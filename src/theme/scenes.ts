// A "scene" gives each beat its own accent + atmospheric gradient. We walk a
// curated arc from golden hour, through dusk, into night so swiping forward
// feels like the evening progressing. Index is mapped across the arc so the
// arc always spans the full journey regardless of how many beats there are.

export interface Scene {
  /** `R G B` triplet for the --accent CSS var. */
  accent: string
  accentSoft: string
  /** Background gradient stops (used at low opacity over the neutral base). */
  from: string
  to: string
}

const ARC: Scene[] = [
  { accent: '245 177 76', accentSoft: '250 224 178', from: '#f9c97a', to: '#f59a5a' }, // golden hour
  { accent: '240 138 92', accentSoft: '249 206 188', from: '#f2a07a', to: '#e07a6a' }, // warm amber
  { accent: '224 88 138', accentSoft: '245 196 214', from: '#e0588a', to: '#b14a8a' }, // sunset rose
  { accent: '150 82 168', accentSoft: '214 188 224', from: '#9652a8', to: '#6b4aa8' }, // dusk violet
  { accent: '96 92 196', accentSoft: '196 194 236', from: '#605cc4', to: '#4a4ad1' }, // blue hour
  { accent: '74 96 170', accentSoft: '188 200 226', from: '#3a4a8a', to: '#1f2a5a' }, // night
]

export function sceneFor(index: number, total: number): Scene {
  if (total <= 1) return ARC[0]
  const pos = index / (total - 1) // 0..1
  const slot = Math.min(ARC.length - 1, Math.round(pos * (ARC.length - 1)))
  return ARC[slot]
}
