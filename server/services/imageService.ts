import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { config } from '../utils/config'
import { logger } from '../utils/logger'
import { safeDeleteFile } from '../utils/fileCleanup'
import { generateTimestampHashBaseName } from '../utils/filename'

export class ImageService {
  calculateDimensions(width: number, height: number) {
    const maxSize = config.sticker.maxSize
    let newWidth: number, newHeight: number

    if (width >= height) {
      newWidth = maxSize
      newHeight = Math.round((height / width) * maxSize)
    } else {
      newHeight = maxSize
      newWidth = Math.round((width / height) * maxSize)
    }

    return { newWidth, newHeight }
  }

  async convertToSticker(inputPath: string, originalFilename: string) {
    try {
      const metadata = await sharp(inputPath).metadata()
      const originalWidth = metadata.width || 0
      const originalHeight = metadata.height || 0

      const { newWidth, newHeight } = this.calculateDimensions(originalWidth, originalHeight)

      const outputBaseName = generateTimestampHashBaseName(originalFilename)
      const pngPath = path.join(config.paths.temp, `${outputBaseName}.png`)
      const webpPath = path.join(config.paths.temp, `${outputBaseName}.webp`)

      await sharp(inputPath)
        .resize(newWidth, newHeight, { fit: 'fill' })
        .png({ compressionLevel: config.sticker.imageQuality.png })
        .toFile(pngPath)

      await sharp(inputPath)
        .resize(newWidth, newHeight, { fit: 'fill' })
        .webp({ quality: config.sticker.imageQuality.webp })
        .toFile(webpPath)

      const pngStats = fs.statSync(pngPath)
      const webpStats = fs.statSync(webpPath)

      safeDeleteFile(inputPath)

      logger.info(`Image converted: ${originalFilename} -> PNG: ${pngStats.size}, WEBP: ${webpStats.size}`)

      return {
        original: { width: originalWidth, height: originalHeight },
        result: {
          width: newWidth,
          height: newHeight,
          png: {
            filename: `${outputBaseName}.png`,
            size: pngStats.size
          },
          webp: {
            filename: `${outputBaseName}.webp`,
            size: webpStats.size
          }
        }
      }
    } catch (error) {
      safeDeleteFile(inputPath)
      logger.error('Image conversion failed:', error)
      throw error
    }
  }
}

export const imageService = new ImageService()
