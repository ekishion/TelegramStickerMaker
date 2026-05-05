import fs from 'fs'
import path from 'path'
import { config } from '../../utils/config'
import { setNoStoreHeaders } from '../../utils/httpCache'
import { logger } from '../../utils/logger'

const CACHE_FILE_EXTENSIONS = new Set(['.png', '.webp', '.webm'])
const isUploadTempFile = (fileName: string) => /^upload-\d+-\d+\./i.test(fileName)

export default defineEventHandler(event => {
  setNoStoreHeaders(event)

  const tempDir = config.paths.temp
  if (!fs.existsSync(tempDir)) {
    return { success: true, removed: 0, files: [] as string[] }
  }

  const removedFiles: string[] = []
  const entries = fs.readdirSync(tempDir)

  for (const fileName of entries) {
    const fullPath = path.join(tempDir, fileName)
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) continue

    const ext = path.extname(fileName).toLowerCase()
    if (!CACHE_FILE_EXTENSIONS.has(ext) && !isUploadTempFile(fileName)) continue

    fs.unlinkSync(fullPath)
    removedFiles.push(fileName)
  }

  logger.info(`[cache-clear] removed ${removedFiles.length} files`)
  return { success: true, removed: removedFiles.length, files: removedFiles }
})

