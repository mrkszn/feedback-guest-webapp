import { useI18n } from '@/i18n'

export function Loading() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      <p className="text-sm text-ink-soft">{t('common.loading')}</p>
    </div>
  )
}
