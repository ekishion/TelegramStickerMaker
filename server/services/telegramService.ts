import path from 'path'
import { createError } from 'h3'
import { logger } from '../utils/logger'

const TELEGRAM_API_BASE = 'https://api.telegram.org'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 600

/**
 * Bot tokens are `<bot_id>:<35 url-safe chars>`. Validating the shape before it
 * is interpolated into a URL is what keeps a hostile value (e.g. one containing
 * `@evil.host`) from redirecting sticker bytes to another server.
 */
export const BOT_TOKEN_PATTERN = /^\d{5,12}:[A-Za-z0-9_-]{30,50}$/

export function assertBotToken(botToken: unknown): string {
  const token = typeof botToken === 'string' ? botToken.trim() : ''
  if (!BOT_TOKEN_PATTERN.test(token)) {
    throw createError({ statusCode: 400, message: 'Bot token format is invalid' })
  }
  return token
}

function telegramUrl(botToken: string, method: string) {
  return `${TELEGRAM_API_BASE}/bot${encodeURIComponent(botToken)}/${method}`
}

function summarizeTelegramResult(result: any) {
  if (!result || typeof result !== 'object') return 'invalid'
  if (result.ok) return 'ok'
  return `error: ${String(result.description || 'unknown').slice(0, 200)}`
}

function isRetryableError(error: any) {
  const status = Number(error?.status || error?.statusCode || 0)
  if (status === 429 || status >= 500) return true
  const message = String(error?.message || '')
  return /network|fetch failed|timeout|aborted|ECONNRESET|EAI_AGAIN|socket hang up/i.test(message)
}

function retryDelaySeconds(error: any) {
  const retryAfter = Number(error?.retryAfter || error?.parameters?.retry_after || 0)
  return retryAfter > 0 ? retryAfter * 1000 : 0
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
    if (parsed && parsed.ok === false) {
      // Surface the HTTP status so the retry policy can see 429/5xx.
      const error: any = new Error(parsed.description || `Telegram API ${method} failed`)
      error.status = response.status
      error.retryAfter = parsed.parameters?.retry_after
      error.payload = parsed
      throw error
    }
    return parsed
  } catch (parseError: any) {
    if (parseError?.status) throw parseError
    logger.error(`Failed to parse Telegram API response for ${method} (status: ${response.status}, length: ${responseText.length})`)
    return { ok: false, description: `Invalid JSON response from Telegram: ${responseText.substring(0, 200)}` }
  }
}

async function withRetry<T>(label: string, run: () => Promise<T>): Promise<T> {
  let lastError: any
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await run()
    } catch (error: any) {
      lastError = error
      if (attempt === MAX_ATTEMPTS || !isRetryableError(error)) throw error
      const backoff = retryDelaySeconds(error) || RETRY_BASE_DELAY_MS * attempt
      logger.warn(`${label} failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${backoff}ms: ${error.message}`)
      await new Promise(resolve => setTimeout(resolve, backoff))
    }
  }
  throw lastError
}

async function callTelegramApi(botToken: string, method: string, params: Record<string, any> = {}) {
  return await withRetry(`Telegram API ${method}`, async () => {
    try {
      const response = await fetch(telegramUrl(botToken, method), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
      return await parseResponse(response, method)
    } catch (fetchError: any) {
      if (fetchError?.name === 'TimeoutError') {
        const timeoutError: any = new Error(`Telegram API ${method} timed out after ${REQUEST_TIMEOUT_MS}ms`)
        timeoutError.status = 504
        throw timeoutError
      }
      const networkError: any = new Error(`Network error: ${fetchError.message}`)
      networkError.status = 503
      throw networkError
    }
  })
}

function stickerContentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === '.webp') return 'image/webp'
  if (ext === '.webm') return 'video/webm'
  if (ext === '.tgs') return 'application/gzip'
  return 'application/octet-stream'
}

