/**
 * Waveform visualization component using Canvas API
 */

import { useRef, useEffect } from 'react'
import { WaveformOptions } from '../../types/audio'

interface WaveformProps {
  waveformData: number[]
  width: number
  height: number
  color?: string
  backgroundColor?: string
  strokeWidth?: number
  className?: string
}

function Waveform({
  waveformData,
  width,
  height,
  color = '#3a86ff',
  backgroundColor = 'transparent',
  strokeWidth = 1,
  className
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw the waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveformData.length) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw waveform
    ctx.strokeStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const centerY = height / 2
    const maxAmplitude = height / 2 - 2 // Leave small margin

    ctx.beginPath()

    // Draw the waveform as connected lines
    for (let i = 0; i < waveformData.length; i++) {
      const x = (i / (waveformData.length - 1)) * width
      const amplitude = waveformData[i] * maxAmplitude
      
      // Draw both positive and negative peaks
      const y1 = centerY - amplitude
      const y2 = centerY + amplitude

      if (i === 0) {
        ctx.moveTo(x, y1)
      } else {
        ctx.lineTo(x, y1)
      }
    }

    // Draw bottom half
    for (let i = waveformData.length - 1; i >= 0; i--) {
      const x = (i / (waveformData.length - 1)) * width
      const amplitude = waveformData[i] * maxAmplitude
      const y2 = centerY + amplitude
      ctx.lineTo(x, y2)
    }

    ctx.closePath()
    ctx.fillStyle = color + '40' // Add some transparency
    ctx.fill()
    ctx.stroke()

  }, [waveformData, width, height, color, backgroundColor, strokeWidth])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block' }}
      role="img"
      aria-label="Audio waveform visualization"
    />
  )
}

export default Waveform
