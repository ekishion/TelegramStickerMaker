<template>
  <div class="tg-workbench">
    <WorkbenchSection
      title="视频贴纸转换"
      description="GIF / MP4 / WEBM 转 Telegram WEBM VP9 视频贴纸"
      badge="最长 3 秒 / 256KB"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </template>

      <UploadZone
        title="上传动图或视频"
        hint="支持 GIF / MP4 / WEBM，浏览器本地转换，不上传源文件"
        accept="image/gif,video/mp4,video/webm"
        @files-selected="handleFilesSelected"
      />
    </WorkbenchSection>

    <WorkbenchSection
      v-if="tasks.length"
      title="转换队列"
      :description="`${doneCount}/${tasks.length} 已完成`"
      :badge="`${pendingCount} 待处理`"
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

      <div v-if="converting" class="tg-batch-progress">
        <div class="tg-batch-bar">
          <div class="tg-batch-fill" :style="{ width: `${overallProgress}%` }"></div>
        </div>
        <div class="tg-batch-info">
          <span>{{ convertStatus }}</span>
          <span>{{ overallProgress }}%</span>
        </div>
      </div>

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
              <video :src="task.result?.url || task.previewUrl" muted loop playsinline></video>
            </template>

            <template #meta>
              <span>{{ formatFileSize(task.file.size) }}</span>
              <span v-if="task.result">{{ formatFileSize(task.result.size) }}</span>
            </template>

            <template #extra>
              <div v-if="task.status === 'converting' && task.message" class="tg-task-message">{{ task.message }}</div>
              <div v-if="task.error" class="tg-task-error">{{ task.error }}</div>
            </template>

            <template #actions>
              <button class="tg-btn-ghost tg-btn-primary-soft" type="button" @click="convertSingle(task)" :disabled="task.status === 'converting' || converting">
                转换
              </button>
              <button class="tg-btn-ghost" type="button" @click="downloadOne(task)" :disabled="!task.result">下载</button>
              <button class="tg-btn-ghost tg-btn-danger tg-btn-span-2" type="button" @click="removeTask(task.id)">移除</button>
            </template>
          </MediaTaskCard>
        </div>
      </div>

      <div class="tg-upload-bar">
        <button class="tg-btn-outline" type="button" @click="convertAll" :disabled="pendingCount === 0 || converting">
          全部转换
        </button>
        <div class="tg-upload-bar-info">
          <button class="tg-btn-ghost" type="button" @click="downloadAll" :disabled="doneCount === 0">全部下载</button>
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
import { convertVideoToTelegramSticker } from '@/utils/browserStickerConverter'
import { TELEGRAM_STICKER_LIMITS } from '@/utils/telegramStickerRules'

interface VideoTaskResult {
  filename: string
  url: string
  cacheId: string
  width: number
  height: number
  duration: number
  size: number
}

interface VideoTask {
  id: string
  file: File
  name: string
  previewUrl: string
  status: 'pending' | 'converting' | 'done' | 'error'
  progress: number
  message: string
  result: VideoTaskResult | null
  error: string
}

const statusText = (status: VideoTask['status']) => ({
  pending: '待转换',
  converting: '转换中',
  done: '已完成',
  error: '失败'
}[status])

const tasks = ref<VideoTask[]>([])
const limits = reactive({ maxVideoFiles: 100 })
const historyStore = useHistoryStore()
const lightbox = useLightbox()
const objectUrls = useObjectUrlRegistry()

const converting = ref(false)
const convertStatus = ref('')
const currentTaskIndex = ref(0)
const totalTasks = ref(0)

const overallProgress = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((currentTaskIndex.value / totalTasks.value) * 100)
})

const pendingCount = computed(() => tasks.value.filter(task => task.status === 'pending').length)
const doneCount = computed(() => tasks.value.filter(task => task.status === 'done').length)

onMounted(async () => {
  try {
    const res = await fetch('/api/config')
    if (res.ok) {
      const data = await res.json()
      limits.maxVideoFiles = data.upload?.maxVideoFiles || limits.maxVideoFiles
    }
  } catch {}
})

const releaseTaskUrls = (task: VideoTask) => {
  objectUrls.revoke(task.previewUrl)
  objectUrls.revoke(task.result?.url)
}

