/**
 * Audio Clip Component - represents a single audio clip on a track
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AudioClip } from '../../types/audio'
import { timeToPixels, formatTime } from '../../utils/audioUtils'
import Waveform from '../waveform/Waveform'
import './Clip.css'


interface ClipProps {
  clip:            AudioClip
  pixelsPerSecond: number
  trackHeight:     number
  isSelected?:     boolean
  onSelect?:       (clipId: string) => void
  onMove?:         (clipId: string, newStartTime: number) => void
  onResize?:       (clipId: string, newDuration: number) => void
  onMoveToTrack?:  (clipId: string, targetTrackId: string, newStartTime: number) => void
}

const useResizableAndPositionable = ({ onMove, onResize, onMoveToTrack }: Partial<ClipProps>) => {
  const nodeRef     = useRef<HTMLDivElement>(null)
  const modifyState = useRef({
    width:  null,
    action: null,
    x:      null,
    y:      null,
  })

  const clearModifyState = () => {
    const box = nodeRef.current?.getBoundingClientRect()
    return {
      x:     box?.x,
      y:     box?.y,
      width: box?.width,
      time:  Date.now(),
    }
  }

  const setDragStart = () => {
    modifyState.current = { x: null, y: null, width: null, time: null }
  }

  // Handle drag/resize movement (visual only during drag)
  const handleMouseMove = (event: MouseEvent) => {
    const deltaX    = event.clientX - modifyState.current.startX
    const deltaY    = event.clientY - modifyState.current.startY

    if (nodeRef.current)
      nodeRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`
  }

  // Handle drag/resize end (commit changes)
  const handleMouseUp = () => {
    modifyState.current.x = null
    modifyState.current.y = null
    modifyState.current.width = null
    modifyState.current.action = null

    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    if (nodeRef.current)
      nodeRef.current.style.transform = 'translate(0, 0)'
    clearModifyState()
  }

  // Handle drag start
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.target !== event.currentTarget)
      return // Ignore clicks on children

    event.preventDefault()
    event.stopPropagation()

    setDragStart()
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return nodeRef
}

function Clip ({
  clip,
  pixelsPerSecond,
  sampleRate,
  trackHeight,
  isSelected = false,
  onSelect,
  onMove,
  onResize,
  onMoveToTrack
}: ClipProps) {
  const nodeRef = useResizableAndPositionable({ onMove, onResize, onMoveToTrack })

  const resolution = pixelsPerSecond / sampleRate
  const lengthInSamples = clip.duration * resolution

  // Calculate clip dimensions (use temp values during drag/resize)
  const clipHeight = useMemo(() => trackHeight - 4, [ trackHeight ])

  // Detect target track based on mouse position
  const getTargetTrackId = (clientY: number): string | null => {
    const trackElements = document.querySelectorAll('.audio-track')
    for (const trackElement of trackElements) {
      const rect = trackElement.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) {
        const trackId = trackElement.getAttribute('data-track-id')
        return trackId
      }
    }
    return null
  }

  // Handle clip selection
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect?.(clip.id)
  }, [ clip.id, onSelect ])

  return <div ref={ nodeRef }
    className={ `audio-clip` }
    style={{
      height:          `${clipHeight}px`,
      width:           `${lengthInSamples / resolution}px`,
      left:            `${timeToPixels(clip.startTime, pixelsPerSecond)}px`,
      backgroundColor: `${clip.color}40` || '#3a86ff40',
      borderColor:     isSelected ? `${clip.color}a0` : 'transparent'
    }}
    onClick={ handleClick }
    title={ `${clip.name} - ${formatTime(clip.duration)}` }
  >
    {clip.isLoading
      ? <div className='clip-loading'>
        <div className='loading-spinner' />
        <span>Processing...</span>
      </div>
      : <>
        {clip.waveformData.length > 0 &&
          <Waveform
            waveformData={ clip.waveformData }
            height={ clipHeight }
            color={ clip.color }
            className='clip-waveform'
          />
        }

        <div className='clip-label'>
          <span className='clip-name'>{clip.name}</span>
          <span className='clip-time'>{formatTime(clip.duration)}</span>
        </div>

        <div className='resize-handle' />
      </>
    }
  </div>
}


export default Clip
