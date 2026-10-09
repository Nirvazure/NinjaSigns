import type { JutsuId, Point } from '../domain/types'

const TAU = Math.PI * 2

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string | CanvasGradient,
  stroke = '#27352e',
) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 3
    ctx.stroke()
  }
}

function polygon(
  ctx: CanvasRenderingContext2D,
  points: number[][],
  fill: string,
  stroke = '#27352e',
) {
  ctx.beginPath()
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x!, y!) : ctx.lineTo(x!, y!)))
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 3
    ctx.stroke()
  }
}

// Original game artwork: a compact, ink-outlined toad silhouette with a shinobi coat.
export function drawToad(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  breath = 0,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale * (1 + Math.sin(breath) * 0.008))
  ellipse(ctx, 0, 149, 132, 17, '#142e262e', '')
  polygon(
    ctx,
    [
      [48, -90],
      [77, -113],
      [178, 130],
      [160, 139],
    ],
    '#323f42',
  )
  polygon(
    ctx,
    [
      [71, -116],
      [81, -122],
      [91, -110],
      [77, -102],
    ],
    '#d3b972',
  )
  ellipse(ctx, -88, 109, 66, 36, '#927045')
  ellipse(ctx, 88, 109, 66, 36, '#927045')
  polygon(
    ctx,
    [
      [-154, 128],
      [-169, 145],
      [-143, 140],
      [-128, 146],
      [-120, 133],
    ],
    '#bda36b',
  )
  polygon(
    ctx,
    [
      [154, 128],
      [169, 145],
      [143, 140],
      [128, 146],
      [120, 133],
    ],
    '#bda36b',
  )
  ellipse(ctx, 0, 53, 108, 94, '#b18c52')
  ellipse(ctx, 0, 66, 74, 71, '#ddca8d')
  polygon(
    ctx,
    [
      [-98, -4],
      [-54, -32],
      [-33, 13],
      [-57, 81],
      [-81, 111],
      [-109, 45],
    ],
    '#374941',
  )
  polygon(
    ctx,
    [
      [98, -4],
      [54, -32],
      [33, 13],
      [57, 81],
      [81, 111],
      [109, 45],
    ],
    '#374941',
  )
  polygon(
    ctx,
    [
      [-56, -23],
      [-40, -18],
      [-24, 16],
      [-49, 42],
    ],
    '#b7cbb3',
  )
  polygon(
    ctx,
    [
      [56, -23],
      [40, -18],
      [24, 16],
      [49, 42],
    ],
    '#b7cbb3',
  )
  ellipse(ctx, -114, 34, 35, 63, '#ac8650')
  ellipse(ctx, 114, 34, 35, 63, '#ac8650')
  ellipse(ctx, -116, 83, 31, 19, '#c0a065')
  ellipse(ctx, 116, 83, 31, 19, '#c0a065')
  polygon(
    ctx,
    [
      [-95, 31],
      [-130, -10],
      [-113, -28],
      [-75, 9],
    ],
    '#455c50',
  )
  polygon(
    ctx,
    [
      [95, 31],
      [130, -10],
      [113, -28],
      [75, 9],
    ],
    '#455c50',
  )
  ellipse(ctx, 0, -35, 106, 68, '#ad8850')
  ellipse(ctx, -57, -78, 38, 32, '#ac8850')
  ellipse(ctx, 57, -78, 38, 32, '#ac8850')
  ellipse(ctx, -57, -78, 27, 17, '#e8d99d')
  ellipse(ctx, 57, -78, 27, 17, '#e8d99d')
  ellipse(ctx, -54, -80, 6, 15, '#283529')
  ellipse(ctx, 54, -80, 6, 15, '#283529')
  polygon(
    ctx,
    [
      [-88, -95],
      [-28, -88],
      [-33, -81],
      [-89, -86],
    ],
    '#44543a',
  )
  polygon(
    ctx,
    [
      [88, -95],
      [28, -88],
      [33, -81],
      [89, -86],
    ],
    '#44543a',
  )
  ellipse(ctx, 0, -22, 90, 32, '#c9aa69')
  ctx.beginPath()
  ctx.moveTo(-78, -28)
  ctx.quadraticCurveTo(0, 5, 78, -28)
  ctx.strokeStyle = '#374333'
  ctx.lineWidth = 4
  ctx.stroke()
  ellipse(ctx, -19, -44, 4, 3, '#5f5936', '')
  ellipse(ctx, 19, -44, 4, 3, '#5f5936', '')
  for (let i = 0; i < 12; i++) {
    const side = i < 6 ? -1 : 1
    ellipse(
      ctx,
      side * (58 + (i % 3) * 12),
      -50 + Math.floor((i % 6) / 3) * 19,
      3,
      2,
      '#76663c',
      '',
    )
  }
  polygon(
    ctx,
    [
      [-99, -50],
      [-57, -34],
      [-95, -11],
    ],
    '#793e36',
    '',
  )
  ctx.beginPath()
  ctx.moveTo(48, -21)
  ctx.lineTo(125, -21)
  ctx.strokeStyle = '#584630'
  ctx.lineWidth = 9
  ctx.stroke()
  polygon(
    ctx,
    [
      [120, -33],
      [147, -33],
      [145, 1],
      [129, 3],
    ],
    '#a07444',
  )
  ctx.fillStyle = '#e2c892'
  ctx.fillRect(120, -37, 28, 6)
  ctx.fillStyle = '#e6ead6'
  ctx.font = 'bold 25px serif'
  ctx.textAlign = 'center'
  ctx.fillText('忍', 79, 25)
  ctx.restore()
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1, 0.32)
  ctx.rotate(time * 0.06)
  ctx.strokeStyle = '#a6d6aa'
  ctx.lineWidth = 2
  ctx.shadowColor = '#6abf96'
  ctx.shadowBlur = 12
  for (const factor of [1, 0.86, 0.58]) {
    ctx.beginPath()
    ctx.arc(0, 0, radius * factor, 0, TAU)
    ctx.stroke()
  }
  for (let i = 0; i < 12; i++) {
    const angle = (i * TAU) / 12
    ctx.save()
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(radius * 0.6, 0)
    ctx.lineTo(radius * 0.85, 0)
    ctx.stroke()
    ctx.fillStyle = '#cce7c3'
    ctx.font = `${Math.max(12, radius * 0.12)}px serif`
    ctx.textAlign = 'center'
    ctx.fillText('子丑寅卯辰巳午未申酉戌亥'[i]!, radius * 0.72, 0)
    ctx.restore()
  }
  ctx.restore()
}

