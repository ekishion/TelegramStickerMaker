<template>
  <div
    class="upload-zone"
    :class="{ dragover: isDragover }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="openFilePicker"
  >
    <div class="upload-zone-inner">
      <div class="upload-zone-title">{{ title }}</div>
      <div class="upload-zone-hint">{{ hint }}</div>
      <button class="kv-action secondary" type="button" @click.stop="openFilePicker">选择文件</button>
    </div>
    <input :id="inputId" ref="fileInput" name="uploadFiles" type="file" :accept="accept" :multiple="multiple" style="display: none" @change="onFileChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'

withDefaults(defineProps<{
  title?: string
  hint?: string
  accept?: string
  multiple?: boolean
}>(), {
  title: '拖拽或点击上传文件',
  hint: '',
  accept: '*/*',
  multiple: true
})

const emit = defineEmits<{
  'files-selected': [files: File[]]
}>()

const isDragover = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const inputId = useId()

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
