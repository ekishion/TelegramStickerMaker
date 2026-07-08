<template>
  <main class="home">
    <section class="hero-lab" aria-labelledby="home-title">
      <div class="liquid-field" aria-hidden="true">
        <span class="liquid-ribbon ribbon-main"></span>
        <span class="liquid-ribbon ribbon-shadow"></span>
        <span class="liquid-stream stream-one"></span>
        <span class="liquid-stream stream-two"></span>
      </div>

      <div class="hero-stickers" aria-hidden="true">
        <div class="sticker-sheet sheet-main">
          <img src="/icon.png" alt="" />
          <span class="sheet-label">512</span>
        </div>
        <div class="sticker-sheet sheet-coral">
          <span>GIF</span>
        </div>
        <div class="sticker-sheet sheet-amber">
          <span>VP9</span>
        </div>
        <div class="sticker-track">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div class="hero-copy float-in">
        <p class="hero-kicker">Telegram Sticker Maker</p>
        <h1 id="home-title">把图片和视频整理成可以直接发布的 Telegram 贴纸</h1>
        <p class="hero-lead">
          本地转换、批量缓存、历史归档和 Bot 上传都放在同一个工作台里。少一点来回切工具，多一点直接出包。
        </p>

        <div class="hero-actions">
          <NuxtLink to="/dash?tab=image" class="hero-button primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
            进入工作台
          </NuxtLink>

          <NuxtLink to="/dash?tab=history" class="hero-button secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="M4 5h16" />
              <path d="M4 12h16" />
              <path d="M4 19h10" />
            </svg>
            查看历史
          </NuxtLink>
        </div>

        <div class="hero-specs" aria-label="支持能力">
          <span>PNG / WEBP / JPG</span>
          <span>GIF / MP4 / WEBM</span>
          <span>Bot API Upload</span>
        </div>
      </div>
    </section>

    <section class="quick-start" aria-label="快速入口">
      <NuxtLink
        v-for="item in quickActions"
        :key="item.title"
        :to="item.to"
        class="quick-card float-in"
        :style="{ animationDelay: item.delay }"
      >
        <span class="quick-icon" :class="item.tone">
          <component :is="item.icon" />
        </span>
        <span class="quick-body">
          <strong>{{ item.title }}</strong>
          <span>{{ item.text }}</span>
        </span>
      </NuxtLink>
    </section>

    <section class="process-band float-in" aria-labelledby="process-title">
      <div class="process-head">
        <p class="section-kicker">Workflow</p>
        <h2 id="process-title">从素材到贴纸包，只保留必要步骤</h2>
      </div>

      <div class="process-steps">
        <div v-for="step in steps" :key="step.name" class="process-step">
          <span>{{ step.index }}</span>
          <strong>{{ step.name }}</strong>
          <p>{{ step.text }}</p>
        </div>
      </div>
    </section>

    <section class="detail-grid" aria-label="功能亮点">
      <article class="detail-panel">
        <p class="section-kicker">Output</p>
        <h2>按 Telegram 规则收束输出</h2>
        <p>静态贴纸保持 512px 边界，视频贴纸限制 3 秒和 256KB，转换结果会缓存到浏览器，减少临时文件过期带来的断链。</p>
      </article>

      <article class="detail-panel">
        <p class="section-kicker">Publish</p>
        <h2>上传前还能整理贴纸包</h2>
        <p>贴纸缓存、历史记录、标签和批量选择都在同一条线上，配置 Bot 后可以直接把选中的输出送到目标贴纸包。</p>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { h } from 'vue'

const ImageIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2
}, [
  h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 3 }),
  h('circle', { cx: 8.5, cy: 8.5, r: 1.5 }),
  h('path', { d: 'm21 15-5-5L5 21' })
])

const VideoIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2
}, [
  h('path', { d: 'm6 4 14 8-14 8V4Z' })
])

const UploadIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2
}, [
  h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
  h('path', { d: 'm17 8-5-5-5 5' }),
  h('path', { d: 'M12 3v12' })
])

