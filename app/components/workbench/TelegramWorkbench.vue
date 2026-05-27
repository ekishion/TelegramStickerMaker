<template>
  <div class="tg-workbench">
    <!-- Connection status bar -->
    <div class="tg-status-bar">
      <div class="tg-status-indicator" :class="connectionState">
        <span class="tg-status-dot"></span>
        <span class="tg-status-text">{{ connectionLabel }}</span>
      </div>
      <div class="tg-status-actions">
        <button class="tg-btn-ghost" type="button" @click="saveConfig">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存
        </button>
      </div>
    </div>

    <!-- Config section -->
    <div class="tg-section">
      <div class="tg-section-head">
        <div class="tg-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
        <div>
          <h3 class="tg-section-title">Bot 连接配置</h3>
          <p class="tg-section-desc">配置 Telegram Bot Token 和目标贴纸包信息</p>
        </div>
      </div>

      <div class="tg-config-grid">
        <div class="tg-field tg-field-full">
          <label class="tg-label" for="telegram-bot-token">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Bot Token
          </label>
          <div class="tg-input-wrap">
            <input id="telegram-bot-token" v-model="botToken" name="botToken" class="tg-input" type="password" placeholder="123456:ABC-DEF..." autocomplete="off" />
            <button class="tg-btn-sm" type="button" @click="validateToken" :disabled="!botToken || validating">
              {{ validating ? '验证中...' : '验证' }}
            </button>
          </div>
        </div>

        <div class="tg-field">
          <label class="tg-label" for="telegram-user-id">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            用户 ID
          </label>
          <input id="telegram-user-id" v-model="userId" name="telegramUserId" class="tg-input" placeholder="Your Telegram ID" autocomplete="off" />
        </div>

        <div class="tg-field">
          <label class="tg-label" for="telegram-emoji">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            默认 Emoji
          </label>
          <input id="telegram-emoji" v-model="emoji" name="emoji" class="tg-input" placeholder="🙂" autocomplete="off" />
        </div>

        <div class="tg-divider"></div>

        <div class="tg-field">
          <label class="tg-label" for="telegram-pack-name">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/><polyline points="14 2 14 8 20 8"/></svg>
            贴纸包短名
          </label>
          <input id="telegram-pack-name" v-model="packName" name="packName" class="tg-input" placeholder="my_sticker_pack" autocomplete="off" />
        </div>

        <div class="tg-field">
          <label class="tg-label" for="telegram-pack-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            贴纸包标题
          </label>
          <input id="telegram-pack-title" v-model="packTitle" name="packTitle" class="tg-input" placeholder="My Sticker Pack" autocomplete="off" />
        </div>
      </div>

      <!-- Pack history -->
      <div v-if="packHistory.length" class="tg-history">
        <div class="tg-history-label">历史贴纸包</div>
        <div class="tg-history-list">
          <button
            v-for="(pack, i) in packHistory"
            :key="i"
            type="button"
            class="tg-history-chip"
            @click="applyPack(pack)"
          >
            <span class="tg-history-chip-name">{{ pack.packName }}</span>
            <span v-if="pack.packTitle" class="tg-history-chip-title">{{ pack.packTitle }}</span>
            <span class="tg-history-chip-remove" @click.stop="removePack(i)" aria-label="移除">&times;</span>
          </button>
        </div>
      </div>

      <!-- Connection result -->
      <div v-if="botInfo || tokenError" class="tg-result">
        <div v-if="botInfo" class="tg-result-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>已连接 <strong>@{{ botInfo.username }}</strong></span>
        </div>
        <div v-if="tokenError" class="tg-result-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>{{ tokenError }}</span>
        </div>
      </div>
    </div>

    <!-- Sticker cache section -->
    <div class="tg-section">
      <div class="tg-section-head">
        <div class="tg-section-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        </div>
        <div>
          <h3 class="tg-section-title">缓存贴纸</h3>
          <p class="tg-section-desc">选择已转换的贴纸上传到 Telegram</p>
        </div>
        <div class="tg-section-right">
          <span v-if="outputFiles.length" class="tg-count">{{ selectedFiles.length }}/{{ outputFiles.length }}</span>
          <button class="tg-btn-ghost" type="button" @click="loadOutputFiles" :disabled="loadingFiles">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button class="tg-btn-ghost tg-btn-danger" type="button" @click="clearAllCache" :disabled="clearingCache">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      <div v-if="!outputFiles.length" class="tg-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        <span>还没有缓存贴纸</span>
        <span class="tg-empty-hint">在图片或视频页转换后会出现在这里</span>
      </div>

      <div v-else class="tg-gallery">
        <button
          v-for="file in outputFiles"
          :key="file.id"
          type="button"
          class="tg-gallery-item"
          :class="{ selected: selectedFiles.includes(file.id) }"
          @click="toggleSelect(file.id)"
        >
          <div class="tg-gallery-preview">
            <img v-if="file.type === 'static'" :src="file.url" :alt="file.name" />
            <video v-else :src="file.url" muted loop playsinline></video>
            <span class="tg-gallery-badge">{{ file.type === 'static' ? file.name.split('.').pop()?.toUpperCase() : 'WEBM' }}</span>
            <span v-if="selectedFiles.includes(file.id)" class="tg-gallery-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </div>
          <div class="tg-gallery-name">{{ file.name }}</div>
        </button>
      </div>

      <!-- Upload bar -->
      <div v-if="outputFiles.length" class="tg-upload-bar">
        <button class="tg-btn-outline" type="button" @click="toggleSelectAll" :disabled="!outputFiles.length">
          {{ allSelected ? '取消全选' : '全选' }}
        </button>
        <div class="tg-upload-bar-info">
          <span v-if="uploadResult" class="tg-result-chip" :class="uploadResult.failed ? 'warn' : 'ok'">
            成功 {{ uploadResult.success }} / 失败 {{ uploadResult.failed }}
          </span>
          <span v-if="cacheMessage" class="tg-result-chip ok">{{ cacheMessage }}</span>
        </div>
        <button class="tg-btn-primary" type="button" @click="startUpload" :disabled="!canUpload || uploading">
          <svg v-if="!uploading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span v-if="uploading" class="tg-spinner"></span>
          {{ uploading ? '上传中...' : '上传到 Telegram' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useHistoryStore } from '@/stores/history'
import {
  clearCachedStickers,
  createStickerObjectUrl,
  listCachedStickers,
  type CachedStickerFile
} from '@/utils/browserStickerStore'

interface OutputFile extends CachedStickerFile {
  url: string
}
interface BotInfo { id: number; username: string; firstName: string }
interface PackEntry { packName: string; packTitle: string; emoji: string }

const PACK_HISTORY_KEY = 'telegram_pack_history'
const CONFIG_KEY = 'telegram_config'
const historyStore = useHistoryStore()

const botToken = ref('')
const userId = ref('')
const packName = ref('')
const packTitle = ref('')
const emoji = ref('🙂')
const validating = ref(false)
const botInfo = ref<BotInfo | null>(null)
const tokenError = ref('')
const outputFiles = ref<OutputFile[]>([])
const selectedFiles = ref<string[]>([])
const loadingFiles = ref(false)
const clearingCache = ref(false)
const uploading = ref(false)
const uploadResult = ref<{ success: number; failed: number } | null>(null)
const cacheMessage = ref('')
const packHistory = ref<PackEntry[]>([])

const allSelected = computed(() => outputFiles.value.length > 0 && selectedFiles.value.length === outputFiles.value.length)
const canUpload = computed(() => botToken.value && userId.value && packName.value && selectedFiles.value.length > 0)

const connectionState = computed(() => {
  if (validating.value) return 'loading'
  if (botInfo.value) return 'connected'
  if (tokenError.value) return 'error'
  return 'idle'
})

const connectionLabel = computed(() => {
  if (validating.value) return '验证中...'
  if (botInfo.value) return `已连接 @${botInfo.value.username}`
  if (tokenError.value) return '连接失败'
  return '未连接'
})

onMounted(() => {
  loadConfig()
  loadPackHistory()
  loadOutputFiles()
})

onBeforeUnmount(() => {
  outputFiles.value.forEach(file => URL.revokeObjectURL(file.url))
})

const loadConfig = () => {
  const raw = localStorage.getItem(CONFIG_KEY)
  if (!raw) return
  try {
    const config = JSON.parse(raw)
    botToken.value = config.botToken || ''
    userId.value = config.userId || ''
    packName.value = config.packName || ''
    packTitle.value = config.packTitle || ''
    emoji.value = config.emoji || '🙂'
  } catch {}
}

const saveConfig = () => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
    botToken: botToken.value,
    userId: userId.value,
    packName: packName.value,
    packTitle: packTitle.value,
    emoji: emoji.value
  }))
}

