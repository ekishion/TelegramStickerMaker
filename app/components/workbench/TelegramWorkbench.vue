<template>
  <div class="section-stack">
    <div class="workbench-panel">
      <div class="workbench-header">
        <div>
          <strong>Telegram 配置</strong>
          <div class="text-secondary">验证 Bot / 贴纸包 / 表情</div>
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
          <span>贴纸包名称</span>
          <input v-model="packName" class="input-field" placeholder="pack_name" />
        </label>
        <label class="form-item">
          <span>贴纸包标题</span>
          <input v-model="packTitle" class="input-field" placeholder="Sticker Pack Title" />
        </label>
        <label class="form-item">
          <span>默认表情</span>
          <input v-model="emoji" class="input-field" placeholder="😊" />
        </label>
      </div>

      <div v-if="packHistory.length" class="pack-history">
        <div class="pack-history-label">历史贴纸包</div>
        <div class="pack-history-list">
          <button
            v-for="(pack, i) in packHistory"
            :key="i"
            type="button"
            class="pack-history-chip"
            @click="applyPack(pack)"
          >
            <span class="pack-history-name">{{ pack.packName }}</span>
            <span v-if="pack.packTitle" class="pack-history-title">{{ pack.packTitle }}</span>
            <button type="button" class="pack-history-remove" @click.stop="removePack(i)" aria-label="删除">×</button>
          </button>
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
          <strong>输出文件</strong>
          <div class="text-secondary">选择要上传的贴纸（WEBP / WEBM）</div>
        </div>
        <div class="workbench-actions">
          <button class="kv-action secondary" type="button" @click="loadOutputFiles" :disabled="loadingFiles">
            {{ loadingFiles ? '加载中...' : '刷新' }}
          </button>
          <button class="kv-action secondary" type="button" @click="clearAllCache" :disabled="clearingCache">
            {{ clearingCache ? '清理中...' : '清理缓存' }}
          </button>
        </div>
      </div>

      <div v-if="!outputFiles.length" class="empty-state">暂无输出文件</div>

      <div v-else class="file-grid">
        <button
          v-for="file in outputFiles"
          :key="file.name"
          type="button"
          class="file-item"
          :class="{ selected: selectedFiles.includes(file.name) }"
          @click="toggleSelect(file.name)"
        >
          <div class="file-preview">
            <img v-if="file.type === 'static'" :src="file.url" :alt="file.name" />
            <video v-else :src="file.url" muted loop></video>
            <span class="file-type-badge">{{ file.type === 'static' ? 'WEBP' : 'WEBM' }}</span>
          </div>
          <div class="file-name">{{ file.name }}</div>
        </button>
      </div>

      <div class="workbench-actions">
        <button class="kv-action secondary" type="button" @click="toggleSelectAll">
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
import { computed, onMounted, ref } from 'vue'
import { useHistoryStore } from '@/stores/history'

interface OutputFile { name: string; type: string; size: number; url: string; source: 'browser' | 'server' }
interface BotInfo { id: number; username: string; firstName: string }
interface PackEntry { packName: string; packTitle: string; emoji: string }

const PACK_HISTORY_KEY = 'telegram_pack_history'
const CONFIG_KEY = 'telegram_config'

const botToken = ref('')
const userId = ref('')
const packName = ref('')
const packTitle = ref('')
const emoji = ref('😊')
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
const historyStore = useHistoryStore()

const allSelected = computed(() => outputFiles.value.length > 0 && selectedFiles.value.length === outputFiles.value.length)
const canUpload = computed(() => botToken.value && userId.value && packName.value && selectedFiles.value.length > 0)

onMounted(() => { loadConfig(); loadPackHistory(); historyStore.load(); loadOutputFiles() })

const loadConfig = () => {
  const raw = localStorage.getItem(CONFIG_KEY); if (!raw) return
  try { const c = JSON.parse(raw); botToken.value = c.botToken || ''; userId.value = c.userId || ''; packName.value = c.packName || ''; packTitle.value = c.packTitle || ''; emoji.value = c.emoji || '😊' } catch {}
}

const saveConfig = () => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ botToken: botToken.value, userId: userId.value, packName: packName.value, packTitle: packTitle.value, emoji: emoji.value }))
}

