<template>
  <footer class="app-footer" aria-label="页面底部导航">
    <p class="app-footer__text">
      项目仓库：
      <a href="https://github.com/ekishion/TelegramStickerMaker" target="_blank" rel="noreferrer">
        GitHub
      </a>
      <span class="app-footer__divider">·</span>
      贴纸规范：
      <a href="https://core.telegram.org/stickers" target="_blank" rel="noreferrer">
        Telegram Stickers
      </a>
    </p>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 18px;
  padding-top: 6px;
}

.app-footer__text {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
  text-align: center;
  font-size: 0.76rem;
  line-height: 1.8;
  color: #9ca3af;
}

.app-footer__text a {
  display: inline-flex;
  align-items: center;
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.16s ease, opacity 0.16s ease;
}

.app-footer__text a[target="_blank"]::after {
  content: '↗';
  margin-left: 0.24rem;
  font-size: 0.7em;
  line-height: 1;
  opacity: 0.72;
  transform: translateY(-0.02em);
}

.app-footer__text a:hover {
  color: #6b7280;
}

.app-footer__divider {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 6px;
  color: #c4c9d4;
}

@media (max-width: 600px) {
  .app-footer {
    margin-top: 14px;
  }

  .app-footer__text {
    font-size: 0.72rem;
    gap: 3px;
  }

  .app-footer__divider {
    margin: 0 4px;
  }
}
</style>
