<template>
  <div class="section-stack">
    <div class="workbench-panel">
      <div class="workbench-header">
        <div>
          <strong>静态贴纸转换</strong>
          <div class="text-secondary">PNG / WEBP / JPG → 512×512</div>
        </div>
        <div class="chip">支持批量</div>
      </div>
      <UploadZone
        title="拖拽图片到此处"
        hint="支持 PNG / WEBP / JPG"
        accept="image/png,image/webp,image/jpeg,image/jpg"
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
        <button class="kv-action" type="button" @click="convertAll" :disabled="pendingCount === 0 || isConverting">全部转换</button>
        <button class="kv-action secondary" type="button" @click="downloadAll('png')" :disabled="doneCount === 0">下载 PNG</button>
        <button class="kv-action secondary" type="button" @click="downloadAll('webp')" :disabled="doneCount === 0">下载 WEBP</button>
        <button class="kv-action secondary" type="button" @click="clearAll">清空</button>
      </div>

      <div class="task-list">
        <article v-for="task in tasks" :key="task.id" class="task-card">
          <div class="task-preview" @click="openPreview(task)">
            <img :src="task.previewUrl" :alt="task.name" />
          </div>
          <div class="task-info">
            <strong class="task-name" :title="task.name">{{ task.name }}</strong>
            <div class="history-meta">
              <span v-if="task.width">{{ task.width }}×{{ task.height }}</span>
              <span>{{ formatFileSize(task.file.size) }}</span>
              <span class="chip">{{ statusText(task.status) }}</span>
            </div>
            <div v-if="task.status === 'uploading' || task.status === 'converting'" class="task-progress">
              <div class="task-progress-bar">
                <div class="task-progress-fill" :style="{ width: task.uploadProgress + '%' }"></div>
              </div>
              <span class="task-progress-label">{{ task.status === 'uploading' ? task.uploadProgress + '%' : '服务器处理中…' }}</span>
            </div>
            <div v-if="task.error" class="error-text">{{ task.error }}</div>
          </div>
          <div class="history-actions">
            <button class="kv-action secondary" type="button" @click="convertSingle(task)" :disabled="task.status === 'uploading' || task.status === 'converting'">转换</button>
            <button class="kv-action secondary" type="button" @click="downloadOne(task, 'png')" :disabled="!task.result?.png">PNG</button>
            <button class="kv-action secondary" type="button" @click="downloadOne(task, 'webp')" :disabled="!task.result?.webp">WEBP</button>
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

interface ImageTask {
  id: string
  file: File
  name: string
  previewUrl: string
  width: number
  height: number
  status: 'pending' | 'uploading' | 'converting' | 'done' | 'error'
  uploadProgress: number
  result: any
  error: string
}

const statusText = (s: string) => ({ pending: '等待', uploading: '上传中', converting: '转换中', done: '完成', error: '失败' }[s] || s)

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
  tasks.value.forEach(task => { if (task.previewUrl) URL.revokeObjectURL(task.previewUrl) })
})

const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length)
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)
const isConverting = computed(() => tasks.value.some(t => t.status === 'uploading' || t.status === 'converting'))

const handleFilesSelected = (files: File[]) => {
  const valid = files.filter(f => ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'].includes(f.type))
  if (!valid.length) return
  valid.slice(0, limits.maxImageFiles).forEach(file => {
    const previewUrl = URL.createObjectURL(file)
    const task: ImageTask = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, name: file.name, previewUrl, width: 0, height: 0, status: 'pending', uploadProgress: 0, result: null, error: '' }
    tasks.value.push(task)
    loadImageMetadata(task)
  })
}

const loadImageMetadata = (task: ImageTask) => {
  const img = new Image()
  img.onload = () => { task.width = img.naturalWidth; task.height = img.naturalHeight; img.src = '' }
  img.onerror = () => { img.src = '' }
  img.src = task.previewUrl
}

const convertSingle = async (task: ImageTask) => {
  if (!task || task.status === 'uploading' || task.status === 'converting') return
  task.status = 'uploading'; task.uploadProgress = 0; task.error = ''
  try {
    const formData = new FormData()
    formData.append('image', task.file)
    formData.append('taskId', task.id)
    const data = await new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/convert-image')
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) task.uploadProgress = Math.round((e.loaded / e.total) * 100) }
      xhr.upload.onload = () => { task.status = 'converting'; task.uploadProgress = 100 }
      xhr.onload = () => {
        try { resolve(JSON.parse(xhr.responseText)) } catch { reject(new Error('响应解析失败')) }
      }
      xhr.onerror = () => reject(new Error('网络错误'))
      xhr.send(formData)
    })
    if (!data.result) throw new Error(data.error || '转换失败')
    const pngUrl = data.result.png.dataUrl || `/api/telegram/file/${encodeURIComponent(data.result.png.filename)}`
    const webpUrl = data.result.webp.dataUrl || `/api/telegram/file/${encodeURIComponent(data.result.webp.filename)}`
    task.status = 'done'
    task.result = {
      ...data.result,
      png: { ...data.result.png, url: pngUrl },
      webp: { ...data.result.webp, url: webpUrl }
    }
    historyStore.add({ type: 'image', fileName: task.name.replace(/\.[^.]+$/, ''), preview: pngUrl, width: task.width, height: task.height, size: task.file.size, result: { png: pngUrl, webp: webpUrl } })
  } catch (error: any) {
    task.status = 'error'; task.error = error.message || '转换失败'
  }
}

const convertAll = async () => { for (const t of tasks.value.filter(i => i.status === 'pending')) await convertSingle(t) }

const downloadOne = (task: ImageTask, format: string) => {
  const url = task.result?.[format]?.url; if (!url) return
  const a = document.createElement('a'); a.href = url; a.download = `${task.name.replace(/\.[^.]+$/, '')}.${format}`; a.click()
}

const downloadAll = async (format: string) => {
  const done = tasks.value.filter(t => t.status === 'done' && t.result?.[format]); if (!done.length) return
  const files = done.map(t => ({ url: t.result[format].url, name: `${t.name.replace(/\.[^.]+$/, '')}.${format}` }))
  if (files.some(file => String(file.url).startsWith('data:'))) {
    files.forEach(file => {
      const a = document.createElement('a')
      a.href = file.url
      a.download = file.name
      a.click()
    })
    return
  }
  const res = await fetch('/api/download-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ files }) })
  if (!res.ok) return
  const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `stickers-${format}-${Date.now()}.zip`; a.click(); URL.revokeObjectURL(url)
}

const removeTask = (id: string) => { const t = tasks.value.find(t => t.id === id); if (t?.previewUrl) URL.revokeObjectURL(t.previewUrl); tasks.value = tasks.value.filter(t => t.id !== id) }
const clearAll = () => { tasks.value.forEach(t => { if (t.previewUrl) URL.revokeObjectURL(t.previewUrl) }); tasks.value = [] }
const openPreview = (task: ImageTask) => {
  const meta = task.width ? `${task.width}×${task.height} · ${formatFileSize(task.file.size)}` : formatFileSize(task.file.size)
  lightbox.openImage(task.previewUrl, task.name, meta)
}
</script>

<style scoped>
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