const handleFilesSelected = (files: File[]) => {
  const valid = files.filter(file => ['image/gif', 'video/mp4', 'video/webm'].includes(file.type))
  valid.slice(0, limits.maxVideoFiles).forEach(file => {
    tasks.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      previewUrl: objectUrls.create(file),
      status: file.size > TELEGRAM_STICKER_LIMITS.maxSourceVideoBytes ? 'error' : 'pending',
      progress: 0,
      message: '',
      result: null,
      error: file.size > TELEGRAM_STICKER_LIMITS.maxSourceVideoBytes ? '源文件超过 50MB，请先裁剪后再转换' : ''
    })
  })
}

const convertSingle = async (task: VideoTask) => {
  if (task.status === 'converting') return

  task.status = 'converting'
  task.progress = 5
  task.message = '准备转换'
  task.error = ''

  try {
    const converted = await convertVideoToTelegramSticker(task.file, (progress, message) => {
      task.progress = progress
      task.message = message
    })

    const cache = await saveCachedSticker({
      name: converted.fileName,
      type: 'video',
      mime: 'video/webm',
      blob: converted.blob,
      size: converted.size,
      width: converted.width,
      height: converted.height,
      duration: converted.duration
    })

    task.status = 'done'
    task.progress = 100
    task.message = '转换完成'
    task.result = {
      filename: converted.fileName,
      url: objectUrls.track(converted.url),
      cacheId: cache.id,
      width: converted.width,
      height: converted.height,
      duration: converted.duration || TELEGRAM_STICKER_LIMITS.maxVideoDuration,
      size: converted.size
    }

    historyStore.add({
      type: 'video',
      fileName: converted.fileName,
      preview: `cache:${cache.id}`,
      duration: task.result.duration,
      size: converted.size,
      result: { webm: `cache:${cache.id}` }
    })
  } catch (error: any) {
    task.status = 'error'
    task.error = error.message || '转换失败'
  }
}

const convertAll = async () => {
  const pending = tasks.value.filter(task => task.status === 'pending')
  if (!pending.length) return

  converting.value = true
  totalTasks.value = pending.length
  currentTaskIndex.value = 0

  for (const task of pending) {
    currentTaskIndex.value += 1
    convertStatus.value = `正在转换 ${currentTaskIndex.value}/${totalTasks.value}: ${task.name}`
    await convertSingle(task)
  }

  converting.value = false
  convertStatus.value = ''
}

const downloadOne = (task: VideoTask) => {
  if (!task.result?.url) return
  const link = document.createElement('a')
  link.href = task.result.url
  link.download = task.result.filename
  link.click()
}

const downloadAll = () => {
  for (const task of tasks.value.filter(item => item.status === 'done' && item.result?.url)) {
    downloadOne(task)
  }
}

const removeTask = (id: string) => {
  const task = tasks.value.find(item => item.id === id)
  if (task) releaseTaskUrls(task)
  tasks.value = tasks.value.filter(item => item.id !== id)
}

const clearAll = () => {
  tasks.value.forEach(releaseTaskUrls)
  tasks.value = []
}

const openPreview = (task: VideoTask) => {
  lightbox.openVideo(task.result?.url || task.previewUrl, task.name, formatFileSize(task.result?.size || task.file.size))
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');

.tg-workbench {
  display: grid;
  gap: var(--gap-lg);
}

.tg-batch-progress {
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.tg-batch-bar {
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.tg-batch-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s ease;
  border-radius: var(--radius-full);
}

.tg-batch-info {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
}

.tg-gallery-frame {
  position: relative;
  padding: 8px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.64), rgba(245, 248, 255, 0.84)),
    var(--color-bg-subtle);
  border: 1px solid rgba(37, 99, 235, 0.12);
}

:global([data-theme="dark"] .tg-gallery-frame) {
  background:
    linear-gradient(180deg, rgba(17, 28, 49, 0.76), rgba(10, 18, 31, 0.92)),
    var(--color-bg-subtle);
  border-color: rgba(147, 197, 253, 0.14);
}

.tg-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(186px, 1fr));
  gap: 12px;
}

.tg-task-message,
.tg-task-error {
  font-size: 0.62rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-task-message {
  color: var(--color-accent);
}

.tg-task-error {
  color: var(--color-error);
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

.tg-btn-span-2 {
  grid-column: span 2;
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
