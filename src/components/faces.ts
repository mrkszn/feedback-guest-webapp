// Mood faces for the 1–5 slider. Index 0 is unset/neutral.
export const MOOD_FACES = ['😐', '😣', '🙁', '😐', '🙂', '😍'] as const

export function faceFor(score: number | undefined): string {
  if (!score || score < 1) return '🙂'
  return MOOD_FACES[Math.max(1, Math.min(5, score))]
}
