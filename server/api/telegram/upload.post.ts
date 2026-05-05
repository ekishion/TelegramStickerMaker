import fs from 'fs'
import path from 'path'
import { Buffer } from 'node:buffer'
import { config } from '../../utils/config'
import { telegramService } from '../../services/telegramService'
import { logger } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  try {
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
      return { mime: match[1], buffer: Buffer.from(match[2], 'base64') }
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
