<template>
  <main class="section-stack">
    <WorkbenchShell>
      <template #tabs>
        <SegmentedTabs v-model="activeTab" :items="tabs" />
      </template>

      <ImageWorkbench v-if="activeTab === 'image'" />
      <VideoWorkbench v-else-if="activeTab === 'video'" />
      <TelegramWorkbench v-else-if="activeTab === 'telegram'" />
      <HistoryPanel v-else />
    </WorkbenchShell>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const tabKeys = new Set(['image', 'video', 'telegram', 'history'])

const resolveTab = (value: unknown) => {
  if (typeof value === 'string' && tabKeys.has(value)) return value
  return 'image'
}

const activeTab = ref(resolveTab(route.query.tab))

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
