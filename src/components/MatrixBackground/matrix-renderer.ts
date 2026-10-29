import tokens from '../../tokens.json' with { type: 'json' }

const matrixFontUrl = new URL(
  './assets/DSEG7Classic-Regular.woff2',
  import.meta.url,
).href

const alphabet = ['0', '1']
const bluePalette = [
  tokens['palette-blue-500'],
  tokens['palette-blue-600'],
  tokens['palette-blue-700'],
]
const random = (min: number, max: number) => min + Math.random() * (max - min)
const randomGlyph = () => alphabet[Math.floor(Math.random() * alphabet.length)]
const lineHeight = Number.parseFloat(tokens['line-height-matrix'])
const fontSize = Number.parseFloat(tokens['font-size-small'])
const baseGlyphGap = Number.parseFloat(tokens['space-4'])
const minDigitScale = 0.54
const maxDigitScale = 5.4
const matrixFontFamily = `${tokens['font-family-matrix']}, ${tokens['font-family-mono']}`
let matrixFont: FontFace | undefined

// Give larger glyphs proportionally more room.
const glyphGap = (scale: number) => baseGlyphGap * Math.max(1, scale ** 1.5)

interface Column {
  x: number
  scale: number
  halfWidth: number
}

interface Digit extends Column {
  y: number
  speed: number
  glyph: string
  brightness: number
  color: string
}

function createDigit(column: Column, y: number): Digit {
  const { scale } = column
  const proximity = (scale - minDigitScale) / (maxDigitScale - minDigitScale)
  return {
    ...column,
    y,
    speed: 8 + 142 * proximity ** 1.6,
    glyph: randomGlyph(),
    brightness: 0.25 + proximity * 0.75,
    color:
      Math.random() < 0.3
        ? bluePalette[Math.floor(Math.random() * bluePalette.length)]
        : tokens['palette-black'],
  }
}

