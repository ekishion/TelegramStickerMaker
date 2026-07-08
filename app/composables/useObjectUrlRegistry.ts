import { onBeforeUnmount } from 'vue'

export function useObjectUrlRegistry() {
  const urls = new Set<string>()

  const track = (url?: string | null) => {
    if (url?.startsWith('blob:')) urls.add(url)
    return url || ''
  }

  const create = (blob: Blob | MediaSource) => track(URL.createObjectURL(blob))

  const revoke = (url?: string | null) => {
    if (!url || !urls.has(url)) return
    URL.revokeObjectURL(url)
    urls.delete(url)
  }

  const reset = () => {
    urls.forEach(url => URL.revokeObjectURL(url))
    urls.clear()
  }

  onBeforeUnmount(reset)

  return {
    create,
    reset,
    revoke,
    track
  }
}
