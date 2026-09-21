<template>
  <div class="segmented-tabs" role="tablist" ref="tabsRef">
    <span class="segmented-tabs__indicator" ref="indicatorRef" aria-hidden="true"></span>
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      :class="{ active: item.key === modelValue }"
      role="tab"
      :aria-selected="item.key === modelValue"
      @click="selectTab(item.key)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'

interface TabItem {
  key: string
  label: string
}

const props = defineProps<{
  items: TabItem[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tabsRef = ref<HTMLElement | null>(null)
const indicatorRef = ref<HTMLElement | null>(null)

const selectTab = (key: string) => {
  emit('update:modelValue', key)
}

const syncIndicator = async () => {
  await nextTick()
  const tabs = tabsRef.value
  const indicator = indicatorRef.value
  if (!tabs || !indicator) return

  const activeBtn = tabs.querySelector('button.active') as HTMLElement | null
  if (!activeBtn) return

  indicator.style.width = `${activeBtn.offsetWidth}px`
  indicator.style.transform = `translateX(${activeBtn.offsetLeft}px)`
  activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

watch(() => props.modelValue, syncIndicator, { immediate: true })
watch(() => props.items, syncIndicator)

onMounted(() => {
  tabsRef.value?.classList.add('is-ready')
  syncIndicator()
  window.addEventListener('resize', syncIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncIndicator)
})
</script>

<style scoped>
.segmented-tabs {
  position: relative;
  display: inline-flex;
  background: var(--paper-2);
  border-radius: var(--radius-full);
  padding: 4px;
  border: 1px solid var(--line);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.segmented-tabs::-webkit-scrollbar {
  display: none;
}

.segmented-tabs__indicator {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  width: 0;
  border-radius: var(--radius-full);
  background: var(--ink);
  opacity: 0;
  transition: transform 0.35s var(--ease-spring), width 0.35s var(--ease-spring), opacity 0.2s ease;
  will-change: transform;
}

.segmented-tabs.is-ready .segmented-tabs__indicator {
  opacity: 1;
}

.segmented-tabs button {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  padding: 8px 18px;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-2);
  transition: color 0.2s ease, background 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 36px;
}

.segmented-tabs button:hover {
  color: var(--ink);
}

/* Static ink pill until the sliding indicator takes over (is-ready). */
.segmented-tabs button.active {
  background: var(--ink);
  color: var(--on-ink);
  font-weight: 700;
}

.segmented-tabs.is-ready button.active {
  background: transparent;
}

@media (max-width: 600px) {
  .segmented-tabs {
    width: 100%;
  }

  .segmented-tabs button {
    flex: 1 0 auto;
    padding: 8px 13px;
    font-size: 0.76rem;
  }
}
</style>
