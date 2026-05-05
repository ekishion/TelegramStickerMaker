import fs from 'fs'
import path from 'path'
import { config } from '../../utils/config'
import { setNoStoreHeaders } from '../../utils/httpCache'

const EXTENSIONS = new Set(['.webp', '.webm'])
const isUploadTempFile = (fileName: string) => /^upload-\d+-\d+\./i.test(fileName)

export default defineEventHandler(event => {
  setNoStoreHeaders(event)

  const tempDir = config.paths.temp
  if (!fs.existsSync(tempDir)) {
    return { files: [], total: 0 }
  }

  const files = fs
    .readdirSync(tempDir)
    .filter((file: string) => {
      const ext = path.extname(file).toLowerCase()
      if (!EXTENSIONS.has(ext)) return false
      if (isUploadTempFile(file)) return false
      return fs.statSync(path.join(tempDir, file)).isFile()
    })
    .map((file: string) => {
      const filePath = path.join(tempDir, file)
      const stats = fs.statSync(filePath)
      const ext = path.extname(file).toLowerCase()
      return {
        name: file,
        type: ext === '.webm' ? 'video' : 'static',
        size: stats.size,
        mtime: stats.mtime,
        url: `/api/telegram/file/${encodeURIComponent(file)}`
      }
    })
    .sort((a: any, b: any) => b.mtime - a.mtime)

  return { files, total: files.length }
})
