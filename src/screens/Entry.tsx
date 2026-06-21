import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authWithToken, startAnonymousSession } from '@/api/guest'
import { hasAuth, setAuth, setJourneyContext } from '@/auth/token'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { TopControls } from '@/components/TopControls'
import { Loading } from '@/components/Loading'
import type { JourneyName, MealOccasion, SessionMode } from '@/api/types'

const EntryScene3D = lazyWithRetry(() => import('@/screens/EntryScene3D'))

// Extract a one-time token from `?t=` or from a pasted full URL / bare code.
function extractToken(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null
  try {
    const url = new URL(v)
    const t = url.searchParams.get('t')
    if (t) return t
  } catch {
    /* not a URL — treat as a bare code below */
  }
  return /^[\w-]{6,}$/.test(v) ? v : null
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')),
    )
  } catch {
    return false
  }
}

/** Keeps a WebGL/runtime failure in the 3D scene from bubbling to the app
 * error screen — we just fall back to the gradient backdrop. */
class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** Brand "flow" swoosh — the InsightFlow mark, matched to the favicon. */
function BrandMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden>
      <defs>
        <linearGradient id="ifmark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="0.55" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M10 40 C 20 18, 28 18, 32 30 C 36 42, 44 42, 54 22"
        fill="none"
        stroke="url(#ifmark)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  )
}

type OccasionLabelKey =
  | 'entry.occasion.breakfast'
  | 'entry.occasion.lunch'
  | 'entry.occasion.dinner'
  | 'entry.occasion.other'

const OCCASIONS: { key: MealOccasion; emoji: string; labelKey: OccasionLabelKey }[] = [
  { key: 'breakfast', emoji: '🌅', labelKey: 'entry.occasion.breakfast' },
  { key: 'lunch', emoji: '☀️', labelKey: 'entry.occasion.lunch' },
  { key: 'dinner', emoji: '🌙', labelKey: 'entry.occasion.dinner' },
  { key: 'other', emoji: '✨', labelKey: 'entry.occasion.other' },
]

export function Entry() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { show } = useToast()
  const reduced = useReducedMotion()
  const [busy, setBusy] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [link, setLink] = useState('')

  // The QR code decides the context — the guest never picks the source.
  const journey: JourneyName = params.get('journey') === 'delivery' ? 'delivery' : 'restaurant'
  const mode: SessionMode = params.get('mode') === 'targeted' ? 'targeted' : 'non_targeted'

  // An explicit `?mode=`/`?journey=` means the guest arrived via a (possibly
  // new) QR — that context must win. Without this, a returning guest is
  // auto-resumed into their PREVIOUS session/mode and a targeted QR silently
  // behaves as non_targeted. Bare `/` (no params) still resumes a live session.
  const hasEntryParams = params.get('mode') !== null || params.get('journey') !== null

  const use3D = useMemo(() => !reduced && webglAvailable(), [reduced])

  // Auto-auth path: ?t=<token> → straight to the feed.
  const tokenParam = params.get('t')
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (tokenParam) {
        try {
          const res = await authWithToken(tokenParam)
          if (cancelled) return
          // Persist the QR-carried context (mode/journey) so the feed and the
          // Phase C routing pick the right flow even on the token path.
          setJourneyContext(journey, mode)
          setAuth(res.token, res.session_id)
          navigate('/feed', { replace: true })
          return
        } catch {
          if (!cancelled) show(t('toast.error'), 'error')
        }
      } else if (hasAuth() && !hasEntryParams) {
        // Returning guest hitting the bare URL → restore into the feed. With
        // explicit entry params we fall through to the hero so a fresh session
        // starts in the QR-carried mode.
        navigate('/feed', { replace: true })
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenParam])

  if (tokenParam) return <Loading />

  const start = async (occasion?: MealOccasion) => {
    if (busy) return
    setBusy(true)
    try {
      const res = await startAnonymousSession({
        journey,
        mode,
        meal_occasion: journey === 'restaurant' ? occasion : undefined,
      })
      setJourneyContext(journey, mode)
      setAuth(res.token, res.session_id)
      navigate('/welcome')
    } catch {
      show(t('toast.error'), 'error')
      setBusy(false)
    }
  }

  const submitLink = async () => {
    const token = extractToken(link)
    if (!token) {
      show(t('entry.link.invalid'), 'error')
      return
    }
    setBusy(true)
    try {
      const res = await authWithToken(token)
      setAuth(res.token, res.session_id)
      navigate('/feed', { replace: true })
    } catch {
      show(t('toast.error'), 'error')
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden text-white">
      {/* Brand backdrop: gradient first paint, 3D canvas swapped in over it. */}
      <div className="brand-flow-bg animate-brand-flow fixed inset-0 -z-20" />
      {use3D && (
        <div className="fixed inset-0 -z-10">
          <SilentBoundary>
            <Suspense fallback={null}>
              <EntryScene3D />
            </Suspense>
          </SilentBoundary>
        </div>
      )}
      {/* Legibility veil under the copy. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-[#0d1330] via-[#0d1330]/55 to-transparent" />

      <TopControls />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-app flex-col px-6 pb-12 pt-20 md:max-w-lg lg:justify-center lg:gap-10 lg:pt-0">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight">InsightFlow</span>
        </motion.div>

        <div className="flex-1 lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 120, damping: 18 }}
          className="flex flex-col gap-6"
        >
          <h1 className="text-[2rem] font-semibold leading-tight drop-shadow-sm">
            {t('entry.tagline')}
          </h1>

          {journey === 'restaurant' ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-white/75">
                {t('entry.occasion.title')}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {OCCASIONS.map((o, i) => (
                  <motion.button
                    key={o.key}
                    type="button"
                    disabled={busy}
                    onClick={() => start(o.key)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.05 }}
                    className="focus-ring flex flex-col items-start gap-2 rounded-2xl bg-white/10 px-4 py-4 text-left ring-1 ring-white/15 backdrop-blur-md transition active:scale-[0.97] disabled:opacity-60"
                  >
                    <span className="text-2xl" aria-hidden>
                      {o.emoji}
                    </span>
                    <span className="text-[0.95rem] font-medium leading-tight">
                      {t(o.labelKey)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => start()}
              className="focus-ring rounded-2xl bg-white px-6 py-4 text-lg font-semibold text-brand-ink shadow-lg transition active:scale-[0.98] disabled:opacity-60"
            >
              {t('entry.delivery.cta')}
            </button>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowLink((s) => !s)}
              className="focus-ring self-start rounded-xl px-1 py-1 text-sm font-medium text-white/60 transition hover:text-white/90"
            >
              {t('entry.haslink')}
            </button>
            {showLink && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  inputMode="url"
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder={t('entry.link.placeholder')}
                  className="focus-ring rounded-xl bg-white/10 px-4 py-3 text-white ring-1 ring-white/20 placeholder:text-white/40 backdrop-blur"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={submitLink}
                  className="focus-ring rounded-xl bg-white/20 px-4 py-3 font-medium text-white ring-1 ring-white/20 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {t('entry.link.submit')}
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Entry
