export interface ZipEntry {
  name: string
  blob: Blob
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

function dosDateTime(date: Date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f)
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, day }
}

/** deflate-raw via the native Compression Streams API — no dependency. */
async function deflateRaw(bytes: Uint8Array<ArrayBuffer>) {
  if (typeof CompressionStream === 'undefined') return null
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/**
 * Build a store-only (no compression) zip in the browser. Small payloads are
 * deflated when the platform supports it; anything else is simply stored.
 */
/** Exported for tests: builds the archive bytes without triggering a download. */
export async function buildZip(entries: ZipEntry[]) {
  const encoder = new TextEncoder()
  const now = dosDateTime(new Date())
  const chunks: Uint8Array<ArrayBuffer>[] = []
  const central: Uint8Array<ArrayBuffer>[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const raw = new Uint8Array(await entry.blob.arrayBuffer())
    const deflated = await deflateRaw(raw)
    const useDeflate = deflated !== null && deflated.length < raw.length
    const payload = useDeflate ? deflated : raw
    const checksum = crc32(raw)

    const local = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(local.buffer)
    writeUint32(localView, 0, 0x04034b50)
    writeUint16(localView, 4, 20)
    writeUint16(localView, 6, useDeflate ? 8 : 0)
    writeUint16(localView, 8, now.time)
    writeUint16(localView, 10, now.day)
    writeUint32(localView, 14, checksum)
    writeUint32(localView, 18, payload.length)
    writeUint32(localView, 22, raw.length)
    writeUint16(localView, 26, nameBytes.length)
    local.set(nameBytes, 30)

    chunks.push(local, payload)

    const dir = new Uint8Array(46 + nameBytes.length)
    const dirView = new DataView(dir.buffer)
    writeUint32(dirView, 0, 0x02014b50)
    writeUint16(dirView, 4, 20)
    writeUint16(dirView, 6, 20)
    writeUint16(dirView, 8, useDeflate ? 8 : 0)
    writeUint16(dirView, 10, now.time)
    writeUint16(dirView, 12, now.day)
    writeUint32(dirView, 16, checksum)
    writeUint32(dirView, 20, payload.length)
    writeUint32(dirView, 24, raw.length)
    writeUint16(dirView, 28, nameBytes.length)
    writeUint32(dirView, 42, offset)
    dir.set(nameBytes, 46)
    central.push(dir)

    offset += local.length + payload.length
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  writeUint32(endView, 0, 0x06054b50)
  writeUint16(endView, 8, entries.length)
  writeUint16(endView, 10, entries.length)
  writeUint32(endView, 12, centralSize)
  writeUint32(endView, 16, offset)

  return new Blob([...chunks, ...central, end], { type: 'application/zip' })
}

/** Returns false when the platform cannot build a zip (no Compression Streams). */
export function canDownloadZip() {
  return typeof CompressionStream !== 'undefined'
}

export async function downloadZip(entries: ZipEntry[], fileName: string) {
  const blob = await buildZip(entries)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
