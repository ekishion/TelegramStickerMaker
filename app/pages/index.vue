<template>
  <main class="home">
    <!-- Hero: kinetic type over an interactive sticker field -->
    <section class="hero" aria-labelledby="home-title">
      <StickerField />

      <div class="hero-copy">
        <p class="hero-kicker float-in">Telegram Sticker Maker</p>

        <h1 id="home-title">
          <span class="hero-line float-in" style="animation-delay: 0.06s">{{ t('hero.line1') }}</span>
          <span class="hero-line float-in hero-line-accent" style="animation-delay: 0.16s">{{ t('hero.line2') }}</span>
        </h1>

        <p class="hero-lead float-in" style="animation-delay: 0.26s">
          {{ t('hero.lead') }}
        </p>

        <div class="hero-actions float-in" style="animation-delay: 0.36s">
          <NuxtLink v-magnetic to="/dash?tab=image" class="hero-cta">
            {{ t('hero.cta') }}
            <ArrowRight :size="17" :stroke-width="2.4" class="hero-cta-arrow" />
          </NuxtLink>
          <NuxtLink to="/dash?tab=history" class="hero-cta ghost">{{ t('hero.ctaGhost') }}</NuxtLink>
        </div>

        <div class="hero-mini float-in" style="animation-delay: 0.46s" aria-hidden="true">
          <span class="mini-sticker"><img src="/icon.png" alt="" /></span>
          <span class="mini-sticker mono">GIF</span>
          <span class="mini-sticker mono accent">512</span>
        </div>
      </div>
    </section>

    <!-- Single marquee strip: each half repeats the phrase set 4x so the
         loop always covers viewports wider than one pass -->
    <section class="ticker" aria-hidden="true">
      <div class="ticker-track">
        <div v-for="n in 2" :key="n" class="ticker-group">
          <template v-for="r in 4" :key="`${n}-${r}`">
            <template v-for="(phrase, i) in tickerItems" :key="`${n}-${r}-${i}`">
              <span class="ticker-item">{{ phrase }}</span>
              <Scissors class="ticker-icon" :size="15" :stroke-width="2" />
            </template>
          </template>
        </div>
      </div>
    </section>

    <!-- Quick entries: asymmetric bento -->
    <section class="quick" :aria-label="t('aria.quickLinks')">
      <NuxtLink
        v-for="item in quickActions"
        :key="item.title"
        :to="item.to"
        v-reveal="item.delay"
        class="quick-card"
        :class="item.span"
      >
        <span class="quick-format">{{ item.format }}</span>
        <span class="quick-body">
          <strong>{{ item.title }}</strong>
          <span>{{ item.text }}</span>
        </span>
        <span class="quick-go">
          <ArrowUpRight :size="20" :stroke-width="2" />
        </span>
        <span v-if="item.sticker" class="quick-sticker" aria-hidden="true">
          <img src="/icon.png" alt="" />
        </span>
      </NuxtLink>
    </section>

    <!-- Process rail -->
    <section class="process" aria-labelledby="process-title">
      <h2 id="process-title" v-reveal>{{ t('process.title') }}</h2>

      <div class="process-rail">
        <div v-for="(step, i) in steps" :key="step.name" class="process-step" v-reveal="i * 80">
          <span class="process-num">{{ i + 1 }}</span>
          <strong>{{ step.name }}</strong>
          <p>{{ step.text }}</p>
        </div>
      </div>
    </section>

    <!-- Output rules: real Telegram limits -->
    <section class="specs" aria-labelledby="specs-title">
      <article class="specs-panel wide" v-reveal>
        <h2 id="specs-title">{{ t('specs.title1') }}</h2>
        <p>
          {{ t('specs.p1') }}
        </p>
        <div class="specs-stats">
          <div class="specs-stat">
            <span class="specs-num">512<small>px</small></span>
            <span class="specs-label">{{ t('specs.stat1') }}</span>
          </div>
          <div class="specs-stat">
            <span class="specs-num">3<small>s</small></span>
            <span class="specs-label">{{ t('specs.stat2') }}</span>
          </div>
          <div class="specs-stat">
            <span class="specs-num">256<small>KB</small></span>
            <span class="specs-label">{{ t('specs.stat3') }}</span>
          </div>
        </div>
      </article>

      <article class="specs-panel" v-reveal="120">
        <h2>{{ t('specs.title2') }}</h2>
        <p>
          {{ t('specs.p2') }}
        </p>
        <ul class="specs-list">
          <li v-for="cap in capabilities" :key="cap">
            <Check :size="15" :stroke-width="2.6" />
            {{ cap }}
          </li>
        </ul>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, ArrowUpRight, Check, Scissors } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'

const { t } = useLocale()

// Technical tokens (format codes, sizes) stay verbatim; prose comes from the dictionary
const tickerItems = computed(() => [
  t('ticker.static'),
  t('ticker.video'),
  t('ticker.bot'),
  '512 PX',
  'VP9',
  t('ticker.local')
])

