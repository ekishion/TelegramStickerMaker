<template>
  <div class="tg-workbench">
    <WorkbenchSection
      :title="t('history.s1.title')"
      :description="t('history.s1.desc', { count: filteredItems.length })"
      class="tg-filter-shell"
    >
      <template #icon>
        <Search :size="17" :stroke-width="2" />
      </template>

      <template #right>
        <span v-if="selectedIds.length" class="tg-count">{{ t('history.selected', { count: selectedIds.length }) }}</span>
      </template>

      <div class="tg-filters">
        <input v-model="searchQuery" class="tg-search" :placeholder="t('history.search')" :aria-label="t('aria.searchHistory')" />
        <CustomSelect v-model="typeFilter" :options="typeOptions" :aria-label="t('aria.typeFilter')" />
        <CustomSelect v-model="formatFilter" :options="formatOptions" :aria-label="t('aria.formatFilter')" />
        <CustomSelect v-model="tagFilter" :options="tagOptions" :aria-label="t('aria.tagFilter')" />
      </div>

      <div class="tg-filter-actions">
        <button class="tg-btn-ghost" type="button" @click="selectAll">{{ t('history.btn.selectAll') }}</button>
        <button class="tg-btn-ghost" type="button" @click="clearSelection">{{ t('history.btn.deselectAll') }}</button>
        <button class="tg-btn-ghost tg-btn-danger" type="button" @click="removeSelected" :disabled="selectedIds.length === 0">{{ t('history.btn.removeSelected') }}</button>
        <div class="tg-spacer"></div>
        <button class="tg-btn-ghost" type="button" @click="downloadSelected" :disabled="selectedIds.length === 0">{{ t('history.btn.download') }}</button>
        <button class="tg-btn-ghost tg-btn-danger" type="button" @click="clearHistory">{{ t('history.btn.clear') }}</button>
      </div>
    </WorkbenchSection>

    <WorkbenchSection v-if="filteredItems.length === 0" :title="t('history.s2.title')" :description="t('history.s2.desc')">
      <template #icon>
        <Sticker :size="17" :stroke-width="1.8" />
      </template>

      <WorkbenchEmptyState :title="t('history.empty.title')" :hint="t('history.empty.hint')" />
    </WorkbenchSection>

    <template v-else>
      <WorkbenchSection
        v-for="(group, dateKey) in grouped"
        :key="dateKey"
        :title="formatDayLabel(String(dateKey), locale)"
        :description="t('history.s1.desc', { count: group.length })"
      >
        <template #icon>
          <CalendarDays :size="17" :stroke-width="2" />
        </template>

        <template #right>
          <label class="tg-group-check">
            <input type="checkbox" :checked="isGroupSelected(group)" @change="toggleGroup(group)" />
            <span>{{ t('history.group.selectAll') }}</span>
          </label>
        </template>

        <div class="tg-gallery tg-gallery--archive">
          <div v-for="item in group" :key="item.id" class="tg-history-item" :class="{ selected: selectedIds.includes(item.id) }">
            <div class="tg-history-preview" @click="openPreview(item)">
              <img v-if="item.type === 'image'" :src="resolveUrl(item.preview)" :alt="item.fileName" />
              <video v-else :src="resolveUrl(item.preview)" muted loop></video>
              <label class="tg-history-check" @click.stop>
                <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
              </label>
              <span class="tg-history-type">{{ item.type === 'image' ? t('history.badge.image') : t('history.badge.video') }}</span>
            </div>

            <div class="tg-history-info">
              <div class="tg-history-name" :title="item.fileName">{{ item.fileName }}</div>
              <div class="tg-history-meta">
                <span v-if="item.width">{{ item.width }}x{{ item.height }}</span>
                <span>{{ formatFileSize(item.size || 0) }}</span>
              </div>
              <div class="tg-history-tags">
                <span v-if="item.result?.png" class="tg-tag">PNG</span>
                <span v-if="item.result?.webp" class="tg-tag">WEBP</span>
                <span v-if="item.result?.webm" class="tg-tag">WEBM</span>
              </div>
              <input
                class="tg-tag-input"
                :value="item.inputTag || ''"
                :placeholder="t('history.tagInput')"
                @change="(e: Event) => updateTag(item.id, (e.target as HTMLInputElement).value)"
              />
            </div>

            <div class="tg-history-actions">
              <button class="tg-btn-ghost" type="button" @click="downloadOne(item, 'png')" :disabled="!item.result?.png">PNG</button>
              <button class="tg-btn-ghost" type="button" @click="downloadOne(item, 'webp')" :disabled="!item.result?.webp">WEBP</button>
              <button class="tg-btn-ghost" type="button" @click="downloadOne(item, 'webm')" :disabled="!item.result?.webm">WEBM</button>
            </div>
          </div>
        </div>
      </WorkbenchSection>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CalendarDays, Search, Sticker } from 'lucide-vue-next'
