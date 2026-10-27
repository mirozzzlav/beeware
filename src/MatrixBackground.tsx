import { useEffect, useRef } from 'react'
import tokens from './tokens.json'

const alphabet = Array.from(
  '0123456789アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
)
const random = (min: number, max: number) => min + Math.random() * (max - min)
const randomGlyph = () => alphabet[Math.floor(Math.random() * alphabet.length)]
const lineHeight = Number.parseFloat(tokens['line-height-matrix'])

interface Stream {
  x: number
  head: number
  speed: number
  glyphs: string[]
  brightness: number
  nextMutation: number
}

function createStream(x: number, head: number): Stream {
  return {
    x,
    head,
    speed: random(24, 76),
    glyphs: Array.from({ length: Math.floor(random(12, 34)) }, randomGlyph),
    brightness: random(0.45, 0.95),
    nextMutation: 0,
  }
}

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0
    let height = 0
    let streams: Stream[] = []
    let frame = 0
    let previousTime = 0

    function draw(time: number, elapsed: number) {
      if (!context) return
      context.clearRect(0, 0, width, height)
      context.font = `${tokens['font-weight-regular']} ${tokens['font-size-small']} ${tokens['font-family-mono']}`
      context.textAlign = 'center'

      for (let index = 0; index < streams.length; index++) {
        let stream = streams[index]
        stream.head += stream.speed * elapsed
        if (stream.head - stream.glyphs.length * lineHeight > height) {
          stream = createStream(stream.x, -random(30, 450))
          streams[index] = stream
        }
        if (time >= stream.nextMutation) {
          stream.glyphs[Math.floor(Math.random() * stream.glyphs.length)] =
            randomGlyph()
          stream.nextMutation = time + random(100, 420)
        }
        stream.glyphs.forEach((glyph, row) => {
          const y = stream.head - row * lineHeight
          if (y < -lineHeight || y > height + lineHeight) return
          const opacity =
            stream.brightness * (1 - row / stream.glyphs.length) ** 1.5
          context.globalAlpha = opacity
          context.fillStyle =
            row === 0
              ? tokens['palette-green-200']
              : tokens['palette-green-400']
          context.fillText(glyph, stream.x, y)
        })
      }
      context.globalAlpha = 1
    }

    function resize() {
      if (!canvas || !context) return
      width = window.innerWidth
      height = window.innerHeight
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      context.setTransform(scale, 0, 0, scale, 0, 0)
      streams = []
      for (let x = random(8, 18); x < width; x += random(16, 28)) {
        streams.push(createStream(x, random(-height * 0.4, height * 1.35)))
      }
      draw(performance.now(), 0)
    }

    function animate(time: number) {
      frame = window.requestAnimationFrame(animate)
      if (time - previousTime < 1000 / 30) return
      const elapsed = previousTime
        ? Math.min((time - previousTime) / 1000, 0.1)
        : 0
      previousTime = time
      draw(time, elapsed)
    }

    function updateAnimation() {
      window.cancelAnimationFrame(frame)
      previousTime = 0
      if (!document.hidden && !reducedMotion.matches) {
        frame = window.requestAnimationFrame(animate)
      } else if (reducedMotion.matches) {
        draw(performance.now(), 0)
      }
    }

    resize()
    updateAnimation()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', updateAnimation)
    reducedMotion.addEventListener('change', updateAnimation)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', updateAnimation)
      reducedMotion.removeEventListener('change', updateAnimation)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="matrix-background" aria-hidden="true" />
  )
}
