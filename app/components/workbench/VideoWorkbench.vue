<template>
  <div class="section-stack">
    <div class="workbench-panel">
      <div class="workbench-header">
        <div>
          <strong>视频贴纸转换</strong>
          <div class="text-secondary">GIF / MP4 / WEBM 转 Telegram WEBM VP9 视频贴纸</div>
        </div>
        <div class="chip">最长 3 秒 / 最大 256KB</div>
      </div>
      <UploadZone
        title="上传动图或视频"
        hint="支持 GIF / MP4 / WEBM，浏览器本地转换，不上传源文件"
        accept="image/gif,video/mp4,video/webm"
        @files-selected="handleFilesSelected"
      />
    </div>

    <div v-if="tasks.length" class="workbench-panel">
      <div class="workbench-header">
        <strong>转换队列</strong>
        <div class="history-meta">
          <span>总数 {{ tasks.length }}</span>
          <span>完成 {{ doneCount }}</span>
        </div>
      </div>
      <div class="workbench-actions">
        <button class="kv-action" type="button" @click="convertAll" :disabled="pendingCount === 0 || converting">全部转换</button>
        <button class="kv-action secondary" type="button" @click="clearAll">清空</button>
      </div>

      <div v-if="converting" class="convert-progress">
        <div class="task-progress-bar">
          <div class="task-progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
        <div class="history-meta">
          <span>{{ convertStatus }}</span>
          <span>{{ overallProgress }}%</span>
        </div>
      </div>

      <div class="task-list">
        <article v-for="task in tasks" :key="task.id" class="task-card">
          <div class="task-preview" @click="openPreview(task)">
            <video :src="task.result?.url || task.previewUrl" muted loop playsinline></video>
          </div>
          <div class="task-info">
            <strong class="task-name" :title="task.name">{{ task.name }}</strong>
            <div class="history-meta">
              <span>{{ formatFileSize(task.file.size) }}</span>
              <span v-if="task.result">{{ formatFileSize(task.result.size) }}</span>
              <span class="chip">{{ statusText(task.status) }}</span>
            </div>
            <div v-if="task.status === 'converting'" class="task-progress">
              <div class="task-progress-bar">
                <div class="task-progress-fill" :style="{ width: task.progress + '%' }"></div>
              </div>
              <span class="task-progress-label">{{ task.message || task.progress + '%' }}</span>
            </div>
            <div v-if="task.error" class="error-text">{{ task.error }}</div>
          </div>
          <div class="history-actions">
            <button class="kv-action secondary" type="button" @click="convertSingle(task)" :disabled="task.status === 'converting' || converting">转换</button>
            <button class="kv-action secondary" type="button" @click="downloadOne(task)" :disabled="!task.result">下载</button>
            <button class="kv-action secondary" type="button" @click="removeTask(task.id)">移除</button>
          </div>
        </article>
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
.convert-progress {
  margin-top: var(--gap-md);
}
.task-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-progress-bar {
  flex: 1;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.task-progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.2s ease;
}
.task-progress-label {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}
</style>
