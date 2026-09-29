import { describe, expect, it } from 'vitest'
import {
  TELEGRAM_STICKER_LIMITS,
  getStickerDimensions,
  objectUrlToFileName,
  stickerBaseName,
  validateTelegramStickerOutput
} from '@/utils/telegramStickerRules'

describe('validateTelegramStickerOutput', () => {
  it('accepts a 512x512 static sticker inside the size cap', () => {
    const errors = validateTelegramStickerOutput({
      type: 'static',
      size: 100 * 1024,
      width: 512,
      height: 512
    })
    expect(errors).toEqual([])
  })

  it('returns rule keys, not user-facing copy', () => {
    const errors = validateTelegramStickerOutput({
      type: 'static',
      size: TELEGRAM_STICKER_LIMITS.maxStaticBytes + 1,
      width: 512,
      height: 512
    })
    expect(errors).toContain('rule.size.static')
  })

  it('rejects a side that is neither 512 nor under 512', () => {
    const errors = validateTelegramStickerOutput({ type: 'static', size: 1024, width: 640, height: 512 })
    expect(errors).toContain('rule.side')
  })

  it('allows a portrait sticker as long as one side is 512', () => {
    const errors = validateTelegramStickerOutput({ type: 'static', size: 1024, width: 512, height: 300 })
    expect(errors).toEqual([])
  })

  it('flags video stickers longer than the cap', () => {
    const errors = validateTelegramStickerOutput({
      type: 'video',
      size: 100 * 1024,
      width: 512,
      height: 512,
      duration: TELEGRAM_STICKER_LIMITS.maxVideoDuration + 0.5
    })
    expect(errors).toContain('rule.duration')
  })

  it('ignores the duration rule for static stickers', () => {
    const errors = validateTelegramStickerOutput({ type: 'static', size: 1024, width: 512, height: 512, duration: 99 })
    expect(errors).toEqual([])
  })
})

describe('getStickerDimensions', () => {
  it('scales the long side to 512 and keeps the ratio', () => {
    expect(getStickerDimensions(1024, 512)).toEqual({ width: 512, height: 256 })
  })

  it('handles portrait input', () => {
    expect(getStickerDimensions(512, 1024)).toEqual({ width: 256, height: 512 })
  })

  it('upscales small images so the long side still reaches 512', () => {
    expect(getStickerDimensions(100, 100)).toEqual({ width: 512, height: 512 })
    expect(getStickerDimensions(128, 64)).toEqual({ width: 512, height: 256 })
    expect(getStickerDimensions(60, 120)).toEqual({ width: 256, height: 512 })
  })

  it('never emits a zero side for extreme aspect ratios', () => {
    const wide = getStickerDimensions(512, 1)
    expect(wide).toEqual({ width: 512, height: 1 })
    const tall = getStickerDimensions(1, 512)
    expect(tall).toEqual({ width: 1, height: 512 })
  })
})

describe('undersized sources', () => {
  it('flags a 100x100 source so it converts instead of being reused as-is', () => {
    const errors = validateTelegramStickerOutput({ type: 'static', size: 1024, width: 100, height: 100 })
    expect(errors).toContain('rule.side')
  })
})

describe('stickerBaseName', () => {
  it('strips the extension and trims unsafe characters', () => {
    expect(stickerBaseName('my photo (1).PNG')).toBe('my_photo_1')
  })

  it('keeps dots and dashes, and falls back for empty names', () => {
    expect(stickerBaseName('a.b-c.d.png')).toBe('a.b-c.d')
    expect(stickerBaseName('!!!.png')).toBe('sticker')
  })
})

describe('objectUrlToFileName', () => {
  it('produces a unique extension-tagged name without the source name', () => {
    const first = objectUrlToFileName('webp')
    const second = objectUrlToFileName('webp')
    expect(first).toMatch(/^\d+-[a-z0-9]+\.webp$/)
    expect(first).not.toBe(second)
  })
})
