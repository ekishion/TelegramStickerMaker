import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'fs'
import path from 'path'
import { config } from '../utils/config'
import { safeDeleteFile } from '../utils/fileCleanup'
import { logger } from '../utils/logger'
import { generateTimestampHashBaseName } from '../utils/filename'

const execFileAsync = promisify(execFile)

class VideoService {
  private ffmpegAvailable: boolean | null = null

  async checkFfmpeg(): Promise<{ available: boolean; version: string | null }> {
    if (this.ffmpegAvailable !== null && this.ffmpegAvailable) {
      try {
        const { stdout } = await execFileAsync('ffmpeg', ['-version'], { timeout: 5000 })
        const match = stdout.match(/ffmpeg version (\S+)/)
        return { available: true, version: match?.[1] || 'unknown' }
      } catch {
        this.ffmpegAvailable = false
      }
    }
    try {
      const { stdout } = await execFileAsync('ffmpeg', ['-version'], { timeout: 5000 })
      const match = stdout.match(/ffmpeg version (\S+)/)
      this.ffmpegAvailable = true
      return { available: true, version: match?.[1] || 'unknown' }
    } catch {
      this.ffmpegAvailable = false
      return { available: false, version: null }
    }
  }

  async convertToWebm(
    inputPath: string,
    originalFilename: string,
    duration = 2
  ): Promise<{
    width: number
    height: number
    duration: number
    filename: string
    outputPath: string
    size: number
  }> {
    const { available } = await this.checkFfmpeg()
    if (!available) {
      throw Object.assign(new Error('系统未安装 FFmpeg，无法转换视频'), { statusCode: 500 })
    }

    const outputFilename = `${generateTimestampHashBaseName(originalFilename)}.webm`
    const outputPath = path.join(config.paths.temp, outputFilename)

    // VP9 + alpha 转码，适配 Telegram 动态贴纸
    const args = [
      '-y',
      '-i', inputPath,
      '-t', String(duration),
      '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
      '-r', '30',
      '-an',
      '-pix_fmt', 'yuva420p',
      '-c:v', 'libvpx-vp9',
      '-b:v', '256k',
      '-crf', '30',
      '-auto-alt-ref', '0',
      outputPath
    ]

    logger.info(`[video] converting: ${originalFilename} -> ${outputFilename}`)
    logger.info(`[video] ffmpeg ${args.join(' ')}`)

    try {
      const { stderr } = await execFileAsync('ffmpeg', args, { timeout: 120000 })
      logger.info(`[video] ffmpeg done, stderr: ${stderr.slice(0, 500)}`)
    } catch (e: any) {
      await safeDeleteFile(outputPath)
      logger.error('[video] ffmpeg error:', e.stderr || e.message)
      throw Object.assign(new Error(`视频转换失败: ${e.stderr?.slice(0, 200) || e.message}`), { statusCode: 500 })
    }

    // 检查输出文件
    if (!fs.existsSync(outputPath)) {
      throw Object.assign(new Error('FFmpeg 未生成输出文件'), { statusCode: 500 })
    }

    const stat = fs.statSync(outputPath)
    logger.info(`[video] output: ${outputFilename}, size: ${stat.size} bytes`)

    // 超过 256KB 则高压缩重编码
    if (stat.size > 256 * 1024) {
      logger.info('[video] output too large, re-encoding with lower bitrate...')
      const args2 = [
        '-y',
        '-i', inputPath,
        '-t', String(duration),
        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
        '-r', '30',
        '-an',
        '-pix_fmt', 'yuva420p',
        '-c:v', 'libvpx-vp9',
        '-b:v', '120k',
        '-crf', '45',
        '-auto-alt-ref', '0',
        outputPath
      ]
      try {
        await execFileAsync('ffmpeg', args2, { timeout: 120000 })
      } catch (e: any) {
        await safeDeleteFile(outputPath)
        throw Object.assign(new Error(`视频重压缩失败: ${e.stderr?.slice(0, 200) || e.message}`), { statusCode: 500 })
      }
    }

    const finalStat = fs.statSync(outputPath)
    logger.info(`[video] final size: ${finalStat.size} bytes`)

    return {
      width: 512,
      height: 512,
      duration,
      filename: outputFilename,
      outputPath,
      size: finalStat.size
    }
  }
}

export const videoService = new VideoService()