const loadPackHistory = () => {
  const raw = localStorage.getItem(PACK_HISTORY_KEY)
  if (!raw) return
  try {
    packHistory.value = JSON.parse(raw)
  } catch {
    packHistory.value = []
  }
}

const savePackHistory = () => {
  localStorage.setItem(PACK_HISTORY_KEY, JSON.stringify(packHistory.value))
}

const addPackToHistory = () => {
  if (!packName.value) return
  const entry: PackEntry = { packName: packName.value, packTitle: packTitle.value, emoji: emoji.value }
  packHistory.value = [entry, ...packHistory.value.filter(pack => pack.packName !== entry.packName)].slice(0, 20)
  savePackHistory()
}

const applyPack = (pack: PackEntry) => {
  packName.value = pack.packName
  packTitle.value = pack.packTitle
  emoji.value = pack.emoji
}

const removePack = (index: number) => {
  packHistory.value.splice(index, 1)
  savePackHistory()
}

const validateToken = async () => {
  if (!botToken.value) return
  validating.value = true
  tokenError.value = ''
  botInfo.value = null
  try {
    const res = await fetch('/api/telegram/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken: botToken.value })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || data.message || 'Token 验证失败')
    botInfo.value = data.bot
  } catch (error: any) {
    tokenError.value = error.message
  } finally {
    validating.value = false
  }
}

const loadOutputFiles = async () => {
  loadingFiles.value = true
  cacheMessage.value = ''
  outputFiles.value.forEach(file => URL.revokeObjectURL(file.url))
  try {
    const cached = await listCachedStickers()
    outputFiles.value = cached
      .filter(file => file.mime === 'image/webp' || file.mime === 'video/webm')
      .map(file => ({ ...file, url: createStickerObjectUrl(file) }))
    selectedFiles.value = selectedFiles.value.filter(id => outputFiles.value.some(file => file.id === id))
  } catch (error: any) {
    cacheMessage.value = error.message || '读取浏览器缓存失败'
    outputFiles.value = []
  } finally {
    loadingFiles.value = false
  }
}

const clearAllCache = async () => {
  clearingCache.value = true
  cacheMessage.value = ''
  try {
    await clearCachedStickers()
    historyStore.clear()
    selectedFiles.value = []
    outputFiles.value.forEach(file => URL.revokeObjectURL(file.url))
    outputFiles.value = []
    cacheMessage.value = '缓存和历史已清空'
  } catch (error: any) {
    cacheMessage.value = error.message || '清空缓存失败'
  } finally {
    clearingCache.value = false
  }
}

const toggleSelect = (id: string) => {
  selectedFiles.value = selectedFiles.value.includes(id)
    ? selectedFiles.value.filter(item => item !== id)
    : [...selectedFiles.value, id]
}

const toggleSelectAll = () => {
  selectedFiles.value = allSelected.value ? [] : outputFiles.value.map(file => file.id)
}

const startUpload = async () => {
  if (!canUpload.value) return
  uploading.value = true
  uploadResult.value = null
  tokenError.value = ''

  try {
    const selectedOutputs = outputFiles.value.filter(file => selectedFiles.value.includes(file.id))
    const formData = new FormData()
    formData.append('botToken', botToken.value)
    formData.append('userId', userId.value)
    formData.append('packName', packName.value)
    formData.append('packTitle', packTitle.value || 'My Sticker Pack')
    formData.append('emoji', emoji.value || '🙂')

    for (const file of selectedOutputs) {
      formData.append('stickers', file.blob, file.name)
    }

    const res = await fetch('/api/telegram/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || data.message || '上传失败')
    uploadResult.value = data.results || { success: 0, failed: 0 }
    addPackToHistory()
  } catch (error: any) {
    uploadResult.value = { success: 0, failed: selectedFiles.value.length }
    tokenError.value = error.message
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
/* ========== Workbench Shell ========== */
.tg-workbench {
  display: grid;
  gap: var(--gap-lg);
}

/* ========== Status Bar ========== */
.tg-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  background: var(--color-bg-subtle);
}

.tg-status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.tg-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  transition: background 0.3s ease;
}

.tg-status-indicator.connected .tg-status-dot {
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.tg-status-indicator.error .tg-status-dot {
  background: var(--color-error);
}

.tg-status-indicator.loading .tg-status-dot {
  background: var(--color-accent);
  animation: pulse 1s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.tg-status-indicator.connected .tg-status-text {
  color: var(--color-success);
}

.tg-status-indicator.error .tg-status-text {
  color: var(--color-error);
}

.tg-status-actions {
  display: flex;
  gap: 6px;
}

/* ========== Section ========== */
.tg-section {
  display: grid;
  gap: var(--gap-md);
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.tg-section-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tg-section-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--color-accent-light);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tg-section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
}

.tg-section-desc {
  font-size: 0.78rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.tg-section-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tg-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  padding: 2px 8px;
  background: var(--color-accent-light);
  border-radius: var(--radius-full);
}

/* ========== Config Grid ========== */
.tg-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.tg-field-full {
  grid-column: 1 / -1;
}

.tg-divider {
  grid-column: 1 / -1;
  height: 1px;
  background: var(--color-border);
  margin: 2px 0;
}

.tg-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tg-label svg {
  color: var(--color-text-tertiary);
}

.tg-input {
  width: 100%;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  padding: 9px 12px;
  background: var(--color-bg-subtle);
  color: var(--color-text);
  font-size: 0.85rem;
  font-family: var(--font-sans);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.tg-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
  background: var(--color-surface-solid);
}

.tg-input::placeholder {
  color: var(--color-text-tertiary);
}

.tg-input-wrap {
  display: flex;
  gap: 8px;
}

.tg-input-wrap .tg-input {
  flex: 1;
  min-width: 0;
}

/* ========== Buttons ========== */
.tg-btn-sm {
  padding: 0 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface-solid);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.tg-btn-sm:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.tg-btn-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tg-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tg-btn-ghost:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}

.tg-btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tg-btn-danger:hover:not(:disabled) {
  color: var(--color-error);
  background: var(--color-error-light);
}

.tg-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 38px;
}

.tg-btn-outline:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-light);
}