import WorkbenchEmptyState from '@/components/workbench/WorkbenchEmptyState.vue'
import WorkbenchSection from '@/components/workbench/WorkbenchSection.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import { useLocale } from '@/composables/useLocale'
import { useConfirm } from '@/composables/useConfirm'
import { useLightbox } from '@/composables/useLightbox'
import { useObjectUrlRegistry } from '@/composables/useObjectUrlRegistry'
import { useHistoryStore } from '@/stores/history'
import { clearCachedStickers, getCachedSticker, removeCachedSticker } from '@/utils/browserStickerStore'
import { downloadZip } from '@/utils/zipDownload'
import { formatDayLabel, formatFileSize, groupByDay } from '@/utils/format'

const { t, locale } = useLocale()
const { confirm } = useConfirm()
const historyStore = useHistoryStore()
const lightbox = useLightbox()
const objectUrls = useObjectUrlRegistry()

const searchQuery = ref('')
const typeFilter = ref('all')
const formatFilter = ref('all')
const tagFilter = ref('all')
const selectedIds = ref<string[]>([])
const cachedUrls = ref<Record<string, string>>({})

const typeOptions = computed(() => [
  { value: 'all', label: t('history.type.all') },
  { value: 'image', label: t('history.type.image') },
  { value: 'video', label: t('history.type.video') }
])

const formatOptions = computed(() => [
  { value: 'all', label: t('history.format.all') },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WEBP' },
  { value: 'webm', label: 'WEBM' }
])

onMounted(async () => {
  historyStore.load()
  await resolveCachedUrls()
})

watch(
  () => historyStore.items.map((item: any) => item.id).join('|'),
  () => {
    void resolveCachedUrls()
  }
)

const resolveUrl = (url: string) => {
  if (!url?.startsWith('cache:')) return url
  return cachedUrls.value[url.slice(6)] || ''
}

const cacheIdOf = (value: unknown) => (
  typeof value === 'string' && value.startsWith('cache:') ? value.slice(6) : null
)

let resolvingUrls = false

const resolveCachedUrls = async () => {
  if (resolvingUrls) return
  resolvingUrls = true

  try {
    const wanted = new Set<string>()
    historyStore.items.forEach((item: any) => {
      const values = [item.preview, item.result?.png, item.result?.webp, item.result?.webm]
      values.forEach(value => {
        const id = cacheIdOf(value)
        if (id) wanted.add(id)
      })
    })

    // Incremental: keep the URLs that are still referenced and only fetch the
    // ones that are new. Editing a tag must not blank the whole gallery.
    const current = cachedUrls.value
    const next: Record<string, string> = {}
    const missing: string[] = []

    for (const id of wanted) {
      if (current[id]) next[id] = current[id]
      else missing.push(id)
    }

    for (const id of Object.keys(current)) {
      if (!next[id]) objectUrls.revoke(current[id])
    }

    cachedUrls.value = next

    for (const id of missing) {
      const cached = await getCachedSticker(id)
      if (cached) next[id] = objectUrls.create(cached.blob)
    }
    cachedUrls.value = { ...next }
  } catch {
    // A failing cache read must never break the panel; previews stay blank.
  } finally {
    resolvingUrls = false
  }
}

const availableTags = computed(() => {
  const tags = new Set<string>()
  historyStore.items.forEach((item: any) => {
    if (item.inputTag) tags.add(item.inputTag)
  })
  return Array.from(tags)
})

const tagOptions = computed(() => [
  { value: 'all', label: t('history.tag.all') },
  ...availableTags.value.map(tag => ({ value: tag, label: tag }))
])

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return historyStore.items.filter((item: any) => {
    const matchQuery = !query || item.fileName.toLowerCase().includes(query) || (item.inputTag || '').toLowerCase().includes(query)
    const matchType = typeFilter.value === 'all' || item.type === typeFilter.value
    const matchFormat =
      formatFilter.value === 'all' ||
      (formatFilter.value === 'png' && item.result?.png) ||
      (formatFilter.value === 'webp' && item.result?.webp) ||
      (formatFilter.value === 'webm' && item.result?.webm)
    const matchTag = tagFilter.value === 'all' || item.inputTag === tagFilter.value
    return matchQuery && matchType && matchFormat && matchTag
  })
})