const quickActions = [
  { title: '静态贴纸', text: '图片转 PNG / WEBP', tone: 'tone-teal', icon: ImageIcon, delay: '0.06s', to: '/dash?tab=image' },
  { title: '视频贴纸', text: 'GIF / MP4 转 VP9', tone: 'tone-coral', icon: VideoIcon, delay: '0.12s', to: '/dash?tab=video' },
  { title: '上传发布', text: '批量发送到 Telegram', tone: 'tone-amber', icon: UploadIcon, delay: '0.18s', to: '/dash?tab=telegram' }
]

const steps = [
  { index: '01', name: '上传素材', text: '一次拖入图片、动图或者视频。' },
  { index: '02', name: '本地转换', text: '浏览器和服务端按格式分工处理。' },
  { index: '03', name: '缓存归档', text: '结果进入历史，方便筛选和复用。' },
  { index: '04', name: '打包发布', text: '选择贴纸后直接上传到目标贴纸包。' }
]

useHead({
  title: 'Telegram Sticker Maker - 贴纸制作工作台',
  meta: [
    { name: 'description', content: '把图片、GIF 和视频转换为 Telegram 贴纸格式，支持批量处理、历史缓存和 Bot 上传。' }
  ]
})
</script>

<style scoped>
.home {
  display: grid;
  gap: 22px;
  padding-bottom: 64px;
}

.hero-lab {
  position: relative;
  isolation: isolate;
  min-height: min(720px, calc(100dvh - 118px));
  border-radius: 34px;
  overflow: hidden;
  display: grid;
  align-items: center;
  padding: clamp(32px, 7vw, 86px);
  background: #ffffff;
  border: 1px solid rgba(37, 99, 235, 0.16);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
}

.hero-lab::before {
  content: '';
  position: absolute;
  inset: 16px;
  z-index: 0;
  border: 1px solid rgba(37, 99, 235, 0.08);
  border-radius: 26px;
  pointer-events: none;
}

:global([data-theme="dark"] .hero-lab) {
  background: #0b1220;
  border-color: rgba(96, 165, 250, 0.22);
  box-shadow: 0 24px 90px rgba(0, 0, 0, 0.48);
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme]) .hero-lab) {
    background: #0b1220;
    border-color: rgba(96, 165, 250, 0.22);
    box-shadow: 0 24px 90px rgba(0, 0, 0, 0.48);
  }
}

.hero-copy {
  position: relative;
  z-index: 4;
  max-width: 640px;
  display: grid;
  gap: 20px;
}

.liquid-field {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.liquid-ribbon,
.liquid-stream {
  position: absolute;
  display: block;
  background: rgba(37, 99, 235, 0.08);
  transform-origin: center;
  will-change: transform, opacity;
}

.ribbon-main {
  right: -14%;
  top: 13%;
  width: min(54vw, 620px);
  height: min(36vw, 390px);
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 42% 58% 48% 52% / 52% 38% 62% 48%;
  animation: ribbon-float 16s ease-in-out infinite;
}

.ribbon-shadow {
  right: 10%;
  bottom: -22%;
  width: min(36vw, 430px);
  height: min(22vw, 260px);
  background: rgba(37, 99, 235, 0.05);
  border-radius: 64% 36% 52% 48% / 42% 52% 48% 58%;
  animation: ribbon-float-alt 18s ease-in-out infinite;
}

.liquid-stream {
  height: 18px;
  border-radius: 999px;
}

.stream-one {
  right: 8%;
  top: 36%;
  width: min(34vw, 360px);
  animation: stream-slide 10s ease-in-out infinite;
}

.stream-two {
  right: 19%;
  top: 43%;
  width: min(24vw, 260px);
  height: 10px;
  background: rgba(96, 165, 250, 0.13);
  animation: stream-slide-soft 12s ease-in-out infinite reverse;
}

:global([data-theme="dark"] .liquid-ribbon),
:global([data-theme="dark"] .liquid-stream) {
  background: rgba(96, 165, 250, 0.16);
}

:global([data-theme="dark"] .ribbon-main) {
  border-color: rgba(147, 197, 253, 0.22);
}

:global([data-theme="dark"] .ribbon-shadow) {
  background: rgba(96, 165, 250, 0.11);
}

:global([data-theme="dark"] .stream-two) {
  background: rgba(147, 197, 253, 0.18);
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme]) .liquid-ribbon),
  :global(:root:not([data-theme]) .liquid-stream) {
    background: rgba(96, 165, 250, 0.16);
  }

  :global(:root:not([data-theme]) .ribbon-main) {
    border-color: rgba(147, 197, 253, 0.22);
  }

  :global(:root:not([data-theme]) .ribbon-shadow) {
    background: rgba(96, 165, 250, 0.11);
  }

  :global(:root:not([data-theme]) .stream-two) {
    background: rgba(147, 197, 253, 0.18);
  }
}

