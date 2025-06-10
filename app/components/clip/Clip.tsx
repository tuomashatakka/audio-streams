/**
 * Audio Clip Component - represents a single audio clip on a track
 */

import { useCallback, useMemo, useRef } from 'react'
import { AudioClip } from '../../types/audio'
import { timeToPixels, formatTime } from '../../utils/audioUtils'
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

const useResizableAndPositionable = ({ onMove: _onMove, onResize: _onResize, onMouseUp }: Partial<ClipProps>) => {
  const nodeRef     = useRef<HTMLDivElement>(null)
  const modifyState = useRef({
    width:  null,
    action: null,
    x:      null,
    y:      null,
    time:   null,
    startX: null,
    startY: null,
  })

  // Drag utility methods preserved for future implementation
  // const clearModifyState = () => {
  //   const box = nodeRef.current?.getBoundingClientRect()
  //   return { x: box?.x, y: box?.y, width: box?.width, time: Date.now() }
  // }

  // Handle drag/resize movement (visual only during drag)
  const handleMouseMove = (event: MouseEvent) => {
    if (modifyState.current.startX === null || modifyState.current.startY === null)
      return

    modifyState.current = {
      startX: modifyState.current.startX,
      startY: modifyState.current.startY,
      x:      event.clientX,
      y:      event.clientY,
      width:  null,
      action: 'drag',
    }

    const deltaX = modifyState.current.x - modifyState.current.startX
    const deltaY = modifyState.current.y - modifyState.current.startY

    console.log(modifyState.current)
    if (nodeRef.current)
      nodeRef.current.style.setProperty('transform', `translate(${deltaX}px, ${deltaY}px)`)
  }

  // Handle drag/resize end (commit changes)
  const handleMouseUp = () => {

    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)

    onMouseUp(modifyState)

    if (nodeRef.current)
      nodeRef.current.style.transform = 'translate(0, 0)'
    // clearModifyState() - removed for build convergence

    modifyState.current = {
      x:      null,
      y:      null,
      width:  null,
      action: null,
    }
  }

  // Handle drag start (currently unused but preserved for future implementation)
  const handleMouseDown = (event: React.MouseEvent) => {
    console.log('onMouseDn', event.target)
    modifyState.current = {
      startX: event.clientX,
      startY: event.clientY,
      x:      event.clientX,
      y:      event.clientY,
      width:  0,
      action: 'drag',
    }

    // event.preventDefault()
    // event.stopPropagation()

    // setDragStart()
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
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
}: ClipProps) {
  const onMoveToTrack = (modifyState) => {
    const h = nodeRef.current?.getBoundingClientRect().height / 2
    const tragetTrackId = getTargetTrackId(modifyState.current.y + h)
    console.log(tragetTrackId)
  }

  const { handleMouseDown, nodeRef } = useResizableAndPositionable({ onMove, onResize, onMouseUp: onMoveToTrack })

  const resolution = pixelsPerSecond / sampleRate
  const lengthInSamples = clip.duration * resolution

  // Calculate clip dimensions (use temp values during drag/resize)
  const clipHeight = useMemo(() => trackHeight - 4, [ trackHeight ])

  // Detect target track based on mouse position
  // Cross-track detection logic preserved for future implementation
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

  return <div
    ref={ nodeRef }
    onMouseDown={ handleMouseDown }
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
            width={ clip.duration * pixelsPerSecond }
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
