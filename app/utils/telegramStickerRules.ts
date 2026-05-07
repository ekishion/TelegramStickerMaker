export const TELEGRAM_STICKER_LIMITS = {
  maxStaticBytes: 512 * 1024,
  maxVideoBytes: 256 * 1024,
  maxSide: 512,
  maxVideoDuration: 3,
  maxVideoFps: 30,
  maxSourceVideoBytes: 50 * 1024 * 1024
} as const

export function stickerBaseName(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '').trim() || 'sticker'
  return base.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48) || 'sticker'
}

export function getStickerDimensions(width: number, height: number) {
  const maxSide = TELEGRAM_STICKER_LIMITS.maxSide
  if (!width || !height) return { width: maxSide, height: maxSide }
  if (width >= height) {
    return { width: maxSide, height: Math.max(1, Math.round((height / width) * maxSide)) }
  }
  return { width: Math.max(1, Math.round((width / height) * maxSide)), height: maxSide }
}

export function objectUrlToFileName(_fileName: string, ext: 'png' | 'webp' | 'webm') {
  const timestamp = Date.now()
  const hash = createBrowserHash(12)
  return `${timestamp}-${hash}.${ext}`
}

function createBrowserHash(length = 12) {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(Math.ceil(length / 2))
    cryptoApi.getRandomValues(bytes)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, length)
  }

  return Math.random().toString(16).slice(2, 2 + length).padEnd(length, '0')
}

export function validateTelegramStickerOutput(input: {
  type: 'static' | 'video'
  size: number
  width?: number
  height?: number
  duration?: number
}) {
  const errors: string[] = []
  const maxBytes = input.type === 'video'
    ? TELEGRAM_STICKER_LIMITS.maxVideoBytes
    : TELEGRAM_STICKER_LIMITS.maxStaticBytes

  if (input.size > maxBytes) {
    errors.push(`文件超过 Telegram ${input.type === 'video' ? '视频贴纸 256KB' : '静态贴纸 512KB'} 限制`)
  }
  if (input.width && input.height) {
    const max = Math.max(input.width, input.height)
    const min = Math.min(input.width, input.height)
    if (max !== TELEGRAM_STICKER_LIMITS.maxSide || min > TELEGRAM_STICKER_LIMITS.maxSide) {
      errors.push('贴纸尺寸必须至少一边为 512px，另一边不超过 512px')
    }
  }
  if (input.type === 'video' && input.duration && input.duration > TELEGRAM_STICKER_LIMITS.maxVideoDuration) {
    errors.push('视频贴纸时长不能超过 3 秒')
  }

  return errors
}
