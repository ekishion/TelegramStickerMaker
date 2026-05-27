<template>
  <div class="tg-workbench">
    <!-- Filters section -->
    <div class="tg-section">
      <div class="tg-section-head">
        <div class="tg-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div>
          <h3 class="tg-section-title">历史档案</h3>
          <p class="tg-section-desc">{{ filteredItems.length }} 条记录</p>
        </div>
        <div class="tg-section-right">
          <span class="tg-count" v-if="selectedIds.length">{{ selectedIds.length }} 已选</span>
        </div>
      </div>

      <div class="tg-filters">
        <input v-model="searchQuery" class="tg-search" placeholder="搜索文件名 / 标签" />
        <CustomSelect v-model="typeFilter" :options="typeOptions" />
        <CustomSelect v-model="formatFilter" :options="formatOptions" />
        <CustomSelect v-model="tagFilter" :options="tagOptions" />
      </div>

      <div class="tg-filter-actions">
        <button class="tg-btn-ghost" type="button" @click="selectAll">全选</button>
        <button class="tg-btn-ghost" type="button" @click="clearSelection">取消全选</button>
        <button class="tg-btn-ghost tg-btn-danger" type="button" @click="removeSelected" :disabled="selectedIds.length === 0">删除所选</button>
        <div class="tg-spacer"></div>
        <button class="tg-btn-ghost" type="button" @click="downloadSelected" :disabled="selectedIds.length === 0">批量下载</button>
        <button class="tg-btn-ghost tg-btn-danger" type="button" @click="clearHistory">清空历史</button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredItems.length === 0" class="tg-section tg-empty">
      <div class="tg-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div class="tg-empty-title">暂无记录</div>
      <div class="tg-empty-desc">完成一次贴纸输出后会自动归档到这里</div>
    </div>

    <!-- Grouped items -->
    <template v-else>
      <div v-for="(group, dateKey) in grouped" :key="dateKey" class="tg-section">
        <div class="tg-section-head">
          <div class="tg-section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <h3 class="tg-section-title">{{ dateKey }}</h3>
            <p class="tg-section-desc">{{ group.length }} 条记录</p>
          </div>
          <div class="tg-section-right">
            <label class="tg-group-check">
              <input type="checkbox" :checked="isGroupSelected(group)" @change="toggleGroup(group)" />
              <span>全选</span>
            </label>
          </div>
        </div>

        <div class="tg-gallery">
          <div v-for="item in group" :key="item.id" class="tg-history-item" :class="{ selected: selectedIds.includes(item.id) }">
            <div class="tg-history-preview" @click="openPreview(item)">
              <img v-if="item.type === 'image'" :src="resolveUrl(item.preview)" :alt="item.fileName" />
              <video v-else :src="resolveUrl(item.preview)" muted loop></video>
              <label class="tg-history-check" @click.stop>
                <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
              </label>
              <span class="tg-history-type">{{ item.type === 'image' ? '静态' : '视频' }}</span>
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
                placeholder="添加标签"
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
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { formatFileSize, groupByDay } from '@/utils/format'
import { useLightbox } from '@/composables/useLightbox'
import { getCachedSticker, clearCachedStickers } from '@/utils/browserStickerStore'
import CustomSelect from '@/components/ui/CustomSelect.vue'

