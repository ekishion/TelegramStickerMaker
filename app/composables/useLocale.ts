import type { Locale, MessageKey } from '@/locales'
import { messages } from '@/locales'

const STORAGE_KEY = 'locale'

const isLocale = (value: unknown): value is Locale => value === 'zh' || value === 'en'

const htmlLang = (locale: Locale) => (locale === 'zh' ? 'zh-CN' : 'en')

/**
 * Runtime strings thrown by utils are authored as the zh dictionary values.
 * Match them back to their key so the active language wins; anything unknown
 * passes through untouched.
 */
const sysReverse = new Map<string, MessageKey>(
  Object.entries(messages.zh)
    .filter(([key]) => key.startsWith('sys.'))
    .map(([key, value]) => [value as string, key as MessageKey])
)

export function useLocale() {
  // useState keeps the value per SSR request and shared across client navigations
  const locale = useState<Locale>('locale', () => 'zh')

  const t = (key: MessageKey, vars?: Record<string, string | number>): string => {
    const dict = messages[locale.value] || messages.zh
    let text: string = dict[key] ?? messages.zh[key] ?? key

    if (vars) {
      for (const name of Object.keys(vars)) {
        text = text.replaceAll(`{${name}}`, String(vars[name]))
      }
    }

    if (import.meta.dev && !dict[key]) {
      console.warn(`[i18n] missing key "${key}" for locale "${locale.value}"`)
    }

    return text
  }

  const setLocale = (next: Locale) => {
    locale.value = next
    if (!import.meta.client) return

    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}

    document.documentElement.lang = htmlLang(next)
  }

  const toggleLocale = () => setLocale(locale.value === 'zh' ? 'en' : 'zh')

  const tRaw = (raw: string): string => {
    const key = sysReverse.get(raw)
    return key ? t(key) : raw
  }

  return { locale, t, tRaw, setLocale, toggleLocale }
}

/**
 * Restores the saved language once, from the layout's onMounted (post-hydration):
 * the server always renders zh, so switching here avoids hydration mismatches.
 */
export function initLocaleFromStorage() {
  const { locale, setLocale } = useLocale()

  let saved: string | null = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {}

  if (isLocale(saved) && saved !== locale.value) setLocale(saved)
}
