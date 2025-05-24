/**
 * Audio Clip Component - represents a single audio clip on a track
 */

import { useState, useCallback } from 'react'
import { AudioClip } from '../../types/audio'
import { timeToPixels, formatTime } from '../../utils/audioUtils'
import Waveform from '../waveform/Waveform'
import './Clip.css'

interface ClipProps {
  clip: AudioClip
  pixelsPerSecond: number
  trackHeight: number
  isSelected?: boolean
  onSelect?: (clipId: string) => void
  onMove?: (clipId: string, newStartTime: number) => void
  onResize?: (clipId: string, newDuration: number) => void
}

function Clip({
  clip,
  pixelsPerSecond,
  trackHeight,
  isSelected = false,
  onSelect,
  onMove,
  onResize
}: ClipProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)

  // Calculate clip dimensions
  const clipWidth = timeToPixels(clip.duration, pixelsPerSecond)
  const clipLeft = timeToPixels(clip.startTime, pixelsPerSecond)
  const clipHeight = trackHeight - 8 // Small margin

  // Handle clip selection
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onSelect?.(clip.id)
  }, [clip.id, onSelect])

  // Handle drag start
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.target !== event.currentTarget) return // Ignore clicks on children

    event.preventDefault()
    event.stopPropagation()

    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left

    // Check if clicking near the right edge for resizing
    if (clickX > clipWidth - 10) {
      setIsResizing(true)
    } else {
      setIsDragging(true)
    }

    setDragStartX(event.clientX)
    setDragStartTime(clip.startTime)

    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [clip.startTime, clipWidth])

  // Handle drag/resize movement
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const deltaX = event.clientX - dragStartX
    const deltaTime = deltaX / pixelsPerSecond

    if (isDragging) {
      const newStartTime = Math.max(0, dragStartTime + deltaTime)
      onMove?.(clip.id, newStartTime)
    } else if (isResizing) {
      const newDuration = Math.max(0.1, clip.duration + deltaTime)
      onResize?.(clip.id, newDuration)
    }
  }, [isDragging, isResizing, dragStartX, dragStartTime, pixelsPerSecond, clip.id, clip.duration, onMove, onResize])

  // Handle drag/resize end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  // Clip style
  const clipStyle = {
    left: `${clipLeft}px`,
    width: `${clipWidth}px`,
    height: `${clipHeight}px`,
    backgroundColor: clip.color || '#3a86ff',
    borderColor: isSelected ? '#ff5500' : 'transparent'
  }

  return (
    <div
      className={`audio-clip ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={clipStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      title={`${clip.name} - ${formatTime(clip.duration)}`}
    >
      {/* Loading state */}
      {clip.isLoading && (
        <div className="clip-loading">
          <div className="loading-spinner" />
          <span>Processing...</span>
        </div>
      )}

      {/* Waveform */}
      {!clip.isLoading && clip.waveformData.length > 0 && (
        <Waveform
          waveformData={clip.waveformData}
          width={clipWidth}
          height={clipHeight - 20} // Leave space for label
          color="rgba(255, 255, 255, 0.8)"
          className="clip-waveform"
        />
      )}

      {/* Clip label */}
      <div className="clip-label">
        <span className="clip-name">{clip.name}</span>
        <span className="clip-time">{formatTime(clip.duration)}</span>
      </div>

      {/* Resize handle */}
      <div className="resize-handle" />
    </div>
  )
}

export default Clip
