import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { answerDig, startDig, uploadVoice } from '@/api/guest'
import { getSessionId } from '@/auth/token'
import { useSession, WEAK_THRESHOLD } from '@/state/session'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { AppShell } from '@/components/AppShell'
import { Loading } from '@/components/Loading'
import type { Dig as DigType } from '@/api/types'

type Phase = 'loading' | 'guessing' | 'ownwords'

export function Dig() {
  const navigate = useNavigate()
  const { t, pick } = useI18n()
  const { show } = useToast()
  const { status, beats, states, load } = useSession()
  const recorder = useVoiceRecorder()

  // Weak beats, derived reactively so it settles once the session loads.
  const weak = useMemo(
    () =>
      beats
        .filter((b) => {
          const s = states[b.id]
          return s && !s.skipped && typeof s.score === 'number' && s.score <= WEAK_THRESHOLD
        })
        .map((b) => b.id),
    [beats, states],
  )
  const [cursor, setCursor] = useState(0)
  const [dig, setDig] = useState<DigType | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [busy, setBusy] = useState(false)
  const [text, setText] = useState('')
  const startedFor = useRef<string | null>(null)

  useEffect(() => {
    if (status === 'idle') load()
  }, [status, load])

  const finish = useCallback(() => navigate('/final', { replace: true }), [navigate])

  // Kick off a dig for the current weak beat.
  useEffect(() => {
    if (status !== 'ready') return
    if (weak.length === 0) {
      finish()
      return
    }
    const beatId = weak[cursor]
    if (!beatId) {
      finish()
      return
    }
    if (startedFor.current === `${cursor}:${beatId}`) return
    startedFor.current = `${cursor}:${beatId}`

    const sessionId = getSessionId()
    if (!sessionId) return
    let cancelled = false
    setPhase('loading')
    startDig(sessionId, beatId)
      .then((d) => {
        if (cancelled) return
        setDig(d)
        setPhase('guessing')
      })
      .catch(() => {
        if (cancelled) return
        show(t('toast.error'), 'error')
        advanceBeat()
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, weak, cursor])

  const advanceBeat = useCallback(() => {
    setText('')
    recorder.reset()
    setDig(null)
    if (cursor + 1 < weak.length) setCursor((c) => c + 1)
    else finish()
  }, [cursor, weak.length, recorder, finish])

  const handleResponse = useCallback(
    (res: { next_dig?: DigType; done?: boolean }) => {
      setBusy(false)
      if (res.next_dig) {
        setText('')
        recorder.reset()
        setDig(res.next_dig)
        setPhase('guessing')
      } else {
        advanceBeat()
      }
    },
    [advanceBeat, recorder],
  )

  const submit = useCallback(
    async (payload: { accepted_guess_id?: string; free_text?: string; voice_object_key?: string }) => {
      const sessionId = getSessionId()
      if (!sessionId || !dig) return
      setBusy(true)
      try {
        const res = await answerDig(sessionId, { dig_id: dig.dig_id, ...payload })
        handleResponse(res)
      } catch {
        show(t('toast.error'), 'error')
        setBusy(false)
      }
    },
    [dig, handleResponse, show, t],
  )

  const sendOwnWords = useCallback(async () => {
    const sessionId = getSessionId()
    if (!sessionId || !dig) return
    // Need at least a recording or some text.
    if (!recorder.blob && !text.trim()) return
    setBusy(true)
    try {
      const payload = recorder.blob
        ? { voice_object_key: (await uploadVoice(sessionId, recorder.blob)).object_key }
        : { free_text: text.trim() }
      const res = await answerDig(sessionId, { dig_id: dig.dig_id, ...payload })
      handleResponse(res)
    } catch {
      show(t('toast.error'), 'error')
      setBusy(false)
    }
  }, [recorder.blob, text, dig, handleResponse, show, t])

  if (status !== 'ready' || phase === 'loading') return <Loading />

  const beat = beats.find((b) => b.id === weak[cursor])

  return (
    <AppShell>
      <div className="flex flex-1 flex-col justify-center gap-8 px-6 py-16">
        {beat && (
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-3xl" aria-hidden>
              {beat.icon}
            </span>
            <h2 className="text-lg font-semibold text-ink">{pick(beat, 'label')}</h2>
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === 'ownwords' ? (
            <motion.div
              key="ownwords"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('dig.text.placeholder')}
                rows={3}
                className="focus-ring resize-none rounded-2xl bg-surface-soft px-4 py-3 text-ink ring-1 ring-black/5"
              />

              {recorder.supported && (
                <div className="flex items-center gap-2">
                  {recorder.state === 'recording' ? (
                    <button
                      type="button"
                      onClick={recorder.stop}
                      className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 font-medium text-white"
                    >
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                      {t('dig.record.stop')}
                    </button>
                  ) : recorder.state === 'recorded' ? (
                    <button
                      type="button"
                      onClick={recorder.reset}
                      className="focus-ring flex-1 rounded-xl bg-surface-raised px-4 py-3 font-medium text-ink ring-1 ring-black/5"
                    >
                      🎙️ {t('dig.record.again')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={recorder.start}
                      className="focus-ring flex-1 rounded-xl bg-surface-raised px-4 py-3 font-medium text-ink ring-1 ring-black/5"
                    >
                      🎙️ {t('dig.record.start')}
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={sendOwnWords}
                className="focus-ring rounded-xl bg-accent px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {t('dig.send')}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={dig?.dig_id ?? 'guesses'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-3"
            >
              {/* Guess "cards" — not chat bubbles. Tap a card to confirm. */}
              {dig?.guesses.map((g, i) => (
                <motion.button
                  key={g.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  disabled={busy}
                  onClick={() => submit({ accepted_guess_id: g.id })}
                  className="focus-ring flex items-center gap-3 rounded-2xl bg-surface-raised px-5 py-4 text-left shadow-sm ring-1 ring-black/5 transition active:scale-[0.98] disabled:opacity-60"
                >
                  <span className="text-2xl" aria-hidden>
                    {g.emoji}
                  </span>
                  <span className="font-medium text-ink">{pick(g, 'text')}</span>
                </motion.button>
              ))}

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => submit({})}
                  className="focus-ring flex-1 rounded-xl px-4 py-3 text-sm font-medium text-ink-soft ring-1 ring-black/5 transition hover:text-ink disabled:opacity-60"
                >
                  {t('dig.notquite')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPhase('ownwords')}
                  className="focus-ring flex-1 rounded-xl px-4 py-3 text-sm font-medium text-ink-soft ring-1 ring-black/5 transition hover:text-ink disabled:opacity-60"
                >
                  {t('dig.ownwords')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

export default Dig
