import archiver from 'archiver'
import type { H3Event } from 'h3'
import path from 'path'
import { logger } from '../utils/logger'
import { ensureDir } from '../utils/fileCleanup'
import { resolveExistingTempFile } from '../utils/fileSecurity'
import { config } from '../utils/config'

export interface DownloadFile {
  url: string
  name: string
}

function safeArchiveEntryName(name: string, fallback: string) {
  const normalized = (name || fallback).replace(/\\/g, '/')
  const basename = path.posix.basename(normalized).trim()
  return basename && basename !== '.' && basename !== '..' ? basename : fallback
}

export async function batchDownload(files: DownloadFile[], event: H3Event) {
  ensureDir(config.paths.temp)

  const archive = archiver('zip', { zlib: { level: 9 } })
  let archiveError: Error | null = null

  event.node.res.setHeader('Content-Type', 'application/zip')
  event.node.res.setHeader('Content-Disposition', `attachment; filename=stickers-${Date.now()}.zip`)

  archive.on('warning', err => {
    logger.warn('Archive warning:', err)
  })

  archive.on('error', err => {
    archiveError = err
    logger.error('Archive error:', err)
    event.node.res.destroy(err)
  })

  archive.pipe(event.node.res)

  for (const requestedFile of files) {
    let filename = ''
    try {
      const urlObj = new URL(requestedFile.url, 'http://localhost')
      filename = path.basename(urlObj.pathname)
    } catch {
      filename = path.basename(requestedFile.url || '')
    }

    try {
      filename = decodeURIComponent(filename)
    } catch {
      // ignore invalid uri
    }

    if (!filename) continue

    const tempFile = resolveExistingTempFile(filename)
    if (!tempFile) {
      logger.warn('File missing or denied:', filename)
      continue
    }

    archive.file(tempFile.filePath, { name: safeArchiveEntryName(requestedFile.name, tempFile.filename) })
  }

  await archive.finalize()
  if (archiveError) throw archiveError
}