.tg-btn-outline:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tg-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-accent-gradient);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.25);
}

.tg-btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.35);
  transform: translateY(-1px);
}

.tg-btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.tg-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.tg-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ========== Pack History ========== */
.tg-history {
  display: grid;
  gap: 8px;
  padding-top: 4px;
}

.tg-history-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tg-history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tg-history-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: transparent;
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--color-text);
  transition: all 0.15s ease;
  font-family: var(--font-sans);
}

.tg-history-chip:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}

.tg-history-chip-name {
  font-weight: 600;
}

.tg-history-chip-title {
  color: var(--color-text-tertiary);
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-history-chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 0.8rem;
  line-height: 1;
  color: var(--color-text-tertiary);
  transition: all 0.15s ease;
  cursor: pointer;
}

.tg-history-chip-remove:hover {
  background: var(--color-error);
  color: #fff;
}

/* ========== Result Messages ========== */
.tg-result {
  display: grid;
  gap: 6px;
}

.tg-result-success,
.tg-result-error {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
}

.tg-result-success {
  color: var(--color-success);
  background: var(--color-success-light);
}

.tg-result-error {
  color: var(--color-error);
  background: var(--color-error-light);
}

/* ========== Empty State ========== */
.tg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.tg-empty svg {
  opacity: 0.4;
}

