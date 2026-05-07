<template>
  <main class="section-stack">
    <KvHero />

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
import { computed, ref } from 'vue'
import KvHero from '@/components/kv/KvHero.vue'
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import SegmentedTabs from '@/components/ui/SegmentedTabs.vue'
import HistoryPanel from '@/components/history/HistoryPanel.vue'
import ImageWorkbench from '@/components/workbench/ImageWorkbench.vue'
import VideoWorkbench from '@/components/workbench/VideoWorkbench.vue'
import TelegramWorkbench from '@/components/workbench/TelegramWorkbench.vue'

const tabs = computed(() => {
  const items = [
    { key: 'image', label: '静态贴纸' },
    { key: 'video', label: '动态贴纸' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'history', label: '历史记录' }
  ]
  return items
})

const activeTab = ref('image')
</script>
