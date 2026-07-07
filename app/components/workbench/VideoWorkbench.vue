<template>
  <div class="tg-workbench">
    <!-- Upload section -->
    <div class="tg-section">
      <div class="tg-section-head">
        <div class="tg-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div>
          <h3 class="tg-section-title">视频贴纸转换</h3>
          <p class="tg-section-desc">GIF / MP4 / WEBM 转 Telegram WEBM VP9 视频贴纸</p>
        </div>
        <div class="tg-section-right">
          <span class="tg-count">最长 3 秒 / 256KB</span>
        </div>
      </div>
      <UploadZone
        title="上传动图或视频"
        hint="支持 GIF / MP4 / WEBM，浏览器本地转换，不上传源文件"
        accept="image/gif,video/mp4,video/webm"
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

      <!-- Overall batch progress -->
      <div v-if="converting" class="tg-batch-progress">
        <div class="tg-batch-bar">
          <div class="tg-batch-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
        <div class="tg-batch-info">
          <span>{{ convertStatus }}</span>
          <span>{{ overallProgress }}%</span>
        </div>
      </div>

      <!-- Task gallery -->
      <div class="tg-gallery">
        <div v-for="task in tasks" :key="task.id" class="tg-task-item" :class="task.status">
          <div class="tg-task-shell">
            <div class="tg-task-preview" @click="openPreview(task)">
              <div class="tg-task-media">
                <video :src="task.result?.url || task.previewUrl" muted loop playsinline></video>
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
                  <span>{{ formatFileSize(task.file.size) }}</span>
                  <span v-if="task.result">{{ formatFileSize(task.result.size) }}</span>
                </div>
                <div v-if="task.status === 'converting' && task.message" class="tg-task-message">{{ task.message }}</div>
                <div v-if="task.error" class="tg-task-error">{{ task.error }}</div>
              </div>
              <div class="tg-task-actions">
                <button class="tg-btn-ghost" type="button" @click="convertSingle(task)" :disabled="task.status === 'converting' || converting">转换</button>
                <button class="tg-btn-ghost" type="button" @click="downloadOne(task)" :disabled="!task.result">下载</button>
                <button class="tg-btn-ghost tg-btn-danger" type="button" @click="removeTask(task.id)">移除</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action bar -->
      <div class="tg-upload-bar">
        <button class="tg-btn-outline" type="button" @click="convertAll" :disabled="pendingCount === 0 || converting">
          全部转换
        </button>
        <div class="tg-upload-bar-info">
          <button class="tg-btn-ghost" type="button" @click="downloadAll" :disabled="doneCount === 0">全部下载</button>
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
import { convertVideoToTelegramSticker } from '@/utils/browserStickerConverter'
import { saveCachedSticker } from '@/utils/browserStickerStore'
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

const converting = ref(false)
const convertStatus = ref('')
const currentTaskIndex = ref(0)
const totalTasks = ref(0)

const overallProgress = computed(() => {
  if (totalTasks.value === 0) return 0
  return Math.round((currentTaskIndex.value / totalTasks.value) * 100)
})

onMounted(async () => {
  try {
    const res = await fetch('/api/config')
    if (res.ok) {
      const data = await res.json()
      limits.maxVideoFiles = data.upload?.maxVideoFiles || limits.maxVideoFiles
    }
  } catch {}
})

onBeforeUnmount(() => {
  tasks.value.forEach(task => {
    URL.revokeObjectURL(task.previewUrl)
    if (task.result?.url) URL.revokeObjectURL(task.result.url)
  })
})

const pendingCount = computed(() => tasks.value.filter(task => task.status === 'pending').length)
const doneCount = computed(() => tasks.value.filter(task => task.status === 'done').length)

const handleFilesSelected = (files: File[]) => {
  const valid = files.filter(file => ['image/gif', 'video/mp4', 'video/webm'].includes(file.type))
  valid.slice(0, limits.maxVideoFiles).forEach(file => {
    tasks.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
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
      url: converted.url,
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
    currentTaskIndex.value++
    convertStatus.value = `正在转换 ${currentTaskIndex.value}/${totalTasks.value}: ${task.name}`
    await convertSingle(task)
  }

  converting.value = false
  convertStatus.value = ''
}

const downloadOne = (task: VideoTask) => {
  if (!task.result?.url) return
  const a = document.createElement('a')
  a.href = task.result.url
  a.download = task.result.filename
  a.click()
}

const downloadAll = () => {
  for (const task of tasks.value.filter(item => item.status === 'done' && item.result?.url)) {
    downloadOne(task)
  }
}

const removeTask = (id: string) => {
  const task = tasks.value.find(item => item.id === id)
  if (task) {
    URL.revokeObjectURL(task.previewUrl)
    if (task.result?.url) URL.revokeObjectURL(task.result.url)
  }
  tasks.value = tasks.value.filter(item => item.id !== id)
}

const clearAll = () => {
  tasks.value.forEach(task => {
    URL.revokeObjectURL(task.previewUrl)
    if (task.result?.url) URL.revokeObjectURL(task.result.url)
  })
  tasks.value = []
}

const openPreview = (task: VideoTask) => {
  lightbox.openVideo(task.result?.url || task.previewUrl, task.name, formatFileSize(task.result?.size || task.file.size))
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

/* Batch progress */
.tg-batch-progress {
  display: grid; gap: 6px;
  padding: 10px 12px; border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}
.tg-batch-bar {
  width: 100%; height: 4px;
  background: var(--color-border); border-radius: var(--radius-full);
  overflow: hidden;
}
.tg-batch-fill {
  height: 100%; background: var(--color-accent);
  transition: width 0.3s ease; border-radius: var(--radius-full);
}
.tg-batch-info {
  display: flex; justify-content: space-between;
  font-size: 0.7rem; color: var(--color-text-tertiary);
}

/* Gallery */
.tg-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 14px;
}

.tg-task-item {
  position: relative;
  min-width: 0;
  font-family: "Manrope", "Noto Sans SC", sans-serif;
}

.tg-task-shell {
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(145deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.02));
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.tg-task-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16px;
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

.tg-task-preview video {
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
  border-radius: 16px;
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
  border-radius: 16px;
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
.tg-task-message {
  font-size: 0.62rem;
  color: var(--color-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tg-task-error {
  font-size: 0.62rem;
  color: var(--color-error);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
