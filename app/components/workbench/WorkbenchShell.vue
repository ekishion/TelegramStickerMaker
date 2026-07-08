<template>
  <div class="tg-shell">
    <div class="tg-shell-hero">
      <div class="tg-shell-backdrop" aria-hidden="true">
        <!--<span class="tg-shell-orb orb-one"></span>-->
        <span class="tg-shell-orb orb-two"></span>
        <span class="tg-shell-orb orb-one"></span>
        <!--<span class="tg-shell-line line-two"></span>-->
      </div>

      <div class="tg-shell-header">
        <div class="tg-shell-copy">
          <p class="tg-shell-kicker">桌面工作台</p>
          <h2 class="tg-shell-title">贴纸工作区</h2>
          <p class="tg-shell-desc">在同一个大屏工作区里完成转换、整理与发布，专注处理 Telegram 贴纸素材。</p>
        </div>
        <slot name="tabs" />
      </div>

      <div class="tg-shell-stats" aria-label="Workbench overview">
        <div class="tg-shell-stat">
          <span class="tg-shell-stat-label">流程</span>
          <strong>转换处理</strong>
          <small>图片、视频与缓存一体化处理</small>
        </div>
        <div class="tg-shell-stat">
          <span class="tg-shell-stat-label">输出</span>
          <strong>符合贴纸规范</strong>
          <small>面向 Telegram 的安全输出格式</small>
        </div>
        <div class="tg-shell-stat">
          <span class="tg-shell-stat-label">工作区</span>
          <strong>浏览器优先</strong>
          <small>文件不上传云端由浏览器制作</small>
        </div>
      </div>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.tg-shell {
  display: grid;
  gap: 22px;
  padding: 26px 0 72px;
}

.tg-shell-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 24px;
  padding: 28px;
  border: 1px solid var(--glass-border);
  border-radius: 32px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(246, 249, 255, 0.88)),
    var(--glass-bg);
  box-shadow: var(--shadow-lg);
  isolation: isolate;
}

:global([data-theme="dark"] .tg-shell-hero) {
  background:
    linear-gradient(135deg, rgba(16, 24, 39, 0.92), rgba(10, 17, 31, 0.9)),
    var(--glass-bg);
}

.tg-shell-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.tg-shell-orb,
.tg-shell-line {
  position: absolute;
  display: block;
}

.tg-shell-orb {
  border-radius: 999px;
  filter: blur(4px);
}

.orb-one {
  top: -58px;
  right: 12%;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.16), transparent 72%);
}

.orb-two {
  bottom: -84px;
  left: -36px;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.16), transparent 74%);
}

.tg-shell-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.18), transparent);
}

.line-one {
  left: 28px;
  right: 28px;
  top: 92px;
}

.line-two {
  left: 42%;
  right: 28px;
  bottom: 76px;
}

.tg-shell-header,
.tg-shell-stats {
  position: relative;
  z-index: 1;
}

.tg-shell-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}

.tg-shell-copy {
  display: grid;
  gap: 6px;
  max-width: 720px;
}

.tg-shell-kicker {
  font-size: 0.72rem;
  line-height: 1;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--color-accent-strong);
  letter-spacing: 0.08em;
}

.tg-shell-title {
  font-size: clamp(1.45rem, 2vw, 2rem);
  font-weight: 900;
  color: var(--color-text);
  line-height: 1.12;
}

.tg-shell-desc {
  max-width: 620px;
  font-size: 0.92rem;
  color: var(--color-text-secondary);
}

.tg-shell-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.tg-shell-stat {
  display: grid;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(37, 99, 235, 0.12);
  backdrop-filter: blur(14px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.05);
}

:global([data-theme="dark"] .tg-shell-stat) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(147, 197, 253, 0.12);
}

.tg-shell-stat-label {
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent-strong);
}

.tg-shell-stat strong {
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
}

.tg-shell-stat small {
  font-size: 0.78rem;
  color: var(--color-text-tertiary);
}

@media (min-width: 1280px) {
  .tg-shell {
    gap: 26px;
  }

  .tg-shell-hero {
    grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
    gap: 22px 28px;
    padding: 34px;
  }

  .tg-shell-header {
    display: contents;
  }

  .tg-shell-copy {
    align-self: start;
  }

  .tg-shell :deep(.segmented-tabs) {
    justify-self: end;
    align-self: start;
  }

  .tg-shell-stats {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .tg-shell {
    gap: 14px;
    padding: 16px 0 40px;
  }

  .tg-shell-hero {
    padding: 14px;
    border-radius: var(--radius-lg);
    gap: 14px;
  }

  .tg-shell-title {
    font-size: 1.1rem;
  }

  .tg-shell-desc {
    font-size: 0.8rem;
  }

  .tg-shell-stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tg-shell-stat {
    padding: 12px 14px;
    border-radius: 16px;
  }

  .line-one,
  .line-two,
  .orb-two {
    display: none;
  }
}
</style>
