<template>
  <div class="tg-workbench">
    <div class="tg-status-bar">
      <div class="tg-status-indicator" :class="connectionState">
        <span class="tg-status-dot"></span>
        <span class="tg-status-text">{{ connectionLabel }}</span>
      </div>
      <div class="tg-status-actions">
        <button class="tg-btn-ghost" type="button" @click="saveConfig">
          <Save :size="14" :stroke-width="2" />
          {{ t('tg.btn.save') }}
        </button>
      </div>
    </div>

    <WorkbenchSection
      :title="t('tg.s1.title')"
      :description="t('tg.s1.desc')"
      class="tg-config-section"
    >
      <template #icon>
        <Settings :size="17" :stroke-width="2" />
      </template>

      <div class="tg-config-grid">
        <div class="tg-field tg-field-full">
          <label class="tg-label" for="telegram-bot-token">
            <KeyRound :size="13" :stroke-width="2" />
            Bot Token
          </label>
          <div class="tg-input-wrap">
            <input id="telegram-bot-token" v-model="botToken" name="botToken" class="tg-input" type="password" placeholder="123456:ABC-DEF..." autocomplete="off" />
            <button class="tg-btn-sm" type="button" @click="validateToken" :disabled="!botToken || validating">
              {{ validating ? t('tg.btn.validating') : t('tg.btn.validate') }}
            </button>
          </div>
        </div>

        <div class="tg-field">
          <label class="tg-label" for="telegram-user-id">
            <User :size="13" :stroke-width="2" />
            {{ t('tg.label.userId') }}
          </label>
          <input id="telegram-user-id" v-model="userId" name="telegramUserId" class="tg-input" :placeholder="t('tg.ph.userId')" autocomplete="off" />
        </div>

        <div class="tg-field">
          <label class="tg-label" for="telegram-emoji">
            <Smile :size="13" :stroke-width="2" />
            {{ t('tg.label.emoji') }}
          </label>
          <input id="telegram-emoji" v-model="emoji" name="emoji" class="tg-input" :placeholder="t('tg.ph.emoji')" autocomplete="off" />
        </div>

        <div class="tg-divider"></div>

        <div class="tg-field">
          <label class="tg-label" for="telegram-pack-name">
            <Package :size="13" :stroke-width="2" />
            {{ t('tg.label.packName') }}
          </label>
          <input id="telegram-pack-name" v-model="packName" name="packName" class="tg-input" placeholder="my_sticker_pack" autocomplete="off" />
        </div>

        <div class="tg-field">
          <label class="tg-label" for="telegram-pack-title">
            <PenLine :size="13" :stroke-width="2" />
            {{ t('tg.label.packTitle') }}
          </label>
          <input id="telegram-pack-title" v-model="packTitle" name="packTitle" class="tg-input" placeholder="My Sticker Pack" autocomplete="off" />
        </div>
      </div>

      <div v-if="packHistory.length" class="tg-history">
        <div class="tg-history-label">{{ t('tg.packHistory') }}</div>
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
            <span class="tg-history-chip-remove" @click.stop="removePack(i)" :aria-label="t('tg.packRemove')">&times;</span>
          </button>
        </div>
      </div>

      <div v-if="botInfo || tokenError" class="tg-result">
        <div v-if="botInfo" class="tg-result-success">
          <CircleCheck :size="15" :stroke-width="2" />
          <span>{{ t('tg.status.connected') }} <strong>@{{ botInfo.username }}</strong></span>
        </div>
        <div v-if="tokenError" class="tg-result-error">
          <CircleX :size="15" :stroke-width="2" />
          <span>{{ tokenError }}</span>
        </div>
      </div>
    </WorkbenchSection>

    <WorkbenchSection
      :title="t('tg.s2.title')"
      :description="t('tg.s2.desc')"
      class="tg-cache-section"
    >
      <template #icon>
        <Sticker :size="17" :stroke-width="2" />
      </template>

      <template #right>
        <div class="tg-section-actions">
          <span v-if="outputFiles.length" class="tg-count">{{ selectedFiles.length }}/{{ outputFiles.length }}</span>
          <button class="tg-btn-ghost" type="button" @click="loadOutputFiles" :disabled="loadingFiles" :aria-label="t('tg.btn.refresh')">
            <RefreshCw :size="14" :stroke-width="2" />
          </button>
          <button class="tg-btn-ghost tg-btn-danger" type="button" @click="clearAllCache" :disabled="clearingCache" :aria-label="t('tg.btn.clearCache')">
            <Trash2 :size="14" :stroke-width="2" />
          </button>
        </div>
      </template>

      <div v-if="loadingFiles && !outputFiles.length" class="tg-skeleton-row" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="tg-skeleton-tile"></div>
      </div>

      <WorkbenchEmptyState
        v-else-if="!outputFiles.length"
        :title="t('tg.empty.title')"
        :hint="t('tg.empty.hint')"
      />

      <div v-else class="tg-gallery tg-gallery--select">
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
              <Check :size="13" :stroke-width="3" />
            </span>
          </div>
          <div class="tg-gallery-name">{{ file.name }}</div>
          <input
            v-if="selectedFiles.includes(file.id)"
            class="tg-gallery-emoji"
            type="text"
            maxlength="4"
            :value="emojiFor(file.id)"
            :aria-label="`${t('tg.emojiLabel')} ${file.name}`"
            @click.stop
            @input="setEmojiFor(file.id, ($event.target as HTMLInputElement).value)"
          />
        </button>
      </div>

      <div v-if="outputFiles.length" class="tg-upload-bar">
        <button class="tg-btn-outline" type="button" @click="toggleSelectAll" :disabled="!outputFiles.length">
          {{ allSelected ? t('tg.deselectAll') : t('tg.selectAll') }}
        </button>
        <div class="tg-upload-bar-info">
          <span v-if="uploadResult" class="tg-result-chip" :class="uploadResult.failed ? 'warn' : 'ok'">
            {{ t('tg.uploadResult', { success: uploadResult.success, failed: uploadResult.failed }) }}
          </span>
          <a
            v-if="uploadResult?.packUrl"
            class="tg-result-chip ok"
            :href="uploadResult.packUrl"
            target="_blank"
            rel="noopener"
          >
            <ExternalLink :size="13" :stroke-width="2" />
            {{ t('tg.packLink') }}
          </a>
          <button
            v-if="uploadResult && uploadResult.failed > 0"
            class="tg-result-chip warn tg-result-chip-btn"
            type="button"
            :disabled="uploading"
            @click="retryFailed"
          >
            <RefreshCw :size="13" :stroke-width="2" />
            {{ t('tg.retryFailed') }}
          </button>
          <span v-if="cacheMessage" class="tg-result-chip" :class="cacheOk ? 'ok' : 'warn'">{{ cacheMessage }}</span>
          <div v-if="uploadResult?.failedFiles?.length" class="tg-failed-list">
            <div class="tg-failed-title">{{ t('tg.failedTitle') }}</div>
            <ul>
              <li v-for="file in uploadResult.failedFiles.slice(0, 8)" :key="file.fileName + file.index">
                <span class="tg-failed-name">{{ file.fileName }}</span>
                <span class="tg-failed-reason">{{ file.error }}</span>
              </li>
            </ul>
          </div>
        </div>
        <button class="tg-btn-primary is-accent" type="button" @click="startUpload" :disabled="!canUpload || uploading">
          <CloudUpload v-if="!uploading" :size="15" :stroke-width="2" />
          <span v-if="uploading" class="tg-spinner"></span>
          {{ uploading ? t('tg.btn.uploading') : t('tg.btn.upload') }}
        </button>
      </div>
    </WorkbenchSection>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Check,
  CircleCheck,
  CircleX,
  CloudUpload,
  ExternalLink,
  KeyRound,
  Package,
  PenLine,
  RefreshCw,
  Save,
  Settings,
  Smile,
  Sticker,
  Trash2,
  User
} from 'lucide-vue-next'
import WorkbenchEmptyState from '@/components/workbench/WorkbenchEmptyState.vue'
import WorkbenchSection from '@/components/workbench/WorkbenchSection.vue'
import { useLocale } from '@/composables/useLocale'
import { useConfirm } from '@/composables/useConfirm'
import { useObjectUrlRegistry } from '@/composables/useObjectUrlRegistry'
import { useHistoryStore } from '@/stores/history'
import {
  clearCachedStickers,
  createStickerObjectUrl,
  listCachedStickers,
  type CachedStickerFile
} from '@/utils/browserStickerStore'

