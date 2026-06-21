import type { ReactNode } from 'react'
import { TopControls } from './TopControls'

/** Centered mobile column with the persistent language/theme controls. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-app flex-col">
      <TopControls />
      {children}
    </div>
  )
}
