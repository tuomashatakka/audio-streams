/**
 * Audio Clip Component - represents a single audio clip on a track
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
}


function Clip ({
  clip,
  pixelsPerSecond,
  trackHeight,
  isSelected = false,
  onSelect,
  onMove,
  onResize
}: ClipProps) {
  const nodeRef     = useRef<HTMLDivElement>(null)
  const modifyState = useRef({
    dragging:  false,
    resizing:  false,
    startTime: clip.startTime,
    duration:  clip.duration,
    startX:    0,
  })


  // Calculate clip dimensions (use temp values during drag/resize)
  const displayStartTime = useMemo(() => modifyState.current.dragging ? modifyState.current.startTime : clip.startTime, [ modifyState, clip.startTime ])
  const displayDuration  = useMemo(() => modifyState.current.resizing ? modifyState.current.duration : clip.duration, [ modifyState, clip.duration ])

  const clipLeft   = timeToPixels(displayStartTime, pixelsPerSecond)
  const clipWidth  = timeToPixels(displayDuration, pixelsPerSecond)
  const clipHeight = useMemo(() => trackHeight - 4, [ trackHeight ])

  console.log(clipLeft, displayStartTime)

  const setDragStart = (x: number, startTime: number) => {
    modifyState.current.startX = x
    modifyState.current.startTime = startTime
  }

  // Handle clip selection
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect?.(clip.id)
  }, [ clip.id, onSelect ])

  // Handle drag start
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.target !== event.currentTarget)
      return // Ignore clicks on children

    event.preventDefault()
    event.stopPropagation()

    const rect   = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left

    // Check if clicking near the right edge for resizing
    if (clickX > clipWidth - 10)
      modifyState.current.resizing = true
    else
      modifyState.current.dragging = true

    setDragStart(event.clientX, clip.startTime)

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [ clip.startTime, clipWidth ])

  // Handle drag/resize movement (visual only during drag)
  const handleMouseMove = (event: MouseEvent) => {
    const deltaX    = event.clientX - modifyState.current.startX
    const deltaTime = deltaX / pixelsPerSecond

    console.log(deltaX, modifyState.current, deltaTime)

    if (modifyState.current.dragging) {
      const newStartTime = Math.max(0, clip.startTime + deltaTime)
      modifyState.current.startTime = newStartTime
    }
    else if (modifyState.current.resizing) {
      const newDuration = Math.max(0.1, clip.duration + deltaTime)
      modifyState.current.duration = newDuration
    }

    nodeRef.current?.style.setProperty('transform', `translateX(${timeToPixels(modifyState.current.startTime, pixelsPerSecond)}px`)
  }

  // Handle drag/resize end (commit changes)
  const handleMouseUp = () => {
    // Commit the changes when drag/resize ends
    if (modifyState.current.dragging)
      onMove?.(clip.id, modifyState.current.startTime)
    else if (modifyState.current.resizing)
      onResize?.(clip.id, modifyState.current.duration)

    modifyState.current.dragging = false
    modifyState.current.resizing = false

    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // Reset temp values when clip props change
  useEffect(() => {
    modifyState.current.startTime = clip.startTime
    modifyState.current.duration = clip.duration
  }, [ clip.startTime, clip.duration ])

  return <div
    className={`audio-clip ${isSelected ? 'selected' : ''} ${modifyState.current.dragging ? 'dragging' : ''} ${modifyState.current.resizing ? 'resizing' : ''}`}
    style={{
      transform:       `translateX(${clipLeft}px)`,
      width:           `${clipWidth}px`,
      height:          `${clipHeight}px`,
      backgroundColor: `${clip.color}40` || '#3a86ff40',
      borderColor:     isSelected ? `${clip.color}a0` : 'transparent'
    }}
    onClick={handleClick}
    onMouseDown={handleMouseDown}
    title={`${clip.name} - ${formatTime(clip.duration)}`}
    ref={nodeRef}
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
            width={clipWidth - 4}
            height={clipHeight - 4} // Leave space for label
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
