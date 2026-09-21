<template>
  <div class="tg-workbench">
    <WorkbenchSection
      :title="t('image.s1.title')"
      :description="t('image.s1.desc')"
      :badge="t('image.s1.badge')"
    >
      <template #icon>
        <ImageUp :size="17" :stroke-width="2" />
      </template>

      <UploadZone
        :title="t('image.upload.title')"
        :hint="t('image.upload.hint')"
        accept="image/png,image/webp,image/jpeg,image/jpg"
        @files-selected="handleFilesSelected"
      />
    </WorkbenchSection>

    <WorkbenchSection
      v-if="tasks.length"
      :title="t('image.s2.title')"
      :description="t('image.s2.done', { done: doneCount, total: tasks.length })"
      :badge="t('image.s2.pending', { pending: pendingCount })"
      class="tg-section-queue"
    >
      <template #icon>
        <ListChecks :size="17" :stroke-width="2" />
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

            <template #extra>
              <div v-if="task.errorKeys.length" class="tg-task-error">{{ errorText(task) }}</div>
            </template>

            <template #actions>
              <button class="tg-btn-ghost" type="button" @click="convertSingle(task)" :disabled="task.status === 'converting' || isConverting">
                {{ t('image.btn.convert') }}
              </button>
              <button class="tg-btn-ghost" type="button" @click="downloadOne(task, 'png')" :disabled="!task.result?.png">
                {{ t('image.btn.downloadPng') }}
              </button>
              <button class="tg-btn-ghost" type="button" @click="downloadOne(task, 'webp')" :disabled="!task.result?.webp">
                {{ t('image.btn.downloadWebp') }}
              </button>
              <button class="tg-btn-ghost tg-btn-danger" type="button" @click="removeTask(task.id)">
                {{ t('image.btn.remove') }}
              </button>
            </template>
          </MediaTaskCard>
        </div>
      </div>

      <div class="tg-upload-bar">
        <button class="tg-btn-outline" type="button" @click="convertAll" :disabled="pendingCount === 0 || isConverting">
          {{ t('image.btn.convertAll') }}
        </button>
        <div class="tg-upload-bar-info">
          <button class="tg-btn-ghost" type="button" @click="downloadAll('png')" :disabled="doneCount === 0">{{ t('image.btn.downloadPng') }}</button>
          <button class="tg-btn-ghost" type="button" @click="downloadAll('webp')" :disabled="doneCount === 0">{{ t('image.btn.downloadWebp') }}</button>
          <button class="tg-btn-ghost tg-btn-danger" type="button" @click="clearAll">{{ t('image.btn.clear') }}</button>
        </div>
      </div>
    </WorkbenchSection>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ImageUp, ListChecks } from 'lucide-vue-next'
import MediaTaskCard from '@/components/workbench/MediaTaskCard.vue'
import WorkbenchSection from '@/components/workbench/WorkbenchSection.vue'
import UploadZone from '@/components/ui/UploadZone.vue'
import { useLocale } from '@/composables/useLocale'
import { useLightbox } from '@/composables/useLightbox'
import { useObjectUrlRegistry } from '@/composables/useObjectUrlRegistry'
import { useHistoryStore } from '@/stores/history'
import { formatFileSize } from '@/utils/format'
import { triggerDownload } from '@/utils/download'
import { StickerStorageFullError, saveCachedSticker } from '@/utils/browserStickerStore'
import { LocalizedRuleError, convertImageToTelegramSticker, resolveReusableWebpSticker } from '@/utils/browserStickerConverter'

const { t, tRuntime, locale } = useLocale()

/** Keys → localized text, resolved per render so language switches apply. */
const errorText = (task: ImageTask) =>
  task.errorKeys.map(key => tRuntime(key)).join(locale.value === 'zh' ? '；' : '; ')

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
  /** i18n keys, translated on render so a language switch re-renders them */
  errorKeys: string[]
}

const limits = reactive({ maxImageFiles: 200, maxFileSize: 52428800 })
const historyStore = useHistoryStore()
const lightbox = useLightbox()
const objectUrls = useObjectUrlRegistry()

const IMAGE_ACCEPT = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg']

const {
  tasks,
  statusText,
  pendingCount,
  doneCount,
  isConverting,
  addFiles,
  removeTask,
  clearAll
} = useMediaQueue<ImageTask>({
  accept: IMAGE_ACCEPT,
  maxFiles: () => limits.maxImageFiles,
  maxFileSize: () => limits.maxFileSize,
  createTask: (file) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    name: file.name,
    previewUrl: objectUrls.create(file),
    width: 0,
    height: 0,
    status: 'pending',
    progress: 0,
    result: null,
    errorKeys: []
  }),
  releaseUrls: task => releaseTaskUrls(task),
  onAdded: task => loadImageMetadata(task)
})

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
  addFiles(files)
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
  task.errorKeys = []

  try {
    const reusableWebp = await resolveReusableWebpSticker(task.file)

    if (reusableWebp.reusable && reusableWebp.result) {
      const webpCache = await saveCachedSticker({
        name: reusableWebp.result.fileName,
        type: 'static',
        mime: 'image/webp',
        blob: reusableWebp.result.blob,
        size: reusableWebp.result.size,
        width: reusableWebp.result.width,
        height: reusableWebp.result.height
      })

      task.status = 'done'
      task.progress = 100
      task.result = {
        webp: {
          filename: reusableWebp.result.fileName,
          size: reusableWebp.result.size,
          url: objectUrls.track(reusableWebp.result.url),
          cacheId: webpCache.id
        }
      }

      historyStore.add({
        type: 'image',
        fileName: reusableWebp.result.fileName,
        preview: `cache:${webpCache.id}`,
        width: reusableWebp.result.width,
        height: reusableWebp.result.height,
        size: reusableWebp.result.size,
        result: { webp: `cache:${webpCache.id}` }
      })
      return
    }

    if (reusableWebp.ruleKeys?.length) throw new LocalizedRuleError(reusableWebp.ruleKeys)

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
    task.errorKeys = error instanceof StickerStorageFullError
      ? ['sys.storageFull']
      : error instanceof LocalizedRuleError
        ? error.ruleKeys
        : [error.message || 'image.err.convert']
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
  triggerDownload(item.url, item.filename)
}

const downloadAll = async (format: 'png' | 'webp') => {
  for (const task of tasks.value.filter(item => item.status === 'done' && item.result?.[format])) {
    downloadOne(task, format)
  }
}

const openPreview = (task: ImageTask) => {
  const meta = task.width ? `${task.width}x${task.height} / ${formatFileSize(task.file.size)}` : formatFileSize(task.file.size)
  const downloadUrl = task.result?.webp?.url || task.result?.png?.url
  lightbox.openImage(task.previewUrl, task.name, meta, downloadUrl)
}
</script>