function drawSummoning(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  anchor: Point,
  poster: boolean,
) {
  const entrance = poster ? 1 : Math.min(1, Math.max(0, (t - 0.45) / 0.8))
  const fade = poster ? 1 : Math.min(1, Math.max(0, (5.2 - t) / 0.65))
  const x = width * (poster ? 0.5 : Math.min(0.65, Math.max(0.35, anchor.x))),
    y = height * 0.64,
    scale = Math.min(width / 580, height / 365) * 0.86
  ctx.globalAlpha = fade
  drawCircle(ctx, x, y + 132 * scale, 166 * scale, t)
  for (let i = 0; i < 28; i++) {
    const age = (t * 0.55 + i * 0.067) % 1
    const angle = i * 2.399
    const radius = age * 210 * scale
    const px = x + Math.cos(angle) * radius,
      py = y + 90 * scale - Math.sin(age * Math.PI) * 105 * scale + Math.sin(angle) * radius * 0.2
    ctx.globalAlpha = fade * (poster ? 0.15 : (1 - age) * 0.35)
    ellipse(ctx, px, py, (14 + age * 32) * scale, (10 + age * 24) * scale, '#c9e1d0', '')
  }
  ctx.globalAlpha = fade * entrance
  drawToad(ctx, x, y + (1 - entrance) * 70 * scale, scale * (0.8 + entrance * 0.2), t * 2)
  ctx.globalAlpha = 1
}