.tg-empty span {
  font-size: 0.85rem;
}

.tg-empty-hint {
  font-size: 0.75rem !important;
  opacity: 0.7;
}

/* ========== Gallery Grid ========== */
.tg-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
}

.tg-gallery-item {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: center;
  font-family: var(--font-sans);
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
  padding: 6px;
}

.tg-gallery-item:hover {
  background: var(--color-bg-subtle);
}

.tg-gallery-item.selected {
  background: var(--color-accent-light);
}

.tg-gallery-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-bg-subtle);
  margin-bottom: 4px;
}

.tg-gallery-preview img,
.tg-gallery-preview video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tg-gallery-badge {
  position: absolute;
  right: 3px;
  bottom: 3px;
  background: var(--color-accent);
  color: #fff;
  border-radius: 4px;
  font-size: 0.55rem;
  padding: 1px 4px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tg-gallery-check {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tg-gallery-name {
  font-size: 0.62rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== Upload Bar ========== */
.tg-upload-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0 0;
  border-top: 1px solid var(--color-border);
}

.tg-upload-bar-info {
  flex: 1;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tg-result-chip {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.tg-result-chip.ok {
  background: var(--color-success-light);
  color: var(--color-success);
}

.tg-result-chip.warn {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

/* ========== Mobile ========== */
@media (max-width: 600px) {
  .tg-section {
    padding: 14px;
    border-radius: var(--radius-md);
  }

  .tg-status-bar {
    padding: 8px 12px;
  }

  .tg-config-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tg-divider {
    margin: 0;
  }

  .tg-section-icon {
    width: 30px;
    height: 30px;
  }

  .tg-section-icon svg {
    width: 15px;
    height: 15px;
  }

  .tg-section-title {
    font-size: 0.88rem;
  }

  .tg-gallery {
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
    gap: 6px;
  }

  .tg-upload-bar {
    flex-wrap: wrap;
  }

  .tg-upload-bar-info {
    order: 3;
    flex-basis: 100%;
  }

  .tg-input {
    font-size: 16px; /* prevents iOS zoom */
    padding: 10px 12px;
  }

  .tg-btn-primary {
    flex: 1;
    justify-content: center;
  }
}
</style>
