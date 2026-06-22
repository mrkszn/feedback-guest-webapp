import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchPrize, finalizeSession } from '@/api/guest'
import { HttpError } from '@/api/client'
import { getSessionId } from '@/auth/token'
import { useI18n, type TKey } from '@/i18n'
import { useToast } from '@/components/Toast'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { AppShell } from '@/components/AppShell'
import { Loading } from '@/components/Loading'
import type { PrizeResult, PrizeTier } from '@/api/types'

// Segment order around the wheel (clockwise from the top pointer). Each spans
// 120°, centered at i*120 + 60.
const SEGMENTS: { tier: PrizeTier; color: string; labelKey: TKey }[] = [
  { tier: 'small', color: '#9aa6b8', labelKey: 'prize.tier.small' },
  { tier: 'medium', color: '#e0588a', labelKey: 'prize.tier.medium' },
  { tier: 'large', color: '#f5b14c', labelKey: 'prize.tier.large' },
]
const SEG_ANGLE = 360 / SEGMENTS.length
const SPINS = 4

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Point on the wheel for an angle measured clockwise from the top.
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function sectorPath(i: number): string {
  const cx = 100
  const cy = 100
  const r = 96
  const a = polar(cx, cy, r, i * SEG_ANGLE)
  const b = polar(cx, cy, r, (i + 1) * SEG_ANGLE)
  return `M ${cx} ${cy} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`
}

export function Prize() {
  const navigate = useNavigate()
  const { t, pick } = useI18n()
  const { show } = useToast()
  const reduced = useReducedMotion()

  const [prize, setPrize] = useState<PrizeResult | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    const sessionId = getSessionId()
    if (!sessionId) return
    startedRef.current = true

    let cancelled = false
    ;(async () => {
      try {
        // The prize endpoint requires a finalized session (409 otherwise), so
        // finalize first, then poll a couple of times in case it lags.
        await finalizeSession(sessionId).catch(() => {})
        let result: PrizeResult | null = null
        for (let attempt = 0; attempt < 4 && !result; attempt++) {
          try {
            result = await fetchPrize(sessionId)
          } catch (err) {
            if (err instanceof HttpError && err.status === 409 && attempt < 3) {
              await sleep(700)
              continue
            }
            throw err
          }
        }
        if (cancelled || !result) return
        setPrize(result)
        if (reduced) setRevealed(true)
      } catch {
        if (!cancelled) show(t('toast.error'), 'error')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copy = async () => {
    if (!prize) return
    try {
      await navigator.clipboard.writeText(prize.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — the code is shown on screen anyway */
    }
  }

  if (!prize) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Loading />
          <p className="text-sm text-white/70">{t('prize.spinning')}</p>
        </div>
      </AppShell>
    )
  }

  const targetIndex = SEGMENTS.findIndex((s) => s.tier === prize.tier)
  const idx = targetIndex < 0 ? 0 : targetIndex
  // Land the chosen segment's center under the top pointer.
  const finalRotation = SPINS * 360 - (idx * SEG_ANGLE + SEG_ANGLE / 2)

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="relative h-72 w-72">
          {/* Fixed pointer at the top, pointing into the wheel. */}
          <div
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
            aria-hidden
            style={{
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '20px solid #ffffff',
            }}
          />
          <motion.svg
            viewBox="0 0 200 200"
            className="h-full w-full drop-shadow-lg"
            initial={{ rotate: 0 }}
            animate={{ rotate: finalRotation }}
            transition={{
              duration: reduced ? 0 : 3.5,
              ease: [0.33, 1, 0.68, 1], // cubic-out
            }}
            onAnimationComplete={() => setRevealed(true)}
          >
            {SEGMENTS.map((seg, i) => {
              const center = polar(100, 100, 58, i * SEG_ANGLE + SEG_ANGLE / 2)
              return (
                <g key={seg.tier}>
                  <path d={sectorPath(i)} fill={seg.color} stroke="#0f0f14" strokeWidth={1.5} />
                  <text
                    x={center.x}
                    y={center.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${i * SEG_ANGLE + SEG_ANGLE / 2} ${center.x.toFixed(2)} ${center.y.toFixed(2)})`}
                    className="fill-white text-[11px] font-semibold"
                  >
                    {t(seg.labelKey)}
                  </text>
                </g>
              )
            })}
            <circle cx="100" cy="100" r="14" fill="#0f1733" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
          </motion.svg>
        </div>

        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full flex-col items-center gap-5"
          >
            <h1 className="text-2xl font-semibold text-white">{pick(prize, 'label')}</h1>

            <div className="flex w-full flex-col items-center gap-2 rounded-3xl bg-white/10 p-5 shadow-sm ring-1 ring-white/15">
              <span className="text-xs uppercase tracking-wide text-white/45">
                {t('prize.code.label')}
              </span>
              <span className="select-all font-mono text-2xl font-bold tracking-widest text-white">
                {prize.code}
              </span>
              <button
                type="button"
                onClick={copy}
                className="focus-ring mt-1 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/70 ring-1 ring-white/15 transition hover:text-white"
              >
                {copied ? t('prize.copied') : t('prize.copy')}
              </button>
            </div>

            <p className="text-sm text-white/70">
              ✨ {prize.points} {t('prize.points')}
            </p>

            <button
              type="button"
              onClick={() => navigate('/final', { replace: true })}
              className="focus-ring w-full rounded-2xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-lg transition active:scale-[0.98]"
            >
              {t('prize.done')}
            </button>
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}

export default Prize
