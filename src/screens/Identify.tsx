import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { submitIdentify } from '@/api/guest'
import { getMode, getSessionId } from '@/auth/token'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { AppShell } from '@/components/AppShell'

// Loose, client-side sanity check only — the backend validates for real.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Identify() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { show } = useToast()
  const targeted = getMode() === 'targeted'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy) return
    if (!name.trim()) {
      show(t('identify.name.required'), 'error')
      return
    }
    // Email is mandatory in targeted mode — it's how the prize is delivered.
    if (targeted && !EMAIL_RE.test(email.trim())) {
      show(t('identify.email.required'), 'error')
      return
    }

    const sessionId = getSessionId()
    if (!sessionId) return
    setBusy(true)
    try {
      await submitIdentify(sessionId, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      navigate(targeted ? '/prize' : '/final', { replace: true })
    } catch {
      show(t('toast.error'), 'error')
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-2xl font-semibold text-ink"
        >
          {t('identify.title')}
        </motion.h1>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-sm font-medium text-ink-soft">
              {t('identify.name')}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              autoComplete="name"
              className="focus-ring rounded-xl bg-surface-soft px-4 py-3 text-ink ring-1 ring-black/5"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-sm font-medium text-ink-soft">
              {t('identify.email')}
              {targeted && <span className="text-accent"> *</span>}
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              autoCapitalize="off"
              autoComplete="email"
              required={targeted}
              placeholder="you@email.com"
              className="focus-ring rounded-xl bg-surface-soft px-4 py-3 text-ink ring-1 ring-black/5"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="px-1 text-sm font-medium text-ink-soft">
              {t('identify.phone')}
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="focus-ring rounded-xl bg-surface-soft px-4 py-3 text-ink ring-1 ring-black/5"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="focus-ring mt-2 rounded-2xl bg-accent px-6 py-4 text-lg font-semibold text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
          >
            {t('identify.cta')}
          </button>
        </motion.form>
      </div>
    </AppShell>
  )
}

export default Identify
