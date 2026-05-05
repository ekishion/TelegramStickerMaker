<template>
  <div class="section-stack">
    <div class="workbench-panel">
      <div class="workbench-header">
        <div>
          <strong>动态贴纸转换</strong>
          <div class="text-secondary">GIF / MP4 / WEBM → WEBM VP9</div>
        </div>
        <div class="chip">默认 3 秒</div>
      </div>
      <UploadZone
        title="拖拽视频到此处"
        hint="支持 GIF / MP4 / WEBM"
        accept="image/gif,video/mp4,video/webm"
        @files-selected="handleFilesSelected"
      />
    </div>

    <div v-if="tasks.length" class="workbench-panel">
      <div class="workbench-header">
        <strong>转换队列</strong>
        <div class="history-meta">
          <span>总计 {{ tasks.length }}</span>
          <span>完成 {{ doneCount }}</span>
        </div>
      </div>
      <div class="workbench-actions">
        <button class="kv-action" type="button" @click="convertAll" :disabled="pendingCount === 0 || converting">全部转换</button>
        <button class="kv-action secondary" type="button" @click="clearAll">清空</button>
      </div>

      <div v-if="converting" class="convert-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: overallProgress + '%' }"></div>
        </div>
        <div class="history-meta">
          <span>{{ convertStatus }}</span>
          <span>{{ overallProgress }}%</span>
        </div>
      </div>

      <div class="task-list">
        <article v-for="task in tasks" :key="task.id" class="task-card">
          <div class="task-preview" @click="openPreview(task)">
            <video :src="task.previewUrl" muted loop></video>
          </div>
          <div class="task-info">
            <strong class="task-name" :title="task.name">{{ task.name }}</strong>
            <div class="history-meta">
              <span>{{ formatFileSize(task.file.size) }}</span>
              <span class="chip">{{ statusText(task.status) }}</span>
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

interface VideoTaskResult {
  filename: string
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
  result: VideoTaskResult | null
  error: string
}

const statusText = (s: string) => ({ pending: '等待', converting: '转换中', done: '完成', error: '失败' }[s] || s)

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
    if (res.ok) { const d = await res.json(); limits.maxVideoFiles = d.upload?.maxVideoFiles || limits.maxVideoFiles }
  } catch {}
})

onBeforeUnmount(() => { tasks.value.forEach(t => { if (t.previewUrl) URL.revokeObjectURL(t.previewUrl) }) })

const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)

const handleFilesSelected = (files: File[]) => {
  const valid = files.filter(f => ['image/gif', 'video/mp4', 'video/webm'].includes(f.type))
  if (!valid.length) return
  valid.slice(0, limits.maxVideoFiles).forEach(file => {
    tasks.value.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      result: null,
      error: ''
    })
  })
}

const convertSingle = async (task: VideoTask) => {
  if (!task || task.status === 'converting' || converting.value) return

  task.status = 'converting'
  task.error = ''

  try {
    const formData = new FormData()
    formData.append('video', task.file, task.name)

    const res = await fetch('/api/convert-video', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || '转换失败')
    }

    task.status = 'done'
    task.result = {
      filename: data.result.filename,
      width: data.result.width,
      height: data.result.height,
      duration: data.result.duration,
      size: data.result.size
    }

    historyStore.add({
      type: 'video',
      fileName: task.name.replace(/\.[^.]+$/, ''),
      preview: task.previewUrl,
      duration: data.result.duration,
      size: task.file.size,
      result: { webm: `/api/telegram/file/${encodeURIComponent(data.result.filename)}` }
    })
  } catch (error: any) {
    task.status = 'error'
    task.error = error.message || '转换失败'
  }
}

const convertAll = async () => {
  const pending = tasks.value.filter(t => t.status === 'pending')
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
  if (!task.result?.filename) return
  window.open(`/api/telegram/file/${encodeURIComponent(task.result.filename)}`, '_blank')
}

const removeTask = (id: string) => {
  const t = tasks.value.find(t => t.id === id)
  if (t?.previewUrl) URL.revokeObjectURL(t.previewUrl)
  tasks.value = tasks.value.filter(t => t.id !== id)
}

const clearAll = () => {
  tasks.value.forEach(t => { if (t.previewUrl) URL.revokeObjectURL(t.previewUrl) })
  tasks.value = []
}

const openPreview = (task: VideoTask) => {
  lightbox.openVideo(task.previewUrl, task.name, formatFileSize(task.file.size))
}
</script>

<style scoped>
.convert-progress {
  margin-top: var(--gap-md);
}
.progress-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.2s ease;
}
</style>
