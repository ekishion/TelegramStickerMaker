<template>
  <div class="custom-select" ref="containerRef">
    <button
      type="button"
      class="custom-select-trigger"
      :class="{ open: isOpen }"
      @click="toggle"
    >
      <span class="custom-select-label">{{ selectedLabel }}</span>
      <svg class="custom-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
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
          <svg v-if="option.value === modelValue" class="custom-select-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

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
  gap: 6px;
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 0 12px;
  background: var(--color-surface-solid);
  color: var(--color-text);
  font-size: 0.85rem;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 40px;
  box-shadow: none;
  text-align: left;
}

.custom-select-trigger:hover {
  border-color: var(--color-border-strong);
  background: var(--color-surface-hover);
}

.custom-select-trigger.open {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.custom-select-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-select-chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
}

.custom-select-trigger.open .custom-select-chevron {
  transform: rotate(180deg);
}

.custom-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  border-radius: var(--radius-md);
  background: var(--color-surface-solid);
  border: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-lg);
  padding: 4px;
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  width: max-content;
}

.custom-select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.82rem;
  font-family: var(--font-sans);
  color: var(--color-text);
  transition: background 0.12s ease;
  text-align: left;
}

.custom-select-option:hover {
  background: var(--color-accent-light);
  color: var(--color-accent-strong);
}

.custom-select-option.selected {
  background: var(--color-accent-light);
  color: var(--color-accent-strong);
  font-weight: 600;
}

.custom-select-check {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-accent);
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
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
