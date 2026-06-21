import { lazy, type ComponentType } from 'react'

// After a deploy, an old tab holds hashed chunk URLs that no longer exist, so
// the dynamic import 404s ("error loading dynamically imported module"). We
// reload ONCE — guarded by a sessionStorage flag so we never loop — to pull
// the fresh index.html and chunk map. A clean import clears the flag.
const FLAG = 'guest.chunk-reloaded'

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory()
      window.sessionStorage.removeItem(FLAG)
      return mod
    } catch (err) {
      const alreadyReloaded = window.sessionStorage.getItem(FLAG) === '1'
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(FLAG, '1')
        window.location.reload()
        // Return a never-resolving promise so React keeps the Suspense
        // fallback up until the reload swaps the document.
        return new Promise<{ default: T }>(() => {})
      }
      throw err
    }
  })
}
