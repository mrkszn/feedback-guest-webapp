import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const EntryScene3D = lazyWithRetry(() => import('@/screens/EntryScene3D'))

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')),
    )
  } catch {
    return false
  }
}

/** Keeps a WebGL/runtime failure in the 3D scene from bubbling to the app
 * error screen — we just fall back to the gradient backdrop. */
class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * The persistent InsightFlow backdrop, mounted ONCE at the app root behind all
 * routes. The brand gradient paints instantly; the lazy 3D canvas is layered
 * over it. Because this component never unmounts across navigation, the canvas
 * is created a single time and survives route changes (no remount / reload /
 * flash). `prefers-reduced-motion` or no-WebGL → gradient only.
 *
 * It is `pointer-events-none` so the interactive survey screens above it always
 * receive taps; the scene self-animates (float + drift) without pointer input.
 */
export function BrandBackdrop() {
  const reduced = useReducedMotion()
  const use3D = useMemo(() => !reduced && webglAvailable(), [reduced])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-[#0f1733]" aria-hidden>
      <div className="brand-flow-bg animate-brand-flow absolute inset-0" />
      {use3D && (
        <div className="absolute inset-0">
          <SilentBoundary>
            <Suspense fallback={null}>
              <EntryScene3D />
            </Suspense>
          </SilentBoundary>
        </div>
      )}
      {/* legibility veil toward the bottom, where copy/actions sit */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0d1330] via-[#0d1330]/55 to-transparent" />
    </div>
  )
}

export default BrandBackdrop
