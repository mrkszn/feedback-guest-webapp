import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { uk } from './dicts/uk'
import { en } from './dicts/en'

export type Locale = 'uk' | 'en'
export type TKey = keyof typeof uk

const DICTS: Record<Locale, Record<TKey, string>> = { uk, en }
const STORAGE_KEY = 'guest.locale'

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'uk' || stored === 'en') return stored
  // autodetect by navigator.language; default uk, second en
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'uk'
}

type Vars = Record<string, string | number>

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TKey, vars?: Vars) => string
  /** Pick the *_uk / *_en field for the active locale from a content object. */
  pick: <T extends object>(obj: T, base: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  )
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l
  }, [])

  const t = useCallback(
    (key: TKey, vars?: Vars) => interpolate(DICTS[locale][key] ?? key, vars),
    [locale],
  )

  const pick = useCallback(
    <T extends object>(obj: T, base: string): string => {
      const rec = obj as Record<string, unknown>
      const v = rec[`${base}_${locale}`]
      if (typeof v === 'string') return v
      const fallback = rec[`${base}_uk`] ?? rec[`${base}_en`]
      return typeof fallback === 'string' ? fallback : ''
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, pick }),
    [locale, setLocale, t, pick],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
