import { useCallback, useRef, useState } from 'react'

type RecState = 'idle' | 'recording' | 'recorded' | 'denied'

// Picks an mp3/ogg-ish mime the browser actually supports.
function pickMime(): string | undefined {
  const candidates = ['audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm']
  if (typeof MediaRecorder === 'undefined') return undefined
  return candidates.find((m) => MediaRecorder.isTypeSupported(m))
}

export function useVoiceRecorder() {
  const [state, setState] = useState<RecState>('idle')
  const [blob, setBlob] = useState<Blob | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const supported =
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'

  const start = useCallback(async () => {
    if (!supported) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = pickMime()
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      rec.onstop = () => {
        const b = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        setBlob(b)
        setState('recorded')
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      recorderRef.current = rec
      rec.start()
      setState('recording')
    } catch {
      setState('denied')
    }
  }, [supported])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setBlob(null)
    setState('idle')
  }, [])

  return { supported, state, blob, start, stop, reset }
}
