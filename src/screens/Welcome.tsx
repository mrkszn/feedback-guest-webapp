import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '@/state/session'
import { useI18n } from '@/i18n'
import { AppShell } from '@/components/AppShell'

export function Welcome() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { status, beats, load } = useSession()

  useEffect(() => {
    if (status === 'idle') load()
  }, [status, load])

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="text-7xl"
          aria-hidden
        >
          🍷
        </motion.div>

        <div className="flex flex-col gap-3">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-semibold leading-tight text-ink"
          >
            {t('welcome.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base text-ink-soft"
          >
            {t('welcome.subtitle')}
          </motion.p>
        </div>

        {/* Non-interactive mini preview of the evening's beats. */}
        <div className="flex items-center gap-2" aria-hidden>
          {(beats.length ? beats : Array.from({ length: 6 })).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.07, type: 'spring' }}
              className="h-2.5 w-2.5 rounded-full bg-accent/70"
            />
          ))}
        </div>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/feed')}
          className="focus-ring w-full max-w-xs rounded-2xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-lg transition active:scale-[0.98]"
        >
          {t('welcome.cta')}
        </motion.button>
      </div>
    </AppShell>
  )
}

export default Welcome
