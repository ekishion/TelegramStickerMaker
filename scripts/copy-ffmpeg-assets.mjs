import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const sourceDir = join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm')
const targetDir = join(root, 'public', 'vendor', 'ffmpeg', 'esm')

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm']

if (!existsSync(sourceDir)) {
  console.warn('[ffmpeg] @ffmpeg/core assets not found, skipping copy')
  process.exit(0)
}

mkdirSync(targetDir, { recursive: true })

for (const file of files) {
  const source = join(sourceDir, file)
  if (!existsSync(source)) {
    console.warn(`[ffmpeg] missing ${file}, skipping`)
    continue
  }
  copyFileSync(source, join(targetDir, file))
}

console.log(`[ffmpeg] copied assets to ${targetDir}`)
