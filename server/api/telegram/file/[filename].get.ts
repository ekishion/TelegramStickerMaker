import fs from 'fs'
import path from 'path'
import { config } from '../../../utils/config'
import { setNoStoreHeaders } from '../../../utils/httpCache'

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
  const filePath = path.join(config.paths.temp, filename)
  const resolvedPath = path.resolve(filePath)
  const tempDirResolved = path.resolve(config.paths.temp)

  if (!resolvedPath.startsWith(tempDirResolved)) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.png': 'image/png'
  }

  event.node.res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
  return sendStream(event, fs.createReadStream(filePath))
})
