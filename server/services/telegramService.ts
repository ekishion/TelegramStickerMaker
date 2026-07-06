import fs from 'fs'
import path from 'path'
import { logger } from '../utils/logger'

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

function summarizeTelegramResult(result: any) {
  if (!result || typeof result !== 'object') return 'invalid'
  if (result.ok) return 'ok'
  return `error: ${String(result.description || 'unknown').slice(0, 200)}`
}

async function parseResponse(response: Response, method: string) {
  let responseText: string
  try {
    responseText = await response.text()
  } catch (textError: any) {
    logger.error(`Failed to read response text for ${method}: ${textError.message}`)
    return { ok: false, description: `Failed to read response: ${textError.message}` }
  }

  if (!responseText || responseText.trim() === '') {
    logger.warn(`Telegram API ${method} response (status: ${response.status}): empty`)
    return { ok: false, description: `Empty response from Telegram (HTTP ${response.status})` }
  }

  try {
    const parsed = JSON.parse(responseText)
    logger.info(`Telegram API ${method} response (status: ${response.status}): ${summarizeTelegramResult(parsed)}`)
    return parsed
  } catch {
    logger.error(`Failed to parse Telegram API response for ${method} (status: ${response.status}, length: ${responseText.length})`)
    return { ok: false, description: `Invalid JSON response from Telegram: ${responseText.substring(0, 200)}` }
  }
}

