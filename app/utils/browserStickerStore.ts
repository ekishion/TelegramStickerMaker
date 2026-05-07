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

let dbPromise: Promise<IDBDatabase> | null = null

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
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Failed to open sticker cache'))
  })

  return dbPromise
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void) {
  const db = await openDb()
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const request = run(store)
    let result: T

    if (request) {
      request.onsuccess = () => { result = request.result }
      request.onerror = () => reject(request.error || new Error('Sticker cache request failed'))
    }

    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error || new Error('Sticker cache transaction failed'))
  })
}

export async function saveCachedSticker(input: Omit<CachedStickerFile, 'id' | 'createdAt'> & { id?: string }) {
  const record: CachedStickerFile = {
    ...input,
    id: input.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now()
  }
  await withStore('readwrite', store => store.put(record))
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
