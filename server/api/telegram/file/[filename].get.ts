import fs from 'fs'
import { setNoStoreHeaders } from '../../../utils/httpCache'
import { resolveTempFile } from '../../../utils/fileSecurity'

export default defineEventHandler(event => {
  setNoStoreHeaders(event)

  const rawFilename = event.context.params?.filename
  if (!rawFilename) {
    throw createError({ statusCode: 400, statusMessage: 'Missing filename' })
  }
  let filename = rawFilename
  try {
    filename = decodeURIComponent(rawFilename)
  } catch {
    filename = rawFilename
  }
  const file = resolveTempFile(filename)
  if (!file) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  if (!fs.existsSync(file.filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const mimeTypes: Record<string, string> = {
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.png': 'image/png'
  }

  event.node.res.setHeader('Content-Type', mimeTypes[file.ext] || 'application/octet-stream')
  return sendStream(event, fs.createReadStream(file.filePath))
})
