import { motion } from 'framer-motion'
import type { Beat } from '@/api/types'
import { useSession, WEAK_THRESHOLD } from '@/state/session'
import { useI18n } from '@/i18n'
import { useHaptics } from '@/hooks/useHaptics'
import { MoodSlider } from './MoodSlider'
import { ChipTags } from './ChipTags'

// yes_no is stored as a score so it flows through the curve + weak detection.
export const YES_SCORE = 5
export const NO_SCORE = 1

/** Renders the right input for a beat, driven by `beat.input_type`. */
export function BeatInput({ beat }: { beat: Beat }) {
  const { t } = useI18n()
  const { impact } = useHaptics()
  const { beatState, setScore, toggleTag } = useSession()
  const state = beatState(beat.id)

  if (beat.input_type === 'yes_no') {
    return (
      <div className="flex w-full gap-3">
        {[
          { label: t('feed.yes'), score: YES_SCORE },
          { label: t('feed.no'), score: NO_SCORE },
        ].map((opt) => {
          const active = state.score === opt.score
          return (
            <button
              key={opt.score}
              type="button"
              onClick={() => {
                impact('light')
                setScore(beat.id, opt.score)
              }}
              className={[
                'focus-ring flex-1 rounded-2xl px-6 py-5 text-lg font-semibold transition active:scale-[0.98]',
                active
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-surface-raised text-ink ring-1 ring-black/5',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (beat.input_type === 'chip_pick') {
    return (
      <ChipTags
        tags={beat.tags}
        selected={state.tags ?? []}
        onToggle={(id) => toggleTag(beat.id, id)}
        open
      />
    )
  }

  // default: mood_slider, with tags revealed on a low score
  const showTags = typeof state.score === 'number' && state.score <= WEAK_THRESHOLD
  return (
    <motion.div layout className="flex w-full flex-col gap-8">
      <MoodSlider value={state.score} onChange={(s) => setScore(beat.id, s)} />
      <ChipTags
        tags={beat.tags}
        selected={state.tags ?? []}
        onToggle={(id) => toggleTag(beat.id, id)}
        open={showTags}
      />
    </motion.div>
  )
}
