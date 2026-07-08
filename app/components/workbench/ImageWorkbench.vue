<template>
  <div class="tg-workbench">
    <WorkbenchSection
      title="静态贴纸转换"
      description="PNG / WEBP / JPG 转 Telegram 512px 静态贴纸"
      badge="浏览器本地"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </template>

      <UploadZone
        title="上传图片"
        hint="支持 PNG / WEBP / JPG，输出写入浏览器缓存"
        accept="image/png,image/webp,image/jpeg,image/jpg"
        @files-selected="handleFilesSelected"
      />
    </WorkbenchSection>

    <WorkbenchSection
      v-if="tasks.length"
      title="转换队列"
      :description="`${doneCount}/${tasks.length} 已完成`"
      :badge="`${pendingCount} 待处理`"
      class="tg-section-queue"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </template>

      <div class="tg-gallery-frame">
        <div class="tg-gallery">
          <MediaTaskCard
            v-for="task in tasks"
            :key="task.id"
            :name="task.name"
            :progress="task.progress"
            :status="task.status"
            :status-label="statusText(task.status)"
            @preview="openPreview(task)"
          >
            <template #media>
              <img :src="task.previewUrl" :alt="task.name" />
            </template>

            <template #meta>
              <span v-if="task.width">{{ task.width }}x{{ task.height }}</span>
              <span>{{ formatFileSize(task.file.size) }}</span>
            </template>

            <template #actions>
              <button class="tg-btn-ghost tg-btn-primary-soft" type="button" @click="convertSingle(task)" :disabled="task.status === 'converting'">
                转换
              </button>
              <button class="tg-btn-ghost" type="button" @click="downloadOne(task, 'png')" :disabled="!task.result?.png">
                PNG
              </button>
              <button class="tg-btn-ghost" type="button" @click="downloadOne(task, 'webp')" :disabled="!task.result?.webp">
                WEBP
              </button>
              <button class="tg-btn-ghost tg-btn-danger" type="button" @click="removeTask(task.id)">
                移除
              </button>
            </template>
          </MediaTaskCard>
        </div>
      </div>

      <div class="tg-upload-bar">
        <button class="tg-btn-outline" type="button" @click="convertAll" :disabled="pendingCount === 0 || isConverting">
          全部转换
        </button>
        <div class="tg-upload-bar-info">
          <button class="tg-btn-ghost" type="button" @click="downloadAll('png')" :disabled="doneCount === 0">下载 PNG</button>
          <button class="tg-btn-ghost" type="button" @click="downloadAll('webp')" :disabled="doneCount === 0">下载 WEBP</button>
          <button class="tg-btn-ghost tg-btn-danger" type="button" @click="clearAll">清空</button>
        </div>
      </div>
    </WorkbenchSection>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MediaTaskCard from '@/components/workbench/MediaTaskCard.vue'
import WorkbenchSection from '@/components/workbench/WorkbenchSection.vue'
import UploadZone from '@/components/ui/UploadZone.vue'
import { useLightbox } from '@/composables/useLightbox'
import { useObjectUrlRegistry } from '@/composables/useObjectUrlRegistry'
import { useHistoryStore } from '@/stores/history'
import { formatFileSize } from '@/utils/format'
import { saveCachedSticker } from '@/utils/browserStickerStore'
import { convertImageToTelegramSticker } from '@/utils/browserStickerConverter'

interface ImageTask {
  id: string
  file: File
  name: string
  previewUrl: string
  width: number
  height: number
  status: 'pending' | 'converting' | 'done' | 'error'
  progress: number
  result: {
    png?: { filename: string; size: number; url: string; cacheId: string }
    webp?: { filename: string; size: number; url: string; cacheId: string }
  } | null
  error: string
}

const statusText = (status: ImageTask['status']) => ({
  pending: '待转换',
  converting: '转换中',
  done: '已完成',
  error: '失败'
}[status])

const tasks = ref<ImageTask[]>([])
const limits = reactive({ maxImageFiles: 200, maxFileSize: 52428800 })
const historyStore = useHistoryStore()
const lightbox = useLightbox()
const objectUrls = useObjectUrlRegistry()

const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)
const isConverting = computed(() => tasks.value.some(t => t.status === 'converting'))

onMounted(async () => {
  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      const data = await response.json()
      limits.maxImageFiles = data.upload?.maxImageFiles || limits.maxImageFiles
      limits.maxFileSize = data.upload?.maxFileSize || limits.maxFileSize
    }
  } catch {}
})

const releaseTaskUrls = (task: ImageTask) => {
  objectUrls.revoke(task.previewUrl)
  objectUrls.revoke(task.result?.png?.url)
  objectUrls.revoke(task.result?.webp?.url)
}

const handleFilesSelected = (files: File[]) => {
  const valid = files.filter(file => ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'].includes(file.type) && file.size <= limits.maxFileSize)
  valid.slice(0, limits.maxImageFiles).forEach(file => {
    const task: ImageTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      previewUrl: objectUrls.create(file),
      width: 0,
      height: 0,
      status: 'pending',
      progress: 0,
      result: null,
      error: ''
    }
    tasks.value.push(task)
    loadImageMetadata(task)
  })
}

