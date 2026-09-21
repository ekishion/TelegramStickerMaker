import type { Locale, MessageKey } from '@/locales'
import { messages } from '@/locales'
import { resolveRuntimeMessage } from './runtimeMessage'

const STORAGE_KEY = 'locale'

const isLocale = (value: unknown): value is Locale => value === 'zh' || value === 'en'

const htmlLang = (locale: Locale) => (locale === 'zh' ? 'zh-CN' : 'en')

/**
 * Runtime strings (converter progress messages and thrown errors) arrive as
 * message keys; see runtimeMessage.ts. Anything that is not a key is a raw
 * platform message and passes through untouched.
 */
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

  const tRuntime = (raw: string): string => resolveRuntimeMessage(raw, locale.value)

  return { locale, t, tRuntime, setLocale, toggleLocale }
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