const { t } = useLocale()
const { confirm } = useConfirm()

interface OutputFile extends CachedStickerFile {
  url: string
}

interface BotInfo {
  id: number
  username: string
  firstName: string
}

interface PackEntry {
  packName: string
  packTitle: string
  emoji: string
}

const PACK_HISTORY_KEY = 'telegram_pack_history'
const CONFIG_KEY = 'telegram_config'

const historyStore = useHistoryStore()
const objectUrls = useObjectUrlRegistry()

const botToken = ref('')
const userId = ref('')
const packName = ref('')
const packTitle = ref('')
const emoji = ref('')
const perFileEmojis = ref<Record<string, string>>({})
const validating = ref(false)
const botInfo = ref<BotInfo | null>(null)
const tokenError = ref('')
const outputFiles = ref<OutputFile[]>([])
const selectedFiles = ref<string[]>([])
const loadingFiles = ref(false)
const clearingCache = ref(false)
const uploading = ref(false)
const uploadResult = ref<{
  success: number
  failed: number
  packUrl?: string | null
  failedFiles?: { fileName: string; index: number; error: string }[]
} | null>(null)
const cacheMessage = ref('')
const cacheOk = ref(true)
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
  if (validating.value) return t('tg.status.validating')
  if (botInfo.value) return t('tg.status.connected', { name: botInfo.value.username })
  if (tokenError.value) return t('tg.status.failed')
  return t('tg.status.idle')
})

