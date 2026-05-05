import fs from 'fs'
import path from 'path'
import { Buffer } from 'node:buffer'
import { config } from '../utils/config'
import { ensureDir, safeDeleteFile } from '../utils/fileCleanup'
import { videoService } from '../services/videoService'
import { logger } from '../utils/logger'

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
  let tempPath: string | null = null
  try {
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, message: '请上传视频文件' })
    }

    const videoPart = formData.find(part => part.name === 'video')
    if (!videoPart || !videoPart.data) {
      throw createError({ statusCode: 400, message: '请上传视频文件' })
    }

    let originalFilename = videoPart.filename || 'video.mp4'
    originalFilename = fixFilenameEncoding(originalFilename)

    const ext = path.extname(originalFilename).toLowerCase() || '.mp4'
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const tempFilename = `upload-${uniqueSuffix}${ext}`
    tempPath = path.join(config.paths.temp, tempFilename)

    ensureDir(config.paths.temp)
    fs.writeFileSync(tempPath, videoPart.data)
    logger.info(`[convert-video] saved upload: ${tempFilename} (${videoPart.data.length} bytes)`)

    const result = await videoService.convertToWebm(tempPath, originalFilename, 2)
    const outputBuffer = fs.readFileSync(result.outputPath)
    const webmBase64 = outputBuffer.toString('base64')

    // 删除原始上传文件
    await safeDeleteFile(tempPath)

    return {
      success: true,
      original: {
        filename: originalFilename,
        size: videoPart.data.length
      },
      result: {
        filename: result.filename,
        width: result.width,
        height: result.height,
        duration: result.duration,
        size: result.size,
        dataUrl: `data:video/webm;base64,${webmBase64}`
      }
    }
  } catch (error: any) {
    if (tempPath) await safeDeleteFile(tempPath)
    logger.error('[convert-video] error:', error)
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, message: error.message || '视频转换失败' })
  }
})
