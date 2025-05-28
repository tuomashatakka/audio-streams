/**
 * Timeline Component - displays time ruler and playback head
 */

import { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import { formatTime, timeToPixels, pixelsToTime } from '../../utils/audioUtils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './Timeline.css'


interface TimelineProps {
  duration:          number
  currentTime:       number
  pixelsPerSecond:   number
  bpm:               number
  timeSignature:     { numerator: number; denominator: number }
  height?:           number
  isCollapsed?:      boolean
  onScrub:           (time: number) => void
  onZoomChange:      (pixelsPerSecond: number) => void
  onToggleCollapse?: () => void
}


function Timeline ({
  duration,
  currentTime,
  pixelsPerSecond,
  bpm,
  timeSignature,
  height = 48,
  isCollapsed = false,
  onScrub,
  onZoomChange,
  onToggleCollapse
}: TimelineProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging   = useRef(false)

  const width = timeToPixels(duration, pixelsPerSecond)

  // Draw the timeline
  // eslint-disable-next-line max-statements, complexity
  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas)
      return

    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.fillStyle = '#222222'
    ctx.fillRect(0, 0, width, height)

    // Set text properties
    ctx.fillStyle = 'currentColor'
    ctx.font = '10px system-ui'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    // Calculate time intervals for markers
    const secondsPerPixel = 1 / pixelsPerSecond
    let majorInterval     = 1 // seconds
    let minorInterval     = 0.25 // seconds

    // Adjust intervals based on zoom level
    if (secondsPerPixel > 0.5) {
      majorInterval = 10
      minorInterval = 2
    }
    else if (secondsPerPixel > 0.1) {
      majorInterval = 5
      minorInterval = 1
    }
    else if (secondsPerPixel > 0.02) {
      majorInterval = 2
      minorInterval = 0.5
    }

    // Draw time markers
    for (let time = 0; time <= duration; time += minorInterval) {
      const x       = timeToPixels(time, pixelsPerSecond)
      const isMajor = time % majorInterval === 0

      // Draw tick mark
      ctx.strokeStyle = isMajor ? '#666666' : '#444444'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, height - (isMajor ? 20 : 10))
      ctx.lineTo(x, height)
      ctx.stroke()

      // Draw time label for major ticks
      if (isMajor && x > 0) {
        ctx.fillStyle = '#aaaaaa'
        ctx.fillText(formatTime(time), x + 2, height - 32)
      }
    }

    // Draw bars/beats markers if zoomed in enough
    if (pixelsPerSecond > 20) {
      const beatsPerSecond = bpm / 60
      const beatsPerBar    = timeSignature.numerator
      const secondsPerBeat = 1 / beatsPerSecond
      const secondsPerBar  = secondsPerBeat * beatsPerBar

      for (let time = 0; time <= duration; time += secondsPerBeat) {
        const x          = timeToPixels(time, pixelsPerSecond)
        const isBarStart = time % secondsPerBar < 0.001

        ctx.strokeStyle = isBarStart ? '#ff5500' : '#ffbe0b'
        ctx.lineWidth = isBarStart ? 2 : 1
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, isBarStart ? 15 : 8)
        ctx.stroke()
      }
    }
  }, [ width, height, duration, pixelsPerSecond, bpm, timeSignature ])

  // Handle click/drag for scrubbing
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current)
      return

    const rect = containerRef.current.getBoundingClientRect()
    const x    = event.clientX - rect.left
    const time = pixelsToTime(x, pixelsPerSecond)

    isDragging.current = true

    // Immediate scrub on click
    const clampedTime = Math.max(0, Math.min(time, duration))
    onScrub(clampedTime)

    // Add global event listeners for dragging
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !containerRef.current)
        return

      const rect        = containerRef.current.getBoundingClientRect()
      const x           = moveEvent.clientX - rect.left
      const time        = pixelsToTime(x, pixelsPerSecond)
      const clampedTime = Math.max(0, Math.min(time, duration))
      onScrub(clampedTime)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [ pixelsPerSecond, duration, onScrub ])

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault()

    const zoomFactor         = event.deltaY > 0 ? 0.9 : 1.1
    const newPixelsPerSecond = Math.max(10, Math.min(200, pixelsPerSecond * zoomFactor))

    onZoomChange(newPixelsPerSecond)
  }, [ pixelsPerSecond, onZoomChange ])

  // Redraw timeline when props change
  useEffect(() => {
    drawTimeline()
  }, [ drawTimeline ])

  // Calculate playhead position
  const playheadPosition = timeToPixels(currentTime, pixelsPerSecond)

  const zoomOut   = useCallback(() => onZoomChange(pixelsPerSecond * 0.8), [ pixelsPerSecond ])
  const zoomIn    = useCallback(() => onZoomChange(pixelsPerSecond * 1.125), [ pixelsPerSecond ])
  const zoomLevel = useMemo(() => Math.round(pixelsPerSecond), [ pixelsPerSecond ])

  return <div className={`timeline-container ${isDragging.current ? 'scrubbing' : ''} ${isCollapsed ? 'collapsed' : ''}`} style={{ height }}>
    <div
      ref={containerRef}
      className='timeline-canvas-container'
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ width }}
    >
      <canvas ref={canvasRef} className='timeline-canvas' />

      <div
        className='playhead'
        style={{
          transform: `translateX(${playheadPosition}px)`,
          height:    `${height}px`
        }}
      >
        <div className='playhead-handle' />
        <div className='playhead-line' />
      </div>
    </div>

    <div className={`timeline-controls ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className='collapse-button'
        onClick={onToggleCollapse}
        title={isCollapsed ? 'Expand controls' : 'Collapse controls'}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {!isCollapsed &&
        <>
          <button className='zoom-button' onClick={zoomOut} title='Zoom out'>-</button>
          <span className='zoom-level'>{zoomLevel}px/s</span>
          <button className='zoom-button' onClick={zoomIn} title='Zoom in'>+</button>
        </>
      }
    </div>
  </div>
}

export default Timeline