onMounted(() => {
  loadConfig()
  loadPackHistory()
  void loadOutputFiles()
})

const loadConfig = () => {
  const raw = localStorage.getItem(CONFIG_KEY)
  if (!raw) return

  try {
    const config = JSON.parse(raw)
    userId.value = config.userId || ''
    packName.value = config.packName || ''
    packTitle.value = config.packTitle || ''
    emoji.value = config.emoji || ''
  } catch {}
}

const saveConfig = () => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({
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

  const entry: PackEntry = {
    packName: packName.value,
    packTitle: packTitle.value,
    emoji: emoji.value
  }

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

    if (!res.ok) throw new Error(data.error || data.message || t('tg.err.validate'))
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
  objectUrls.reset()

  try {
    const cached = await listCachedStickers()
    outputFiles.value = cached
      .filter(file => file.mime === 'image/webp' || file.mime === 'video/webm')
      .map(file => ({ ...file, url: objectUrls.track(createStickerObjectUrl(file)) }))
    selectedFiles.value = selectedFiles.value.filter(id => outputFiles.value.some(file => file.id === id))
  } catch (error: any) {
    cacheMessage.value = error.message || t('tg.err.cacheRead')
    cacheOk.value = false
    outputFiles.value = []
  } finally {
    loadingFiles.value = false
  }
}

const clearAllCache = async () => {
  const ok = await confirm({
    title: t('tg.confirmClearTitle'),
    message: t('tg.confirmClearBody'),
    confirmText: t('tg.btn.clearCache'),
    danger: true
  })
  if (!ok) return

  clearingCache.value = true
  cacheMessage.value = ''

  try {
    await clearCachedStickers()
    historyStore.clear()
    selectedFiles.value = []
    objectUrls.reset()
    outputFiles.value = []
    cacheMessage.value = t('tg.cache.cleared')
    cacheOk.value = true
  } catch (error: any) {
    cacheMessage.value = error.message || t('tg.err.cacheClear')
    cacheOk.value = false
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

/** Per-sticker emoji defaults to the global one until the user edits it. */
const emojiFor = (id: string) => perFileEmojis.value[id] ?? emoji.value ?? '🙂'
const setEmojiFor = (id: string, value: string) => {
  perFileEmojis.value = { ...perFileEmojis.value, [id]: value.trim() }
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

    // Only send the array when at least one sticker deviates from the global
    // emoji, so the server's per-sticker branch stays opt-in.
    const emojis = selectedOutputs.map(file => emojiFor(file.id))
    if (emojis.some(value => value !== (emoji.value || '🙂'))) {
      formData.append('emojis', JSON.stringify(emojis))
    }

    const res = await fetch('/api/telegram/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) throw new Error(data.error || data.message || t('tg.err.upload'))

    const results = data.results || { success: 0, failed: 0 }
    uploadResult.value = {
      success: results.success,
      failed: results.failed,
      packUrl: data.packUrl ?? null,
      failedFiles: Array.isArray(results.failedFiles) ? results.failedFiles : []
    }
    addPackToHistory()
  } catch (error: any) {
    uploadResult.value = { success: 0, failed: selectedFiles.value.length, packUrl: null, failedFiles: [] }
    tokenError.value = error.message
  } finally {
    uploading.value = false
  }
}

const retryFailed = async () => {
  const failedNames = new Set((uploadResult.value?.failedFiles || []).map(file => file.fileName))
  const retriable = outputFiles.value.filter(file => failedNames.has(file.name)).map(file => file.id)
  if (!retriable.length) return

  selectedFiles.value = retriable
  await startUpload()
}
</script>
