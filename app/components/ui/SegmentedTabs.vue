<template>
  <div class="segmented-tabs" role="tablist" ref="tabsRef">
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
import { ref, nextTick, watch } from 'vue'

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

const selectTab = (key: string) => {
  emit('update:modelValue', key)
}

watch(() => props.modelValue, async () => {
  await nextTick()
  if (!tabsRef.value) return
  const activeBtn = tabsRef.value.querySelector('.active') as HTMLElement | null
  activeBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
})
</script>
