<template>
  <section class="history-panel float-in history-section">
    <div class="history-toolbar">
      <div>
        <div class="history-title">历史档案</div>
        <div class="text-secondary">按时间分组、批量操作、标签管理</div>
      </div>
      <div class="workbench-actions">
        <button class="kv-action secondary" type="button" @click="clearHistory">清空历史</button>
        <button class="kv-action" type="button" :disabled="selectedIds.length === 0" @click="downloadSelected">批量下载</button>
      </div>
    </div>

    <div class="history-toolbar">
      <div class="history-filters">
        <input id="history-search" v-model="searchQuery" name="historySearch" class="input-field" placeholder="搜索文件名 / 标签" />
        <select id="history-type-filter" v-model="typeFilter" name="historyTypeFilter" class="select-field">
          <option value="all">全部类型</option>
          <option value="image">静态贴纸</option>
          <option value="video">视频贴纸</option>
        </select>
        <select id="history-format-filter" v-model="formatFilter" name="historyFormatFilter" class="select-field">
          <option value="all">全部格式</option>
          <option value="png">PNG</option>
          <option value="webp">WEBP</option>
          <option value="webm">WEBM</option>
        </select>
        <select id="history-tag-filter" v-model="tagFilter" name="historyTagFilter" class="select-field">
          <option value="all">全部标签</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </div>
      <div class="history-filters">
        <button class="kv-action secondary" type="button" @click="selectAll">全选</button>
        <button class="kv-action secondary" type="button" @click="clearSelection">清空选择</button>
        <button class="kv-action secondary" type="button" @click="removeSelected" :disabled="selectedIds.length === 0">删除选中</button>
      </div>
    </div>

    <div v-if="filteredItems.length === 0" class="empty-state">
      <strong>暂无记录</strong>
      <div class="text-secondary">完成一次贴纸输出后会自动归档到这里</div>
    </div>

    <div v-else class="section-stack">
      <div v-for="(group, dateKey) in grouped" :key="dateKey" class="history-group">
        <div class="history-group-header">
          <div class="history-group-title">{{ dateKey }}</div>
          <div class="history-group-divider"></div>
          <label class="chip">
            <input :id="`history-group-${dateKey}`" name="historyGroupSelect" type="checkbox" :checked="isGroupSelected(group)" @change="toggleGroup(group)" />
            本组全选
          </label>
        </div>
        <div class="section-stack">
          <article v-for="item in group" :key="item.id" class="history-card">
            <div class="history-preview" @click="openPreview(item)">
              <img v-if="item.type === 'image'" :src="resolveUrl(item.preview)" :alt="item.fileName" />
              <video v-else :src="resolveUrl(item.preview)" muted loop></video>
            </div>
            <div class="history-info">
              <div class="history-info-header">
                <strong class="history-name" :title="item.fileName">{{ item.fileName }}</strong>
                <label class="chip">
                  <input :id="`history-select-${item.id}`" name="historyItemSelect" type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                  选择
                </label>
              </div>
              <div class="history-meta">
                <span v-if="item.width">{{ item.width }}x{{ item.height }}</span>
                <span>{{ formatFileSize(item.size || 0) }}</span>
                <span>{{ formatTimestamp(item.timestamp) }}</span>
              </div>
              <div class="history-meta">
                <span class="chip">{{ item.type === 'image' ? '静态' : '视频' }}</span>
                <span v-if="item.result?.png" class="chip">PNG</span>
                <span v-if="item.result?.webp" class="chip">WEBP</span>
                <span v-if="item.result?.webm" class="chip">WEBM</span>
              </div>
              <input
                :id="`history-tag-${item.id}`"
                name="historyTag"
                class="input-field history-tag-input"
                :value="item.inputTag || ''"
                placeholder="添加标签"
                @change="(event: Event) => updateTag(item.id, (event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="history-actions">
              <button class="kv-action secondary" type="button" @click="downloadOne(item, 'png')" :disabled="!item.result?.png">PNG</button>
              <button class="kv-action secondary" type="button" @click="downloadOne(item, 'webp')" :disabled="!item.result?.webp">WEBP</button>
              <button class="kv-action secondary" type="button" @click="downloadOne(item, 'webm')" :disabled="!item.result?.webm">WEBM</button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { formatFileSize, formatTimestamp, groupByDay } from '@/utils/format'
import { useLightbox } from '@/composables/useLightbox'
import { getCachedSticker } from '@/utils/browserStickerStore'

const historyStore = useHistoryStore()
const lightbox = useLightbox()
const searchQuery = ref('')
const typeFilter = ref('all')
const formatFilter = ref('all')
const tagFilter = ref('all')
const selectedIds = ref<string[]>([])
const cachedUrls = ref<Record<string, string>>({})

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
const clearHistory = () => { historyStore.clear(); selectedIds.value = [] }

const openPreview = (item: any) => {
  const meta = `${item.width}x${item.height} / ${formatFileSize(item.size || 0)}`
  if (item.type === 'image') {
    lightbox.openImage(resolveUrl(item.preview), item.fileName, meta)
  } else {
    lightbox.openVideo(resolveUrl(item.preview), item.fileName, meta)
  }
}
</script>
