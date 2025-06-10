/**
 * Timeline Component - displays time ruler and playback head using SVG
 */

import { useRef, useCallback, useMemo, useLayoutEffect, useState } from 'react'
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

const ZOOM_SPEED = 1.02

export default function Timeline ({
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
  const containerRef            = useRef<HTMLDivElement>(null)
  const isDragging              = useRef(false)
  const [ uiWidth, setUiWidth ] = useState(0)
  const width                   = timeToPixels(duration, pixelsPerSecond)

  // Generate timeline markers data
  const timelineData = useMemo(() => {
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

    const timeMarkers = []
    const beatMarkers = []

    // Generate time markers
    for (let time = 0; time <= duration; time += minorInterval) {
      const x       = timeToPixels(time, pixelsPerSecond)
      const isMajor = time % majorInterval === 0

      timeMarkers.push({
        x,
        time,
        isMajor,
        label: isMajor && x > 0 ? formatTime(time) : null
      })
    }

    // Generate beat/bar markers if zoomed in enough
    if (pixelsPerSecond > 20) {
      const beatsPerSecond = bpm / 60
      const beatsPerBar    = timeSignature.numerator
      const secondsPerBeat = 1 / beatsPerSecond
      const secondsPerBar  = secondsPerBeat * beatsPerBar

      for (let time = 0; time <= duration; time += secondsPerBeat) {
        const x          = timeToPixels(time, pixelsPerSecond)
        const isBarStart = time % secondsPerBar < 0.001

        beatMarkers.push({
          x,
          isBarStart
        })
      }
    }

    return { timeMarkers, beatMarkers }
  }, [ duration, pixelsPerSecond, bpm, timeSignature ])

  // Handle click/drag for scrubbing
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!containerRef.current)
      return

    const rect        = containerRef.current.getBoundingClientRect()
    const x           = event.clientX - rect.left
    const time        = pixelsToTime(x, pixelsPerSecond)
    const clampedTime = Math.max(0, Math.min(time, duration))

    isDragging.current = true

    // Immediate scrub on click
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
    console.log(event)
    event.preventDefault()

    const zoomFactor         = event.deltaY > 0 ? 1 / ZOOM_SPEED : ZOOM_SPEED
    const newPixelsPerSecond = Math.max(10, Math.min(200, pixelsPerSecond * zoomFactor))

    onZoomChange(newPixelsPerSecond)
  }, [ pixelsPerSecond, onZoomChange ])

  useLayoutEffect(() => {
    if (!containerRef.current)
      return

    const rect = containerRef.current.parentElement?.getBoundingClientRect()
    if (rect)
      setUiWidth(rect.width)

    // containerRef.current.parentElement?.style.setProperty('width', `${rect.width}px`)
    console.log(rect)
  }, [ containerRef ])

  // Calculate playhead position
  const playheadPosition = timeToPixels(currentTime, pixelsPerSecond)

  const zoomOut   = useCallback(() => onZoomChange(pixelsPerSecond * 0.8), [ pixelsPerSecond ])
  const zoomIn    = useCallback(() => onZoomChange(pixelsPerSecond * 1.125), [ pixelsPerSecond ])
  const zoomLevel = useMemo(() => Math.round(pixelsPerSecond), [ pixelsPerSecond ])

  return <div className={ `timeline-container ${isDragging.current ? 'scrubbing' : ''} ${isCollapsed ? 'collapsed' : ''}` } style={{ width: uiWidth }}>
    <div
      ref={ containerRef }
      className='timeline-svg-container'
      onMouseDown={ handleMouseDown }
      onWheel={ handleWheel }
      style={{ width: uiWidth }}>
      <svg
        className='timeline-svg'
        width={ uiWidth }
        height={ height }
        viewBox={ `0 0 ${uiWidth} ${height}` }
        role='img'
        aria-label={ `Timeline showing ${formatTime(duration)} duration, current time ${formatTime(currentTime)}` }>

        <rect
          width={ width }
          height={ height }
          fill='#222222'
        />

        {timelineData.beatMarkers.map((marker, index) =>
          <line
            key={ `beat-${index}` }
            x1={ marker.x }
            y1={ 0 }
            x2={ marker.x }
            y2={ marker.isBarStart ? 15 : 8 }
            stroke={ marker.isBarStart ? '#ff5500' : '#ffbe0b' }
            strokeWidth={ marker.isBarStart ? 2 : 1 } />
        )}

        {/* Time markers */}
        {timelineData.timeMarkers.map((marker, index) =>
          <g key={ `time-${index}` }>
            <line
              x1={ marker.x }
              y1={ height - (marker.isMajor ? 20 : 10) }
              x2={ marker.x }
              y2={ height }
              stroke={ marker.isMajor ? '#666666' : '#444444' }
              strokeWidth={ 1 }
            />

            {marker.label &&
              <text
                x={ marker.x + 2 }
                y={ height - 32 }
                fill='#aaaaaa'
                fontSize='10'
                fontFamily='system-ui'
                dominantBaseline='hanging'
              >
                {marker.label}
              </text>
            }
          </g>
        )}
      </svg>

      {/* Playhead */}
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

    <div className={ `timeline-controls ${isCollapsed ? 'collapsed' : ''}` }>
      <button
        className='collapse-button'
        onClick={ onToggleCollapse }
        title={ isCollapsed ? 'Expand controls' : 'Collapse controls' }
      >
        {isCollapsed ? <ChevronRight size={ 16 } /> : <ChevronLeft size={ 16 } />}
      </button>

      {!isCollapsed &&
        <>
          <button className='zoom-button' onClick={ zoomOut } title='Zoom out'>-</button>
          <span className='zoom-level'>{zoomLevel}px/s</span>
          <button className='zoom-button' onClick={ zoomIn } title='Zoom in'>+</button>
        </>
      }
    </div>
  </div>
}
