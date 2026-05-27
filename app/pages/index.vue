<template>
  <main class="landing">
    <!-- Hero -->
    <section class="landing-hero float-in">
      <div class="landing-hero-content">
        <div class="chip">Telegram Sticker Maker</div>
        <h1 class="landing-title">
          将图片与视频
          <span>转为 Telegram 贴纸</span>
        </h1>
        <p class="landing-desc">
          浏览器本地转换，支持 PNG / WEBP / JPG / GIF / MP4 / WEBM。
          批量处理、标签管理、一键上传到贴纸包。
        </p>
        <div class="landing-cta">
          <NuxtLink to="/dash" class="tg-btn-primary landing-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            进入工作台
          </NuxtLink>
          <NuxtLink to="/dash" class="tg-btn-outline landing-btn">
            查看历史记录
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Feature cards -->
    <section class="landing-features">
      <div class="landing-card float-in" style="animation-delay: 0.08s">
        <div class="landing-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
        <h3 class="landing-card-title">静态贴纸</h3>
        <p class="landing-card-desc">PNG / WEBP / JPG 一键转为 512px Telegram 静态贴纸，支持 PNG 和 WEBP 双格式输出</p>
        <div class="landing-card-formats">
          <span class="chip">PNG</span>
          <span class="chip">WEBP</span>
          <span class="chip">JPG</span>
        </div>
      </div>

      <div class="landing-card float-in" style="animation-delay: 0.16s">
        <div class="landing-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <h3 class="landing-card-title">视频贴纸</h3>
        <p class="landing-card-desc">GIF / MP4 / WEBM 转为 WEBM VP9 视频贴纸，最长 3 秒，最大 256KB</p>
        <div class="landing-card-formats">
          <span class="chip">GIF</span>
          <span class="chip">MP4</span>
          <span class="chip">WEBM</span>
        </div>
      </div>

      <div class="landing-card float-in" style="animation-delay: 0.24s">
        <div class="landing-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <h3 class="landing-card-title">上传发布</h3>
        <p class="landing-card-desc">配置 Bot Token 后选择贴纸直接上传到 Telegram 贴纸包，支持批量操作</p>
        <div class="landing-card-formats">
          <span class="chip">Bot API</span>
          <span class="chip">批量上传</span>
        </div>
      </div>
    </section>

    <!-- Workflow -->
    <section class="landing-workflow float-in" style="animation-delay: 0.32s">
      <div class="landing-workflow-steps">
        <div class="landing-step">
          <div class="landing-step-num">1</div>
          <div class="landing-step-text">上传文件</div>
        </div>
        <div class="landing-step-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
        <div class="landing-step">
          <div class="landing-step-num">2</div>
          <div class="landing-step-text">本地转换</div>
        </div>
        <div class="landing-step-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
        <div class="landing-step">
          <div class="landing-step-num">3</div>
          <div class="landing-step-text">标签管理</div>
        </div>
        <div class="landing-step-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
        <div class="landing-step">
          <div class="landing-step-num">4</div>
          <div class="landing-step-text">发布上线</div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
useHead({
  title: 'Telegram Sticker Maker - 制作你的 Telegram 贴纸',
  meta: [
    { name: 'description', content: '浏览器本地将图片和视频转换为 Telegram 贴纸格式，支持批量处理、标签管理，一键上传到贴纸包。' }
  ]
})
</script>

<style scoped>
.landing {
  display: grid;
  gap: var(--gap-xl);
  padding: 24px 0 60px;
}

/* Hero */
.landing-hero {
  text-align: center;
  padding: 32px 0 16px;
}

.landing-hero-content {
  max-width: 640px;
  margin: 0 auto;
  display: grid;
  gap: var(--gap-md);
  justify-items: center;
}

.landing-title {
  font-size: clamp(2rem, 4.5vw, 3rem);
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text);
}

.landing-title span {
  display: block;
  background: var(--color-accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.landing-desc {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 480px;
}

.landing-cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.landing-btn {
  text-decoration: none;
  min-height: 44px;
  padding: 10px 24px;
  font-size: 0.9rem;
}

/* Feature cards */
.landing-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--gap-md);
}

.landing-card {
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  display: grid;
  gap: 12px;
  align-content: start;
  transition: background 0.2s ease;
}

.landing-card:hover {
  background: var(--color-surface-hover);
}

.landing-card-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--color-accent-light);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.landing-card-title {
  font-size: 1.05rem;
  font-weight: 600;
}

.landing-card-desc {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.landing-card-formats {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* Workflow */
.landing-workflow {
  padding: 24px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.landing-workflow-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.landing-step {
  display: flex;
  align-items: center;
  gap: 10px;
}

.landing-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-accent-gradient);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.landing-step-text {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--color-text);
}

.landing-step-arrow {
  color: var(--color-text-tertiary);
  display: flex;
}

/* Button styles (shared with TelegramWorkbench) */
.tg-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-accent-gradient);
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25);
}

.tg-btn-primary:hover {
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.35);
  transform: translateY(-1px);
}

.tg-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tg-btn-outline:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-light);
}

@media (max-width: 768px) {
  .landing-features {
    grid-template-columns: 1fr;
  }
  .landing-workflow-steps {
    gap: 8px;
  }
  .landing-step-arrow {
    display: none;
  }
  .landing-workflow-steps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .landing-title {
    font-size: 1.6rem;
  }
  .landing-desc {
    font-size: 0.88rem;
  }
  .landing-cta {
    flex-direction: column;
    width: 100%;
  }
  .landing-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
