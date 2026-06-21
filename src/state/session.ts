import { create } from 'zustand'
import { fetchJourney, fetchSession, patchBeat } from '@/api/guest'
import { getJourney, getSessionId } from '@/auth/token'
import type { Beat, BeatState } from '@/api/types'

export const WEAK_THRESHOLD = 3

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface SessionStore {
  status: Status
  beats: Beat[]
  /** beat_id -> local state (source of truth for the UI, optimistic). */
  states: Record<string, BeatState>
  /** Set by the debounced save when a PATCH ultimately fails. */
  saveError: number | null

  load: () => Promise<void>
  setScore: (beatId: string, score: number) => void
  toggleTag: (beatId: string, tagId: string, max?: number) => void
  skip: (beatId: string) => void

  beatState: (beatId: string) => BeatState
  weakBeatIds: () => string[]
  /** Cosmetic local points estimate shown in the targeted feed. The backend
   * is the source of truth at finalize; this only mirrors what's visible in
   * the feed (mood taps + chips). */
  localPoints: () => number
}

// Points weights (cosmetic — kept in sync with the backend formula).
const PTS_SCORE = 5
const PTS_TAG = 3

// Per-beat debounce timers so a dragging slider coalesces into one PATCH.
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleSave(beatId: string, get: () => SessionStore, set: (p: Partial<SessionStore>) => void) {
  const sessionId = getSessionId()
  if (!sessionId) return
  const existing = timers.get(beatId)
  if (existing) clearTimeout(existing)
  timers.set(
    beatId,
    setTimeout(async () => {
      timers.delete(beatId)
      const s = get().states[beatId]
      if (!s) return
      try {
        await patchBeat(sessionId, beatId, {
          score: s.score,
          tags: s.tags,
          skipped: s.skipped,
        })
      } catch {
        // client.ts already retried with backoff; flag for a toast.
        set({ saveError: Date.now() })
      }
    }, 450),
  )
}

export const useSession = create<SessionStore>((set, get) => ({
  status: 'idle',
  beats: [],
  states: {},
  saveError: null,

  load: async () => {
    set({ status: 'loading' })
    try {
      const journey = await fetchJourney(getJourney())
      const states: Record<string, BeatState> = {}
      for (const b of journey.beats) states[b.id] = { beat_id: b.id }

      // Restore any prior progress for this session.
      const sessionId = getSessionId()
      if (sessionId) {
        try {
          const session = await fetchSession(sessionId)
          for (const bs of session.beats) {
            if (states[bs.beat_id]) states[bs.beat_id] = { ...states[bs.beat_id], ...bs }
          }
        } catch {
          // No restorable state yet (e.g. fresh session) — fine.
        }
      }
      set({ status: 'ready', beats: journey.beats, states })
    } catch {
      set({ status: 'error' })
    }
  },

  setScore: (beatId, score) => {
    set((st) => ({
      states: { ...st.states, [beatId]: { ...st.states[beatId], beat_id: beatId, score, skipped: false } },
    }))
    scheduleSave(beatId, get, set)
  },

  toggleTag: (beatId, tagId, max = 3) => {
    set((st) => {
      const cur = st.states[beatId] ?? { beat_id: beatId }
      const tags = new Set(cur.tags ?? [])
      if (tags.has(tagId)) tags.delete(tagId)
      else if (tags.size < max) tags.add(tagId)
      return {
        states: { ...st.states, [beatId]: { ...cur, beat_id: beatId, tags: [...tags] } },
      }
    })
    scheduleSave(beatId, get, set)
  },

  skip: (beatId) => {
    set((st) => ({
      states: { ...st.states, [beatId]: { ...st.states[beatId], beat_id: beatId, skipped: true } },
    }))
    scheduleSave(beatId, get, set)
  },

  beatState: (beatId) => get().states[beatId] ?? { beat_id: beatId },

  weakBeatIds: () => {
    const { beats, states } = get()
    return beats
      .filter((b) => {
        const s = states[b.id]
        return s && !s.skipped && typeof s.score === 'number' && s.score <= WEAK_THRESHOLD
      })
      .map((b) => b.id)
  },

  localPoints: () => {
    const { states } = get()
    let pts = 0
    for (const s of Object.values(states)) {
      if (s.skipped) continue
      if (typeof s.score === 'number') pts += PTS_SCORE
      pts += (s.tags?.length ?? 0) * PTS_TAG
    }
    return pts
  },
}))
