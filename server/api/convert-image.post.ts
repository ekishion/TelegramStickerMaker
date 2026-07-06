import fs from 'fs'
import path from 'path'
import { Buffer } from 'node:buffer'
import { config } from '../utils/config'
import { ensureDir } from '../utils/fileCleanup'
import { imageService } from '../services/imageService'
import { logger } from '../utils/logger'
import { assertAllowedUploadPart } from '../utils/fileSecurity'

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function fixFilenameEncoding(filename: string): string {
  try {
    if (Array.from(filename).every(char => char.charCodeAt(0) <= 0x7f)) return filename
    if (/[\u3400-\u9fff\uf900-\ufaff]/u.test(filename)) return filename
    const decoded = Buffer.from(filename, 'latin1').toString('utf8')
    if (decoded.includes('\uFFFD')) return filename
    if (/[\u3400-\u9fff\uf900-\ufaff]/u.test(decoded)) return decoded
    return filename
  } catch {
    return filename
  }
}

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, message: '请上传图片文件' })
    }

    const imagePart = formData.find(part => part.name === 'image')
    if (!imagePart || !imagePart.data) {
      throw createError({ statusCode: 400, message: '请上传图片文件' })
    }
    assertAllowedUploadPart(imagePart, IMAGE_MIME_TYPES)

    const taskIdPart = formData.find(part => part.name === 'taskId')
    const taskId = taskIdPart?.data?.toString() || null

    let originalFilename = imagePart.filename || 'image.png'
    originalFilename = fixFilenameEncoding(originalFilename)

    const ext = path.extname(originalFilename).toLowerCase() || '.png'
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const tempFilename = `upload-${uniqueSuffix}${ext}`
    const tempPath = path.join(config.paths.temp, tempFilename)

    ensureDir(config.paths.temp)
    fs.writeFileSync(tempPath, imagePart.data)

    const result = await imageService.convertToSticker(tempPath, originalFilename)
    const pngPath = path.join(config.paths.temp, result.result.png.filename)
    const webpPath = path.join(config.paths.temp, result.result.webp.filename)
    const pngBase64 = fs.readFileSync(pngPath).toString('base64')
    const webpBase64 = fs.readFileSync(webpPath).toString('base64')

    return {
      success: true,
      taskId,
      original: {
        ...result.original,
        size: imagePart.data.length
      },
      result: {
        ...result.result,
        png: {
          ...result.result.png,
          dataUrl: `data:image/png;base64,${pngBase64}`
        },
        webp: {
          ...result.result.webp,
          dataUrl: `data:image/webp;base64,${webpBase64}`
        }
      }
    }
  } catch (error: any) {
    logger.error('Image conversion error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || 'Image conversion failed' })
  }
})
