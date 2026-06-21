// Light tactile feedback. Prefers the Telegram WebApp API when the page is
// opened inside a TG WebView, falls back to navigator.vibrate on Android.
// Silently no-ops where neither exists (most desktop / iOS Safari).

type Impact = 'light' | 'medium' | 'heavy'

function tgHaptic(style: Impact): boolean {
  const h = window.Telegram?.WebApp?.HapticFeedback
  if (h?.impactOccurred) {
    h.impactOccurred(style)
    return true
  }
  return false
}

function vibrate(ms: number): void {
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms)
    } catch {
      /* some browsers throw without a user gesture — ignore */
    }
  }
}

export function useHaptics() {
  const impact = (style: Impact = 'light') => {
    if (tgHaptic(style)) return
    vibrate(style === 'heavy' ? 20 : style === 'medium' ? 12 : 8)
  }

  const selection = () => {
    const h = window.Telegram?.WebApp?.HapticFeedback
    if (h?.selectionChanged) {
      h.selectionChanged()
      return
    }
    vibrate(5)
  }

  return { impact, selection }
}
