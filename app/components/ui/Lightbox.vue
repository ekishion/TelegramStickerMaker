<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="visible" class="lightbox-overlay" @click.self="close">
        <div ref="containerRef" class="lightbox-container" role="dialog" aria-modal="true" :aria-label="item?.name">
          <div class="lightbox-header">
            <div class="lightbox-info">
              <strong>{{ item?.name }}</strong>
              <span v-if="item?.meta" class="lightbox-meta">{{ item.meta }}</span>
            </div>
            <div class="lightbox-actions">
              <a v-if="item?.downloadUrl" :href="item.downloadUrl" :download="item.downloadName || item?.name" class="lightbox-btn" :title="t('lightbox.download')">
                <Download :size="17" :stroke-width="2" />
              </a>
              <button class="lightbox-btn" type="button" @click="close" :title="t('lightbox.close')">
                <X :size="17" :stroke-width="2" />
              </button>
            </div>
          </div>
          <div class="lightbox-body">
            <img v-if="item?.type === 'image'" :src="item.src" :alt="item.name" class="lightbox-media" />
            <video v-else-if="item?.type === 'video'" :src="item.src" controls autoplay loop class="lightbox-media" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { Download, X } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()

export interface LightboxItem {
  type: 'image' | 'video'
  src: string
  name: string
  meta?: string
  downloadUrl?: string
  downloadName?: string
}

const visible = ref(false)
const item = ref<LightboxItem | null>(null)

const containerRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const open = (data: LightboxItem) => {
  previouslyFocused = document.activeElement as HTMLElement | null
  item.value = data
  visible.value = true
  document.body.style.overflow = 'hidden'
  nextTick(() => containerRef.value?.querySelector<HTMLElement>('.lightbox-btn')?.focus())
}

const close = () => {
  visible.value = false
  document.body.style.overflow = ''
  previouslyFocused?.focus?.()
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && visible.value) close()
}

onMounted(() => { document.addEventListener('keydown', onKeydown) })
onUnmounted(() => { document.removeEventListener('keydown', onKeydown); document.body.style.overflow = '' })

defineExpose({ open, close })
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 12, 0.88);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 24px;
}

.lightbox-container {
  display: grid;
  grid-template-rows: auto 1fr;
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  max-width: 960px;
}

.lightbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-md);
  padding: 0 0 12px;
}

.lightbox-info {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  color: #f4f4f1;
  font-size: 0.9rem;
  min-width: 0;
}

.lightbox-info strong {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 0.82rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lightbox-meta {
  color: rgba(244, 244, 241, 0.5);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  white-space: nowrap;
}

.lightbox-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.lightbox-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(244, 244, 241, 0.24);
  background: rgba(244, 244, 241, 0.08);
  color: #f4f4f1;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s var(--ease-spring);
  text-decoration: none;
}

.lightbox-btn:hover {
  background: rgba(244, 244, 241, 0.2);
  transform: scale(1.06);
}

.lightbox-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.lightbox-media {
  max-width: 100%;
  max-height: calc(90vh - 80px);
  object-fit: contain;
  border-radius: var(--radius-md);
}

/* Transitions */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.22s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .lightbox-overlay {
    padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
  }
  .lightbox-info strong {
    font-size: 0.76rem;
  }
  .lightbox-meta {
    display: none;
  }
  .lightbox-btn {
    width: 42px;
    height: 42px;
  }
  .lightbox-media {
    max-height: calc(100dvh - 60px);
  }
}
</style>
