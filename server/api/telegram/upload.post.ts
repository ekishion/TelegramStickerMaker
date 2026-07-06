import fs from 'fs'
import path from 'path'
import { Buffer } from 'node:buffer'
import { config } from '../../utils/config'
import { telegramService } from '../../services/telegramService'
import { logger } from '../../utils/logger'
import {
  assertAllowedUploadPart,
  assertMaxFileCount,
  parseBoundedDataUrl,
  resolveStickerTempFile
} from '../../utils/fileSecurity'

const STICKER_MIME_TYPES = ['image/webp', 'video/webm']

function stickerFormatFromName(fileName: string, mime?: string): 'static' | 'video' | null {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === '.webm' || mime === 'video/webm') return 'video'
  if (ext === '.webp' || mime === 'image/webp') return 'static'
  return null
}

function assertStickerSize(format: 'static' | 'video', size: number) {
  const maxSize = format === 'video' ? config.sticker.maxVideoFileSize : 512 * 1024
  if (size > maxSize) {
    throw createError({ statusCode: 413, message: 'Sticker file is too large' })
  }
}

export default defineEventHandler(async (event) => {
  try {
    const contentType = getHeader(event, 'content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await readMultipartFormData(event)
      if (!formData || formData.length === 0) {
        throw createError({ statusCode: 400, message: 'No form data received' })
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

      const stickerParts = formData.filter(part => part.name === 'stickers' && part.filename && part.data)
      assertMaxFileCount(stickerParts.length, config.upload.maxImageFiles + config.upload.maxVideoFiles)

      const stickers = stickerParts
        .map(part => {
          assertAllowedUploadPart(part, STICKER_MIME_TYPES)
          const fileName = path.basename(part.filename || 'sticker.webp')
          const format = stickerFormatFromName(fileName, part.type)
          if (!format) {
            throw createError({ statusCode: 415, message: 'Unsupported sticker file type' })
          }
          assertStickerSize(format, part.data.length)
          return { name: fileName, buffer: Buffer.from(part.data), format }
        })

      if (stickers.length === 0) {
        throw createError({ statusCode: 400, message: 'At least one sticker file is required' })
      }

      logger.info(`Starting browser multipart upload of ${stickers.length} stickers to Telegram`)
      const results = await telegramService.batchUploadStickerBuffers(
        botToken,
        userId,
        packName,
        packTitle,
        stickers,
        emoji
      )

      return {
        results: {
          success: results.success.length,
          failed: results.failed.length,
          failedFiles: results.failed
        },
        packUrl: results.packUrl,
        packName: results.packName
      }
    }

    const body = await readBody(event)
    const { botToken, userId, packName, packTitle, emoji, files } = body

    if (!botToken) {
      throw createError({ statusCode: 400, message: 'Bot token is required' })
    }
    if (!userId) {
      throw createError({ statusCode: 400, message: 'User ID is required' })
    }
    if (!packName) {
      throw createError({ statusCode: 400, message: 'Pack name is required' })
    }
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw createError({ statusCode: 400, message: 'At least one file is required' })
    }

    assertMaxFileCount(files.length, config.upload.maxImageFiles + config.upload.maxVideoFiles)

    const dataUrlFiles: { name: string; buffer: Buffer; format: 'static' | 'video' }[] = []
    const isDataUrl = (value: string) => /^data:[^;]+;base64,/.test(value)

    for (const file of files) {
      if (!file || typeof file !== 'object') continue
      if (typeof file.url !== 'string' || typeof file.name !== 'string') continue
      if (!isDataUrl(file.url)) continue
      const parsed = parseBoundedDataUrl(file.url)
      if (!STICKER_MIME_TYPES.includes(parsed.mime)) {
        throw createError({ statusCode: 415, message: 'Unsupported sticker file type' })
      }
      const fileName = path.basename(file.name)
      const format = stickerFormatFromName(fileName, parsed.mime)
      if (!format) {
        throw createError({ statusCode: 415, message: 'Unsupported sticker file type' })
      }
      assertStickerSize(format, parsed.buffer.length)
      dataUrlFiles.push({ name: fileName, buffer: parsed.buffer, format })
    }

    if (dataUrlFiles.length > 0) {
      logger.info(`Starting browser-cache upload of ${dataUrlFiles.length} stickers to Telegram`)
      const results = await telegramService.batchUploadStickerBuffers(
        botToken,
        userId,
        packName,
        packTitle || 'My Sticker Pack',
        dataUrlFiles,
        emoji || '😊'
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
    }

    const validFiles: string[] = []

    for (const file of files) {
      const fileName = typeof file === 'string' ? file : (typeof file?.name === 'string' ? file.name : '')
      const tempFile = resolveStickerTempFile(fileName)
      if (tempFile && fs.existsSync(tempFile.filePath)) {
        const stats = fs.statSync(tempFile.filePath)
        const format = tempFile.ext === '.webm' ? 'video' : 'static'
        assertStickerSize(format, stats.size)
        validFiles.push(tempFile.filePath)
      }
    }

    if (validFiles.length === 0) {
      throw createError({ statusCode: 400, message: 'No valid sticker files found' })
    }

    logger.info(`Starting upload of ${validFiles.length} stickers to Telegram`)

    const results = await telegramService.batchUploadStickers(
      botToken,
      userId,
      packName,
      packTitle || 'My Sticker Pack',
      validFiles,
      emoji || '😊'
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
    logger.error('Upload error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || 'Upload failed' })
  }
})
