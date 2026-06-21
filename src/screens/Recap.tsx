import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '@/state/session'
import { useI18n } from '@/i18n'
import { AppShell } from '@/components/AppShell'
import { Loading } from '@/components/Loading'
import { MoodCurve } from '@/components/MoodCurve'

export function Recap() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { status, beats, load, weakBeatIds } = useSession()

  useEffect(() => {
    if (status === 'idle') load()
  }, [status, load])

  if (status !== 'ready') return <Loading />

  const weak = weakBeatIds()

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10 px-6 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-2xl font-semibold text-ink"
        >
          {t('recap.title')}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl bg-surface-raised/70 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur"
        >
          <MoodCurve beats={beats} weakIds={weak} />
        </motion.div>

        {weak.length > 0 ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/dig')}
            className="focus-ring rounded-2xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-lg transition active:scale-[0.98]"
          >
            {t('recap.weak.help')}
          </motion.button>
        ) : (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/final')}
            className="focus-ring rounded-2xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-lg transition active:scale-[0.98]"
          >
            {t('recap.allgood')}
          </motion.button>
        )}
      </div>
    </AppShell>
  )
}

export default Recap
