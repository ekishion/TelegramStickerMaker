export interface CachedStickerFile {
  id: string
  name: string
  type: 'static' | 'video'
  mime: string
  size: number
  width?: number
  height?: number
  duration?: number
  createdAt: number
  blob: Blob
}

const DB_NAME = 'telegram-sticker-maker'
const DB_VERSION = 1
const STORE_NAME = 'stickers'
const MAX_CACHE_ITEMS = 180
// Real per-origin IndexedDB budgets are far below this (Firefox defaults to
// ~10% of disk with a 10MB floor; iOS Safari is tighter), so the byte budget
// is the one that actually binds — keep it reachable.
const MAX_CACHE_BYTES = 40 * 1024 * 1024

let dbPromise: Promise<IDBDatabase> | null = null

export class StickerStorageFullError extends Error {
  constructor() {
    super('storage full')
    this.name = 'StickerStorageFullError'
  }
}

function isQuotaError(error: unknown) {
  return error instanceof DOMException && error.name === 'QuotaExceededError'
}

function openDb() {
  if (!import.meta.client) return Promise.reject(new Error('IndexedDB is only available in the browser'))
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
    }
    request.onsuccess = () => {
      const db = request.result
      // A browser-closed connection must poison nothing: drop the cached
      // promise so the next call reopens instead of failing forever.
      db.onclose = () => { dbPromise = null }
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
    request.onerror = () => {
      dbPromise = null
      reject(request.error || new Error('Failed to open sticker cache'))
    }
    request.onblocked = () => {
      dbPromise = null
      reject(new Error('Sticker cache is blocked by another tab'))
    }
  })

  return dbPromise
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<any> | void) {
  const db = await openDb()
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    let result: T
    let settled = false

    const finish = (error?: unknown) => {
      if (settled) return
      settled = true
      if (error) reject(error)
      else resolve(result)
    }

    const request = run(store)
    if (request) {
      request.onsuccess = () => { result = request.result }
      request.onerror = () => finish(request.error || new Error('Sticker cache request failed'))
    }

    tx.oncomplete = () => finish()
    tx.onerror = () => finish(tx.error || new Error('Sticker cache transaction failed'))
    tx.onabort = () => finish(tx.error || new Error('Sticker cache transaction aborted'))
  })
}

export async function saveCachedSticker(input: Omit<CachedStickerFile, 'id' | 'createdAt'> & { id?: string }) {
  const record: CachedStickerFile = {
    ...input,
    id: input.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now()
  }
  try {
    await withStore('readwrite', store => store.put(record))
  } catch (error) {
    if (isQuotaError(error)) throw new StickerStorageFullError()
    throw error
  }
  await pruneCachedStickers([record.id])
  return record
}

export async function listCachedStickers() {
  const items = await withStore<CachedStickerFile[]>('readonly', store => store.getAll())
  return (items || []).sort((a, b) => b.createdAt - a.createdAt)
}

export async function getCachedSticker(id: string) {
  return await withStore<CachedStickerFile | undefined>('readonly', store => store.get(id))
}

export async function removeCachedSticker(id: string) {
  await withStore('readwrite', store => store.delete(id))
}

export async function clearCachedStickers() {
  await withStore('readwrite', store => store.clear())
}

export function createStickerObjectUrl(sticker: CachedStickerFile) {
  return URL.createObjectURL(sticker.blob)
}

/**
 * Reads the cache index only (id/size/createdAt) via a cursor walk, so blobs are
 * never materialised just to measure the cache. Kept separate from `withStore`
 * because that helper resolves with a single request's result, not a collection.
 */
async function collectCacheIndex(): Promise<{ id: string; size: number; createdAt: number }[]> {
  const db = await openDb()
  return await new Promise((resolve, reject) => {
    const collected: { id: string; size: number; createdAt: number }[] = []
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).index('createdAt').openCursor()

    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      collected.push({
        id: String(cursor.value.id),
        size: cursor.value.size || 0,
        createdAt: cursor.value.createdAt || 0
      })
      cursor.continue()
    }
    request.onerror = () => reject(request.error || new Error('Sticker cache request failed'))
    tx.onerror = () => reject(tx.error || new Error('Sticker cache transaction failed'))
    tx.onabort = () => reject(tx.error || new Error('Sticker cache transaction aborted'))
    tx.oncomplete = () => resolve(collected)
  })
}

async function pruneCachedStickers(protectedIds: string[] = []) {
  const entries = await collectCacheIndex()

  let totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
  let totalCount = entries.length
  const protectedSet = new Set(protectedIds)
  const removable = [...entries].sort((a, b) => a.createdAt - b.createdAt)

  for (const entry of removable) {
    if (totalCount <= MAX_CACHE_ITEMS && totalSize <= MAX_CACHE_BYTES) break
    if (protectedSet.has(entry.id)) continue

    await removeCachedSticker(entry.id)
    totalCount -= 1
    totalSize -= entry.size
  }
}
