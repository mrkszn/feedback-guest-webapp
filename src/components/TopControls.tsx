import { useI18n, type Locale, type TKey } from '@/i18n'
import { useTheme, type ThemePref } from '@/hooks/useTheme'

const LOCALES: Locale[] = ['uk', 'en']
const THEME_ORDER: ThemePref[] = ['system', 'light', 'dark']
const THEME_ICON: Record<ThemePref, string> = {
  system: '🖥️',
  light: '☀️',
  dark: '🌙',
}
const THEME_LABEL: Record<ThemePref, TKey> = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
}

/** Language + theme controls, pinned top-right across screens. */
export function TopControls() {
  const { locale, setLocale, t } = useI18n()
  const { pref, setPref } = useTheme()

  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(pref) + 1) % THEME_ORDER.length]

  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-30 flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setPref(nextTheme)}
        aria-label={t(THEME_LABEL[pref])}
        title={t(THEME_LABEL[pref])}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised/80 text-base shadow-sm ring-1 ring-black/5 backdrop-blur"
      >
        {THEME_ICON[pref]}
      </button>
      <button
        type="button"
        onClick={() => setLocale(nextLocale)}
        aria-label={t('lang.switch')}
        className="focus-ring flex h-9 items-center justify-center rounded-full bg-surface-raised/80 px-3 text-xs font-semibold uppercase tracking-wide text-ink shadow-sm ring-1 ring-black/5 backdrop-blur"
      >
        {locale}
      </button>
    </div>
  )
}
