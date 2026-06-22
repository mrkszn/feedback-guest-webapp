/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // Which product this deployment is. Set per Vercel project — each domain is
  // exactly one mode. Defaults to 'non_targeted' when unset.
  readonly VITE_APP_MODE?: 'targeted' | 'non_targeted'
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
