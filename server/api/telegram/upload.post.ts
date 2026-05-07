import fs from 'fs'
import path from 'path'
import { Buffer } from 'node:buffer'
import { config } from '../../utils/config'
import { telegramService } from '../../services/telegramService'
import { logger } from '../../utils/logger'

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

      const stickers = formData
        .filter(part => part.name === 'stickers' && part.filename && part.data)
        .map(part => {
          const fileName = part.filename || 'sticker.webp'
          const ext = path.extname(fileName).toLowerCase()
          const format: 'static' | 'video' = ext === '.webm' ? 'video' : 'static'
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

    const dataUrlFiles: { name: string; buffer: Buffer; format: 'static' | 'video' }[] = []
    const isDataUrl = (value: string) => /^data:[^;]+;base64,/.test(value)
    const parseDataUrl = (dataUrl: string) => {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) throw createError({ statusCode: 400, message: 'Invalid data URL file payload' })
      const mime = match[1]
      const base64 = match[2]
      if (!mime || !base64) throw createError({ statusCode: 400, message: 'Invalid data URL file payload' })
      return { mime, buffer: Buffer.from(base64, 'base64') }
    }

    for (const file of files) {
      if (!file || typeof file !== 'object') continue
      if (typeof file.url !== 'string' || typeof file.name !== 'string') continue
      if (!isDataUrl(file.url)) continue
      const parsed = parseDataUrl(file.url)
      const ext = path.extname(file.name).toLowerCase()
      const format: 'static' | 'video' = ext === '.webm' || parsed.mime === 'video/webm' ? 'video' : 'static'
      dataUrlFiles.push({ name: file.name, buffer: parsed.buffer, format })
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

    const tempDir = config.paths.temp
    const validFiles: string[] = []

    for (const file of files) {
      const fileName = typeof file === 'string' ? file : (typeof file?.name === 'string' ? file.name : '')
      const filePath = path.join(tempDir, fileName)
      if (fs.existsSync(filePath)) {
        const ext = path.extname(fileName).toLowerCase()
        if (ext === '.webp' || ext === '.webm') {
          validFiles.push(filePath)
        }
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
