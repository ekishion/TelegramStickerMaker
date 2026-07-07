<template>
  <div class="tg-workbench">
    <!-- Upload section -->
    <div class="tg-section">
      <div class="tg-section-head">
        <div class="tg-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
        <div>
          <h3 class="tg-section-title">静态贴纸转换</h3>
          <p class="tg-section-desc">PNG / WEBP / JPG 转 Telegram 512px 静态贴纸</p>
        </div>
        <div class="tg-section-right">
          <span class="tg-count">浏览器本地</span>
        </div>
      </div>
      <UploadZone
        title="上传图片"
        hint="支持 PNG / WEBP / JPG，输出写入浏览器缓存"
        accept="image/png,image/webp,image/jpeg,image/jpg"
        @files-selected="handleFilesSelected"
      />
    </div>

    <!-- Queue section -->
    <div v-if="tasks.length" class="tg-section">
      <div class="tg-section-head">
        <div class="tg-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </div>
        <div>
          <h3 class="tg-section-title">转换队列</h3>
          <p class="tg-section-desc">{{ doneCount }}/{{ tasks.length }} 已完成</p>
        </div>
        <div class="tg-section-right">
          <span class="tg-count">{{ pendingCount }} 待处理</span>
        </div>
      </div>

      <!-- Task gallery -->
      <div class="tg-gallery">
        <div v-for="task in tasks" :key="task.id" class="tg-task-item" :class="task.status">
          <div class="tg-task-shell">
            <div class="tg-task-preview" @click="openPreview(task)">
              <div class="tg-task-media">
                <img :src="task.previewUrl" :alt="task.name" />
              </div>
              <span class="tg-task-badge" :class="task.status">{{ statusText(task.status) }}</span>
              <div v-if="task.status === 'converting'" class="tg-task-progress-ring">
                <svg viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" stroke-width="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-accent)" stroke-width="3"
                    stroke-dasharray="94" :stroke-dashoffset="94 - (94 * task.progress / 100)"
                    stroke-linecap="round" transform="rotate(-90 18 18)" />
                </svg>
                <span class="tg-task-progress-text">{{ task.progress }}%</span>
              </div>
            </div>
            <div class="tg-task-body">
              <div class="tg-task-info">
                <div class="tg-task-name" :title="task.name">{{ task.name }}</div>
                <div class="tg-task-meta">
                  <span v-if="task.width">{{ task.width }}x{{ task.height }}</span>
                  <span>{{ formatFileSize(task.file.size) }}</span>
                </div>
              </div>
              <div class="tg-task-actions">
                <button class="tg-btn-ghost" type="button" @click="convertSingle(task)" :disabled="task.status === 'converting'">转换</button>
                <button class="tg-btn-ghost" type="button" @click="downloadOne(task, 'png')" :disabled="!task.result?.png">PNG</button>
                <button class="tg-btn-ghost" type="button" @click="downloadOne(task, 'webp')" :disabled="!task.result?.webp">WEBP</button>
                <button class="tg-btn-ghost tg-btn-danger" type="button" @click="removeTask(task.id)">移除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action bar -->
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import UploadZone from '@/components/ui/UploadZone.vue'
import { useHistoryStore } from '@/stores/history'
import { formatFileSize } from '@/utils/format'
import { useLightbox } from '@/composables/useLightbox'
import { convertImageToTelegramSticker } from '@/utils/browserStickerConverter'
import { saveCachedSticker } from '@/utils/browserStickerStore'

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

onBeforeUnmount(() => {
  tasks.value.forEach(task => {
    URL.revokeObjectURL(task.previewUrl)
    if (task.result?.png?.url) URL.revokeObjectURL(task.result.png.url)
    if (task.result?.webp?.url) URL.revokeObjectURL(task.result.webp.url)
  })
})

const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)
const isConverting = computed(() => tasks.value.some(t => t.status === 'converting'))

