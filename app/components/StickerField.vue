<template>
  <div ref="hostRef" class="sticker-field" aria-hidden="true">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Chip {
  label: string
  accent: boolean
  size: number
  radius: number
  x: number
  y: number
  ax: number
  ay: number
  vx: number
  vy: number
  rot: number
  rot0: number
  vrot: number
  phase: number
  freq: number
}

const hostRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const LABELS = ['PNG', 'WEBP', 'GIF', 'WEBM', 'VP9', 'MP4', '512', '3s']

let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let chips: Chip[] = []
let width = 0
let height = 0
let dpr = 1
let running = false
let inView = true
let pointer = { x: -9999, y: -9999 }
let palette = { face: '#ffffff', edge: '#ffffff', ink: '#16161a', accent: '#ff4a1f', onAccent: '#16161a', line: 'rgba(22,22,26,0.14)' }
let time = 0
let last = 0

const reduceQuery = () => window.matchMedia('(prefers-reduced-motion: reduce)')

const readPalette = () => {
  const style = getComputedStyle(document.documentElement)
  palette = {
    face: style.getPropertyValue('--surface').trim() || '#ffffff',
    edge: style.getPropertyValue('--sticker-edge').trim() || '#ffffff',
    ink: style.getPropertyValue('--ink').trim() || '#16161a',
    accent: style.getPropertyValue('--accent').trim() || '#ff4a1f',
    onAccent: style.getPropertyValue('--on-accent').trim() || '#16161a',
    line: style.getPropertyValue('--line').trim() || 'rgba(22,22,26,0.14)'
  }
}

const buildChips = () => {
  // Loose diagonal scatter, denser toward the upper right where the hero type is not.
  const slots = [
    { fx: 0.78, fy: 0.2, size: 112 },
    { fx: 0.55, fy: 0.52, size: 86 },
    { fx: 0.88, fy: 0.62, size: 96 },
    { fx: 0.4, fy: 0.16, size: 74 },
    { fx: 0.68, fy: 0.85, size: 80 },
    { fx: 0.92, fy: 0.32, size: 68 },
    { fx: 0.3, fy: 0.78, size: 70 },
    { fx: 0.62, fy: 0.14, size: 62 }
  ]

  chips = slots.map((slot, i) => {
    const size = slot.size
    return {
      label: LABELS[i % LABELS.length] ?? 'PNG',
      accent: i === 0,
      size,
      radius: size * 0.26,
      x: slot.fx * width,
      y: slot.fy * height,
      ax: slot.fx * width,
      ay: slot.fy * height,
      vx: 0,
      vy: 0,
      rot: 0,
      rot0: (i % 2 === 0 ? 1 : -1) * (0.06 + (i % 3) * 0.05),
      vrot: 0,
      phase: i * 1.7,
      freq: 0.5 + (i % 4) * 0.16
    }
  })
}

const resize = () => {
  const host = hostRef.value
  const canvas = canvasRef.value
  if (!host || !canvas) return

  const rect = host.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = rect.width
  height = rect.height
  canvas.width = Math.max(1, Math.round(width * dpr))
  canvas.height = Math.max(1, Math.round(height * dpr))
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (!chips.length) buildChips()
  else {
    const anchors = [
      { fx: 0.78, fy: 0.2 },
      { fx: 0.55, fy: 0.52 },
      { fx: 0.88, fy: 0.62 },
      { fx: 0.4, fy: 0.16 },
      { fx: 0.68, fy: 0.85 },
      { fx: 0.92, fy: 0.32 },
      { fx: 0.3, fy: 0.78 },
      { fx: 0.62, fy: 0.14 }
    ]
    chips.forEach((chip, i) => {
      const slot = anchors[i % anchors.length]
      if (!slot) return
      chip.ax = slot.fx * width
      chip.ay = slot.fy * height
    })
  }
}

const roundRect = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

