import { describe, expect, it } from 'vitest'
import { messages } from '@/locales'
import type { Locale, MessageKey } from '@/locales'
import { isMessageKey, resolveRuntimeMessage } from '@/composables/runtimeMessage'

describe('locale dictionaries', () => {
  const zhKeys = Object.keys(messages.zh).sort()
  const enKeys = Object.keys(messages.en).sort()

  it('cover exactly the same keys in zh and en', () => {
    expect(enKeys).toEqual(zhKeys)
  })

  it('have no empty or placeholder-only strings', () => {
    for (const locale of Object.keys(messages) as Locale[]) {
      for (const [key, value] of Object.entries(messages[locale])) {
        expect(value.trim(), `${locale}:${key}`).not.toBe('')
        expect(value, `${locale}:${key}`).not.toMatch(/^TODO|^FIXME/)
      }
    }
  })
})

describe('runtime message resolution', () => {
  it('translates a known message key for the active language', () => {
    expect(resolveRuntimeMessage('sys.sourceTooLarge', 'en')).toBe(messages.en['sys.sourceTooLarge'])
    expect(resolveRuntimeMessage('sys.sourceTooLarge', 'zh')).toBe(messages.zh['sys.sourceTooLarge'])
  })

  it('recognises every key the converter emits', () => {
    const emitted = [
      'sys.ffmpegLoadFailed',
      'sys.exportImageFailed',
      'sys.videoDecodeFailed',
      'sys.videoDecodeError',
      'sys.fixingWebmMeta',
      'sys.vp9Unsupported',
      'sys.canvasVideoUnsupported',
      'sys.encodingVp9',
      'sys.recordWebmFailed',
      'sys.encodingVp9Webm',
      'sys.noWebmOutput',
      'sys.convertDone',
      'sys.preprocessingFrames',
      'sys.canvasImageUnsupported',
      'sys.encodingWebm',
      'sys.ffmpegConvertFailed',
      'sys.convertingGif',
      'sys.sourceTooLarge',
      'sys.outOfMemory'
    ]
    for (const key of emitted) expect(isMessageKey(key), key).toBe(true)
  })

  it('passes raw platform messages through untouched', () => {
    expect(resolveRuntimeMessage('Aborted()', 'en')).toBe('Aborted()')
    expect(resolveRuntimeMessage('', 'zh')).toBe('')
    expect(resolveRuntimeMessage('nav.home ', 'en')).toBe('nav.home ')
  })
})

describe('converter string sources', () => {
  it('only emits message keys, never untranslated copy', async () => {
    const source = await import('node:fs/promises').then(fs =>
      fs.readFile(new URL('../app/utils/browserStickerConverter.ts', import.meta.url), 'utf8')
    )
    const stringLiterals = [...source.matchAll(/'([^'\n]*)'/g)].map(m => m[1])
    const cjk = stringLiterals.filter(value => /[\u4e00-\u9fff]/.test(value))
    expect(cjk, `untranslated literals: ${cjk.join(' | ')}`).toEqual([])
  })
})