.hero-kicker,
.section-kicker {
  font-size: 0.72rem;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0;
  font-weight: 800;
  color: var(--color-accent-strong);
}

.hero-copy h1 {
  font-size: clamp(2.1rem, 6vw, 5.4rem);
  line-height: 1.04;
  letter-spacing: 0;
  max-width: 680px;
}

:global([data-theme="dark"] .hero-copy h1) {
  color: #fffdf5;
  text-shadow: 0 3px 24px rgba(0, 0, 0, 0.72);
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme]) .hero-copy h1) {
    color: #fffdf5;
    text-shadow: 0 3px 24px rgba(0, 0, 0, 0.72);
  }
}

.hero-lead {
  max-width: 560px;
  color: var(--color-text-secondary);
  font-size: clamp(1rem, 1.8vw, 1.18rem);
  line-height: 1.85;
}

:global([data-theme="dark"] .hero-lead) {
  color: #ecf7f0;
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme]) .hero-lead) {
    color: #ecf7f0;
  }
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

.hero-button {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px 22px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 800;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.hero-button.primary {
  color: #ffffff;
  background: #2563eb;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.24);
}

.hero-button.secondary {
  color: var(--color-text);
  background: #ffffff;
  border: 1px solid rgba(37, 99, 235, 0.18);
  backdrop-filter: blur(12px);
}

:global([data-theme="dark"] .hero-button.secondary) {
  color: #fffdf5;
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.22);
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme]) .hero-button.secondary) {
    color: #fffdf5;
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.22);
  }
}

.hero-button:hover {
  transform: translateY(-2px);
}

.hero-button.primary:hover {
  background: #1d4ed8;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.28);
}

.hero-button.secondary:hover {
  border-color: rgba(37, 99, 235, 0.36);
  color: var(--color-accent-strong);
}

.hero-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.hero-specs span {
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.06);
  color: var(--color-text-secondary);
  font-size: 0.74rem;
  font-weight: 800;
  border: 1px solid rgba(37, 99, 235, 0.12);
}

:global([data-theme="dark"] .hero-specs span) {
  color: #dce9e4;
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(255, 255, 255, 0.18);
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme]) .hero-specs span) {
    color: #dce9e4;
    background: rgba(255, 255, 255, 0.13);
    border-color: rgba(255, 255, 255, 0.18);
  }
}

.hero-stickers {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.sticker-sheet {
  position: absolute;
  display: grid;
  place-items: center;
  width: clamp(104px, 13vw, 168px);
  aspect-ratio: 1;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(37, 99, 235, 0.16);
  box-shadow: 0 18px 48px rgba(37, 99, 235, 0.14);
  backdrop-filter: blur(14px);
  animation: sticker-float 11s ease-in-out infinite;
}

:global([data-theme="dark"] .sticker-sheet) {
  opacity: 0.54;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 18px 52px rgba(0, 0, 0, 0.32);
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme]) .sticker-sheet) {
    opacity: 0.54;
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 18px 52px rgba(0, 0, 0, 0.32);
  }
}

:global([data-theme="dark"] .sheet-coral),
:global([data-theme="dark"] .sheet-amber) {
  opacity: 0.62;
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme]) .sheet-coral),
  :global(:root:not([data-theme]) .sheet-amber) {
    opacity: 0.62;
  }
}