export async function uploadStickerBuffer(
  botToken: string,
  userId: string,
  fileName: string,
  stickerBuffer: Buffer,
  stickerFormat: string
) {
  return await withRetry(`uploadStickerFile ${fileName}`, async () => {
    const form = new FormData()
    form.append('user_id', String(userId))
    // Uint8Array.from() copies into a plain ArrayBuffer-backed view, which the
    // DOM File/Blob typings accept (a Node Buffer's buffer is ArrayBufferLike).
    form.append('sticker', new File([Uint8Array.from(stickerBuffer)], fileName, { type: stickerContentType(fileName) }))
    form.append('sticker_format', stickerFormat)

    try {
      const response = await fetch(telegramUrl(botToken, 'uploadStickerFile'), {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
      return await parseResponse(response, 'uploadStickerFile')
    } catch (fetchError: any) {
      if (fetchError?.name === 'TimeoutError') {
        const timeoutError: any = new Error(`uploadStickerFile timed out after ${REQUEST_TIMEOUT_MS}ms`)
        timeoutError.status = 504
        throw timeoutError
      }
      const networkError: any = new Error(`Network error: ${fetchError.message}`)
      networkError.status = 503
      throw networkError
    }
  })
}

export async function validateBotToken(botToken: string) {
  try {
    const result = await callTelegramApi(assertBotToken(botToken), 'getMe')
    if (result.ok) {
      return { valid: true, bot: result.result }
    }
    return { valid: false, error: result.description }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}

export async function getBotInfo(botToken: string) {
  const result = await callTelegramApi(assertBotToken(botToken), 'getMe')
  if (!result.ok) {
    throw new Error(result.description || 'Failed to get bot info')
  }
  return result.result
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

export interface BatchStickerInput {
  name: string
  buffer: Buffer
  format: 'static' | 'video'
  emojis?: string[]
}

export interface BatchUploadResult {
  success: { fileName: string; index: number }[]
  failed: { fileName: string; index: number; error: string }[]
  packUrl: string | null
  packName: string | null
  totalCount: number
}

export async function batchUploadStickerBuffers(
  botToken: string,
  userId: string,
  packName: string,
  packTitle: string,
  stickers: BatchStickerInput[],
  emoji = '😊'
): Promise<BatchUploadResult> {
  const results: BatchUploadResult = {
    success: [],
    failed: [],
    packUrl: null,
    packName: null,
    totalCount: stickers.length
  }

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

  for (let i = 0; i < stickers.length; i++) {
    const sticker = stickers[i]!
    try {
      const uploadedFile = await uploadStickerBuffer(botToken, userId, sticker.name, sticker.buffer, sticker.format)
      const emojiList = sticker.emojis?.length ? sticker.emojis : [emoji]
      const inputSticker = {
        sticker: uploadedFile.file_id,
        emoji_list: emojiList,
        format: sticker.format
      }

      if (!packExists) {
        await createStickerSet(botToken, userId, fullPackName, packTitle, [inputSticker])
        packExists = true
        logger.info(`Created new sticker pack: ${fullPackName}`)
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

      // Pack creation is all-or-nothing: retrying it for every remaining
      // sticker would repeat the same failure, so stop the batch instead.
      if (!packExists) {
        logger.error('Sticker pack could not be created, aborting batch upload')
        results.failed.push({ fileName: '(pack)', index: -1, error: error.message })
        break
      }

      if (error.message.includes('too_much') || error.message.includes('TOO_MUCH')) {
        logger.warn('Sticker pack is full, stopping upload')
        break
      }
    }
  }

  if (results.success.length > 0) {
    results.packUrl = `https://t.me/addstickers/${fullPackName}`
    results.packName = fullPackName
  }

  return results
}

export const telegramService = {
  validateBotToken,
  getBotInfo,
  uploadStickerBuffer,
  createStickerSet,
  addStickerToSet,
  getStickerSet,
  batchUploadStickerBuffers
}
