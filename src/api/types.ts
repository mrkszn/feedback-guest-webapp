// Mirror of the backend `presentations/http_guest_api` contract.
// Content strings arrive pre-localized in *_uk / *_en pairs — the frontend
// only picks the field for the active locale, it never translates content.

export type InputType = 'mood_slider' | 'chip_pick' | 'yes_no'

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

export interface ApiError {
  detail: string
}