const loadImageMetadata = (task: ImageTask) => {
  const img = new Image()
  img.onload = () => {
    task.width = img.naturalWidth
    task.height = img.naturalHeight
  }
  img.src = task.previewUrl
}

const convertSingle = async (task: ImageTask) => {
  if (task.status === 'converting') return

  task.status = 'converting'
  task.progress = 10
  task.error = ''

  try {
    const converted = await convertImageToTelegramSticker(task.file)
    task.progress = 80

    const pngCache = await saveCachedSticker({
      name: converted.png.fileName,
      type: 'static',
      mime: 'image/png',
      blob: converted.png.blob,
      size: converted.png.size,
      width: converted.png.width,
      height: converted.png.height
    })

    const webpCache = await saveCachedSticker({
      name: converted.webp.fileName,
      type: 'static',
      mime: 'image/webp',
      blob: converted.webp.blob,
      size: converted.webp.size,
      width: converted.webp.width,
      height: converted.webp.height
    })

    task.status = 'done'
    task.progress = 100
    task.result = {
      png: {
        filename: converted.png.fileName,
        size: converted.png.size,
        url: objectUrls.track(converted.png.url),
        cacheId: pngCache.id
      },
      webp: {
        filename: converted.webp.fileName,
        size: converted.webp.size,
        url: objectUrls.track(converted.webp.url),
        cacheId: webpCache.id
      }
    }

    historyStore.add({
      type: 'image',
      fileName: converted.webp.fileName,
      preview: `cache:${pngCache.id}`,
      width: converted.webp.width,
      height: converted.webp.height,
      size: converted.webp.size,
      result: { png: `cache:${pngCache.id}`, webp: `cache:${webpCache.id}` }
    })
  } catch (error: any) {
    task.status = 'error'
    task.error = error.message || '转换失败'
  }
}

const convertAll = async () => {
  for (const task of tasks.value.filter(item => item.status === 'pending')) {
    await convertSingle(task)
  }
}

const downloadOne = (task: ImageTask, format: 'png' | 'webp') => {
  const item = task.result?.[format]
  if (!item) return
  const link = document.createElement('a')
  link.href = item.url
  link.download = item.filename
  link.click()
}

const downloadAll = async (format: 'png' | 'webp') => {
  for (const task of tasks.value.filter(item => item.status === 'done' && item.result?.[format])) {
    downloadOne(task, format)
  }
}

const removeTask = (id: string) => {
  const task = tasks.value.find(item => item.id === id)
  if (task) {
    releaseTaskUrls(task)
  }
  tasks.value = tasks.value.filter(item => item.id !== id)
}

const clearAll = () => {
  tasks.value.forEach(releaseTaskUrls)
  tasks.value = []
}

const openPreview = (task: ImageTask) => {
  const meta = task.width ? `${task.width}x${task.height} / ${formatFileSize(task.file.size)}` : formatFileSize(task.file.size)
  lightbox.openImage(task.previewUrl, task.name, meta)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');

.tg-workbench {
  display: grid;
  gap: var(--gap-lg);
}

.tg-gallery-frame {
  position: relative;
  padding: 8px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.64), rgba(245, 248, 255, 0.84)),
    var(--color-bg-subtle);
  border: 1px solid rgba(37, 99, 235, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
}

:global([data-theme="dark"] .tg-gallery-frame) {
  background:
    linear-gradient(180deg, rgba(17, 28, 49, 0.76), rgba(10, 18, 31, 0.92)),
    var(--color-bg-subtle);
  border-color: rgba(147, 197, 253, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.tg-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(186px, 1fr));
  gap: 12px;
}

.tg-btn-ghost,
.tg-btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 999px;
  font-family: "Manrope", "Noto Sans SC", sans-serif;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.tg-btn-ghost {
  padding: 5px 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-solid);
  color: var(--color-text);
  font-size: 0.68rem;
  font-weight: 600;
}

.tg-btn-outline {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  min-height: 38px;
}

.tg-btn-primary-soft {
  background: linear-gradient(135deg, var(--color-accent), var(--color-accent-strong));
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

.tg-btn-ghost:hover:not(:disabled),
.tg-btn-outline:hover:not(:disabled) {
  transform: translateY(-1px);
}

.tg-btn-ghost:hover:not(:disabled) {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-strong);
  color: var(--color-accent-strong);
}

.tg-btn-primary-soft:hover:not(:disabled) {
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 14px 24px rgba(37, 99, 235, 0.24);
}

.tg-btn-outline:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-light);
}

.tg-btn-danger {
  color: #b7271d;
  border-color: rgba(231, 76, 60, 0.35);
  background: rgba(231, 76, 60, 0.1);
}

.tg-btn-danger:hover:not(:disabled) {
  color: #fff;
  background: rgba(231, 76, 60, 0.9);
  border-color: rgba(231, 76, 60, 0.9);
}

.tg-btn-ghost:disabled,
.tg-btn-outline:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.tg-upload-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.tg-upload-bar-info {
  flex: 1;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .tg-gallery-frame {
    padding: 6px;
    border-radius: 16px;
  }

  .tg-gallery {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }

  .tg-btn-ghost {
    padding: 3px 6px;
    font-size: 0.65rem;
  }
}
</style>
