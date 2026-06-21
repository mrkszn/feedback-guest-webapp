import { motion } from 'framer-motion'
import { faceFor, MOOD_FACES } from './faces'
import { useHaptics } from '@/hooks/useHaptics'

interface Props {
  value: number | undefined
  onChange: (score: number) => void
}

/** 1–5 mood slider with an animated face. Tap a face to set quickly. */
export function MoodSlider({ value, onChange }: Props) {
  const { selection } = useHaptics()
  const current = value ?? 3

  const set = (n: number) => {
    if (n !== value) selection()
    onChange(n)
  }

  return (
    <div className="flex w-full flex-col items-center gap-7">
      <motion.div
        key={value ?? 'unset'}
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        className="select-none text-[88px] leading-none drop-shadow-sm"
        aria-hidden
      >
        {faceFor(value)}
      </motion.div>

      <input
        type="range"
        className="mood focus-ring"
        min={1}
        max={5}
        step={1}
        value={current}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="mood"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={value ?? undefined}
      />

      <div className="flex w-full items-center justify-between px-1">
        {MOOD_FACES.slice(1).map((face, i) => {
          const n = i + 1
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => set(n)}
              aria-label={`${n}`}
              className={[
                'focus-ring flex h-11 w-11 items-center justify-center rounded-full text-2xl transition',
                active ? 'scale-110 bg-accent-soft/60' : 'opacity-50 hover:opacity-90',
              ].join(' ')}
            >
              {face}
            </button>
          )
        })}
      </div>
    </div>
  )
}
