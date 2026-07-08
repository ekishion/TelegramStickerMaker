<template>
  <section class="workbench-section">
    <div class="workbench-section__head">
      <div class="workbench-section__icon">
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
  gap: var(--gap-md);
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.workbench-section__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.workbench-section__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--color-accent-light);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.workbench-section__copy {
  min-width: 0;
}

.workbench-section__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.workbench-section__desc {
  font-size: 0.78rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.workbench-section__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

.workbench-section__badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  padding: 2px 8px;
  background: var(--color-accent-light);
  border-radius: var(--radius-full);
}

.workbench-section__body {
  display: grid;
  gap: inherit;
}

@media (min-width: 1280px) {
  .workbench-section {
    padding: 24px;
    border-radius: 24px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 249, 255, 0.92)),
      var(--color-surface);
    box-shadow: var(--shadow-md);
  }

  :global([data-theme="dark"] .workbench-section) {
    background:
      linear-gradient(180deg, rgba(17, 28, 49, 0.94), rgba(11, 20, 36, 0.96)),
      var(--color-surface);
  }

  .workbench-section__head {
    align-items: center;
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .workbench-section {
    padding: 14px;
    border-radius: var(--radius-md);
  }

  .workbench-section__icon {
    width: 30px;
    height: 30px;
  }

  .workbench-section__title {
    font-size: 0.88rem;
  }
}
</style>
