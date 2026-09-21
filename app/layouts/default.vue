<template>
  <div class="page-shell">
    <!-- Full-bleed rail: the sticky bar spans the viewport while the inner
         rail stays on the page grid, so brand/actions align with content. -->
    <header class="nav-bar" :class="{ 'is-scrolled': isScrolled }">
      <div class="nav-bar-inner">
        <div class="nav-brand">
          <NuxtLink to="/" class="nav-brand-link">
            <img class="nav-mark" src="/icon.png" alt="Telegram Sticker Maker" />
            <div class="nav-brand-text">
              <div class="nav-title">Telegram Sticker Maker</div>
              <div class="nav-subtitle">Sticker Atelier</div>
            </div>
          </NuxtLink>
        </div>

        <div class="nav-right">
          <NuxtLink v-if="isDash" to="/" class="nav-link">
            <ArrowLeft :size="15" :stroke-width="2" />
            <span>{{ t('nav.home') }}</span>
          </NuxtLink>

          <NuxtLink v-else to="/dash" class="nav-link">
            <span>{{ t('nav.workbench') }}</span>
            <ArrowUpRight :size="15" :stroke-width="2" />
          </NuxtLink>

          <button class="locale-toggle" type="button" @click="toggleLocale" :aria-label="t('nav.localeAria')">
            {{ locale === 'zh' ? 'EN' : '中' }}
          </button>

          <button class="theme-toggle" type="button" @click="cycleTheme" :aria-label="themeLabel">
            <Monitor v-if="theme === 'system'" :size="15" :stroke-width="2" />
            <SunMedium v-else-if="theme === 'light'" :size="15" :stroke-width="2" />
            <Moon v-else :size="15" :stroke-width="2" />
          </button>
        </div>
      </div>
    </header>

    <div class="kv-container">
      <slot />
      <AppFooter />
    </div>
  </div>

  <Lightbox ref="lightboxRef" />
  <ConfirmDialog />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, ArrowUpRight, Monitor, Moon, SunMedium } from 'lucide-vue-next'
import AppFooter from '@/components/common/AppFooter.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import Lightbox from '@/components/ui/Lightbox.vue'
import { initLocaleFromStorage, useLocale } from '@/composables/useLocale'
import { useLightbox } from '@/composables/useLightbox'

const route = useRoute()
const lightboxRef = ref()
const { setRef } = useLightbox()
const { locale, t, toggleLocale } = useLocale()

// Keep <html lang> in sync with the active language (SSR default is zh-CN)
useHead(() => ({
  htmlAttrs: { lang: locale.value === 'zh' ? 'zh-CN' : 'en' }
}))

onMounted(() => {
  setRef(lightboxRef.value)
})

const isDash = computed(() => route.path === '/dash')

// Elevate the glass rail once the page scrolls, so it separates from content
const isScrolled = ref(false)

const onScroll = () => {
  isScrolled.value = window.scrollY > 8
}

onMounted(() => {
  isScrolled.value = window.scrollY > 8
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

type ThemeMode = 'system' | 'light' | 'dark'

const theme = ref<ThemeMode>('system')
const isDark = ref(false)

const themeLabel = computed(() => t(
  theme.value === 'system' ? 'theme.system' : theme.value === 'light' ? 'theme.light' : 'theme.dark'
))

const applyTheme = (mode: ThemeMode) => {
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme')
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    return
  }

  document.documentElement.setAttribute('data-theme', mode)
  isDark.value = mode === 'dark'
}

const cycleTheme = () => {
  theme.value = theme.value === 'system' ? 'light' : theme.value === 'light' ? 'dark' : 'system'
  localStorage.setItem('theme', theme.value)
  applyTheme(theme.value)
}

onMounted(() => {
  const saved = localStorage.getItem('theme') as ThemeMode | null
  theme.value = saved && ['system', 'light', 'dark'].includes(saved) ? saved : 'system'
  applyTheme(theme.value)

  // Restore the saved language after hydration (server renders zh)
  initLocaleFromStorage()

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') applyTheme('system')
  })
})
</script>

<style scoped>
.nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nav-brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.nav-brand-text {
  min-width: 0;
}

.nav-brand-link:hover .nav-mark {
  border-color: var(--ink);
  transform: rotate(-4deg);
}

.nav-brand-link:hover .nav-title {
  color: var(--accent-ink);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.16s var(--ease-out), border-color 0.16s ease, background 0.16s ease,
    color 0.16s ease, box-shadow 0.16s var(--ease-out);
  white-space: nowrap;
}

.nav-link:hover {
  transform: translateY(-1px);
  border-color: var(--ink);
  box-shadow: var(--shadow-sm);
}

.nav-link:active {
  transform: scale(0.97);
}

/* Matched to .nav-link so the right-hand controls read as one cluster */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  transition: border-color 0.16s ease, color 0.16s ease, transform 0.16s var(--ease-out);
}

.theme-toggle:hover {
  border-color: var(--ink);
  transform: rotate(12deg);
}

.theme-toggle:active {
  transform: scale(0.94);
}

/* Language switch: shows the target language (EN on the zh site, 中 on the en site) */
.locale-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 9px;
  border-radius: var(--radius-full);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: border-color 0.16s ease, transform 0.16s var(--ease-out);
}

.locale-toggle:hover {
  border-color: var(--ink);
}

.locale-toggle:active {
  transform: scale(0.94);
}

@media (max-width: 480px) {
  .nav-link span {
    display: none;
  }

  .nav-link {
    padding: 8px 11px;
  }
}
</style>
