import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemePref = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'guest.theme'

interface ThemeContextValue {
  pref: ThemePref
  setPref: (p: ThemePref) => void
  /** Resolved actual theme after applying `system`. */
  resolved: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readPref(): ThemePref {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

function systemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readPref)
  const [systemIsDark, setSystemIsDark] = useState<boolean>(systemDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' =
    pref === 'system' ? (systemIsDark ? 'dark' : 'light') : pref

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p)
    localStorage.setItem(STORAGE_KEY, p)
  }, [])

  const value = useMemo(
    () => ({ pref, setPref, resolved }),
    [pref, setPref, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
