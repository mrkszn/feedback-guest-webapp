import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authWithToken, startAnonymousSession } from '@/api/guest'
import { hasAuth, setAuth } from '@/auth/token'
import { useI18n } from '@/i18n'
import { useToast } from '@/components/Toast'
import { AppShell } from '@/components/AppShell'
import { Loading } from '@/components/Loading'

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

export function Entry() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { show } = useToast()
  const [busy, setBusy] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [link, setLink] = useState('')

  // Auto-auth path: ?t=<token> → straight to the feed (acceptance #1).
  const tokenParam = params.get('t')
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (tokenParam) {
        try {
          const res = await authWithToken(tokenParam)
          if (cancelled) return
          setAuth(res.token, res.session_id)
          navigate('/feed', { replace: true })
          return
        } catch {
          if (!cancelled) show(t('toast.error'), 'error')
        }
      } else if (hasAuth()) {
        // Returning guest with a live session → restore into the feed.
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

  const startAnon = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await startAnonymousSession()
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
    <AppShell>
      <div className="flex flex-1 flex-col justify-center gap-8 px-6 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-2xl font-semibold text-ink"
        >
          {t('entry.title')}
        </motion.h1>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={startAnon}
            className="focus-ring rounded-2xl bg-accent px-6 py-4 text-lg font-medium text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
          >
            {t('entry.dinein')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={startAnon}
            className="focus-ring rounded-2xl bg-surface-raised px-6 py-4 text-lg font-medium text-ink ring-1 ring-black/5 transition active:scale-[0.98] disabled:opacity-60"
          >
            {t('entry.delivery')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowLink((s) => !s)}
            className="focus-ring rounded-2xl px-6 py-3 text-base font-medium text-ink-soft transition hover:text-ink"
          >
            {t('entry.haslink')}
          </button>
        </div>

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
              className="focus-ring rounded-xl bg-surface-soft px-4 py-3 text-ink ring-1 ring-black/5"
            />
            <button
              type="button"
              disabled={busy}
              onClick={submitLink}
              className="focus-ring rounded-xl bg-accent px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {t('entry.link.submit')}
            </button>
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}

export default Entry