const historyStore = useHistoryStore()
const lightbox = useLightbox()
const searchQuery = ref('')
const typeFilter = ref('all')
const formatFilter = ref('all')
const tagFilter = ref('all')
const selectedIds = ref<string[]>([])
const cachedUrls = ref<Record<string, string>>({})

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'image', label: '静态贴纸' },
  { value: 'video', label: '视频贴纸' }
]
const formatOptions = [
  { value: 'all', label: '全部格式' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WEBP' },
  { value: 'webm', label: 'WEBM' }
]

onMounted(async () => {
  historyStore.load()
  await resolveCachedUrls()
})

onBeforeUnmount(() => {
  Object.values(cachedUrls.value).forEach(url => URL.revokeObjectURL(url))
})

const resolveUrl = (url: string) => {
  if (!url?.startsWith('cache:')) return url
  const id = url.slice(6)
  return cachedUrls.value[id] || ''
}

const resolveCachedUrls = async () => {
  const ids = new Set<string>()
  historyStore.items.forEach((item: any) => {
    const values = [item.preview, item.result?.png, item.result?.webp, item.result?.webm]
    values.forEach(value => {
      if (typeof value === 'string' && value.startsWith('cache:')) ids.add(value.slice(6))
    })
  })

  for (const id of ids) {
    if (cachedUrls.value[id]) continue
    const cached = await getCachedSticker(id)
    if (cached) cachedUrls.value[id] = URL.createObjectURL(cached.blob)
  }
}

const availableTags = computed(() => {
  const tags = new Set<string>()
  historyStore.items.forEach((item: any) => { if (item.inputTag) tags.add(item.inputTag) })
  return Array.from(tags)
})

const tagOptions = computed(() => [
  { value: 'all', label: '全部标签' },
  ...availableTags.value.map(tag => ({ value: tag, label: tag }))
])

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return historyStore.items.filter((item: any) => {
    const matchQuery = !query || item.fileName.toLowerCase().includes(query) || (item.inputTag || '').includes(query)
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
const selectAll = () => { selectedIds.value = filteredItems.value.map((item: any) => item.id) }
const clearSelection = () => { selectedIds.value = [] }

const toggleGroup = (group: any[]) => {
  const allSelected = group.every((item: any) => selectedIds.value.includes(item.id))
  selectedIds.value = allSelected
    ? selectedIds.value.filter(id => !group.find((item: any) => item.id === id))
    : [...selectedIds.value, ...group.filter((item: any) => !selectedIds.value.includes(item.id)).map((item: any) => item.id)]
}

const isGroupSelected = (group: any[]) => group.every((item: any) => selectedIds.value.includes(item.id))
const updateTag = (id: string, tag: string) => { historyStore.updateTag(id, tag.trim()) }

const downloadName = (fileName: string, format: string) => {
  return fileName.toLowerCase().endsWith(`.${format}`) ? fileName : `${fileName}.${format}`
}

const downloadOne = (item: any, format: string) => {
  const url = item.result?.[format]
  if (!url) return
  const a = document.createElement('a')
  a.href = resolveUrl(url)
  a.download = downloadName(item.fileName, format)
  a.click()
}

const toBatchFiles = (items: any[]) => items.flatMap(item => {
  const files: { url: string; name: string }[] = []
  if (item.result?.png) files.push({ url: item.result.png, name: downloadName(item.fileName, 'png') })
  if (item.result?.webp) files.push({ url: item.result.webp, name: downloadName(item.fileName, 'webp') })
  if (item.result?.webm) files.push({ url: item.result.webm, name: downloadName(item.fileName, 'webm') })
  return files
})

const downloadSelected = async () => {
  const targets = historyStore.items.filter((item: any) => selectedIds.value.includes(item.id))
  if (!targets.length) return
  const files = toBatchFiles(targets)
  if (files.some(file => String(file.url).startsWith('data:') || String(file.url).startsWith('cache:'))) {
    files.forEach(file => {
      const a = document.createElement('a')
      a.href = resolveUrl(file.url)
      a.download = file.name
      a.click()
    })
    return
  }
  const response = await fetch('/api/download-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  })
  if (!response.ok) return
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `history-${Date.now()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

const removeSelected = () => { historyStore.removeMany(selectedIds.value); selectedIds.value = [] }
const clearHistory = async () => {
  historyStore.clear()
  selectedIds.value = []
  await clearCachedStickers()
}

const openPreview = (item: any) => {
  const meta = item.width ? `${item.width}x${item.height} / ${formatFileSize(item.size || 0)}` : formatFileSize(item.size || 0)
  if (item.type === 'image') {
    lightbox.openImage(resolveUrl(item.preview), item.fileName, meta)
  } else {
    lightbox.openVideo(resolveUrl(item.preview), item.fileName, meta)
  }
}
</script>

<style scoped>
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

/* Filters */
.tg-filters {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.tg-search {
  flex: 1; min-width: 160px; padding: 8px 12px;
  border-radius: var(--radius-sm); border: 1px solid var(--color-border);
  background: var(--color-bg-subtle); color: var(--color-text);
  font-size: 0.8rem; font-family: var(--font-sans);
  outline: none; transition: border-color 0.15s ease;
}
.tg-search:focus { border-color: var(--color-accent); }
.tg-search::placeholder { color: var(--color-text-tertiary); }

.tg-filter-actions {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding-top: 8px; border-top: 1px solid var(--color-border);
}
.tg-spacer { flex: 1; }

/* Group header */
.tg-group-check {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.72rem; color: var(--color-text-tertiary); cursor: pointer;
  white-space: nowrap;
}
.tg-group-check input { accent-color: var(--color-accent); }

/* Empty state */
.tg-empty {
  text-align: center; padding: 48px 20px;
  justify-items: center;
}
.tg-empty-icon { color: var(--color-text-tertiary); opacity: 0.5; }
.tg-empty-title { font-size: 1rem; font-weight: 600; color: var(--color-text); margin-top: 12px; }
.tg-empty-desc { font-size: 0.82rem; color: var(--color-text-tertiary); margin-top: 4px; }

/* Gallery */
.tg-gallery {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;
}

.tg-history-item {
  padding: 10px; border-radius: var(--radius-md); background: var(--color-bg-subtle);
  display: grid; gap: 6px; transition: background 0.15s ease;
}
.tg-history-item.selected { background: var(--color-accent-light); }

.tg-history-preview {
  position: relative; width: 100%; aspect-ratio: 16/10;
  border-radius: var(--radius-sm); overflow: hidden; background: var(--color-surface);
  cursor: pointer;
}
.tg-history-preview img,
.tg-history-preview video { width: 100%; height: 100%; object-fit: cover; }

.tg-history-check {
  position: absolute; top: 6px; left: 6px;
  width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4); border-radius: 4px; cursor: pointer;
}
.tg-history-check input { accent-color: #fff; width: 14px; height: 14px; }

.tg-history-type {
  position: absolute; bottom: 6px; right: 6px;
  font-size: 0.6rem; font-weight: 700; padding: 2px 6px;
  border-radius: 4px; color: #fff; background: rgba(0,0,0,0.5);
}

.tg-history-info { padding: 0 2px; display: grid; gap: 4px; }
.tg-history-name {
  font-size: 0.72rem; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tg-history-meta {
  display: flex; gap: 6px; font-size: 0.65rem; color: var(--color-text-tertiary);
}
.tg-history-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.tg-tag {
  font-size: 0.6rem; font-weight: 600; padding: 1px 5px;
  border-radius: 3px; background: var(--color-accent-light); color: var(--color-accent);
}
.tg-tag-input {
  width: 100%; padding: 4px 8px;
  border-radius: var(--radius-sm); border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text);
  font-size: 0.68rem; font-family: var(--font-sans);
  outline: none; transition: border-color 0.15s ease;
}
.tg-tag-input:focus { border-color: var(--color-accent); }
.tg-tag-input::placeholder { color: var(--color-text-tertiary); }

.tg-history-actions {
  display: flex; gap: 4px; flex-wrap: wrap;
}

/* Buttons */
.tg-btn-ghost {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 8px; border-radius: var(--radius-sm); border: none;
  background: transparent; color: var(--color-text-secondary);
  font-size: 0.7rem; font-weight: 500; font-family: var(--font-sans);
  cursor: pointer; transition: all 0.15s ease;
}
.tg-btn-ghost:hover:not(:disabled) { background: var(--color-surface); color: var(--color-text); }
.tg-btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
.tg-btn-danger:hover:not(:disabled) { color: var(--color-error); background: var(--color-error-light); }

@media (max-width: 600px) {
  .tg-section { padding: 14px; border-radius: var(--radius-md); }
  .tg-section-icon { width: 30px; height: 30px; }
  .tg-section-icon svg { width: 15px; height: 15px; }
  .tg-section-title { font-size: 0.88rem; }
  .tg-filters { gap: 6px; }
  .tg-search { min-width: 100%; }
  .tg-gallery { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
  .tg-history-actions { gap: 3px; }
  .tg-btn-ghost { padding: 3px 6px; font-size: 0.65rem; }
  .tg-filter-actions { gap: 4px; }
}
</style>
