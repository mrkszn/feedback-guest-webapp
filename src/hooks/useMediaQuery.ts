import { useEffect, useState } from 'react'

/** Live match for a media query (SPA-only — reads matchMedia synchronously on
 * first render, then tracks changes). Used to switch the feed between the
 * mobile swipe-pager and the desktop all-at-once grid. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}
