<template>
  <footer class="app-footer" :aria-label="t('aria.footer')">
    <p class="app-footer__text">
      <a href="https://github.com/ekishion/TelegramStickerMaker" target="_blank" rel="noreferrer">
        GitHub
        <ArrowUpRight :size="12" :stroke-width="2" />
      </a>
      <span class="app-footer__divider">/</span>
      <a href="https://core.telegram.org/stickers" target="_blank" rel="noreferrer">
        Telegram Stickers
        <ArrowUpRight :size="12" :stroke-width="2" />
      </a>
    </p>
  </footer>
</template>

<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()
</script>

<style scoped>
.app-footer {
  margin-top: 96px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.app-footer__text {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  line-height: 1.8;
  color: var(--ink-3);
}

.app-footer__text a {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--ink-3);
  text-decoration: none;
  transition: color 0.16s ease;
}

.app-footer__text a:hover {
  color: var(--accent-ink);
}

.app-footer__divider {
  display: inline-flex;
  margin: 0 6px;
  color: var(--line-strong);
}

@media (max-width: 600px) {
  .app-footer {
    margin-top: 56px;
  }

  .app-footer__text {
    font-size: 0.68rem;
    gap: 3px;
  }

  .app-footer__divider {
    margin: 0 4px;
  }
}
</style>