const handleFilesSelected = (files: File[]) => {
  const valid = files.filter(file => ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'].includes(file.type) && file.size <= limits.maxFileSize)
  valid.slice(0, limits.maxImageFiles).forEach(file => {
    const previewUrl = URL.createObjectURL(file)
    const task: ImageTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      previewUrl,
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
      png: { filename: converted.png.fileName, size: converted.png.size, url: converted.png.url, cacheId: pngCache.id },
      webp: { filename: converted.webp.fileName, size: converted.webp.size, url: converted.webp.url, cacheId: webpCache.id }
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
  const a = document.createElement('a')
  a.href = item.url
  a.download = item.filename
  a.click()
}

const downloadAll = async (format: 'png' | 'webp') => {
  for (const task of tasks.value.filter(item => item.status === 'done' && item.result?.[format])) {
    downloadOne(task, format)
  }
}

const removeTask = (id: string) => {
  const task = tasks.value.find(item => item.id === id)
  if (task) {
    URL.revokeObjectURL(task.previewUrl)
    if (task.result?.png?.url) URL.revokeObjectURL(task.result.png.url)
    if (task.result?.webp?.url) URL.revokeObjectURL(task.result.webp.url)
  }
  tasks.value = tasks.value.filter(item => item.id !== id)
}

const clearAll = () => {
  tasks.value.forEach(task => {
    URL.revokeObjectURL(task.previewUrl)
    if (task.result?.png?.url) URL.revokeObjectURL(task.result.png.url)
    if (task.result?.webp?.url) URL.revokeObjectURL(task.result.webp.url)
  })
  tasks.value = []
}

const openPreview = (task: ImageTask) => {
  const meta = task.width ? `${task.width}x${task.height} / ${formatFileSize(task.file.size)}` : formatFileSize(task.file.size)
  lightbox.openImage(task.previewUrl, task.name, meta)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');

.tg-workbench { display: grid; gap: var(--gap-lg); }

.tg-section {
  display: grid;
  gap: var(--gap-md);
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.tg-section-head { display: flex; align-items: flex-start; gap: 12px; }
.tg-section-icon {
  width: 36px; height: 36px; border-radius: var(--radius-sm);
  background: var(--color-accent-light); color: var(--color-accent);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tg-section-title { font-size: 0.95rem; font-weight: 600; color: var(--color-text); line-height: 1.3; }
.tg-section-desc { font-size: 0.78rem; color: var(--color-text-tertiary); margin-top: 2px; }
.tg-section-right { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.tg-count {
  font-size: 0.75rem; font-weight: 600; color: var(--color-accent);
  padding: 2px 8px; background: var(--color-accent-light); border-radius: var(--radius-full);
}

/* Gallery */
.tg-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
}

.tg-task-item {
  --task-accent: var(--color-text-tertiary);
  position: relative;
  min-width: 0;
  font-family: "Manrope", "Noto Sans SC", sans-serif;
}
.tg-task-item.converting { --task-accent: var(--color-accent); }
.tg-task-item.done { --task-accent: var(--color-success); }
.tg-task-item.error { --task-accent: var(--color-error); }

.tg-task-shell {
  border-radius: 18px;
  padding: 1px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.02));
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tg-task-item:hover .tg-task-shell {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.14);
}

.tg-task-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 17px 17px 12px 12px;
  padding: 10px;
  cursor: pointer;
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4) 60%),
    linear-gradient(160deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0));
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.tg-task-media {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f3f2ee;
  background-image:
    linear-gradient(45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05)),
    linear-gradient(45deg, rgba(0, 0, 0, 0.05) 25%, transparent 25%, transparent 75%, rgba(0, 0, 0, 0.05) 75%, rgba(0, 0, 0, 0.05));
  background-position: 0 0, 10px 10px;
  background-size: 20px 20px;
}

.tg-task-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.tg-task-badge {
  position: absolute;
  left: 12px;
  top: 12px;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  color: #fff;
  background: rgba(10, 10, 10, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
}
.tg-task-badge.pending { background: rgba(44, 44, 44, 0.68); }
.tg-task-badge.converting { background: rgba(122, 161, 58, 0.86); }
.tg-task-badge.done { background: rgba(41, 177, 93, 0.82); }
.tg-task-badge.error { background: rgba(232, 78, 60, 0.82); }

.tg-task-progress-ring {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 17px 17px 12px 12px;
}
.tg-task-progress-ring svg { width: 38px; height: 38px; }
.tg-task-progress-ring circle { transition: stroke-dashoffset 0.3s ease; }
.tg-task-progress-text {
  position: absolute; font-size: 0.62rem; font-weight: 700; color: #fff;
}

.tg-task-body {
  display: grid;
  gap: 10px;
  padding: 12px 12px 14px;
  background: var(--color-surface);
  border-radius: 0 0 17px 17px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.tg-task-info { display: grid; gap: 6px; }
.tg-task-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tg-task-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tg-task-meta span {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tg-task-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 6px;
}

/* Buttons */
.tg-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  color: #1f1f1f;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: "Manrope", "Noto Sans SC", sans-serif;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.tg-btn-ghost:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  border-color: rgba(0, 0, 0, 0.18);
}
.tg-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
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

.tg-btn-outline {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: var(--radius-full);
  border: 1px solid var(--color-border); background: transparent;
  color: var(--color-text-secondary); font-size: 0.8rem; font-weight: 600;
  font-family: var(--font-sans); cursor: pointer; transition: all 0.15s ease; min-height: 38px;
}
.tg-btn-outline:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); background: var(--color-accent-light); }
.tg-btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

.tg-upload-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 0 0; border-top: 1px solid var(--color-border);
}
.tg-upload-bar-info { flex: 1; display: flex; gap: 6px; flex-wrap: wrap; }

@media (max-width: 600px) {
  .tg-section { padding: 14px; border-radius: var(--radius-md); }
  .tg-section-icon { width: 30px; height: 30px; }
  .tg-section-icon svg { width: 15px; height: 15px; }
  .tg-section-title { font-size: 0.88rem; }
  .tg-gallery { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
  .tg-task-actions { gap: 3px; }
  .tg-btn-ghost { padding: 3px 6px; font-size: 0.65rem; }
}
</style>
