// Mirror of the backend `presentations/http_guest_api` contract.
// Content strings arrive pre-localized in *_uk / *_en pairs — the frontend
// only picks the field for the active locale, it never translates content.

export type InputType = 'mood_slider' | 'chip_pick' | 'yes_no'

// Which journey the guest walks (chosen by the QR code, not the guest) and the
// product mode (gamified vs plain emoji survey — behaviour lands in Phase C).
export type JourneyName = 'restaurant' | 'delivery'
export type SessionMode = 'non_targeted' | 'targeted'
export type MealOccasion = 'breakfast' | 'lunch' | 'dinner' | 'other'

// Optional body for POST /guest/sessions. All fields optional — a bare start
// is a default restaurant / non_targeted session.
export interface StartSessionOpts {
  journey?: JourneyName
  mode?: SessionMode
  meal_occasion?: MealOccasion
}

export interface Tag {
  id: string
  label_uk: string
  label_en: string
}

export interface Beat {
  id: string
  label_uk: string
  label_en: string
  icon: string
  input_type: InputType
  tags: Tag[]
}

export interface Journey {
  beats: Beat[]
}

export interface AuthResponse {
  token: string
  session_id: string
}

// State returned by GET /guest/sessions/{id} for restore.
export interface BeatState {
  beat_id: string
  score?: number
  tags?: string[]
  skipped?: boolean
}

export interface SessionState {
  session_id: string
  beats: BeatState[]
  finalized?: boolean
  // Phase C: the backend echoes the product mode and the running points total
  // on restore so a returning guest lands in the right flow.
  mode?: SessionMode
  points?: number | null
}

export interface BeatPatch {
  score?: number
  tags?: string[]
  skipped?: boolean
}

// AI dig step — guesses are structured, never free-text bot replies.
export interface Guess {
  id: string
  text_uk: string
  text_en: string
  emoji: string
}

export interface Dig {
  dig_id: string
  beat_id: string
  guesses: Guess[]
}

export interface DigAnswer {
  dig_id: string
  accepted_guess_id?: string
  free_text?: string
  voice_object_key?: string
}

export interface DigAnswerResponse {
  next_dig?: Dig
  done?: boolean
}

export interface VoiceUploadResponse {
  object_key: string
}

// ── Phase C: identity + prize ─────────────────────────────────────────────

// Guest contact details. Collected on the Identify screen — name is always
// required; email is additionally required in `targeted` mode (for the prize).
export interface GuestIdentity {
  name: string
  email: string | null
  phone: string | null
}

export interface IdentifyBody {
  name: string
  email?: string
  phone?: string
}

export type PrizeTier = 'small' | 'medium' | 'large'

// Result of the fortune wheel — the tier (which segment to land on), the
// points the backend awarded, the redeemable code, and a pre-localized label.
export interface PrizeResult {
  tier: PrizeTier
  points: number
  code: string
  label_uk: string
  label_en: string
}

export interface ApiError {
  detail: string
}
