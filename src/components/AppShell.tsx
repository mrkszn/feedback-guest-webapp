import type { ReactNode } from 'react'
import { TopControls } from './TopControls'

/**
 * Centered app column with the persistent language control. Mobile stays a
 * 480px column; desktop gets room to breathe. `wide` opts into the broadest
 * track — used by the feed's all-at-once grid; single-column screens keep the
 * narrower default so copy stays readable.
 */
export function AppShell({
  children,
  wide = false,
}: {
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className={[
        'relative mx-auto flex min-h-dvh w-full flex-col text-white',
        wide ? 'max-w-app md:max-w-2xl lg:max-w-5xl' : 'max-w-app md:max-w-xl',
      ].join(' ')}
    >
      <TopControls />
      {children}
    </div>
  )
}
