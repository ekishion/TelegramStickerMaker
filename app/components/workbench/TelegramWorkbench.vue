<template>
  <div class="section-stack">
    <div class="workbench-panel">
      <div class="workbench-header">
        <div>
          <strong>Telegram 配置</strong>
          <div class="text-secondary">Bot Token / 用户 ID / 贴纸包信息</div>
        </div>
        <button class="kv-action secondary" type="button" @click="saveConfig">保存配置</button>
      </div>

      <div class="form-grid">
        <label class="form-item">
          <span>Bot Token</span>
          <input v-model="botToken" class="input-field" placeholder="BotFather token" />
        </label>
        <label class="form-item">
          <span>用户 ID</span>
          <input v-model="userId" class="input-field" placeholder="Telegram user id" />
        </label>
        <label class="form-item">
          <span>贴纸包短名</span>
          <input v-model="packName" class="input-field" placeholder="pack_name" />
        </label>
        <label class="form-item">
          <span>贴纸包标题</span>
          <input v-model="packTitle" class="input-field" placeholder="Sticker Pack Title" />
        </label>
        <label class="form-item">
          <span>默认 Emoji</span>
          <input v-model="emoji" class="input-field" placeholder="🙂" />
        </label>
      </div>

      <div v-if="packHistory.length" class="pack-history">
        <div class="pack-history-label">历史贴纸包</div>
        <div class="pack-history-list">
          <div
            v-for="(pack, i) in packHistory"
            :key="i"
            class="pack-history-chip"
            @click="applyPack(pack)"
          >
            <span class="pack-history-name">{{ pack.packName }}</span>
            <span v-if="pack.packTitle" class="pack-history-title">{{ pack.packTitle }}</span>
            <button type="button" class="pack-history-remove" @click.stop="removePack(i)" aria-label="移除">x</button>
          </div>
        </div>
      </div>

      <div class="workbench-actions">
        <button class="kv-action" type="button" @click="validateToken" :disabled="!botToken || validating">
          {{ validating ? '验证中...' : '验证 Token' }}
        </button>
        <span v-if="botInfo" class="chip">已连接 @{{ botInfo.username }}</span>
        <span v-if="tokenError" class="error-text">{{ tokenError }}</span>
      </div>
    </div>

    <div class="workbench-panel">
      <div class="workbench-header">
        <div>
          <strong>浏览器缓存贴纸</strong>
          <div class="text-secondary">选择本地转换后的 WEBP / WEBM 上传到 Telegram</div>
        </div>
        <div class="workbench-actions">
          <button class="kv-action secondary" type="button" @click="loadOutputFiles" :disabled="loadingFiles">
            {{ loadingFiles ? '刷新中...' : '刷新' }}
          </button>
          <button class="kv-action secondary" type="button" @click="clearAllCache" :disabled="clearingCache">
            {{ clearingCache ? '清理中...' : '清空缓存' }}
          </button>
        </div>
      </div>

      <div v-if="!outputFiles.length" class="empty-state">还没有浏览器缓存贴纸，请先在图片或视频页转换</div>

      <div v-else class="file-grid">
        <button
          v-for="file in outputFiles"
          :key="file.id"
          type="button"
          class="file-item"
          :class="{ selected: selectedFiles.includes(file.id) }"
          @click="toggleSelect(file.id)"
        >
          <div class="file-preview">
            <img v-if="file.type === 'static'" :src="file.url" :alt="file.name" />
            <video v-else :src="file.url" muted loop playsinline></video>
            <span class="file-type-badge">{{ file.type === 'static' ? file.name.split('.').pop()?.toUpperCase() : 'WEBM' }}</span>
          </div>
          <div class="file-name">{{ file.name }}</div>
          <div class="history-meta">{{ formatFileSize(file.size) }}</div>
        </button>
      </div>

      <div class="workbench-actions">
        <button class="kv-action secondary" type="button" @click="toggleSelectAll" :disabled="!outputFiles.length">
          {{ allSelected ? '取消全选' : '全选' }}
        </button>
        <button class="kv-action" type="button" @click="startUpload" :disabled="!canUpload || uploading">
          {{ uploading ? '上传中...' : '上传到 Telegram' }}
        </button>
        <span v-if="uploadResult" class="chip">成功 {{ uploadResult.success }} / 失败 {{ uploadResult.failed }}</span>
        <span v-if="cacheMessage" class="chip">{{ cacheMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatFileSize } from '@/utils/format'
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
    selectedFiles.value = []
    outputFiles.value.forEach(file => URL.revokeObjectURL(file.url))
    outputFiles.value = []
    cacheMessage.value = '浏览器贴纸缓存已清空'
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
.pack-history {
  display: grid;
  gap: 6px;
}
.pack-history-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
}
.pack-history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pack-history-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-surface-solid);
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--color-text);
  transition: all 0.15s ease;
}
.pack-history-chip:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}
.pack-history-name {
  font-weight: 600;
}
.pack-history-title {
  color: var(--color-text-tertiary);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pack-history-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 0.7rem;
  line-height: 1;
  padding: 0;
  transition: all 0.15s ease;
}
.pack-history-remove:hover {
  background: var(--color-error);
  color: #fff;
}
</style>