async function callTelegramApi(botToken: string, method: string, params: Record<string, any> = {}, files: Record<string, string> = {}) {
  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`

  if (Object.keys(files).length > 0) {
    const FormData = (await import('form-data')).default
    const form = new FormData()

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          form.append(key, JSON.stringify(value))
        } else {
          form.append(key, String(value))
        }
      }
    }

    for (const [key, filePath] of Object.entries(files)) {
      form.append(key, fs.createReadStream(filePath))
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: form as any,
        headers: form.getHeaders()
      })
      return await parseResponse(response, method)
    } catch (fetchError: any) {
      logger.error(`Network error calling Telegram API ${method}: ${fetchError.message}`)
      return { ok: false, description: `Network error: ${fetchError.message}` }
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    return await parseResponse(response, method)
  } catch (fetchError: any) {
    logger.error(`Network error calling Telegram API ${method}: ${fetchError.message}`)
    return { ok: false, description: `Network error: ${fetchError.message}` }
  }
}

export async function validateBotToken(botToken: string) {
  try {
    const result = await callTelegramApi(botToken, 'getMe')
    if (result.ok) {
      return { valid: true, bot: result.result }
    }
    return { valid: false, error: result.description }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}

export async function getBotInfo(botToken: string) {
  const result = await callTelegramApi(botToken, 'getMe')
  if (!result.ok) {
    throw new Error(result.description || 'Failed to get bot info')
  }
  return result.result
}

export async function uploadStickerFile(botToken: string, userId: string, stickerPath: string, stickerFormat: string) {
  const FormData = (await import('form-data')).default
  const form = new FormData()

  const fileName = path.basename(stickerPath)
  const ext = path.extname(stickerPath).toLowerCase()

  let contentType: string
  if (ext === '.webp') contentType = 'image/webp'
  else if (ext === '.webm') contentType = 'video/webm'
  else if (ext === '.tgs') contentType = 'application/gzip'
  else contentType = 'application/octet-stream'

  const fileBuffer = fs.readFileSync(stickerPath)

  form.append('user_id', String(userId))
  form.append('sticker', fileBuffer, {
    filename: fileName,
    contentType,
    knownLength: fileBuffer.length
  })
  form.append('sticker_format', stickerFormat)

  const url = `${TELEGRAM_API_BASE}${botToken}/uploadStickerFile`
  logger.info(`Uploading sticker file: ${fileName}, format: ${stickerFormat}, size: ${fileBuffer.length} bytes`)

  return new Promise<any>((resolve, reject) => {
    const urlObj = new URL(url)

    form.submit(
      {
        protocol: urlObj.protocol as 'https:' | 'http:',
        hostname: urlObj.hostname,
        port: urlObj.port ? Number(urlObj.port) : (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST'
      },
      (err: Error | null, res: any) => {
        if (err) {
          logger.error(`Network error uploading sticker file: ${err.message}`)
          return reject(new Error(`Network error: ${err.message}`))
        }

        let responseBody = ''
        res.on('data', (chunk: Buffer) => {
          responseBody += chunk.toString()
        })

        res.on('end', () => {
          if (!responseBody || responseBody.trim() === '') {
            logger.warn(`Telegram API uploadStickerFile response (status: ${res.statusCode}): empty`)
            return reject(new Error(`Empty response from Telegram (HTTP ${res.statusCode})`))
          }

          try {
            const result = JSON.parse(responseBody)
            logger.info(`Telegram API uploadStickerFile response (status: ${res.statusCode}): ${summarizeTelegramResult(result)}`)
            if (!result.ok) {
              return reject(new Error(result.description || 'Failed to upload sticker file'))
            }
            resolve(result.result)
          } catch {
            logger.error(`Failed to parse Telegram API uploadStickerFile response (status: ${res.statusCode}, length: ${responseBody.length})`)
            return reject(new Error(`Invalid JSON response: ${responseBody.substring(0, 200)}`))
          }
        })

        res.on('error', (error: Error) => {
          reject(new Error(`Response error: ${error.message}`))
        })
      }
    )
  })
}

export async function uploadStickerBuffer(
  botToken: string,
  userId: string,
  fileName: string,
  stickerBuffer: Buffer,
  stickerFormat: string
) {
  const FormData = (await import('form-data')).default
  const form = new FormData()

  const ext = path.extname(fileName).toLowerCase()
  let contentType: string
  if (ext === '.webp') contentType = 'image/webp'
  else if (ext === '.webm') contentType = 'video/webm'
  else if (ext === '.tgs') contentType = 'application/gzip'
  else contentType = 'application/octet-stream'

  form.append('user_id', String(userId))
  form.append('sticker', stickerBuffer, {
    filename: fileName,
    contentType,
    knownLength: stickerBuffer.length
  })
  form.append('sticker_format', stickerFormat)

  const url = `${TELEGRAM_API_BASE}${botToken}/uploadStickerFile`
  logger.info(`Uploading sticker buffer: ${fileName}, format: ${stickerFormat}, size: ${stickerBuffer.length} bytes`)

  return new Promise<any>((resolve, reject) => {
    const urlObj = new URL(url)
    form.submit(
      {
        protocol: urlObj.protocol as 'https:' | 'http:',
        hostname: urlObj.hostname,
        port: urlObj.port ? Number(urlObj.port) : (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST'
      },
      (err: Error | null, res: any) => {
        if (err) {
          logger.error(`Network error uploading sticker buffer: ${err.message}`)
          return reject(new Error(`Network error: ${err.message}`))
        }

        let responseBody = ''
        res.on('data', (chunk: Buffer) => {
          responseBody += chunk.toString()
        })

        res.on('end', () => {
          if (!responseBody || responseBody.trim() === '') {
            logger.warn(`Telegram API uploadStickerFile(buffer) response (status: ${res.statusCode}): empty`)
            return reject(new Error(`Empty response from Telegram (HTTP ${res.statusCode})`))
          }
          try {
            const result = JSON.parse(responseBody)
            logger.info(`Telegram API uploadStickerFile(buffer) response (status: ${res.statusCode}): ${summarizeTelegramResult(result)}`)
            if (!result.ok) {
              return reject(new Error(result.description || 'Failed to upload sticker buffer'))
            }
            resolve(result.result)
          } catch {
            logger.error(`Failed to parse Telegram API uploadStickerFile(buffer) response (status: ${res.statusCode}, length: ${responseBody.length})`)
            return reject(new Error(`Invalid JSON response: ${responseBody.substring(0, 200)}`))
          }
        })

        res.on('error', (error: Error) => {
          reject(new Error(`Response error: ${error.message}`))
        })
      }
    )
  })
}

export async function createStickerSet(botToken: string, userId: string, name: string, title: string, stickers: any[]) {
  const result = await callTelegramApi(botToken, 'createNewStickerSet', {
    user_id: userId,
    name,
    title,
    stickers
  })
  if (!result.ok) {
    throw new Error(result.description || 'Failed to create sticker set')
  }
  return result.result
}

export async function addStickerToSet(botToken: string, userId: string, name: string, sticker: any) {
  const result = await callTelegramApi(botToken, 'addStickerToSet', {
    user_id: userId,
    name,
    sticker
  })
  if (!result.ok) {
    throw new Error(result.description || 'Failed to add sticker to set')
  }
  return result.result
}

export async function getStickerSet(botToken: string, name: string) {
  const result = await callTelegramApi(botToken, 'getStickerSet', { name })
  if (!result.ok) {
    if (result.description?.includes('STICKERSET_INVALID')) {
      return null
    }
    throw new Error(result.description || 'Failed to get sticker set')
  }
  return result.result
}

export async function batchUploadStickers(
  botToken: string,
  userId: string,
  packName: string,
  packTitle: string,
  stickerFiles: string[],
  emoji = '😊'
) {
  const results: {
    success: { fileName: string; index: number }[]
    failed: { fileName: string; index: number; error: string }[]
    packUrl: string | null
    packName: string | null
    totalCount: number
  } = {
    success: [],
    failed: [],
    packUrl: null,
    packName: null,
    totalCount: stickerFiles.length
  }

  try {
    const botInfo = await getBotInfo(botToken)
    const fullPackName = `${packName}_by_${botInfo.username}`

    logger.info(`Starting batch upload to pack: ${fullPackName}`)

    let packExists = false
    try {
      const existingPack = await getStickerSet(botToken, fullPackName)
      packExists = !!existingPack
      if (packExists) {
        logger.info(`Sticker pack already exists with ${existingPack.stickers.length} stickers`)
      }
    } catch {
      packExists = false
    }

    let uploadedCount = 0

    for (let i = 0; i < stickerFiles.length; i++) {
      const filePath = stickerFiles[i]!
      const fileName = path.basename(filePath)

      try {
        const ext = path.extname(filePath).toLowerCase()
        const stickerFormat = ext === '.webm' ? 'video' : 'static'

        const uploadedFile = await uploadStickerFile(botToken, userId, filePath, stickerFormat)

        const inputSticker = {
          sticker: uploadedFile.file_id,
          emoji_list: [emoji],
          format: stickerFormat
        }

        if (!packExists && uploadedCount === 0) {
          await createStickerSet(botToken, userId, fullPackName, packTitle, [inputSticker])
          packExists = true
          logger.info(`Created new sticker pack: ${fullPackName}`)
        } else {
          await addStickerToSet(botToken, userId, fullPackName, inputSticker)
        }

        uploadedCount++
        results.success.push({ fileName, index: i })

        if (i < stickerFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        logger.error(`Failed to upload ${fileName}: ${error.message}`)
        results.failed.push({ fileName, index: i, error: error.message })

        if (error.message.includes('too_much') || error.message.includes('TOO_MUCH')) {
          logger.warn('Sticker pack is full, stopping upload')
          break
        }
      }
    }

    results.packUrl = `https://t.me/addstickers/${fullPackName}`
    results.packName = fullPackName

    return results
  } catch (error: any) {
    logger.error(`Batch upload failed: ${error.message}`)
    throw error
  }
}

