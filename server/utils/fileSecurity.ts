import { Buffer } from 'node:buffer'
import { createError } from 'h3'
import { config } from './config'

export function assertAllowedUploadPart(part: { type?: string; data?: Buffer | Uint8Array }, allowedMimeTypes: string[]) {
  if (!part.data) {
    throw createError({ statusCode: 400, message: 'File data is required' })
  }

  if (part.data.length > config.upload.maxFileSize) {
    throw createError({ statusCode: 413, message: 'File is too large' })
  }

  // A part without a declared Content-Type is rejected rather than waved
  // through: the client always sets one, so a missing type means a hand-made
  // request attempting to bypass the allow-list.
  if (!part.type || !allowedMimeTypes.includes(part.type)) {
    throw createError({ statusCode: 415, message: 'Unsupported file type' })
  }
}

export function assertMaxFileCount(count: number, maxCount: number) {
  if (count > maxCount) {
    throw createError({ statusCode: 413, message: `Too many files. Maximum is ${maxCount}` })
  }
}
