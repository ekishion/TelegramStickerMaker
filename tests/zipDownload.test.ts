import { describe, expect, it } from 'vitest'
import { buildZip } from '@/utils/zipDownload'

/** Minimal local-file-header + central-directory walker, independent of the builder. */
function readZipEntries(zip: Uint8Array) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength)
  const decoder = new TextDecoder()

  // Find the end-of-central-directory record (signature 0x06054b50).
  let eocd = -1
  for (let i = zip.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('no EOCD record')

  const entryCount = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const entries: { name: string; crc: number; compressedSize: number; rawSize: number }[] = []

  for (let index = 0; index < entryCount; index++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('no central header at ' + offset)
    const crc = view.getUint32(offset + 16, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const rawSize = view.getUint32(offset + 24, true)
    const nameLength = view.getUint16(offset + 28, true)
    const name = decoder.decode(zip.subarray(offset + 46, offset + 46 + nameLength))
    entries.push({ name, crc, compressedSize, rawSize })
    offset += 46 + nameLength + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true)
  }

  return entries
}

// CRC32 is deterministic and cheap to recompute for the test payloads.
function crc32(bytes: Uint8Array) {
  let crc = -1
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ -1) >>> 0
}

const asBytes = (text: string) => new Uint8Array([...text].map(char => char.charCodeAt(0)))

async function zipToBytes(zip: Blob) {
  return new Uint8Array(await zip.arrayBuffer())
}

describe('buildZip', () => {
  it('produces a valid archive with matching names and CRCs', async () => {
    const payloadA = asBytes('alpha sticker payload')
    const payloadB = asBytes('beta sticker payload, a bit longer')

    const zip = await buildZip([
      { name: 'alpha.webp', blob: new Blob([payloadA]) },
      { name: 'beta.webp', blob: new Blob([payloadB]) }
    ])
    const entries = readZipEntries(await zipToBytes(zip))

    expect(entries.map(entry => entry.name)).toEqual(['alpha.webp', 'beta.webp'])
    expect(entries[0].crc).toBe(crc32(payloadA))
    expect(entries[1].crc).toBe(crc32(payloadB))
    expect(entries[0].rawSize).toBe(payloadA.length)
  })

  it('keeps empty entries addressable', async () => {
    const zip = await buildZip([{ name: 'empty.webp', blob: new Blob([new Uint8Array()]) }])
    const entries = readZipEntries(await zipToBytes(zip))
    expect(entries).toHaveLength(1)
    expect(entries[0].rawSize).toBe(0)
  })
})
