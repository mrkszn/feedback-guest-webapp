import { motion } from 'framer-motion'
import { faceFor, MOOD_FACES } from './faces'
import { useHaptics } from '@/hooks/useHaptics'

interface Props {
  value: number | undefined
  onChange: (score: number) => void
}

/** 1–5 mood picker — tap a face. */
export function MoodSlider({ value, onChange }: Props) {
  const { selection } = useHaptics()

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

      <div
        role="radiogroup"
        aria-label="mood"
        className="flex w-full items-center justify-between px-1"
      >
        {MOOD_FACES.slice(1).map((face, i) => {
          const n = i + 1
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
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