const loadPackHistory = () => {
  const raw = localStorage.getItem(PACK_HISTORY_KEY)
  if (!raw) return
  try { packHistory.value = JSON.parse(raw) } catch { packHistory.value = [] }
}

const savePackHistory = () => {
  localStorage.setItem(PACK_HISTORY_KEY, JSON.stringify(packHistory.value))
}

const addPackToHistory = () => {
  if (!packName.value) return
  const entry: PackEntry = { packName: packName.value, packTitle: packTitle.value, emoji: emoji.value }
  packHistory.value = [entry, ...packHistory.value.filter(p => p.packName !== entry.packName)].slice(0, 20)
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
  if (!botToken.value) return; validating.value = true; tokenError.value = ''; botInfo.value = null
  try {
    const res = await fetch('/api/telegram/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ botToken: botToken.value }) })
    const data = await res.json(); if (!res.ok) throw new Error(data.error || '验证失败'); botInfo.value = data.bot
  } catch (e: any) { tokenError.value = e.message } finally { validating.value = false }
}

const loadOutputFiles = async () => {
  loadingFiles.value = true
  try {
    const browserFiles: OutputFile[] = []
    for (const item of historyStore.items) {
      const base = item.fileName || 'sticker'
      if (item.result?.webp?.startsWith('data:')) browserFiles.push({ name: `${base}.webp`, type: 'static', size: item.size || 0, url: item.result.webp, source: 'browser' })
      if (item.result?.webm?.startsWith('data:')) browserFiles.push({ name: `${base}.webm`, type: 'video', size: item.size || 0, url: item.result.webm, source: 'browser' })
    }

    let serverFiles: OutputFile[] = []
    try {
      const res = await fetch('/api/telegram/output-files', { cache: 'no-store' })
      const data = await res.json()
      serverFiles = (data.files || [])
        .filter((f: any) => f.name.endsWith('.webp') || f.name.endsWith('.webm'))
        .map((f: any) => ({
          ...f,
          type: f.name.endsWith('.webm') ? 'video' : 'static',
          url: `/api/telegram/file/${encodeURIComponent(f.name)}`,
          source: 'server'
        }))
    } catch {}

    const seen = new Set<string>()
    outputFiles.value = [...browserFiles, ...serverFiles].filter(file => {
      if (seen.has(file.name)) return false
      seen.add(file.name)
      return true
    })
  } catch {
    outputFiles.value = []
  } finally {
    loadingFiles.value = false
  }
}

const clearAllCache = async () => {
  clearingCache.value = true
  cacheMessage.value = ''
  try {
    const res = await fetch('/api/telegram/cache-clear', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || '清理缓存失败')
    historyStore.clear()
    selectedFiles.value = []
    await loadOutputFiles()
    cacheMessage.value = `已清理 ${data.removed || 0} 个服务端文件 + 浏览器历史`
  } catch (e: any) {
    cacheMessage.value = e.message || '清理缓存失败'
  } finally {
    clearingCache.value = false
  }
}

const toggleSelect = (name: string) => {
  selectedFiles.value = selectedFiles.value.includes(name) ? selectedFiles.value.filter(n => n !== name) : [...selectedFiles.value, name]
}

const toggleSelectAll = () => { selectedFiles.value = allSelected.value ? [] : outputFiles.value.map(f => f.name) }

const startUpload = async () => {
  if (!canUpload.value) return; uploading.value = true; uploadResult.value = null
  try {
    const selectedOutputs = outputFiles.value.filter(file => selectedFiles.value.includes(file.name))
    const uploadFiles = selectedOutputs.map(file => {
      if (file.source === 'browser' && file.url.startsWith('data:')) {
        return { name: file.name, url: file.url }
      }
      return file.name
    })
    const res = await fetch('/api/telegram/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ botToken: botToken.value, userId: Number(userId.value), packName: packName.value, packTitle: packTitle.value || 'My Sticker Pack', emoji: emoji.value || '😊', files: uploadFiles }) })
    const data = await res.json(); if (!res.ok) throw new Error(data.error || '上传失败'); uploadResult.value = data.results || { success: 0, failed: 0 }
    addPackToHistory()
  } catch (e: any) { uploadResult.value = { success: 0, failed: selectedFiles.value.length }; tokenError.value = e.message } finally { uploading.value = false }
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
