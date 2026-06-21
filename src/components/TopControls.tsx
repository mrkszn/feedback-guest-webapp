import { useI18n, type Locale } from '@/i18n'

const LOCALES: Locale[] = ['uk', 'en']

/** Language switch, pinned top-right across screens. */
export function TopControls() {
  const { locale, setLocale, t } = useI18n()
  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]

  return (
    <div className="pointer-events-auto absolute right-3 top-3 z-30 flex items-center gap-1.5">
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
