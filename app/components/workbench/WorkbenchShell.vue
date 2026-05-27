<template>
  <div class="tg-shell">
    <div class="tg-shell-header">
      <div>
        <h2 class="tg-shell-title">制作工坊</h2>
        <p class="tg-shell-desc">转换、管理、发布贴纸</p>
      </div>
      <slot name="tabs" />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.tg-shell {
  display: grid;
  gap: var(--gap-lg);
  padding: 24px 0 60px;
}

.tg-shell-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tg-shell-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.tg-shell-desc {
  font-size: 0.82rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

@media (max-width: 600px) {
  .tg-shell {
    padding: 16px 0 40px;
  }
  .tg-shell-title {
    font-size: 1.1rem;
  }
}
</style>