const quickActions = computed(() => [
  {
    title: t('quick.image.title'),
    format: 'PNG · WEBP',
    text: t('quick.image.text'),
    to: '/dash?tab=image',
    span: 'span-7',
    delay: 0,
    sticker: true
  },
  {
    title: t('quick.video.title'),
    format: 'GIF → WEBM',
    text: t('quick.video.text'),
    to: '/dash?tab=video',
    span: 'span-5',
    delay: 80,
    sticker: false
  },
  {
    title: t('quick.upload.title'),
    format: 'TO TELEGRAM',
    text: t('quick.upload.text'),
    to: '/dash?tab=telegram',
    span: 'span-12',
    delay: 160,
    sticker: false
  }
])

const steps = computed(() => [
  { name: t('process.s1.name'), text: t('process.s1.text') },
  { name: t('process.s2.name'), text: t('process.s2.text') },
  { name: t('process.s3.name'), text: t('process.s3.text') },
  { name: t('process.s4.name'), text: t('process.s4.text') }
])

const capabilities = computed(() => [
  t('specs.cap1'),
  t('specs.cap2'),
  t('specs.cap3'),
  t('specs.cap4')
])

useHead(() => ({
  title: t('meta.home'),
  meta: [
    { name: 'description', content: t('meta.homeDesc') }
  ]
}))
</script>

<style scoped>
.home {
  display: grid;
  gap: clamp(48px, 7vw, 96px);
  padding-bottom: 24px;
}

/* ================= Hero ================= */
.hero {
  position: relative;
  isolation: isolate;
  min-height: min(680px, calc(100dvh - 96px));
  display: flex;
  align-items: center;
  padding: clamp(24px, 4vw, 56px) 0;
  border-bottom: 1px solid var(--line);
}

.hero-copy {
  position: relative;
  z-index: 2;
  max-width: 700px;
  display: grid;
  gap: 22px;
}

.hero-kicker {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--accent-ink);
}

.hero-copy h1 {
  display: grid;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2.7rem, 8.4vw, 6.8rem);
  line-height: 1.06;
  letter-spacing: 0.01em;
}

/* English display words are wider than the zh glyphs and wrap in the 700px
   column at the zh cap — widen the measure and trim the cap so the title
   keeps its 2-line rhythm like zh */
html[lang="en"] .hero-copy {
  max-width: 940px;
}

html[lang="en"] .hero-copy h1 {
  font-size: clamp(2.7rem, 6.4vw, 5.4rem);
}

.hero-line {
  display: block;
}

.hero-line-accent {
  color: var(--accent);
}

.hero-lead {
  max-width: 34em;
  color: var(--ink-2);
  font-size: clamp(0.95rem, 1.4vw, 1.1rem);
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 52px;
  padding: 0 30px;
  border-radius: var(--radius-full);
  background: var(--ink);
  color: var(--on-ink);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.95rem;
  transition: box-shadow 0.2s var(--ease-out), background 0.2s ease;
}

.hero-cta:hover {
  box-shadow: var(--shadow-lg);
}

.hero-cta-arrow {
  transition: transform 0.25s var(--ease-spring);
}

.hero-cta:hover .hero-cta-arrow {
  transform: translateX(4px);
}

.hero-cta.ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--line-strong);
}

.hero-cta.ghost:hover {
  border-color: var(--ink);
  box-shadow: none;
}

.hero-mini {
  display: none;
  gap: 10px;
  margin-top: 8px;
}

.mini-sticker {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: var(--sticker-edge);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-cut);
  transform: rotate(-5deg);
}

.mini-sticker:first-child {
  transform: rotate(6deg);
}

.mini-sticker img {
  width: 60%;
}

.mini-sticker.mono {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.72rem;
  color: var(--ink);
}

.mini-sticker.accent {
  background: var(--accent);
  color: var(--on-accent);
  border-color: transparent;
}

/* ================= Ticker ================= */
.ticker {
  margin: -12px calc(50% - 50vw);
  width: 100vw;
  transform: rotate(-1.1deg);
  background: var(--ink);
  color: var(--paper);
  overflow: hidden;
  padding: 13px 0;
}

.ticker-track {
  display: flex;
  width: max-content;
  animation: marquee-roll 64s linear infinite;
}

@media (hover: hover) {
  .ticker:hover .ticker-track {
    animation-play-state: paused;
  }
}

.ticker-group {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ticker-item {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0 22px;
  white-space: nowrap;
}

.ticker-icon {
  opacity: 0.55;
  flex-shrink: 0;
}

/* ================= Quick bento ================= */
.quick {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px;
}

.quick-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
  min-height: 210px;
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  text-decoration: none;
  transition: transform 0.22s var(--ease-out), border-color 0.22s ease, box-shadow 0.22s var(--ease-out);
}

