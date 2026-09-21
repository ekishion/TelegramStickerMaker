<template>
  <div class="wb-shell">
    <header class="wb-header">
      <div class="wb-header-copy">
        <h1 class="wb-title">{{ t('wb.title') }}</h1>
        <p class="wb-desc">{{ t('wb.desc') }}</p>
      </div>
      <slot name="tabs" />
    </header>

    <div class="wb-meta" role="list" :aria-label="t('wb.metaAria')">
      <span role="listitem">
        <Monitor :size="13" :stroke-width="2" />
        {{ t('wb.meta1') }}
      </span>
      <span role="listitem">
        <BadgeCheck :size="13" :stroke-width="2" />
        {{ t('wb.meta2') }}
      </span>
      <span role="listitem">
        <Layers :size="13" :stroke-width="2" />
        {{ t('wb.meta3') }}
      </span>
    </div>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { BadgeCheck, Layers, Monitor } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()
</script>

<style scoped>
.wb-shell {
  display: grid;
  gap: 20px;
  padding: 18px 0 48px;
}

.wb-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}

.wb-header-copy {
  display: grid;
  gap: 4px;
}

.wb-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  font-weight: 800;
  letter-spacing: 0.01em;
  line-height: 1.15;
}

.wb-desc {
  color: var(--ink-2);
  font-size: 0.88rem;
}

.wb-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 26px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--line-strong);
}

.wb-meta span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--ink-2);
}

.wb-meta svg {
  color: var(--accent-ink);
}

@media (max-width: 600px) {
  .wb-shell {
    gap: 14px;
    padding: 8px 0 32px;
  }

  .wb-title {
    font-size: 1.35rem;
  }

  .wb-desc {
    font-size: 0.8rem;
  }

  .wb-meta {
    gap: 6px 16px;
    padding-bottom: 12px;
  }

  .wb-meta span {
    font-size: 0.64rem;
  }

  .wb-header :deep(.segmented-tabs) {
    width: 100%;
  }
}
</style>
