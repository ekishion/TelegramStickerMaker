<template>
  <Teleport to="body">
    <div v-if="state.open" class="confirm-backdrop" @click.self="cancel">
      <div class="confirm-card" role="dialog" aria-modal="true" :aria-label="state.options.title">
        <h3 class="confirm-title">{{ state.options.title }}</h3>
        <p v-if="state.options.message" class="confirm-message">{{ state.options.message }}</p>
        <div class="confirm-actions">
          <button ref="cancelRef" class="tg-btn-ghost" type="button" @click="cancel">
            {{ state.options.cancelText || t('sys.cancel') }}
          </button>
          <button
            class="tg-btn-primary"
            :class="state.options.danger ? 'is-danger' : 'is-accent'"
            type="button"
            @click="accept"
          >
            {{ state.options.confirmText || t('sys.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()
const { state, cancel, accept } = useConfirm()

const cancelRef = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

watch(
  () => state.value.open,
  async open => {
    if (open) {
      previouslyFocused = document.activeElement as HTMLElement | null
      await nextTick()
      cancelRef.value?.focus()
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus?.()
    }
  }
)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
  }
}
</script>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(10, 10, 12, 0.5);
  backdrop-filter: blur(3px);
  animation: confirm-fade 0.16s ease both;
}

.confirm-card {
  width: min(420px, 100%);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 22px;
  display: grid;
  gap: 14px;
  animation: confirm-pop 0.2s var(--ease-spring) both;
}

.confirm-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.08rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.confirm-message {
  margin: 0;
  color: var(--ink-2);
  font-size: 0.88rem;
  line-height: 1.55;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.confirm-actions .is-danger {
  background: var(--err);
  color: #fff;
}

@keyframes confirm-fade {
  from { opacity: 0; }
}

@keyframes confirm-pop {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
}
</style>
