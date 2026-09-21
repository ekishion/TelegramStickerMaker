<template>
  <div class="workbench-empty">
    <div class="workbench-empty__icon">
      <slot name="icon">
        <Sticker :size="30" :stroke-width="1.5" />
      </slot>
    </div>
    <span class="workbench-empty__title">{{ title }}</span>
    <span v-if="hint" class="workbench-empty__hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
import { Sticker } from 'lucide-vue-next'

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
  padding: 36px 16px;
  color: var(--ink-3);
  text-align: center;
  border: 1.5px dashed var(--line);
  border-radius: var(--radius-md);
}

.workbench-empty__icon {
  opacity: 0.6;
  margin-bottom: 2px;
}

.workbench-empty__title {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--ink-2);
}

.workbench-empty__hint {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  opacity: 0.85;
  max-width: 40ch;
  line-height: 1.7;
}
</style>
