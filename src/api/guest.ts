import { request } from './client'
import type {
  AuthResponse,
  BeatPatch,
  Dig,
  DigAnswer,
  DigAnswerResponse,
  Journey,
  SessionState,
  VoiceUploadResponse,
} from './types'

// ── Auth ────────────────────────────────────────────────────────────────

/** Exchange a one-time table/receipt token for a session JWT. */
export function authWithToken(t: string): Promise<AuthResponse> {
  return request('/guest/auth', { method: 'POST', body: { t }, auth: false })
}

/** Start an anonymous session (web_anon). `journey` selects e.g. delivery. */
export function startAnonymousSession(): Promise<AuthResponse> {
  return request('/guest/sessions', { method: 'POST', body: {}, auth: false })
}

// ── Journey + session ───────────────────────────────────────────────────

export function fetchJourney(): Promise<Journey> {
  return request('/guest/journey')
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
