import path from 'path'

const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g

export function sanitizeOutputBaseName(originalFilename: string, maxLength = 40) {
  const baseName = path.basename(originalFilename, path.extname(originalFilename))
  const normalized = baseName.normalize('NFKC').trim()
  const replaced = normalized
    .replace(INVALID_FILENAME_CHARS, '_')
    .replace(/\s+/g, '_')
    .replace(/\.+$/g, '')
  const fallbackSafe = (replaced || 'sticker').slice(0, maxLength)
  const noReservedName = WINDOWS_RESERVED_NAMES.test(fallbackSafe) ? `_${fallbackSafe}` : fallbackSafe
  return noReservedName || 'sticker'
}

