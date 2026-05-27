<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="visible" class="lightbox-overlay" @click.self="close">
        <div class="lightbox-container">
          <div class="lightbox-header">
            <div class="lightbox-info">
              <strong>{{ item?.name }}</strong>
              <span v-if="item?.meta" class="lightbox-meta">{{ item.meta }}</span>
            </div>
            <div class="lightbox-actions">
              <a v-if="item?.downloadUrl" :href="item.downloadUrl" :download="item.downloadName || item?.name" class="lightbox-btn" title="下载">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
              <button class="lightbox-btn" type="button" @click="close" title="关闭">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
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

const open = (data: LightboxItem) => {
  item.value = data
  visible.value = true
  document.body.style.overflow = 'hidden'
}

const close = () => {
  visible.value = false
  document.body.style.overflow = ''
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
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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
  padding: 12px 0;
}

.lightbox-info {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  color: #fff;
  font-size: 0.9rem;
  min-width: 0;
}

.lightbox-info strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lightbox-meta {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
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
  border: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  text-decoration: none;
}

.lightbox-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
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
  border-radius: var(--radius-lg);
}

/* Transitions */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .lightbox-overlay {
    padding: 8px;
    padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
  }
  .lightbox-info strong {
    font-size: 0.8rem;
  }
  .lightbox-meta {
    display: none;
  }
  .lightbox-btn {
    width: 44px;
    height: 44px;
  }
  .lightbox-media {
    max-height: calc(100dvh - 60px);
    border-radius: var(--radius-md);
  }
}
</style>
