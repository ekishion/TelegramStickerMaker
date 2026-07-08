<template>
  <article class="media-task-card" :class="`is-${status}`">
    <div class="media-task-card__shell">
      <div class="media-task-card__preview" @click="$emit('preview')">
        <div class="media-task-card__media">
          <slot name="media" />
        </div>
        <span class="media-task-card__badge">{{ statusLabel }}</span>
        <div v-if="status === 'converting'" class="media-task-card__progress">
          <svg viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--color-border)" stroke-width="3" />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="var(--color-accent)"
              stroke-width="3"
              stroke-dasharray="94"
              :stroke-dashoffset="94 - (94 * progress / 100)"
              stroke-linecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span class="media-task-card__progress-text">{{ progress }}%</span>
        </div>
      </div>

      <div class="media-task-card__body">
        <div class="media-task-card__info">
          <div class="media-task-card__name" :title="name">{{ name }}</div>
          <div class="media-task-card__meta">
            <slot name="meta" />
          </div>
          <div v-if="$slots.extra" class="media-task-card__extra">
            <slot name="extra" />
          </div>
        </div>

        <div class="media-task-card__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  progress?: number
  status: 'pending' | 'converting' | 'done' | 'error'
  statusLabel: string
}>()

defineEmits<{
  preview: []
}>()

const progress = computed(() => props.progress ?? 0)
</script>

<style scoped>
.media-task-card {
  --task-accent: var(--color-text-tertiary);
  min-width: 0;
  font-family: "Manrope", "Noto Sans SC", sans-serif;
}

.media-task-card.is-converting {
  --task-accent: var(--color-accent);
}

.media-task-card.is-done {
  --task-accent: var(--color-success);
}

.media-task-card.is-error {
  --task-accent: var(--color-error);
}

.media-task-card__shell {
  border-radius: 20px;
  padding: 1px;
  background: var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.media-task-card:hover .media-task-card__shell {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.media-task-card__preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 19px 19px 0 0;
  cursor: pointer;
  background: var(--color-surface-solid);
  overflow: hidden;
}

.media-task-card__media {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.05), transparent 45%),
    linear-gradient(180deg, rgba(247, 250, 255, 0.98), rgba(240, 245, 255, 0.98));
}

:global([data-theme="dark"] .media-task-card__media) {
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.12), transparent 48%),
    linear-gradient(180deg, rgba(18, 28, 47, 0.96), rgba(12, 20, 36, 0.96));
}

.media-task-card__media :deep(img),
.media-task-card__media :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.media-task-card__badge {
  position: absolute;
  left: 10px;
  top: 10px;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 5px 9px;
  border-radius: 999px;
  color: #fff;
  background: rgba(10, 10, 10, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
}

.media-task-card.is-converting .media-task-card__badge {
  background: rgba(37, 99, 235, 0.9);
}

.media-task-card.is-done .media-task-card__badge {
  background: rgba(41, 177, 93, 0.82);
}

.media-task-card.is-error .media-task-card__badge {
  background: rgba(232, 78, 60, 0.82);
}

.media-task-card__progress {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.media-task-card__progress svg {
  width: 38px;
  height: 38px;
}

.media-task-card__progress-text {
  position: absolute;
  font-size: 0.62rem;
  font-weight: 700;
  color: #fff;
}

.media-task-card__body {
  display: grid;
  gap: 10px;
  padding: 12px 12px 14px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.media-task-card__info {
  display: grid;
  gap: 6px;
}

.media-task-card__name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.35;
  min-height: calc(1.35em * 2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.media-task-card__meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.media-task-card__meta :deep(span) {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
}

.media-task-card__extra {
  display: grid;
  gap: 4px;
}

.media-task-card__actions {
  display: grid;
  gap: 5px;
}

@media (max-width: 600px) {
  .media-task-card__body {
    padding: 10px;
    gap: 8px;
  }

  .media-task-card__name {
    min-height: 0;
    font-size: 0.74rem;
  }
}
</style>
