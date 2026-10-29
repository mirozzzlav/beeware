import { useEffect, useRef } from 'react'
import { renderMatrixBackground } from './matrix-renderer'
import './MatrixBackground.css'

export default function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) return renderMatrixBackground(canvas)
  }, [])

  return (
    <canvas ref={canvasRef} className="matrix-background" aria-hidden="true" />
  )
}