function drawFireball(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  anchor: Point,
  poster: boolean,
) {
  const p = poster ? 0.65 : Math.min(1, t / 3.4)
  const x = poster ? width * 0.54 : width * (anchor.x + (0.5 - anchor.x) * p)
  const y = poster ? height * 0.5 : height * (anchor.y - 0.16 * p)
  const radius = Math.min(width, height) * (poster ? 0.17 : 0.06 + Math.sin(p * Math.PI) * 0.24)
  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < 65; i++) {
    const angle = i * 2.399 + t * (i % 2 ? 1 : -1) * 0.6
    const length = radius * (1.2 + Math.sin(i * 13.1 + t * 7) * 0.2)
    const tail = radius * (0.32 + (i % 6) * 0.065)
    const sx = x + Math.cos(angle) * radius * 0.48,
      sy = y + Math.sin(angle) * radius * 0.48
    const ex = x + Math.cos(angle) * length,
      ey = y + Math.sin(angle) * length
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.quadraticCurveTo(ex + Math.sin(t * 5 + i) * tail, ey - tail, ex, ey)
    ctx.strokeStyle = i % 3 === 0 ? '#ffce72' : i % 2 ? '#ed742e' : '#c8442b'
    ctx.lineWidth = radius * (0.06 + (i % 4) * 0.015)
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  const glow = ctx.createRadialGradient(x - radius * 0.2, y - radius * 0.2, 0, x, y, radius)
  glow.addColorStop(0, '#fff2bf')
  glow.addColorStop(0.45, '#ffb444')
  glow.addColorStop(0.85, '#db5025')
  glow.addColorStop(1, '#db502500')
  ellipse(ctx, x, y, radius, radius, glow, '')
  for (let i = 0; i < 36; i++) {
    const a = i * 2.3 + t
    const r = radius * (1.3 + (i % 9) * 0.13)
    ellipse(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 1 + (i % 3), 1 + (i % 3), '#ffc079', '')
  }
  ctx.globalCompositeOperation = 'source-over'
}

function drawChidori(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  anchor: Point,
  poster: boolean,
) {
  const x = width * (poster ? 0.5 : anchor.x),
    y = height * (poster ? 0.5 : anchor.y)
  const radius = Math.min(width, height) * 0.13
  ctx.globalCompositeOperation = 'screen'
  ctx.shadowColor = '#7ec9e0'
  ctx.shadowBlur = 18
  for (let i = 0; i < 18; i++) {
    const angle = (i * TAU) / 18 + Math.sin(t) * 0.2
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 1; k < 7; k++) {
      const r = radius * k * (0.33 + (i % 3) * 0.08)
      const jitter = Math.sin(i * 31 + k * 18 + Math.floor(t * 12)) * radius * 0.35
      ctx.lineTo(
        x + Math.cos(angle) * r + Math.sin(angle) * jitter,
        y + Math.sin(angle) * r + Math.cos(angle) * jitter,
      )
    }
    ctx.strokeStyle = i % 2 ? '#a3dff0' : '#eefaff'
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.5
    ctx.stroke()
  }
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius)
  glow.addColorStop(0, '#ffffff')
  glow.addColorStop(0.18, '#cfecf5')
  glow.addColorStop(0.55, '#6db9d6a0')
  glow.addColorStop(1, '#3e8dab00')
  ellipse(ctx, x, y, radius, radius, glow, '')
  ctx.shadowBlur = 0
  ctx.globalCompositeOperation = 'source-over'
}

const renderers = { summoning: drawSummoning, fireball: drawFireball, chidori: drawChidori }

export function renderEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  id: JutsuId,
  time: number,
  anchor: Point = { x: 0.5, y: 0.55 },
  poster = false,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  renderers[id](ctx, width, height, time, anchor, poster)
  ctx.restore()
}

export function renderPoster(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  id: JutsuId,
) {
  ctx.fillStyle = '#18231f'
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  ctx.strokeStyle = '#ffffff0c'
  ctx.lineWidth = 1
  for (let x = 0; x < width; x += 48) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += 48) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.restore()
  const layer = document.createElement('canvas')
  layer.width = width
  layer.height = height
  renderEffect(layer.getContext('2d')!, width, height, id, 1.7, { x: 0.5, y: 0.55 }, true)
  ctx.drawImage(layer, 0, 0)
}
