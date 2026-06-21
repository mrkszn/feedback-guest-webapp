import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasAuth } from '@/auth/token'

/** Gate post-entry screens: without a session JWT, bounce back to entry. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  if (!hasAuth()) {
    return <Navigate to={`/${location.search}`} replace />
  }
  return <>{children}</>
}
