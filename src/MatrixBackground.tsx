import { useEffect, useRef } from 'react'
import { startMatrixAnimation } from './matrix-animation'

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) return startMatrixAnimation(canvas)
  }, [])

  return (
    <canvas ref={canvasRef} className="matrix-background" aria-hidden="true" />
  )
}