const grouped = computed(() => groupByDay(filteredItems.value))

const toggleSelect = (id: string) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}

const selectAll = () => {
  selectedIds.value = filteredItems.value.map((item: any) => item.id)
}

const clearSelection = () => {
  selectedIds.value = []
}

const toggleGroup = (group: any[]) => {
  const everySelected = group.every((item: any) => selectedIds.value.includes(item.id))
  selectedIds.value = everySelected
    ? selectedIds.value.filter(id => !group.some((item: any) => item.id === id))
    : [...selectedIds.value, ...group.filter((item: any) => !selectedIds.value.includes(item.id)).map((item: any) => item.id)]
}

const isGroupSelected = (group: any[]) => group.every((item: any) => selectedIds.value.includes(item.id))

const updateTag = (id: string, tag: string) => {
  historyStore.updateTag(id, tag.trim())
}

const downloadName = (fileName: string, format: string) => (
  fileName.toLowerCase().endsWith(`.${format}`) ? fileName : `${fileName}.${format}`
)

const downloadOne = (item: any, format: string) => {
  const url = item.result?.[format]
  if (!url) return

  const link = document.createElement('a')
  link.href = resolveUrl(url)
  link.download = downloadName(item.fileName, format)
  link.click()
}

const downloadSelected = async () => {
  const targets = historyStore.items.filter((item: any) => selectedIds.value.includes(item.id))
  if (!targets.length) return

  const files: { url: string; name: string }[] = []
  for (const item of targets) {
    for (const format of ['png', 'webp', 'webm'] as const) {
      const url = item.result?.[format]
      if (url) files.push({ url, name: downloadName(item.fileName, format) })
    }
  }
  if (!files.length) return

  // Everything lives in IndexedDB now, so the zip is built in the browser:
  // N synthetic <a download> clicks get blocked by Chrome/Firefox after the
  // first one, which is what the old /api/download-batch path could never fix.
  const entries: { name: string; blob: Blob }[] = []
  const leftovers: { url: string; name: string }[] = []

  for (const file of files) {
    const id = cacheIdOf(file.url)
    if (!id) {
      leftovers.push(file)
      continue
    }
    try {
      const cached = await getCachedSticker(id)
      if (cached) entries.push({ name: file.name, blob: cached.blob })
    } catch {}
  }

  if (entries.length) {
    await downloadZip(entries, `stickers-${entries.length}.zip`)
  }

  // Anything not backed by the cache (legacy entries) falls back to a direct
  // browser download.
  for (const file of leftovers) {
    const link = document.createElement('a')
    link.href = resolveUrl(file.url)
    link.download = file.name
    link.click()
  }
}

const removeSelected = async () => {
  const ids = new Set(selectedIds.value)
  // Drop the cached blobs too, otherwise the Telegram panel keeps listing
  // stickers that no longer exist in history.
  const cacheIds = new Set<string>()
  historyStore.items.forEach((item: any) => {
    if (!ids.has(item.id)) return
    const values = [item.preview, item.result?.png, item.result?.webp, item.result?.webm]
    values.forEach(value => {
      const id = cacheIdOf(value)
      if (id) cacheIds.add(id)
    })
  })

  historyStore.removeMany(selectedIds.value)
  selectedIds.value = []

  await Promise.all([...cacheIds].map(async id => {
    try {
      await removeCachedSticker(id)
    } catch {}
  }))
  await resolveCachedUrls()
}

const clearHistory = async () => {
  const ok = await confirm({
    title: t('history.confirmClearTitle'),
    message: t('history.confirmClearBody'),
    confirmText: t('history.btn.clear'),
    danger: true
  })
  if (!ok) return

  historyStore.clear()
  selectedIds.value = []
  cachedUrls.value = {}
  objectUrls.reset()
  await clearCachedStickers()
}

const openPreview = (item: any) => {
  const meta = item.width
    ? `${item.width}x${item.height} / ${formatFileSize(item.size || 0)}`
    : formatFileSize(item.size || 0)

  const preview = resolveUrl(item.preview)
  const downloadUrl = resolveUrl(item.result?.webp || item.result?.png || item.result?.webm || item.preview)

  if (item.type === 'image') {
    lightbox.openImage(preview, item.fileName, meta, downloadUrl)
    return
  }

  lightbox.openVideo(preview, item.fileName, meta, downloadUrl)
}
</script>

<style scoped>
@media (min-width: 1280px) {
  .tg-filter-shell {
    position: sticky;
    top: 88px;
    z-index: 5;
  }
}
</style>
