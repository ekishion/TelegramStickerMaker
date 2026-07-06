import fs from 'fs'
import path from 'path'
import { Buffer } from 'node:buffer'
import { createError } from 'h3'
import { config } from './config'

const ALLOWED_STICKER_EXTENSIONS = new Set(['.webp', '.webm'])
const ALLOWED_DOWNLOAD_EXTENSIONS = new Set(['.png', '.webp', '.webm'])
const MAX_DATA_URL_BYTES = config.upload.maxFileSize

export function isPathInside(parentPath: string, childPath: string) {
  const parent = path.resolve(parentPath)
  const child = path.resolve(childPath)
  const relative = path.relative(parent, child)
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative))
}

export function resolveTempFile(filename: string, allowedExtensions = ALLOWED_DOWNLOAD_EXTENSIONS) {
  const basename = path.basename(filename)
  if (!basename || basename !== filename) return null

  const ext = path.extname(basename).toLowerCase()
  if (!allowedExtensions.has(ext)) return null

  const filePath = path.resolve(config.paths.temp, basename)
  if (!isPathInside(config.paths.temp, filePath)) return null

  return { filePath, filename: basename, ext }
}

export function resolveExistingTempFile(filename: string, allowedExtensions = ALLOWED_DOWNLOAD_EXTENSIONS) {
  const resolved = resolveTempFile(filename, allowedExtensions)
  if (!resolved) return null
  if (!fs.existsSync(resolved.filePath) || !fs.statSync(resolved.filePath).isFile()) return null
  return resolved
}

export function resolveStickerTempFile(filename: string) {
  return resolveExistingTempFile(filename, ALLOWED_STICKER_EXTENSIONS)
}

export function assertAllowedUploadPart(part: { type?: string; data?: Buffer | Uint8Array }, allowedMimeTypes = config.upload.allowedMimeTypes) {
  if (!part.data) {
    throw createError({ statusCode: 400, message: 'File data is required' })
  }

  if (part.data.length > config.upload.maxFileSize) {
    throw createError({ statusCode: 413, message: 'File is too large' })
  }

  if (part.type && !allowedMimeTypes.includes(part.type)) {
    throw createError({ statusCode: 415, message: 'Unsupported file type' })
  }
}

export function assertMaxFileCount(count: number, maxCount: number) {
  if (count > maxCount) {
    throw createError({ statusCode: 413, message: `Too many files. Maximum is ${maxCount}` })
  }
}

export function parseBoundedDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/)
  if (!match) throw createError({ statusCode: 400, message: 'Invalid data URL file payload' })

  const [, mime, rawBase64] = match
  if (!mime || !rawBase64) throw createError({ statusCode: 400, message: 'Invalid data URL file payload' })

  const base64 = rawBase64.replace(/\s/g, '')
  if (!base64) throw createError({ statusCode: 400, message: 'Invalid data URL file payload' })
  if (!config.upload.allowedMimeTypes.includes(mime)) {
    throw createError({ statusCode: 415, message: 'Unsupported file type' })
  }

  const estimatedBytes = Math.floor((base64.length * 3) / 4)
  if (estimatedBytes > MAX_DATA_URL_BYTES) {
    throw createError({ statusCode: 413, message: 'File is too large' })
  }

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > MAX_DATA_URL_BYTES) {
    throw createError({ statusCode: 413, message: 'File is too large' })
  }

  return { mime, buffer }
}
