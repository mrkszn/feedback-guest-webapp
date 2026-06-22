import { motion } from 'framer-motion'
import type { Beat } from '@/api/types'
import { useSession } from '@/state/session'
import { useI18n } from '@/i18n'
import { faceFor } from './faces'

interface Props {
  beats: Beat[]
  weakIds?: string[]
  /** Pinned mode renders without the draw animation (used on the final card). */
  pinned?: boolean
}

const W = 320
const H = 160
const PAD_X = 28
const PAD_Y = 24

function points(beats: Beat[], scoreOf: (id: string) => number) {
  const n = beats.length
  return beats.map((b, i) => {
    const x = n <= 1 ? W / 2 : PAD_X + (i / (n - 1)) * (W - PAD_X * 2)
    const score = scoreOf(b.id) // 1..5
    const y = H - PAD_Y - ((score - 1) / 4) * (H - PAD_Y * 2)
    return { x, y, beat: b }
  })
}

/** Smooth-ish connected curve through beat scores. */
export function MoodCurve({ beats, weakIds = [], pinned = false }: Props) {
  const { beatState } = useSession()
  const { pick } = useI18n()

  const scoreOf = (id: string) => {
    const s = beatState(id)
    return typeof s.score === 'number' ? s.score : 3
  }

  const pts = points(beats, scoreOf)
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
        <defs>
          <linearGradient id="curve" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f5b14c" />
            <stop offset="0.5" stopColor="#e0588a" />
            <stop offset="1" stopColor="#5a4ad1" />
          </linearGradient>
        </defs>

        <motion.path
          d={path}
          fill="none"
          stroke="url(#curve)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={pinned ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />

        {pts.map((p, i) => {
          const weak = weakIds.includes(p.beat.id)
          return (
            <g key={p.beat.id}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={weak ? 7 : 5}
                className={weak ? 'fill-red-400' : 'fill-[rgb(var(--accent))]'}
                initial={pinned ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: pinned ? 0 : 0.6 + i * 0.08, type: 'spring' }}
                style={weak ? { transformOrigin: `${p.x}px ${p.y}px` } : undefined}
              />
              {weak && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={7}
                  className="animate-pulse-weak fill-red-400/40"
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                />
              )}
            </g>
          )
        })}
      </svg>

      <div className="mt-1 flex justify-between px-1">
        {beats.map((b) => (
          <div key={b.id} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <span className="text-base leading-none">{faceFor(scoreOf(b.id))}</span>
            <span className="truncate text-[10px] text-white/45">{pick(b, 'label')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
