<template>
  <div class="workbench-empty">
    <div class="workbench-empty__icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </slot>
    </div>
    <span class="workbench-empty__title">{{ title }}</span>
    <span v-if="hint" class="workbench-empty__hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  hint?: string
}>()
</script>

<style scoped>
.workbench-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.workbench-empty__icon {
  opacity: 0.4;
}

.workbench-empty__title {
  font-size: 0.85rem;
}

.workbench-empty__hint {
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>
