/**
 * Audio Clip Component - represents a single audio clip on a track
 */

import { useCallback, useMemo, useRef } from 'react'
import { AudioClip } from '../../types/audio'
import { timeToPixels, formatTime, snapToGrid, GridSize, pixelsToTime } from '../../utils/audioUtils'
import { useAudioEngine } from '../../contexts/AudioEngineContext'
import Waveform from '../waveform/Waveform'
import './Clip.css'

interface ClipProps {
  clip:            AudioClip
  pixelsPerSecond: number
  sampleRate:      number
  trackHeight:     number
  isSelected?:     boolean
  onSelect?:       (clipId: string) => void
  onMove?:         (clipId: string, newStartTime: number) => void
  onResize?:       (clipId: string, newDuration: number) => void
  onMoveToTrack?:  (clipId: string, targetTrackId: string, newStartTime: number) => void
}

const useResizableAndPositionable = ({ 
  clip, 
  pixelsPerSecond, 
  onMove, 
  onResize, 
  onMoveToTrack 
}: Partial<ClipProps> & { clip: AudioClip; pixelsPerSecond: number }) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const modifyState = useRef({
    width: null,
    action: null,
    x: null,
    y: null,
    time: null,
    startX: null,
    startY: null,
  })

  const { state } = useAudioEngine()

  // Handle drag/resize movement (visual only during drag)
  const handleMouseMove = (event: MouseEvent) => {
    if (modifyState.current.startX === null || modifyState.current.startY === null)
      return

    modifyState.current = {
      ...modifyState.current,
      x: event.clientX,
      y: event.clientY,
      action: 'drag',
      time: Date.now()
    }

    const deltaX = modifyState.current.x - modifyState.current.startX
    const deltaY = modifyState.current.y - modifyState.current.startY

    // Apply visual transform during drag
    if (nodeRef.current) {
      nodeRef.current.style.setProperty('transform', `translate(${deltaX}px, ${deltaY}px)`)
      nodeRef.current.style.setProperty('z-index', '1000')
      nodeRef.current.classList.add('dragging')
    }
  }

  // Handle drag/resize end (commit changes)
  const handleMouseUp = () => {
    console.log('🎵 Clip mouseup fired!', { clipId: clip.id })
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    // Calculate the changes
    if (modifyState.current.startX !== null && modifyState.current.x !== null) {
      const deltaX = modifyState.current.x - modifyState.current.startX
      const deltaY = modifyState.current.y - modifyState.current.startY
      
      console.log('🎵 Calculating drag result:', { deltaX, deltaY, startTime: clip.startTime })
      
      // Convert pixel movement to time
      const deltaTime = pixelsToTime(deltaX, pixelsPerSecond)
      
      // Apply grid snapping to the time delta
      const snappedDeltaTime = snapToGrid(
        deltaTime, 
        state.project.bpm, 
        GridSize.SIXTEENTH, 
        state.project.timeSignature
      )
      
      console.log('🎵 Time calculations:', { deltaTime, snappedDeltaTime, bpm: state.project.bpm })
      
      // Calculate new start time with snapping
      const newStartTime = Math.max(0, clip.startTime + snappedDeltaTime)
      
      // Check for track movement
      const h = nodeRef.current?.getBoundingClientRect().height / 2 || 0
      const targetTrackId = getTargetTrackId(modifyState.current.y + h)
      
      console.log('🎵 Track detection:', { targetTrackId, currentTrackId: clip.trackId, newStartTime })
      
      if (targetTrackId && targetTrackId !== clip.trackId) {
        console.log('🎵 Moving to different track!')
        onMoveToTrack?.(clip.id, targetTrackId, newStartTime)
      } else {
        console.log('🎵 Moving on same track!')
        onMove?.(clip.id, newStartTime)
      }
    } else {
      console.log('🎵 No drag detected - positions were null')
    }

    // Reset visual state
    if (nodeRef.current) {
      nodeRef.current.style.transform = 'translate(0, 0)'
      nodeRef.current.style.zIndex = '100'
      nodeRef.current.classList.remove('dragging')
    }

    // Clear state
    modifyState.current = {
      x: null,
      y: null,
      width: null,
      action: null,
      startX: null,
      startY: null,
      time: null,
    }
  }

  // Handle drag start
  const handleMouseDown = (event: React.MouseEvent) => {
    console.log('🎵 Clip mousedown started!', { clipId: clip.id, clientX: event.clientX, clientY: event.clientY })
    event.preventDefault()
    event.stopPropagation()

    modifyState.current = {
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      width: 0,
      action: 'drag',
      time: Date.now(),
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    console.log('🎵 Event listeners added for drag')
  }

  // Detect target track based on mouse position (restored from original)
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

  return { handleMouseDown, nodeRef }
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
  const { handleMouseDown, nodeRef } = useResizableAndPositionable({ 
    clip,
    pixelsPerSecond,
    onMove,
    onResize,
    onMoveToTrack
  })

  const resolution = pixelsPerSecond / sampleRate
  const lengthInSamples = clip.duration * resolution

  // Calculate clip dimensions
  const clipHeight = useMemo(() => trackHeight - 4, [trackHeight])

  // Handle clip selection
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect?.(clip.id)
  }, [clip.id, onSelect])

  // Calculate vertical position based on track index
  const trackIndex = useAudioEngine().state.project.tracks.findIndex(t => t.id === clip.trackId)
  const trackHeaderHeight = 40 // From Track.css
  const topPosition = trackIndex * (trackHeight + 1) + trackHeaderHeight // +1 for border

  return <div
    ref={nodeRef}
    onMouseDown={handleMouseDown}
    className={`audio-clip ${isSelected ? 'selected' : ''}`}
    style={{
      height:          `${clipHeight}px`,
      width:           `${lengthInSamples / resolution}px`,
      left:            `${timeToPixels(clip.startTime, pixelsPerSecond)}px`,
      top:             `${topPosition}px`,
      backgroundColor: `${clip.color}40` || '#3a86ff40',
      borderColor:     isSelected ? `${clip.color}a0` : 'transparent'
    }}
    onClick={handleClick}
    title={`${clip.name} - ${formatTime(clip.duration)}`}
  >
    {clip.isLoading
      ? <div className='clip-loading'>
        <div className='loading-spinner' />
        <span>Processing...</span>
      </div>
      : <>
        {clip.waveformData.length > 0 &&
          <Waveform
            waveformData={clip.waveformData}
            width={clip.duration * pixelsPerSecond}
            height={clipHeight}
            color={clip.color}
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