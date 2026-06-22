import { AnimatePresence, motion } from 'framer-motion'
import type { Tag } from '@/api/types'
import { useI18n } from '@/i18n'
import { useHaptics } from '@/hooks/useHaptics'

interface Props {
  tags: Tag[]
  selected: string[]
  onToggle: (tagId: string) => void
  /** When false the row is collapsed (score above the weak threshold). */
  open: boolean
}

/** Optional 1–3 chip picker, revealed when a beat scores low. */
export function ChipTags({ tags, selected, onToggle, open }: Props) {
  const { t, pick } = useI18n()
  const { selection } = useHaptics()

  return (
    <AnimatePresence initial={false}>
      {open && tags.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          <p className="mb-3 text-center text-sm text-white/70">{t('feed.tags.hint')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((tag) => {
              const active = selected.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    selection()
                    onToggle(tag.id)
                  }}
                  aria-pressed={active}
                  className={[
                    'focus-ring rounded-full px-4 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-accent text-white shadow-md'
                      : 'bg-white/10 text-white/70 ring-1 ring-white/15 hover:ring-accent/40',
                  ].join(' ')}
                >
                  {pick(tag, 'label')}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
