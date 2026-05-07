<template>
  <div class="section-stack">
    <div class="workbench-panel">
      <div class="workbench-header">
        <div>
          <strong>静态贴纸转换</strong>
          <div class="text-secondary">PNG / WEBP / JPG 转 Telegram 512px 静态贴纸</div>
        </div>
        <div class="chip">浏览器本地转换</div>
      </div>
      <UploadZone
        title="上传图片"
        hint="支持 PNG / WEBP / JPG，输出写入浏览器缓存"
        accept="image/png,image/webp,image/jpeg,image/jpg"
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
              <span v-if="task.width">{{ task.width }}x{{ task.height }}</span>
              <span>{{ formatFileSize(task.file.size) }}</span>
              <span class="chip">{{ statusText(task.status) }}</span>
            </div>
            <div v-if="task.status === 'converting'" class="task-progress">
              <div class="task-progress-bar">
                <div class="task-progress-fill" :style="{ width: task.progress + '%' }"></div>
              </div>
              <span class="task-progress-label">{{ task.progress }}%</span>
            </div>
            <div v-if="task.error" class="error-text">{{ task.error }}</div>
          </div>
          <div class="history-actions">
            <button class="kv-action secondary" type="button" @click="convertSingle(task)" :disabled="task.status === 'converting'">转换</button>
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
