import type { Locale, MessageKey } from '@/locales'
import { messages } from '@/locales'

/**
 * Runtime strings surfaced from utils (converter progress messages and thrown
 * errors) are authored as message keys, e.g. 'sys.videoDecodeFailed'. Keeping
 * the lookup key-based — instead of matching back the zh copy — means editing a
 * zh string can never silently break English.
 */
const messageKeys = new Set<string>(Object.keys(messages.zh))

export const isMessageKey = (raw: string): raw is MessageKey => messageKeys.has(raw)

/**
 * Resolves a runtime string for a language: known keys are translated, anything
 * else (raw WebCodecs/ffmpeg output) passes through untouched.
 */
export function resolveRuntimeMessage(raw: string, locale: Locale): string {
  if (!isMessageKey(raw)) return raw
  return messages[locale][raw] ?? messages.zh[raw] ?? raw
}