function renderMatrixCanvas(
  canvas: HTMLCanvasElement,
  animated: boolean,
): () => void {
  const context = canvas.getContext('2d')
  if (!context) return () => {}

  let width = 0
  let height = 0
  let pixelRatio = 0
  let columns: Column[] = []
  let digits: Digit[] = []
  let spawnRemaining = random(0.12, 0.3)
  let frame = 0
  let previousTime = 0
  let disposed = false

  function spawnDigit(staticPosition = false) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const column = columns[Math.floor(Math.random() * columns.length)]
      if (!column) return
      const { x, scale, halfWidth } = column
      const y = staticPosition
        ? random(fontSize * scale, height)
        : -glyphGap(scale)
      if (
        digits.some((digit) => {
          const clearance = glyphGap(Math.max(scale, digit.scale))
          return (
            Math.abs(digit.x - x) < halfWidth + digit.halfWidth + clearance &&
            Math.abs(digit.y - y) <
              lineHeight * Math.max(scale, digit.scale) + clearance
          )
        })
      ) {
        continue
      }
      digits.push(createDigit(column, y))
      return
    }
  }

  function draw(elapsed = 0) {
    if (!context) return
    context.clearRect(0, 0, width, height)
    context.textAlign = 'center'

    if (animated) {
      spawnRemaining -= elapsed
      if (spawnRemaining <= 0) {
        spawnRemaining += random(0.12, 0.3)
        spawnDigit()
      }
    }

    for (const digit of digits) {
      digit.y += digit.speed * elapsed
      context.font = `${tokens['font-weight-regular']} ${fontSize * digit.scale}px ${matrixFontFamily}`
      context.globalAlpha = digit.brightness
      context.fillStyle = digit.color
      context.fillText(digit.glyph, digit.x, digit.y)
    }
    digits = digits.filter(
      (digit) => digit.y - lineHeight * digit.scale <= height,
    )
    context.globalAlpha = 1
  }

  function resize() {
    if (disposed || !context) return
    width = canvas.clientWidth
    height = canvas.clientHeight
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    context.textAlign = 'center'
    digits = []
    columns = []
    let columnStart = 0
    while (columnStart < width) {
      const columnScale =
        minDigitScale + Math.random() ** 2 * (maxDigitScale - minDigitScale)
      context.font = `${tokens['font-weight-regular']} ${fontSize * columnScale}px ${matrixFontFamily}`
      // Reserve the full painted width, including overhangs beyond the advance.
      const halfWidth = Math.ceil(
        Math.max(
          ...alphabet.flatMap((glyph) => {
            const metrics = context.measureText(glyph)
            return [
              metrics.width / 2,
              metrics.actualBoundingBoxLeft ?? 0,
              metrics.actualBoundingBoxRight ?? 0,
            ]
          }),
        ),
      )
      const columnWidth = 2 * (halfWidth + glyphGap(columnScale))
      if (columnStart + columnWidth > width) break
      columns.push({
        x: columnStart + columnWidth / 2,
        scale: columnScale,
        halfWidth,
      })
      columnStart += columnWidth
    }
    spawnRemaining = random(0.12, 0.3)
    if (!animated) {
      // Fill the canvas immediately, like a snapshot of the running animation.
      const count = Math.ceil(
        (width * height) / (lineHeight * maxDigitScale) ** 2,
      )
      for (let index = 0; index < count; index++) spawnDigit(true)
    }
    draw()
  }

  function resizeIfNeeded() {
    if (
      canvas.clientWidth !== width ||
      canvas.clientHeight !== height ||
      Math.min(window.devicePixelRatio || 1, 2) !== pixelRatio
    ) {
      resize()
    }
  }

  function animate(time: number) {
    frame = window.requestAnimationFrame(animate)
    if (time - previousTime < 1000 / 30) return
    const elapsed = previousTime
      ? Math.min((time - previousTime) / 1000, 0.1)
      : 0
    previousTime = time
    draw(elapsed)
  }

  function updateAnimation() {
    window.cancelAnimationFrame(frame)
    previousTime = 0
    if (!disposed && !document.hidden) {
      frame = window.requestAnimationFrame(animate)
    }
  }

  resize()
  if (animated) updateAnimation()
  matrixFont ??= new FontFace(
    tokens['font-family-matrix'],
    `url("${matrixFontUrl}")`,
  )
  void matrixFont.load().then(
    (font) => {
      document.fonts.add(font)
      if (!disposed) resize()
    },
    () => {
      // Keep the monospace fallback if the bundled font cannot be loaded.
    },
  )
  const resizeObserver = new ResizeObserver(resizeIfNeeded)
  resizeObserver.observe(canvas)
  window.addEventListener('resize', resizeIfNeeded)
  if (animated) {
    document.addEventListener('visibilitychange', updateAnimation)
  }
  return () => {
    disposed = true
    window.cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    window.removeEventListener('resize', resizeIfNeeded)
    if (animated) {
      document.removeEventListener('visibilitychange', updateAnimation)
    }
  }
}

export function renderMatrixBackground(canvas: HTMLCanvasElement): () => void {
  const tablet = window.matchMedia(`(width >= ${tokens['breakpoint-md']})`)
  const desktop = window.matchMedia(`(width >= ${tokens['breakpoint-lg']})`)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const queries = [tablet, desktop, reducedMotion]
  let mode: 'hidden' | 'static' | 'animated' | undefined
  let cleanup: (() => void) | undefined

  function updateBackground() {
    const nextMode = !tablet.matches
      ? 'hidden'
      : desktop.matches && !reducedMotion.matches
        ? 'animated'
        : 'static'
    if (nextMode === mode) return
    cleanup?.()
    mode = nextMode
    cleanup = undefined
    if (mode === 'hidden') {
      // Release the backing buffer and skip font loading and rendering on mobile.
      canvas.width = 0
      canvas.height = 0
    } else {
      cleanup = renderMatrixCanvas(canvas, mode === 'animated')
    }
  }

  updateBackground()
  for (const query of queries) {
    query.addEventListener('change', updateBackground)
  }
  return () => {
    cleanup?.()
    for (const query of queries) {
      query.removeEventListener('change', updateBackground)
    }
  }
}
