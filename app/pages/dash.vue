<template>
  <main class="section-stack">
    <WorkbenchShell>
      <template #tabs>
        <SegmentedTabs v-model="activeTab" :items="tabs" />
      </template>

      <KeepAlive>
        <component :is="activePanel" />
      </KeepAlive>
    </WorkbenchShell>
  </main>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue'
import HistoryPanel from '@/components/history/HistoryPanel.vue'
import SegmentedTabs from '@/components/ui/SegmentedTabs.vue'
import ImageWorkbench from '@/components/workbench/ImageWorkbench.vue'
import TelegramWorkbench from '@/components/workbench/TelegramWorkbench.vue'
import VideoWorkbench from '@/components/workbench/VideoWorkbench.vue'
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'

const route = useRoute()
const router = useRouter()

const tabs = computed(() => [
  { key: 'image', label: '静态贴纸' },
  { key: 'video', label: '视频贴纸' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'history', label: '历史记录' }
])

const panels = {
  image: markRaw(ImageWorkbench),
  video: markRaw(VideoWorkbench),
  telegram: markRaw(TelegramWorkbench),
  history: markRaw(HistoryPanel)
} as const

const tabKeys = new Set(['image', 'video', 'telegram', 'history'])

const resolveTab = (value: unknown) => {
  if (typeof value === 'string' && tabKeys.has(value)) return value
  return 'image'
}

const activeTab = ref(resolveTab(route.query.tab))

const activePanel = computed(() => panels[activeTab.value as keyof typeof panels] || panels.image)

watch(
  () => route.query.tab,
  tab => {
    const nextTab = resolveTab(tab)
    if (activeTab.value !== nextTab) activeTab.value = nextTab
  }
)

watch(activeTab, tab => {
  if (route.query.tab === tab) return

  void router.replace({
    query: {
      ...route.query,
      tab
    }
  })
})
</script>
