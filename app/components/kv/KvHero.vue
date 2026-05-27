<template>
  <section class="section-grid">
    <div class="kv-hero float-in">
      <div>
        <div class="chip">贴纸工作室</div>
        <h1 class="kv-hero-title">
          制作你的
          <span>Telegram 贴纸</span>
        </h1>
      </div>
      <p class="kv-hero-body">
        将图片和视频转换为 Telegram 贴纸格式，支持批量处理、标签管理，一键上传到贴纸包。
      </p>
      <div class="kv-hero-metrics">
        <div class="kv-metric-card">
          <div class="kv-metric-label">工作区</div>
          <div class="kv-metric-value">多格式支持</div>
        </div>
        <div class="kv-metric-card">
          <div class="kv-metric-label">归档</div>
          <div class="kv-metric-value">时间线管理</div>
        </div>
        <div class="kv-metric-card">
          <div class="kv-metric-label">输出</div>
          <div class="kv-metric-value">批量导出</div>
        </div>
      </div>
      <div class="kv-hero-actions">
        <button class="kv-action" type="button" @click="scrollToWorkbench">开始制作</button>
        <button class="kv-action secondary" type="button" @click="goToHistory">查看历史</button>
      </div>
    </div>

    <div class="kv-surface float-in" style="animation-delay: 0.1s">
      <h2 class="workbench-title">工作台概览</h2>
      <div class="workbench-panel">
        <strong>工作流程</strong>
        <div class="history-meta">
          <span class="chip">上传</span>
          <span class="chip">转换</span>
          <span class="chip">标记</span>
          <span class="chip">发布</span>
        </div>
      </div>
      <div class="workbench-panel">
        <strong>支持格式</strong>
        <div class="history-meta">
          <span class="chip">PNG</span>
          <span class="chip">WEBP</span>
          <span class="chip">JPG</span>
          <span class="chip">GIF</span>
          <span class="chip">MP4</span>
          <span class="chip">WEBM</span>
        </div>
      </div>
      <div class="workbench-panel">
        <strong>技术栈</strong>
        <div class="history-meta">
          <span class="chip">Nuxt 4</span>
          <span class="chip">Pinia</span>
          <span class="chip">Nitro</span>
          <span class="chip">Sharp</span>
          <span class="chip">FFmpeg</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'switch-tab': [key: string]
}>()

const scrollToWorkbench = () => {
  document.querySelector('.workbench-shell')?.scrollIntoView({ behavior: 'smooth' })
}

const goToHistory = () => {
  emit('switch-tab', 'history')
  setTimeout(() => {
    document.querySelector('.workbench-shell')?.scrollIntoView({ behavior: 'smooth' })
  }, 50)
}
</script>
