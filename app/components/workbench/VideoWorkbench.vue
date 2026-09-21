<template>
  <div class="tg-workbench">
    <WorkbenchSection
      :title="t('video.s1.title')"
      :description="t('video.s1.desc')"
      :badge="t('video.s1.badge')"
    >
      <template #icon>
        <Clapperboard :size="17" :stroke-width="2" />
      </template>

      <UploadZone
        :title="t('video.upload.title')"
        :hint="t('video.upload.hint')"
        accept="image/gif,video/mp4,video/webm"
        @files-selected="handleFilesSelected"
      />
    </WorkbenchSection>

    <WorkbenchSection
      v-if="tasks.length"
      :title="t('image.s2.title')"
      :description="t('image.s2.done', { done: doneCount, total: tasks.length })"
      :badge="t('image.s2.pending', { pending: pendingCount })"
    >
      <template #icon>
        <ListChecks :size="17" :stroke-width="2" />
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
              <button class="tg-btn-ghost" type="button" @click="convertSingle(task)" :disabled="task.status === 'converting' || converting">
                {{ t('video.btn.convert') }}
              </button>
              <button class="tg-btn-ghost" type="button" @click="downloadOne(task)" :disabled="!task.result">{{ t('video.btn.download') }}</button>
              <button class="tg-btn-ghost tg-btn-danger tg-btn-span-2" type="button" @click="removeTask(task.id)">{{ t('video.btn.remove') }}</button>
            </template>
          </MediaTaskCard>
        </div>
      </div>

      <div class="tg-upload-bar">
        <button class="tg-btn-outline" type="button" @click="convertAll" :disabled="pendingCount === 0 || converting">
          {{ t('video.btn.convertAll') }}
        </button>
        <div class="tg-upload-bar-info">
          <button class="tg-btn-ghost" type="button" @click="downloadAll" :disabled="doneCount === 0">{{ t('video.btn.downloadAll') }}</button>
          <button class="tg-btn-ghost tg-btn-danger" type="button" @click="clearAll">{{ t('video.btn.clear') }}</button>
        </div>
      </div>
    </WorkbenchSection>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Clapperboard, ListChecks } from 'lucide-vue-next'
import MediaTaskCard from '@/components/workbench/MediaTaskCard.vue'
import WorkbenchSection from '@/components/workbench/WorkbenchSection.vue'
import UploadZone from '@/components/ui/UploadZone.vue'
import { useLightbox } from '@/composables/useLightbox'
import { useObjectUrlRegistry } from '@/composables/useObjectUrlRegistry'
import { useHistoryStore } from '@/stores/history'
import { formatFileSize } from '@/utils/format'
import { saveCachedSticker } from '@/utils/browserStickerStore'
import { convertVideoToTelegramSticker, resolveReusableWebmSticker } from '@/utils/browserStickerConverter'
import { TELEGRAM_STICKER_LIMITS } from '@/utils/telegramStickerRules'
import { useLocale } from '@/composables/useLocale'

const { t, tRaw } = useLocale()

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
  pending: t('status.pending'),
  converting: t('status.converting'),
  done: t('status.done'),
  error: t('status.error')
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
      error: file.size > TELEGRAM_STICKER_LIMITS.maxSourceVideoBytes ? t('video.err.tooLarge') : ''
    })
  })
}

const convertSingle = async (task: VideoTask) => {
  if (task.status === 'converting') return

  task.status = 'converting'
  task.progress = 5
  task.message = t('video.msg.prepare')
  task.error = ''

  try {
    const reusableWebm = await resolveReusableWebmSticker(task.file)

    if (reusableWebm.reusable && reusableWebm.result) {
      const cache = await saveCachedSticker({
        name: reusableWebm.result.fileName,
        type: 'video',
        mime: 'video/webm',
        blob: reusableWebm.result.blob,
        size: reusableWebm.result.size,
        width: reusableWebm.result.width,
        height: reusableWebm.result.height,
        duration: reusableWebm.result.duration
      })

      task.status = 'done'
      task.progress = 100
      task.message = t('video.msg.reused')
      task.result = {
        filename: reusableWebm.result.fileName,
        url: objectUrls.track(reusableWebm.result.url),
        cacheId: cache.id,
        width: reusableWebm.result.width,
        height: reusableWebm.result.height,
        duration: reusableWebm.result.duration || TELEGRAM_STICKER_LIMITS.maxVideoDuration,
        size: reusableWebm.result.size
      }

      historyStore.add({
        type: 'video',
        fileName: reusableWebm.result.fileName,
        preview: `cache:${cache.id}`,
        duration: task.result.duration,
        size: reusableWebm.result.size,
        result: { webm: `cache:${cache.id}` }
      })
      return
    }

    const converted = await convertVideoToTelegramSticker(task.file, (progress, message) => {
      task.progress = progress
      task.message = tRaw(message)
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
    task.message = t('video.msg.done')
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
    task.error = (error.message && tRaw(error.message)) || t('video.err.convert')
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
    convertStatus.value = t('video.msg.converting', { index: currentTaskIndex.value, total: totalTasks.value, name: task.name })
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
.tg-btn-span-2 {
  grid-column: span 2;
}
</style>
