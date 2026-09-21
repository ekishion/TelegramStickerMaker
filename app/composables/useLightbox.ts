import type { LightboxItem } from '@/components/ui/Lightbox.vue'

const lightboxRef = ref<{ open: (item: LightboxItem) => void } | null>(null)

export function useLightbox() {
  const setRef = (ref: any) => { lightboxRef.value = ref }

  const openImage = (src: string, name: string, meta?: string, downloadUrl?: string) => {
    lightboxRef.value?.open({ type: 'image', src, name, meta, downloadUrl, downloadName: name })
  }

  const openVideo = (src: string, name: string, meta?: string, downloadUrl?: string) => {
    lightboxRef.value?.open({ type: 'video', src, name, meta, downloadUrl, downloadName: name })
  }

  return { setRef, openImage, openVideo }
}
