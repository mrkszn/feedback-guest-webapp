import { request } from './client'
import type {
  AuthResponse,
  BeatPatch,
  Dig,
  DigAnswer,
  DigAnswerResponse,
  GuestIdentity,
  IdentifyBody,
  Journey,
  JourneyName,
  PrizeResult,
  SessionState,
  StartSessionOpts,
  VoiceUploadResponse,
} from './types'

// ── Auth ────────────────────────────────────────────────────────────────

/** Exchange a one-time table/receipt token for a session JWT. */
export function authWithToken(t: string): Promise<AuthResponse> {
  return request('/guest/auth', { method: 'POST', body: { t }, auth: false })
}

/**
 * Start an anonymous session (web_anon). The QR code selects the journey
 * (restaurant | delivery), the product mode and — for restaurant — the meal
 * occasion. A bare call starts a default restaurant / non_targeted session.
 */
export function startAnonymousSession(
  opts: StartSessionOpts = {},
): Promise<AuthResponse> {
  return request('/guest/sessions', { method: 'POST', body: opts, auth: false })
}

// ── Journey + session ───────────────────────────────────────────────────

/** Fetch a journey bundle. Defaults to the restaurant journey; pass
 * `'delivery'` to load that named one. */
export function fetchJourney(name?: JourneyName): Promise<Journey> {
  const qs = name && name !== 'restaurant' ? `?name=${encodeURIComponent(name)}` : ''
  return request(`/guest/journey${qs}`)
}

export function fetchSession(sessionId: string): Promise<SessionState> {
  return request(`/guest/sessions/${sessionId}`)
}

export function patchBeat(
  sessionId: string,
  beatId: string,
  patch: BeatPatch,
): Promise<void> {
  return request(`/guest/sessions/${sessionId}/beats/${beatId}`, {
    method: 'PATCH',
    body: patch,
  })
}

// ── AI dig ──────────────────────────────────────────────────────────────

export function startDig(sessionId: string, beatId: string): Promise<Dig> {
  return request(`/guest/sessions/${sessionId}/dig`, {
    method: 'POST',
    body: { beat_id: beatId },
  })
}

export function answerDig(
  sessionId: string,
  answer: DigAnswer,
): Promise<DigAnswerResponse> {
  return request(`/guest/sessions/${sessionId}/dig/answer`, {
    method: 'POST',
    body: answer,
  })
}

// ── Voice ───────────────────────────────────────────────────────────────

export function uploadVoice(
  sessionId: string,
  blob: Blob,
): Promise<VoiceUploadResponse> {
  const form = new FormData()
  const ext = blob.type.includes('ogg') ? 'ogg' : 'mp3'
  form.append('audio', blob, `voice.${ext}`)
  return request(`/guest/sessions/${sessionId}/voice`, {
    method: 'POST',
    formData: form,
  })
}

// ── Finalize ────────────────────────────────────────────────────────────

export function finalizeSession(sessionId: string): Promise<void> {
  return request(`/guest/sessions/${sessionId}/finalize`, { method: 'POST' })
}

// ── Phase C: identity + prize ─────────────────────────────────────────────

/** Submit guest contact details. 400 if name is empty (backend-validated). */
export function submitIdentify(
  sessionId: string,
  body: IdentifyBody,
): Promise<GuestIdentity> {
  return request(`/guest/sessions/${sessionId}/identify`, {
    method: 'POST',
    body,
  })
}

/** Fetch the prize. Must be called AFTER finalize — 409 otherwise. */
export function fetchPrize(sessionId: string): Promise<PrizeResult> {
  return request(`/guest/sessions/${sessionId}/prize`)
}