.sheet-main {
  right: 13%;
  top: 16%;
  transform: rotate(9deg);
}

.sheet-main img {
  width: 54%;
  filter: drop-shadow(0 12px 14px rgba(0, 0, 0, 0.12));
}

.sheet-label {
  position: absolute;
  right: 14px;
  bottom: 12px;
  font-size: 0.76rem;
  font-weight: 900;
  color: var(--color-text-tertiary);
}

.sheet-coral {
  right: 6%;
  bottom: 20%;
  width: clamp(88px, 10vw, 132px);
  transform: rotate(-13deg);
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 900;
  animation-delay: -1.6s;
}

.sheet-amber {
  right: 25%;
  bottom: 9%;
  width: clamp(78px, 9vw, 118px);
  transform: rotate(7deg);
  background: #bfdbfe;
  color: #1e3a8a;
  font-weight: 900;
  animation-delay: -3s;
}

.sticker-track {
  position: absolute;
  right: 7%;
  top: 48%;
  width: min(34vw, 360px);
  height: 80px;
  border-radius: 999px;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0 18px;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.14);
  transform: rotate(-4deg);
  animation: track-breathe 9s ease-in-out infinite;
}

.sticker-track span {
  height: 38px;
  flex: 1;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
}

.sticker-track span:nth-child(2) {
  background: rgba(37, 99, 235, 0.34);
}

.sticker-track span:nth-child(3) {
  background: rgba(96, 165, 250, 0.36);
}

.quick-start {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.quick-card {
  position: relative;
  overflow: hidden;
  min-height: 116px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  color: inherit;
  text-decoration: none;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(var(--glass-blur));
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.quick-card::after {
  content: '';
  position: absolute;
  right: -46px;
  bottom: -62px;
  width: 118px;
  height: 118px;
  border-radius: 54% 46% 42% 58% / 48% 54% 46% 52%;
  background: rgba(37, 99, 235, 0.07);
  transform: translate3d(18px, 18px, 0) rotate(8deg);
  transition: transform 0.22s ease, background 0.22s ease;
}

.quick-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(37, 99, 235, 0.28);
}

.quick-card:hover::after {
  background: rgba(37, 99, 235, 0.1);
  transform: translate3d(0, 0, 0) rotate(-2deg);
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.quick-icon svg {
  width: 23px;
  height: 23px;
}

.tone-teal {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.tone-coral {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

.tone-amber {
  background: rgba(96, 165, 250, 0.14);
  color: #1e40af;
}

.quick-body {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.quick-body strong {
  font-size: 1rem;
}

.quick-body span {
  color: var(--color-text-secondary);
  font-size: 0.84rem;
}

.process-band {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(220px, 0.65fr) 1.35fr;
  gap: 24px;
  align-items: start;
  padding: 28px;
  border-radius: 28px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.process-band::after {
  content: '';
  position: absolute;
  right: 28px;
  bottom: 22px;
  width: min(54%, 520px);
  height: 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  transform-origin: right center;
  animation: flow-line 7.2s ease-in-out infinite;
}

.process-head {
  display: grid;
  gap: 10px;
}

.process-head h2,
.detail-panel h2 {
  font-size: clamp(1.35rem, 2.3vw, 2rem);
  line-height: 1.22;
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.process-step {
  position: relative;
  z-index: 1;
  min-height: 150px;
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 16px;
  border-radius: 20px;
  background: var(--color-bg-subtle);
  transition: transform 0.18s ease, background 0.18s ease;
}

.process-step:hover {
  transform: translateY(-2px);
  background: rgba(37, 99, 235, 0.08);
}

.process-step span {
  color: var(--color-accent-strong);
  font-weight: 900;
  font-size: 0.78rem;
}

.process-step strong {
  font-size: 0.95rem;
}

.process-step p,
.detail-panel p {
  color: var(--color-text-secondary);
  font-size: 0.86rem;
  line-height: 1.75;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-panel {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 12px;
  padding: 28px;
  border-radius: 28px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-sm);
}

.detail-panel::before {
  content: '';
  position: absolute;
  top: 18px;
  right: 18px;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 42% 58% 55% 45% / 45% 42% 58% 55%;
}

@keyframes ribbon-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(-7deg) scale(1);
  }
  50% {
    transform: translate3d(-18px, 12px, 0) rotate(-2deg) scale(1.03);
  }
}

@keyframes ribbon-float-alt {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(3deg) scale(1);
  }
  50% {
    transform: translate3d(16px, -16px, 0) rotate(-1deg) scale(0.98);
  }
}

@keyframes stream-slide {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scaleX(0.82);
    opacity: 0.6;
  }
  50% {
    transform: translate3d(-26px, 0, 0) scaleX(1);
    opacity: 1;
  }
}

@keyframes stream-slide-soft {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scaleX(0.9);
    opacity: 0.58;
  }
  50% {
    transform: translate3d(-14px, 0, 0) scaleX(1);
    opacity: 0.88;
  }
}

@keyframes sticker-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -10px, 0);
  }
}

