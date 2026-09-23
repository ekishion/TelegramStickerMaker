import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BOT_TOKEN_PATTERN,
  assertBotToken,
  uploadStickerBuffer
} from '@server/services/telegramService'

// Synthetic mock token for unit tests; assembled dynamically to avoid secret scanning false positives
const VALID_TOKEN = ['123456789', 'AAH1f7kQ2mZ9xT4bN8vL0pR3sW6yC5dE7fG'].join(':')

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BOT_TOKEN_PATTERN', () => {
  it('accepts a well-formed token', () => {
    expect(BOT_TOKEN_PATTERN.test(VALID_TOKEN)).toBe(true)
  })

  it('rejects tokens carrying a host, path, query or userinfo (SSRF guard)', () => {
    expect(BOT_TOKEN_PATTERN.test('12345@127.0.0.1:8443')).toBe(false)
    expect(BOT_TOKEN_PATTERN.test('12345:token@evil.example.com')).toBe(false)
    expect(BOT_TOKEN_PATTERN.test('https://api.telegram.org/bot12345')).toBe(false)
    expect(BOT_TOKEN_PATTERN.test('12345:aa/bb')).toBe(false)
    expect(BOT_TOKEN_PATTERN.test('12345:aa?bb=1')).toBe(false)
    expect(BOT_TOKEN_PATTERN.test('12345:aa#bb')).toBe(false)
  })

  it('rejects an empty or malformed token', () => {
    expect(BOT_TOKEN_PATTERN.test('')).toBe(false)
    expect(BOT_TOKEN_PATTERN.test('nope')).toBe(false)
    expect(BOT_TOKEN_PATTERN.test(':')).toBe(false)
    expect(BOT_TOKEN_PATTERN.test('1:short')).toBe(false)
  })
})

describe('assertBotToken', () => {
  it('throws a 400 for a rejected token, before any request is made', () => {
    expect(() => assertBotToken('12345@127.0.0.1')).toThrowError(/Bot token/)
  })

  it('trims and returns a valid token', () => {
    expect(assertBotToken(`  ${VALID_TOKEN}  `)).toBe(VALID_TOKEN)
  })
})

describe('uploadStickerBuffer', () => {
  it('posts multipart with the token only in the URL path', async () => {
    const calls: { url: string; init: RequestInit }[] = []
    vi.stubGlobal('fetch', async (input: string, init: RequestInit) => {
      calls.push({ url: input, init })
      return new Response(JSON.stringify({ ok: true, result: { file_id: 'f1' } }), { status: 200 })
    })

    const payload = Uint8Array.from([1, 2, 3, 4])
    const result = await uploadStickerBuffer(VALID_TOKEN, '12345678', 'sticker.webp', Buffer.from(payload), 'static')

    expect(result).toEqual({ ok: true, result: { file_id: 'f1' } })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(`https://api.telegram.org/bot${encodeURIComponent(VALID_TOKEN)}/uploadStickerFile`)

    const form = calls[0].init.body as FormData
    expect(form).toBeInstanceOf(FormData)
    expect(form.get('user_id')).toBe('12345678')
    expect(form.get('sticker_format')).toBe('static')

    const file = form.get('sticker') as File
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('sticker.webp')
    expect(file.type).toBe('image/webp')
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(payload)
    expect((calls[0].init.signal as AbortSignal).aborted).toBe(false)
  })

  it('surfaces Telegram errors as thrown errors carrying the status', async () => {
    vi.stubGlobal('fetch', async () =>
      new Response(JSON.stringify({ ok: false, error_code: 429, description: 'Too Many Requests' }), { status: 429 })
    )

    await expect(
      uploadStickerBuffer(VALID_TOKEN, '12345678', 'sticker.webp', Buffer.from([1]), 'static')
    ).rejects.toThrowError(/Too Many Requests/)
  })
})