.quick-card:hover {
  transform: translateY(-4px);
  border-color: var(--ink);
  box-shadow: var(--shadow-md);
}

.quick-card:active {
  transform: translateY(-2px) scale(0.985);
  box-shadow: var(--shadow-sm);
}

.span-7 { grid-column: span 7; }
.span-5 { grid-column: span 5; }
/* Row layout: reserve the top-right corner for the absolutely positioned
   .quick-go so the body text can never run underneath it (EN copy is wider) */
.span-12 {
  grid-column: span 12;
  min-height: 0;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  padding-right: 82px;
}

.quick-format {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 2.4vw, 1.7rem);
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--ink);
  white-space: nowrap;
}

.quick-body {
  display: grid;
  gap: 4px;
}

.quick-body strong {
  font-size: 1.05rem;
  font-weight: 700;
}

.quick-body span {
  color: var(--ink-2);
  font-size: 0.86rem;
  line-height: 1.7;
}

.quick-go {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  border: 1px solid var(--line);
  color: var(--ink);
  transition: background 0.2s ease, color 0.2s ease, transform 0.25s var(--ease-spring);
}

.quick-card:hover .quick-go {
  background: var(--ink);
  color: var(--on-ink);
  transform: rotate(45deg);
}

.quick-sticker {
  position: absolute;
  right: 74px;
  bottom: 18px;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: var(--sticker-edge);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-cut);
  transform: rotate(9deg);
  transition: transform 0.3s var(--ease-spring);
}

.quick-card:hover .quick-sticker {
  transform: rotate(-4deg) translateY(-4px);
}

.quick-sticker img {
  width: 58%;
}

.span-12 .quick-format {
  flex-shrink: 0;
}

/* ================= Process rail ================= */
.process h2,
.specs-panel h2 {
  font-size: clamp(1.4rem, 2.6vw, 2.1rem);
  line-height: 1.3;
  letter-spacing: 0.01em;
  max-width: 24em;
}

.process-rail {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
  margin-top: 44px;
}

.process-step {
  display: grid;
  gap: 8px;
  align-content: start;
  padding-top: 22px;
  border-top: 1px dashed var(--line-strong);
}

.process-num {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 4.6vw, 4rem);
  font-weight: 700;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1.5px var(--ink);
}

.process-step:last-child .process-num {
  -webkit-text-stroke-color: var(--accent);
}

.process-step strong {
  font-size: 1rem;
  margin-top: 6px;
}

.process-step p {
  color: var(--ink-2);
  font-size: 0.86rem;
  line-height: 1.75;
}

/* ================= Specs ================= */
.specs {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px;
}

.specs-panel {
  grid-column: span 5;
  display: grid;
  gap: 18px;
  align-content: start;
  padding: 30px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
}

.specs-panel.wide {
  grid-column: span 7;
}

.specs-panel > p {
  color: var(--ink-2);
  font-size: 0.9rem;
  line-height: 1.85;
  max-width: 36em;
}

.specs-stats {
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: start;
  gap: clamp(20px, 4vw, 56px);
  margin-top: 8px;
}

.specs-stat {
  display: grid;
  gap: 6px;
}

.specs-num {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 3.4vw, 2.8rem);
  font-weight: 700;
  line-height: 1;
  color: var(--ink);
}

.specs-num small {
  font-size: 0.42em;
  font-weight: 600;
  color: var(--accent-ink);
  margin-left: 2px;
}

.specs-label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  color: var(--ink-3);
}

.specs-list {
  list-style: none;
  display: grid;
  gap: 9px;
}

.specs-list li {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 0.86rem;
  color: var(--ink-2);
}

.specs-list li svg {
  color: var(--accent-ink);
  flex-shrink: 0;
}

/* ================= Responsive ================= */
@media (max-width: 1180px) {
  .hero {
    min-height: min(560px, calc(100dvh - 96px));
  }
}

@media (max-width: 900px) {
  .quick-card.span-7,
  .quick-card.span-5 {
    grid-column: span 12;
  }

  .specs-panel.wide,
  .specs-panel {
    grid-column: span 12;
  }

  .process-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  :deep(.sticker-field) {
    display: none;
  }

  .hero-mini {
    display: flex;
  }

  .hero {
    min-height: 0;
    padding-bottom: 40px;
  }
}

@media (max-width: 560px) {
  .home {
    gap: 40px;
  }

  /* 318px of content width can't fit the 64px sticker + its 74px offset
     alongside the description — drop it like .sticker-field at 720px */
  .quick-sticker {
    display: none;
  }

  .hero-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .hero-cta {
    width: 100%;
    justify-content: center;
  }

  .quick-card {
    padding: 20px;
    min-height: 0;
    gap: 28px;
  }

  .span-12 {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .process-rail {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: 32px;
  }

  .specs-panel {
    padding: 22px;
  }

  .specs-stats {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .ticker {
    transform: rotate(0deg);
  }
}
</style>
