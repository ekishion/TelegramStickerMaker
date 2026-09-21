<template>
  <div class="custom-select" ref="containerRef">
    <button
      type="button"
      class="custom-select-trigger"
      :class="{ open: isOpen }"
      @click="toggle"
    >
      <span class="custom-select-label">{{ selectedLabel }}</span>
      <ChevronDown class="custom-select-chevron" :size="15" :stroke-width="2" />
    </button>
    <Transition name="dropdown">
      <div v-if="isOpen" class="custom-select-dropdown">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="custom-select-option"
          :class="{ selected: option.value === modelValue }"
          @click="select(option.value)"
        >
          <span>{{ option.label }}</span>
          <Check v-if="option.value === modelValue" :size="14" :stroke-width="2.4" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'

interface Option {
  value: string
  label: string
}

const props = defineProps<{
  options: Option[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(() =>
  props.options.find(o => o.value === props.modelValue)?.label ?? props.modelValue
)

const toggle = () => { isOpen.value = !isOpen.value }
const close = () => { isOpen.value = false }

const select = (value: string) => {
  emit('update:modelValue', value)
  close()
}

const onClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => { document.addEventListener('mousedown', onClickOutside) })
onBeforeUnmount(() => { document.removeEventListener('mousedown', onClickOutside) })
</script>

<style scoped>
.custom-select {
  position: relative;
}

.custom-select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  padding: 0 13px;
  background: var(--paper-2);
  color: var(--ink);
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  min-height: 40px;
  text-align: left;
}

.custom-select-trigger:hover {
  border-color: var(--line-strong);
}

.custom-select-trigger.open {
  border-color: var(--ink);
  background: var(--surface);
}

.custom-select-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select-chevron {
  flex-shrink: 0;
  color: var(--ink-3);
  transition: transform 0.25s var(--ease-spring);
}

.custom-select-trigger.open .custom-select-chevron {
  transform: rotate(180deg);
}

.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: var(--z-pop);
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  box-shadow: var(--shadow-lg);
  padding: 5px;
  max-height: 240px;
  overflow-y: auto;
  width: max-content;
  min-width: 100%;
}

.custom-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 9px 11px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--ink);
  transition: background 0.12s ease;
  text-align: left;
}

.custom-select-option:hover {
  background: var(--paper-2);
}

.custom-select-option.selected {
  color: var(--accent-ink);
  font-weight: 700;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.16s ease, transform 0.16s var(--ease-out);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (max-width: 600px) {
  .custom-select-trigger {
    font-size: 16px; /* prevents iOS zoom */
    min-height: 44px;
  }
  .custom-select-option {
    padding: 10px;
    min-height: 40px;
  }
}
</style>
