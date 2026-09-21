<template>
  <section class="workbench-section">
    <div class="workbench-section__head">
      <div v-if="$slots.icon" class="workbench-section__icon">
        <slot name="icon" />
      </div>
      <div class="workbench-section__copy">
        <h3 class="workbench-section__title">{{ title }}</h3>
        <p v-if="description" class="workbench-section__desc">{{ description }}</p>
      </div>
      <div v-if="$slots.right || badge" class="workbench-section__right">
        <slot name="right">
          <span class="workbench-section__badge">{{ badge }}</span>
        </slot>
      </div>
    </div>

    <div class="workbench-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  badge?: string
}>()
</script>

<style scoped>
.workbench-section {
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
}

.workbench-section__head {
  display: flex;
  align-items: flex-start;
  gap: 13px;
}

.workbench-section__icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--ink);
  color: var(--on-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.workbench-section__copy {
  min-width: 0;
}

.workbench-section__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
}

.workbench-section__desc {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.03em;
  color: var(--ink-3);
  margin-top: 3px;
}

.workbench-section__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.workbench-section__badge {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--accent-ink);
  padding: 4px 11px;
  background: var(--accent-soft);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.workbench-section__body {
  display: grid;
  gap: inherit;
}

@media (max-width: 600px) {
  .workbench-section {
    padding: 16px;
    border-radius: var(--radius-md);
    gap: 14px;
  }

  .workbench-section__icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
  }

  .workbench-section__title {
    font-size: 0.92rem;
  }
}
</style>
