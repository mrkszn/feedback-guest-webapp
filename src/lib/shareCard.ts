import type { Beat } from '@/api/types'

// Renders the mood curve to a PNG blob for the Web Share API.
export async function renderCurveToBlob(
  beats: Beat[],
  scoreOf: (id: string) => number,
  title: string,
): Promise<Blob | null> {
  const W = 1080
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Background
  ctx.fillStyle = '#0f0f14'
  ctx.fillRect(0, 0, W, H)

  // Title
  ctx.fillStyle = '#f0f0f8'
  ctx.font = '600 56px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, W / 2, 200)

  const padX = 160
  const padY = 380
  const plotH = 360
  const n = beats.length

  const pts = beats.map((b, i) => {
    const x = n <= 1 ? W / 2 : padX + (i / (n - 1)) * (W - padX * 2)
    const score = scoreOf(b.id)
    const y = padY + plotH - ((score - 1) / 4) * plotH
    return { x, y }
  })

  // Curve
  const grad = ctx.createLinearGradient(padX, 0, W - padX, 0)
  grad.addColorStop(0, '#f5b14c')
  grad.addColorStop(0.5, '#e0588a')
  grad.addColorStop(1, '#5a4ad1')
  ctx.strokeStyle = grad
  ctx.lineWidth = 12
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
  ctx.stroke()

  // Dots
  ctx.fillStyle = '#e0588a'
  for (const p of pts) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2)
    ctx.fill()
  }

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
