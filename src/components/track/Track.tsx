/**
 * Audio Track Component - represents a single track with clips and controls
 */

import { useCallback } from 'react'
import { AudioTrack as AudioTrackType } from '../../types/audio'
import { timeToPixels } from '../../utils/audioUtils'
import Clip from '../clip/Clip'
import { Volume2, VolumeX, Headphones } from 'lucide-react'
import './Track.css'


interface TrackProps {
  track:           AudioTrackType
  pixelsPerSecond: number
  trackHeight:     number
  projectDuration: number
  selectedClipId?: string | null
  onTrackUpdate:   (trackId: string, updates: Partial<AudioTrackType>) => void
  onClipSelect:    (clipId: string) => void
  onClipMove:      (clipId: string, newStartTime: number) => void
  onClipResize:    (clipId: string, newDuration: number) => void
  onTrackHover?:   (trackId: string | null) => void
  isHovered?:      boolean
  showPlaceholder?: boolean
}


function Track ({
  track,
  pixelsPerSecond,
  trackHeight,
  projectDuration,
  selectedClipId,
  onTrackUpdate,
  onClipSelect,
  onClipMove,
  onClipResize,
  onTrackHover,
  isHovered = false,
  showPlaceholder = false
}: TrackProps) {
  // Handle volume change
  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(event.target.value)
    onTrackUpdate(track.id, { volume })
  }, [ track.id, onTrackUpdate ])

  // Handle pan change
  const handlePanChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const pan = parseFloat(event.target.value)
    onTrackUpdate(track.id, { pan })
  }, [ track.id, onTrackUpdate ])

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    onTrackUpdate(track.id, { muted: !track.muted })
  }, [ track.id, track.muted, onTrackUpdate ])

  // Handle solo toggle
  const handleSoloToggle = useCallback(() => {
    onTrackUpdate(track.id, { solo: !track.solo })
  }, [ track.id, track.solo, onTrackUpdate ])

  // Handle track name change
  const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onTrackUpdate(track.id, { name: event.target.value })
  }, [ track.id, onTrackUpdate ])

  const trackWidth = timeToPixels(projectDuration, pixelsPerSecond)

  // Handle track hover for drag and drop
  const handleMouseEnter = useCallback(() => {
    if (showPlaceholder) {
      onTrackHover?.(track.id)
    }
  }, [showPlaceholder, onTrackHover, track.id])

  const handleMouseLeave = useCallback(() => {
    if (showPlaceholder) {
      onTrackHover?.(null)
    }
  }, [showPlaceholder, onTrackHover])

  return (
    <div 
      className={`audio-track ${isHovered ? 'hovered' : ''} ${showPlaceholder ? 'drag-target' : ''}`}
      style={{ height: trackHeight }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
    {/* Track header/controls */}
    <div className='track-header'>
      <input
        type='text'
        value={track.name}
        onChange={handleNameChange}
        className='track-name-input'
        style={{ color: track.color }}
      />

      <div className='track-controls'>
        {/* Mute button */}
        <button
          className={`track-button mute-button ${track.muted ? 'active' : ''}`}
          onClick={handleMuteToggle}
          title={track.muted ? 'Unmute' : 'Mute'}
        >
          {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* Solo button */}
        <button
          className={`track-button solo-button ${track.solo ? 'active' : ''}`}
          onClick={handleSoloToggle}
          title={track.solo ? 'Unsolo' : 'Solo'}
        >
          <Headphones size={14} />
        </button>

        {/* Volume slider */}
        <div className='slider-container'>
          <label className='slider-label'>Vol</label>

          <input
            type='range'
            min='0'
            max='1'
            step='0.01'
            value={track.volume}
            onChange={handleVolumeChange}
            className='volume-slider'
            title={`Volume: ${Math.round(track.volume * 100)}%`}
          />

          <span className='slider-value'>{Math.round(track.volume * 100)}</span>
        </div>

        {/* Pan slider */}
        <div className='slider-container'>
          <label className='slider-label'>Pan</label>

          <input
            type='range'
            min='-1'
            max='1'
            step='0.01'
            value={track.pan}
            onChange={handlePanChange}
            className='pan-slider'
            title={`Pan: ${track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}${Math.abs(Math.round(track.pan * 100))}`}
          />

          <span className='slider-value'>
            {track.pan === 0 ? 'C' : `${track.pan > 0 ? 'R' : 'L'}${Math.abs(Math.round(track.pan * 100))}`}
          </span>
        </div>
      </div>
    </div>

      {/* Track content area */}
      <div className='track-content' style={{ width: trackWidth }}>
        {/* Track background/lane */}
        <div
          className='track-lane'
          style={{
            width: trackWidth,
            height: trackHeight - 40, // Subtract header height
            borderLeft: `3px solid ${track.color}`
          }}
        />

        {/* Audio clips */}
        {track.clips.map(clip => (
          <Clip
            key={clip.id}
            clip={clip}
            pixelsPerSecond={pixelsPerSecond}
            trackHeight={trackHeight - 40} // Subtract header height
            isSelected={selectedClipId === clip.id}
            onSelect={onClipSelect}
            onMove={onClipMove}
            onResize={onClipResize}
          />
        ))}

        {/* Placeholder when hovering during drag */}
        {isHovered && showPlaceholder && (
          <div className='clip-placeholder'>
            <div className='placeholder-content'>
              <span>Drop audio file here</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Track
