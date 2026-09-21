<template>
  <main class="section-stack">
    <WorkbenchShell>
      <template #tabs>
        <SegmentedTabs v-model="activeTab" :items="tabs" />
      </template>

      <Transition name="tab-panel" mode="out-in">
        <div :id="`panel-${activeTab}`" role="tabpanel" :aria-labelledby="`tab-${activeTab}`" tabindex="0">
          <KeepAlive>
            <component :is="activePanel" />
          </KeepAlive>
        </div>
      </Transition>
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
import { useLocale } from '@/composables/useLocale'

const route = useRoute()
const router = useRouter()
const { t } = useLocale()

useHead(() => ({
  title: t('meta.dash')
}))

const tabs = computed(() => [
  { key: 'image', label: t('dash.tab.image') },
  { key: 'video', label: t('dash.tab.video') },
  { key: 'telegram', label: t('dash.tab.telegram') },
  { key: 'history', label: t('dash.tab.history') }
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