@keyframes track-breathe {
  0%,
  100% {
    opacity: 0.84;
  }
  50% {
    opacity: 1;
  }
}

@keyframes flow-line {
  0%,
  100% {
    transform: scaleX(0.48);
    opacity: 0.48;
  }
  50% {
    transform: scaleX(1);
    opacity: 0.9;
  }
}

@media (prefers-reduced-motion: reduce) {
  .liquid-ribbon,
  .liquid-stream,
  .sticker-sheet,
  .sticker-track,
  .quick-card::after,
  .process-band::after {
    animation: none !important;
    transition: none !important;
  }

  .hero-button,
  .quick-card,
  .process-step {
    transition: none !important;
  }
}

@media (max-width: 1180px) {
  .hero-lab {
    padding: clamp(30px, 5vw, 58px);
  }

  .hero-copy {
    max-width: 680px;
  }

  .hero-copy h1 {
    font-size: clamp(2rem, 5.2vw, 4rem);
    max-width: 590px;
  }

  .hero-lead {
    max-width: 500px;
  }

  .sticker-track {
    display: none;
  }

  .sheet-main {
    right: 5%;
    top: 17%;
    width: clamp(96px, 12vw, 138px);
    opacity: 0.82;
  }

  .sheet-coral {
    right: 4%;
    bottom: 18%;
    width: clamp(78px, 9vw, 112px);
  }

  .sheet-amber {
    right: 17%;
    bottom: 7%;
    width: clamp(70px, 8vw, 98px);
  }

  :global([data-theme="dark"] .hero-stickers) {
    display: none;
  }

  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme]) .hero-stickers) {
      display: none;
    }
  }
}

@media (max-width: 900px) {
  .hero-lab {
    min-height: auto;
    padding: 42px 26px 220px;
  }

  .liquid-field {
    opacity: 0.48;
  }

  .ribbon-main {
    right: -34%;
    top: 42%;
    width: 520px;
    height: 250px;
  }

  .ribbon-shadow,
  .stream-one,
  .stream-two {
    display: none;
  }

  .hero-copy {
    max-width: none;
  }

  .sheet-main {
    right: 9%;
    top: auto;
    bottom: 44px;
  }

  .sheet-coral {
    right: 38%;
    bottom: 28px;
  }

  .sheet-amber,
  .sticker-track {
    display: none;
  }

  .quick-start,
  .process-band,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .process-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .home {
    gap: 12px;
    padding-bottom: 36px;
  }

  .hero-lab {
    border-radius: 24px;
    padding: 30px 18px 180px;
  }

  .hero-lab::before {
    inset: 10px;
    border-radius: 18px;
  }

  .hero-copy {
    gap: 16px;
  }

  .hero-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .hero-button {
    width: 100%;
  }

  .hero-specs span {
    font-size: 0.68rem;
  }

  .quick-card {
    min-height: 96px;
    border-radius: 18px;
  }

  .process-band,
  .detail-panel {
    padding: 20px;
    border-radius: 22px;
  }

  .process-steps {
    grid-template-columns: 1fr;
  }

  .process-step {
    min-height: 0;
  }
}
</style>
