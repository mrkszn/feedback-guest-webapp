import { Component, type ErrorInfo, type ReactNode } from 'react'
import { uk } from '@/i18n/dicts/uk'
import { en } from '@/i18n/dicts/en'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

// Standalone (no hooks) so it can sit above the providers and still render a
// friendly, localized fallback instead of a raw stack trace.
function copy() {
  const isEn = navigator.language?.toLowerCase().startsWith('en')
  const d = isEn ? en : uk
  return {
    title: d['error.title'],
    body: d['error.body'],
    reload: d['error.reload'],
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook a real logger here later.
    console.error('App crashed:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const c = copy()
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="text-5xl">🌧️</div>
        <h1 className="text-xl font-semibold text-white">{c.title}</h1>
        <p className="max-w-xs text-sm text-white/70">{c.body}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="focus-ring rounded-full bg-accent px-6 py-3 font-medium text-white shadow-md"
        >
          {c.reload}
        </button>
      </div>
    )
  }
}