export async function batchUploadStickerBuffers(
  botToken: string,
  userId: string,
  packName: string,
  packTitle: string,
  stickers: { name: string; buffer: Buffer; format: 'static' | 'video' }[],
  emoji = '😊'
) {
  const results: {
    success: { fileName: string; index: number }[]
    failed: { fileName: string; index: number; error: string }[]
    packUrl: string | null
    packName: string | null
    totalCount: number
  } = {
    success: [],
    failed: [],
    packUrl: null,
    packName: null,
    totalCount: stickers.length
  }

  try {
    const botInfo = await getBotInfo(botToken)
    const fullPackName = `${packName}_by_${botInfo.username}`

    let packExists = false
    try {
      const existingPack = await getStickerSet(botToken, fullPackName)
      packExists = !!existingPack
    } catch {
      packExists = false
    }

    let uploadedCount = 0

    for (let i = 0; i < stickers.length; i++) {
      const sticker = stickers[i]!
      try {
        const uploadedFile = await uploadStickerBuffer(botToken, userId, sticker.name, sticker.buffer, sticker.format)
        const inputSticker = {
          sticker: uploadedFile.file_id,
          emoji_list: [emoji],
          format: sticker.format
        }

        if (!packExists && uploadedCount === 0) {
          await createStickerSet(botToken, userId, fullPackName, packTitle, [inputSticker])
          packExists = true
        } else {
          await addStickerToSet(botToken, userId, fullPackName, inputSticker)
        }

        uploadedCount++
        results.success.push({ fileName: sticker.name, index: i })

        if (i < stickers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        logger.error(`Failed to upload ${sticker.name}: ${error.message}`)
        results.failed.push({ fileName: sticker.name, index: i, error: error.message })

        if (error.message.includes('too_much') || error.message.includes('TOO_MUCH')) {
          logger.warn('Sticker pack is full, stopping upload')
          break
        }
      }
    }

    results.packUrl = `https://t.me/addstickers/${fullPackName}`
    results.packName = fullPackName
    return results
  } catch (error: any) {
    logger.error(`Batch upload failed: ${error.message}`)
    throw error
  }
}

export const telegramService = {
  validateBotToken,
  getBotInfo,
  uploadStickerFile,
  uploadStickerBuffer,
  createStickerSet,
  addStickerToSet,
  getStickerSet,
  batchUploadStickers,
  batchUploadStickerBuffers
}
