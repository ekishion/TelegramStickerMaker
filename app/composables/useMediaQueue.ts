import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { useLocale } from './useLocale'

export type QueueTaskStatus = 'pending' | 'converting' | 'done' | 'error'

export interface QueueTaskBase {
  id: string
  name: string
  file: File
  status: QueueTaskStatus
  progress: number
}

export interface MediaQueueOptions<T extends QueueTaskBase> {
  /** MIME types the queue accepts; everything else is dropped silently. */
  accept: string[]
  /** Hard cap on queued files, mirrored from /api/config (getter or plain number). */
  maxFiles: number | (() => number)
  /** Optional per-file size ceiling (0/undefined disables the check). */
  maxFileSize?: number | (() => number)
  createTask: (file: File) => T
  releaseUrls: (task: T) => void
  onAdded?: (task: T) => void
}

export function useMediaQueue<T extends QueueTaskBase>(options: MediaQueueOptions<T>) {
  const { t } = useLocale()

  // The cast keeps the caller's exact task type; Vue's UnwrapRef would otherwise
  // widen the generic in push/splice/forEach callbacks.
  const tasks = ref<T[]>([]) as Ref<T[]>

  const statusText = (status: QueueTaskStatus) => ({
    pending: t('status.pending'),
    converting: t('status.converting'),
    done: t('status.done'),
    error: t('status.error')
  }[status])

  const pendingCount = computed(() => tasks.value.filter(task => task.status === 'pending').length)
  const doneCount = computed(() => tasks.value.filter(task => task.status === 'done').length)
  const isConverting = computed(() => tasks.value.some(task => task.status === 'converting'))

  /** Adds accepted files, returning how many were queued and how many were skipped. */
  const addFiles = (files: File[]) => {
    const maxFiles = typeof options.maxFiles === 'function' ? options.maxFiles() : options.maxFiles
    const maxFileSize = typeof options.maxFileSize === 'function' ? options.maxFileSize() : options.maxFileSize
    const room = Math.max(0, maxFiles - tasks.value.length)
    const valid = files
      .filter(file => options.accept.includes(file.type))
      .filter(file => !maxFileSize || file.size <= maxFileSize)
      .slice(0, room)

    valid.forEach(file => {
      const task = options.createTask(file)
      tasks.value.push(task)
      options.onAdded?.(task)
    })

    return { added: valid.length, skipped: files.length - valid.length }
  }

  const removeTask = (id: string) => {
    const index = tasks.value.findIndex(task => task.id === id)
    if (index < 0) return
    const [task] = tasks.value.splice(index, 1)
    if (task) options.releaseUrls(task)
  }

  const clearAll = () => {
    tasks.value.forEach(options.releaseUrls)
    tasks.value = []
  }

  return {
    tasks,
    statusText,
    pendingCount,
    doneCount,
    isConverting,
    addFiles,
    removeTask,
    clearAll
  }
}