const draw = () => {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return

  ctx.clearRect(0, 0, width, height)

  // Dashed die-cut outlines drifting behind the chips
  ctx.save()
  ctx.strokeStyle = palette.line
  ctx.lineWidth = 1
  ctx.setLineDash([7, 9])
  ctx.lineDashOffset = -time * 14
  ctx.beginPath()
  ctx.arc(width * 0.82, height * 0.44, Math.min(width, height) * 0.42, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineDashOffset = time * 10
  ctx.beginPath()
  ctx.arc(width * 0.46, height * 0.86, Math.min(width, height) * 0.3, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  for (const chip of chips) {
    const s = chip.size
    ctx.save()
    ctx.translate(chip.x, chip.y)
    ctx.rotate(chip.rot)

    // Die-cut edge
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 7
    ctx.fillStyle = palette.edge
    roundRect(ctx, -s / 2 - 5, -s / 2 - 5, s + 10, s + 10, chip.radius + 6)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Sticker face
    ctx.fillStyle = chip.accent ? palette.accent : palette.face
    roundRect(ctx, -s / 2, -s / 2, s, s, chip.radius)
    ctx.fill()
    ctx.strokeStyle = chip.accent ? 'transparent' : palette.line
    ctx.lineWidth = 1
    ctx.stroke()

    // Label
    ctx.fillStyle = chip.accent ? palette.onAccent : palette.ink
    ctx.font = `700 ${Math.round(s * 0.24)}px 'JetBrains Mono Variable', 'Space Grotesk Variable', monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(chip.label, 0, 1)
    ctx.restore()
  }
}

const step = (now: number) => {
  if (!last) last = now
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  time += dt

  for (const chip of chips) {
    // Spring back toward the anchor
    chip.vx += (chip.ax - chip.x) * 3.2 * dt
    chip.vy += (chip.ay - chip.y) * 3.2 * dt

    // Pointer repulsion
    const dx = chip.x - pointer.x
    const dy = chip.y - pointer.y
    const dist = Math.hypot(dx, dy)
    const range = 150
    if (dist < range && dist > 0.01) {
      const push = ((range - dist) / range) * 1400
      chip.vx += (dx / dist) * push * dt
      chip.vy += (dy / dist) * push * dt
    }

    // Idle wander
    chip.vx += Math.sin(time * chip.freq + chip.phase) * 26 * dt
    chip.vy += Math.cos(time * chip.freq * 0.8 + chip.phase) * 20 * dt

    chip.vx *= 0.94
    chip.vy *= 0.94
    chip.x += chip.vx * dt
    chip.y += chip.vy * dt

    // Rotation springs home
    chip.vrot += (chip.rot0 - chip.rot) * 5 * dt
    chip.vrot *= 0.9
    chip.rot += chip.vrot * dt

    // Walls
    const m = chip.size / 2 + 14
    if (chip.x < m) { chip.x = m; chip.vx *= -0.5 }
    if (chip.x > width - m) { chip.x = width - m; chip.vx *= -0.5 }
    if (chip.y < m) { chip.y = m; chip.vy *= -0.5 }
    if (chip.y > height - m) { chip.y = height - m; chip.vy *= -0.5 }
  }

  draw()
  if (running) raf = requestAnimationFrame(step)
}

const start = () => {
  if (running || !inView || reduceQuery().matches) return
  running = true
  last = 0
  raf = requestAnimationFrame(step)
}

const stop = () => {
  running = false
  cancelAnimationFrame(raf)
}

const staticRender = () => {
  // One settled frame for reduced-motion users
  chips.forEach(chip => {
    chip.x = chip.ax + Math.sin(chip.phase) * 6
    chip.y = chip.ay + Math.cos(chip.phase) * 6
    chip.rot = chip.rot0
  })
  draw()
}

const onPointerMove = (event: PointerEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

const onPointerLeave = () => {
  pointer = { x: -9999, y: -9999 }
}

let resizeObserver: ResizeObserver | null = null
let viewObserver: IntersectionObserver | null = null
let themeMedia: MediaQueryList | null = null
let surface: HTMLElement | null = null

onMounted(() => {
  const canvas = canvasRef.value
  const host = hostRef.value
  if (!canvas || !host) return
  ctx = canvas.getContext('2d')

  // Track the pointer on the parent hero surface so overlaying copy
  // and buttons keep working; the canvas itself never captures events.
  surface = (host.parentElement as HTMLElement) || host

  readPalette()
  resize()

  themeMedia = window.matchMedia('(prefers-color-scheme: dark)')
  const onThemeFlip = () => {
    readPalette()
    if (!running) staticRender()
  }
  themeMedia.addEventListener('change', onThemeFlip)
  const themeObserver = new MutationObserver(onThemeFlip)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  resizeObserver = new ResizeObserver(() => {
    resize()
    if (!running) staticRender()
  })
  resizeObserver.observe(host)

  viewObserver = new IntersectionObserver(([entry]) => {
    inView = !!entry?.isIntersecting
    if (inView) start()
    else stop()
  }, { threshold: 0 })
  viewObserver.observe(host)

  const onVisibility = () => {
    if (document.hidden) stop()
    else start()
  }
  document.addEventListener('visibilitychange', onVisibility)

  host.addEventListener('pointermove', onPointerMove)
  host.addEventListener('pointerleave', onPointerLeave)

  void document.fonts?.ready.then(() => {
    if (!running) staticRender()
  })

  if (reduceQuery().matches) {
    staticRender()
  } else {
    surface?.addEventListener('pointermove', onPointerMove)
    surface?.addEventListener('pointerleave', onPointerLeave)
    start()
  }

  ;(host as HTMLElement & { __fieldCleanup?: () => void }).__fieldCleanup = () => {
    stop()
    themeMedia?.removeEventListener('change', onThemeFlip)
    themeObserver.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    surface?.removeEventListener('pointermove', onPointerMove)
    surface?.removeEventListener('pointerleave', onPointerLeave)
  }
})

onBeforeUnmount(() => {
  ;(hostRef.value as (HTMLElement & { __fieldCleanup?: () => void }) | null)?.__fieldCleanup?.()
  resizeObserver?.disconnect()
  viewObserver?.disconnect()
})
</script>

<style scoped>
.sticker-field {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.sticker-field canvas {
  display: block;
}
</style>
