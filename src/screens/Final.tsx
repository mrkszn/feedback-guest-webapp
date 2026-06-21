import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { finalizeSession } from '@/api/guest'
import { getSessionId } from '@/auth/token'
import { useSession } from '@/state/session'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { AppShell } from '@/components/AppShell'
import { Loading } from '@/components/Loading'
import { MoodCurve } from '@/components/MoodCurve'
import { renderCurveToBlob } from '@/lib/shareCard'

export function Final() {
  const { t } = useI18n()
  const { show } = useToast()
  const { status, beats, load, beatState, weakBeatIds } = useSession()
  const [email, setEmail] = useState('')
  const finalized = useRef(false)

  useEffect(() => {
    if (status === 'idle') load()
  }, [status, load])

  // Fire finalize once; the final view is shown regardless (non-blocking).
  useEffect(() => {
    if (finalized.current) return
    const sessionId = getSessionId()
    if (!sessionId) return
    finalized.current = true
    finalizeSession(sessionId).catch(() => {
      /* backend kicks off analyze/card async; a failure here is non-fatal */
    })
  }, [])

  const canShare = typeof navigator.share === 'function'

  const share = async () => {
    const scoreOf = (id: string) => {
      const s = beatState(id)
      return typeof s.score === 'number' ? s.score : 3
    }
    try {
      const blob = await renderCurveToBlob(beats, scoreOf, t('final.share.text'))
      const file = blob ? new File([blob], 'evening.png', { type: 'image/png' }) : null
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: t('final.share.text') })
      } else {
        await navigator.share({ text: t('final.share.text') })
      }
    } catch {
      /* user dismissed the share sheet — ignore */
    }
  }

  if (status !== 'ready') return <Loading />

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="text-6xl"
          aria-hidden
        >
          🎉
        </motion.div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-ink">{t('final.title')}</h1>
          <p className="text-ink-soft">{t('final.subtitle')}</p>
        </div>

        <div className="rounded-3xl bg-surface-raised/70 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <MoodCurve beats={beats} weakIds={weakBeatIds()} pinned />
        </div>

        {/* Discount email — placeholder, no backend wiring yet. */}
        <div className="flex flex-col gap-2 text-left">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoCapitalize="off"
            placeholder={t('final.email.placeholder')}
            className="focus-ring rounded-xl bg-surface-soft px-4 py-3 text-ink ring-1 ring-black/5"
          />
          <button
            type="button"
            onClick={() => show(t('toast.saved'), 'success')}
            className="focus-ring rounded-xl bg-surface-raised px-4 py-3 text-sm font-medium text-ink ring-1 ring-black/5"
          >
            {t('final.email.cta')}
          </button>
          <p className="px-1 text-xs text-ink-faint">{t('final.email.note')}</p>
        </div>

        {canShare && (
          <button
            type="button"
            onClick={share}
            className="focus-ring rounded-2xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-md transition active:scale-[0.98]"
          >
            {t('final.share')}
          </button>
        )}
      </div>
    </AppShell>
  )
}

export default Final
