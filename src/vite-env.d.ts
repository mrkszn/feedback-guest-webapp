/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Telegram WebView haptics, present only when opened inside a TG WebApp.
interface Window {
  Telegram?: {
    WebApp?: {
      HapticFeedback?: {
        impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void
        selectionChanged?: () => void
      }
    }
  }
}
