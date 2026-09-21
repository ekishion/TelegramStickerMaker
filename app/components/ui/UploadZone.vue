<template>
  <div
    class="upload-zone"
    :class="{ dragover: isDragover }"
    role="button"
    tabindex="0"
    :aria-label="title || t('upload.default.title')"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="openFilePicker"
    @keydown.enter.prevent="openFilePicker"
    @keydown.space.prevent="openFilePicker"
  >
    <div class="upload-zone-inner">
      <div class="upload-zone-icon">
        <ImagePlus :size="26" :stroke-width="1.8" />
      </div>
      <div class="upload-zone-title">{{ title || t('upload.default.title') }}</div>
      <div class="upload-zone-hint">{{ hint }}</div>
      <button class="tg-btn-primary is-accent" type="button" @click.stop="openFilePicker">{{ t('upload.pick') }}</button>
    </div>
    <input ref="fileInput" name="uploadFiles" type="file" :accept="accept" :multiple="multiple" style="display: none" @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus } from 'lucide-vue-next'

withDefaults(defineProps<{
  title?: string
  hint?: string
  accept?: string
  multiple?: boolean
}>(), {
  title: '',
  hint: '',
  accept: '*/*',
  multiple: true
})

const emit = defineEmits<{
  'files-selected': [files: File[]]
}>()

const { t } = useLocale()

const isDragover = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const openFilePicker = () => {
  fileInput.value?.click()
}

const onDragEnter = () => {
  isDragover.value = true
}

const onDragLeave = () => {
  isDragover.value = false
}

const onDrop = (event: DragEvent) => {
  isDragover.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length) {
    emit('files-selected', files)
  }
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length) {
    emit('files-selected', files)
    target.value = ''
  }
}
</script>

<style scoped>
.upload-zone {
  position: relative;
  border: 1.5px dashed var(--line-strong);
  border-radius: var(--radius-lg);
  padding: 36px;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s var(--ease-out);
}

.upload-zone:hover {
  border-color: var(--ink);
  background: var(--paper-2);
}

.upload-zone.dragover {
  border-color: var(--accent);
  background: var(--accent-soft);
  transform: scale(1.008);
}

.upload-zone-inner {
  display: grid;
  gap: 7px;
  text-align: center;
  place-items: center;
}

.upload-zone-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-full);
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink);
  margin-bottom: 6px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.25s var(--ease-spring), color 0.2s ease, border-color 0.2s ease;
}

.upload-zone:hover .upload-zone-icon,
.upload-zone.dragover .upload-zone-icon {
  transform: translateY(-3px) rotate(-4deg);
  color: var(--accent-ink);
  border-color: var(--accent);
}

.upload-zone-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ink);
}

.upload-zone-hint {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  color: var(--ink-3);
  max-width: 46ch;
  line-height: 1.7;
}

.upload-zone .kv-action {
  margin-top: 10px;
  pointer-events: auto;
}

@media (max-width: 600px) {
  .upload-zone {
    padding: 24px 16px;
  }

  .upload-zone-title {
    font-size: 0.86rem;
  }
}
</style>
