import path from 'path'
import { Buffer } from 'node:buffer'
import { config } from '../../utils/config'
import { telegramService } from '../../services/telegramService'
import { logger } from '../../utils/logger'
import { assertAllowedUploadPart, assertMaxFileCount } from '../../utils/fileSecurity'

const STICKER_MIME_TYPES = ['image/webp', 'video/webm']

// Telegram sticker payloads are small (<=512KB static / <=256KB video) but a
// full selection is still ~46MB of multipart, which exceeds the platform body
// cap — reject on the declared length before h3 buffers anything.
const MAX_REQUEST_BYTES = 8 * 1024 * 1024
const USER_ID_PATTERN = /^\d{5,12}$/
const PACK_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/
const PACK_TITLE_MAX = 64
const EMOJI_MAX = 40

function assertRequestSize(event: any) {
  const declared = Number(event.node.req.headers['content-length'] || 0)
  if (declared > MAX_REQUEST_BYTES) {
    throw createError({ statusCode: 413, message: 'Request body is too large' })
  }
}

function stickerFormatFromName(fileName: string, mime?: string): 'static' | 'video' | null {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === '.webm' || mime === 'video/webm') return 'video'
  if (ext === '.webp' || mime === 'image/webp') return 'static'
  return null
}

function assertStickerSize(format: 'static' | 'video', size: number) {
  const maxSize = format === 'video' ? config.sticker.maxVideoFileSize : config.sticker.maxStaticFileSize
  if (size > maxSize) {
    throw createError({ statusCode: 413, message: 'Sticker file is too large' })
  }
}

function assertTextField(value: string, pattern: RegExp | null, maxLength: number, field: string) {
  if (!value) return
  if (pattern && !pattern.test(value)) {
    throw createError({ statusCode: 400, message: `Invalid ${field}` })
  }
  if (value.length > maxLength) {
    throw createError({ statusCode: 400, message: `${field} is too long` })
  }
}

export default defineEventHandler(async event => {
  try {
    assertRequestSize(event)

    const contentType = getHeader(event, 'content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      throw createError({ statusCode: 415, message: 'Expected multipart/form-data' })
    }

    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, message: 'No form data received' })
    }

    // Second line of defence for chunked requests that declare no length.
    let receivedBytes = 0
    for (const part of formData) {
      receivedBytes += part.data?.length || 0
    }
    if (receivedBytes > MAX_REQUEST_BYTES) {
      throw createError({ statusCode: 413, message: 'Request body is too large' })
    }

    const field = (name: string) => formData.find(part => part.name === name)?.data?.toString() || ''
    const botToken = field('botToken')
    const userId = field('userId')
    const packName = field('packName')
    const packTitle = field('packTitle') || 'My Sticker Pack'
    const emoji = field('emoji') || '🙂'

    if (!botToken) throw createError({ statusCode: 400, message: 'Bot token is required' })
    if (!userId) throw createError({ statusCode: 400, message: 'User ID is required' })
    if (!packName) throw createError({ statusCode: 400, message: 'Pack name is required' })

    assertTextField(userId, USER_ID_PATTERN, 12, 'User ID')
    assertTextField(packName, PACK_NAME_PATTERN, 64, 'Pack name')
    assertTextField(packTitle, null, PACK_TITLE_MAX, 'Pack title')
    assertTextField(emoji, null, EMOJI_MAX, 'Emoji')

    const stickerParts = formData.filter(part => part.name === 'stickers' && part.filename && part.data)
    assertMaxFileCount(stickerParts.length, config.upload.maxImageFiles + config.upload.maxVideoFiles)

    const stickers = stickerParts.map(part => {
      assertAllowedUploadPart(part, STICKER_MIME_TYPES)
      const fileName = path.basename(part.filename || 'sticker.webp')
      const format = stickerFormatFromName(fileName, part.type)
      if (!format) {
        throw createError({ statusCode: 415, message: 'Unsupported sticker file type' })
      }
      assertStickerSize(format, part.data!.length)
      return { name: fileName, buffer: Buffer.from(part.data!), format }
    })

    if (stickers.length === 0) {
      throw createError({ statusCode: 400, message: 'At least one sticker file is required' })
    }

    // Optional parallel field: "emojis" carries a JSON array of per-sticker
    // emoji lists ([[...], [...]]); absent means the batch emoji for all.
    let perStickerEmojis: string[][] | null = null
    const emojisField = formData.find(part => part.name === 'emojis')?.data?.toString()
    if (emojisField) {
      try {
        const parsed = JSON.parse(emojisField)
        if (Array.isArray(parsed) && parsed.length === stickers.length) {
          perStickerEmojis = parsed.map(entry => (Array.isArray(entry) ? entry.map(String).slice(0, 10) : []))
        }
      } catch {
        perStickerEmojis = null
      }
    }

    logger.info(`Starting browser multipart upload of ${stickers.length} stickers to Telegram`)
    const results = await telegramService.batchUploadStickerBuffers(
      botToken,
      userId,
      packName,
      packTitle,
      stickers.map((sticker, index) => ({
        ...sticker,
        emojis: perStickerEmojis?.[index]?.length ? perStickerEmojis[index] : undefined
      })),
      emoji
    )

    logger.info(`Upload complete: ${results.success.length} success, ${results.failed.length} failed`)

    return {
      results: {
        success: results.success.length,
        failed: results.failed.length,
        failedFiles: results.failed
      },
      packUrl: results.packUrl,
      packName: results.packName
    }
  } catch (error: any) {
    logger.error('Upload error:', error?.message || error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: 'Upload failed. Please try again.' })
  }
})
