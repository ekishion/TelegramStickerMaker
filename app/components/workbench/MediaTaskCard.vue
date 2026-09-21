<template>
  <article class="media-task-card" :class="`is-${status}`">
    <div class="media-task-card__preview" @click="$emit('preview')">
      <div class="media-task-card__media">
        <slot name="media" />
      </div>
      <span class="media-task-card__badge">{{ statusLabel }}</span>
      <div v-if="status === 'converting'" class="media-task-card__progress">
        <svg viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="var(--accent)"
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
  --task-accent: var(--ink-3);
  min-width: 0;
}

.media-task-card.is-converting {
  --task-accent: var(--accent-ink);
}

.media-task-card.is-done {
  --task-accent: var(--ok);
}

.media-task-card.is-error {
  --task-accent: var(--err);
}

/* Die-cut sticker: light edge frame around the preview */
.media-task-card__preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  cursor: pointer;
  background: var(--sticker-edge);
  border: 1px solid var(--line);
  padding: 5px;
  box-shadow: var(--shadow-cut);
  transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
}

.media-task-card:hover .media-task-card__preview {
  transform: translateY(-3px) rotate(-0.6deg);
  box-shadow: var(--shadow-lg);
}

.media-task-card__media {
  width: 100%;
  height: 100%;
  border-radius: calc(var(--radius-md) - 5px);
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--paper-2);
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
  left: 12px;
  top: 12px;
  font-family: var(--font-mono);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 4px 9px;
  border-radius: var(--radius-full);
  color: var(--on-ink);
  background: var(--ink);
}

.media-task-card.is-converting .media-task-card__badge {
  background: var(--accent);
  color: var(--on-accent);
}

.media-task-card.is-done .media-task-card__badge {
  background: var(--ok);
  color: #fff;
}

.media-task-card.is-error .media-task-card__badge {
  background: var(--err);
  color: #fff;
}

.media-task-card__progress {
  position: absolute;
  inset: 5px;
  border-radius: calc(var(--radius-md) - 5px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 12, 0.45);
  backdrop-filter: blur(2px);
}

.media-task-card__progress svg {
  width: 38px;
  height: 38px;
}

.media-task-card__progress-text {
  position: absolute;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 600;
  color: #fff;
}

.media-task-card__body {
  display: grid;
  gap: 10px;
  padding: 11px 3px 0;
}

.media-task-card__info {
  display: grid;
  gap: 6px;
}

.media-task-card__name {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.45;
  min-height: calc(1.45em * 2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.media-task-card__meta {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.media-task-card__meta :deep(span) {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--ink-2);
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  background: var(--paper-2);
  border: 1px solid var(--line);
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
    padding: 9px 2px 0;
    gap: 8px;
  }

  .media-task-card__name {
    min-height: 0;
    font-size: 0.68rem;
  }
}
</style>
