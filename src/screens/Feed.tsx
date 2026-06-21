import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSession } from '@/state/session'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { useHaptics } from '@/hooks/useHaptics'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { sceneFor } from '@/theme/scenes'
import { AppShell } from '@/components/AppShell'
import { Loading } from '@/components/Loading'
import { BeatInput } from '@/components/BeatInput'

export function Feed() {
  const navigate = useNavigate()
  const { t, pick } = useI18n()
  const { show } = useToast()
  const { impact } = useHaptics()
  const reduced = useReducedMotion()
  const { status, beats, load, skip, saveError } = useSession()

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (status === 'idle') load()
  }, [status, load])

  // Surface persisted-save failures as a toast (autosave retries already ran).
  useEffect(() => {
    if (saveError) show(t('toast.network'), 'error')
  }, [saveError, show, t])

  const total = beats.length
  const scene = total ? sceneFor(index, total) : sceneFor(0, 1)

  const goTo = useCallback(
    (i: number) => {
      const el = scrollerRef.current
      if (!el || total === 0) return
      const clamped = Math.max(0, Math.min(total - 1, i))
      el.scrollTo({
        left: clamped * el.clientWidth,
        behavior: reduced ? 'auto' : 'smooth',
      })
    },
    [total, reduced],
  )

  // Track the active slide from scroll position.
  const onScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    setIndex((prev) => {
      if (i !== prev) impact('light')
      return i
    })
  }, [impact])

  // Keyboard navigation (a11y: alternative to swiping).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(index + 1)
      else if (e.key === 'ArrowLeft') goTo(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, goTo])

  if (status === 'loading' || status === 'idle') return <Loading />
  if (status === 'error') {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-ink-soft">{t('toast.error')}</p>
          <button
            type="button"
            onClick={() => load()}
            className="focus-ring rounded-full bg-accent px-6 py-3 font-medium text-white"
          >
            {t('common.retry')}
          </button>
        </div>
      </AppShell>
    )
  }

  const isLast = index === total - 1

  return (
    <div
      className="relative min-h-dvh overflow-hidden"
      style={{ ['--accent' as string]: scene.accent, ['--accent-soft' as string]: scene.accentSoft }}
    >
      {/* Crossfading scene gradient over the neutral base. */}
      <AnimatePresence>
        <motion.div
          key={scene.from}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: `linear-gradient(160deg, ${scene.from}, ${scene.to})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.22 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.6 }}
        />
      </AnimatePresence>

      <AppShell>
        {/* Progress bar + dots */}
        <div className="absolute inset-x-0 top-0 z-20 px-4 pt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${((index + 1) / total) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            />
          </div>
          <div className="mt-2 flex justify-center gap-1.5">
            {beats.map((b, i) => (
              <span
                key={b.id}
                className={[
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-4 bg-accent' : 'w-1.5 bg-ink/20',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {/* Horizontal pager */}
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="beat-pager flex flex-1 snap-x overflow-x-auto overflow-y-hidden"
        >
          {beats.map((beat) => (
            <section
              key={beat.id}
              className="beat-slide flex w-full shrink-0 flex-col items-center justify-center gap-8 px-7 pb-28 pt-24"
              aria-label={pick(beat, 'label')}
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-4xl" aria-hidden>
                  {beat.icon}
                </span>
                <h2 className="text-xl font-semibold text-ink">{pick(beat, 'label')}</h2>
              </div>
              <BeatInput beat={beat} />
            </section>
          ))}
        </div>

        {/* Footer controls */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 px-5 pb-6">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label={t('common.back')}
            className="focus-ring flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised/80 text-ink shadow-sm ring-1 ring-black/5 backdrop-blur disabled:opacity-30"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => {
              skip(beats[index].id)
              if (isLast) navigate('/recap')
              else goTo(index + 1)
            }}
            className="focus-ring rounded-full px-4 py-2 text-sm font-medium text-ink-faint transition hover:text-ink-soft"
          >
            {t('common.skip')}
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={() => navigate('/recap')}
              className="focus-ring flex h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-white shadow-md"
            >
              {t('feed.done')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={t('common.next')}
              className="focus-ring flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-md"
            >
              ›
            </button>
          )}
        </div>
      </AppShell>
    </div>
  )
}

export default Feed
