/**
 * Audio Track Component - represents a single track with clips and controls
 */

import { useCallback } from 'react'
import { AudioTrack as AudioTrackType } from '../../types/audio'
import { timeToPixels } from '../../utils/audioUtils'
import Clip from '../clip/Clip'
import { Volume2, VolumeX, Headphones, Trash2, Upload } from 'lucide-react'
import './Track.css'


interface TrackProps {
  track:              AudioTrackType
  pixelsPerSecond:    number
  trackHeight:        number
  projectDuration:    number
  selectedClipId?:    string | null
  isCollapsed?:       boolean
  onTrackUpdate:      (trackId: string, updates: Partial<AudioTrackType>) => void
  onClipSelect:       (clipId: string) => void
  onClipMove:         (clipId: string, newStartTime: number) => void
  onClipResize:       (clipId: string, newDuration: number) => void
  onClipMoveToTrack?: (clipId: string, targetTrackId: string, newStartTime: number) => void
  onTrackRemove?:     (trackId: string) => void
  onFileUpload?:      (files: FileList, trackId: string) => void
  onTrackHover?:      (trackId: string | null) => void
  isHovered?:         boolean
  showPlaceholder?:   boolean
}


// eslint-disable-next-line complexity
function Track ({
  track,
  pixelsPerSecond,
  trackHeight,
  projectDuration,
  selectedClipId,
  isCollapsed = false,
  onTrackUpdate,
  onClipSelect,
  onClipMove,
  onClipResize,
  onClipMoveToTrack,
  onTrackRemove,
  onFileUpload,
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

  // Handle track removal
  const handleRemoveTrack = useCallback(() => {
    if (window.confirm(`Are you sure you want to remove the track "${track.name}"?`))
      onTrackRemove?.(track.id)
  }, [ track.id, track.name, onTrackRemove ])

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && onFileUpload) {
      onFileUpload(files, track.id)
      event.target.value = '' // Reset input
    }
  }

  const trackWidth = timeToPixels(projectDuration, pixelsPerSecond)

  // Handle track hover for drag and drop
  const handleMouseEnter = useCallback(() => {
    if (showPlaceholder)
      onTrackHover?.(track.id)
  }, [ showPlaceholder, onTrackHover, track.id ])

  const handleMouseLeave = useCallback(() => {
    if (showPlaceholder)
      onTrackHover?.(null)
  }, [ showPlaceholder, onTrackHover ])

  return <div
    className={ `audio-track ${isHovered ? 'hovered' : ''} ${showPlaceholder ? 'drag-target' : ''}` }
    data-track-id={ track.id }
    onMouseEnter={ handleMouseEnter }
    onMouseLeave={ handleMouseLeave }>

    {/* Track header/controls */}
    <header className={ `track-header ${isCollapsed ? 'collapsed' : ''}` }>
      <input
        type='text'
        value={ track.name }
        onChange={ handleNameChange }
        className='track-name-input'
        style={{ color: track.color }}
      />

      <div className='track-controls'>
        {/* Mute button */}
        <button
          className={ `track-button mute-button ${track.muted ? 'active' : ''}` }
          onClick={ handleMuteToggle }
          title={ track.muted ? 'Unmute' : 'Mute' }
        >
          {track.muted ? <VolumeX size={ 14 } /> : <Volume2 size={ 14 } />}
        </button>

        {/* Solo button */}
        <button
          className={ `track-button solo-button ${track.solo ? 'active' : ''}` }
          onClick={ handleSoloToggle }
          title={ track.solo ? 'Unsolo' : 'Solo' }>
          <Headphones size={ 14 } />
        </button>

        {/* Remove track button */}
        <button
          className='track-button remove-button'
          onClick={ handleRemoveTrack }
          title='Remove track'>
          <Trash2 size={ 14 } />
        </button>

        {/* Volume slider */}
        <label className='slider-container'>
          <span className='slider-label'>Vol</span>

          <input
            type='range'
            min='0'
            max='1'
            step='0.01'
            value={ track.volume }
            onChange={ handleVolumeChange }
            className='volume-slider'
            title={ `Volume: ${Math.round(track.volume * 100)}%` }
          />

          <output className='slider-value'>{Math.round(track.volume * 100)}</output>
        </label>

        {/* Pan slider */}
        <label className='slider-container'>
          <span className='slider-label'>Pan</span>

          <input
            type='range'
            min='-1'
            max='1'
            step='0.01'
            value={ track.pan }
            onChange={ handlePanChange }
            className='pan-slider'
            title={ `Pan: ${track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}${Math.abs(Math.round(track.pan * 100))}` }
          />

          <output className='slider-value'>
            {track.pan === 0 ? 'C' : `${track.pan > 0 ? 'R' : 'L'}${Math.abs(Math.round(track.pan * 100))}`}
          </output>
        </label>
      </div>
    </header>

    {/* Track content area */}
    <div className='track-content' style={{ width: trackWidth }}>
      {/* Track background/lane */}
      <div
        className='track-lane'
        style={{
          width:      trackWidth,
          height:     trackHeight,
          borderLeft: `3px solid ${track.color}`
        }}
      />

      {/* Audio clips */}
      {track.clipIds.map(clip =>
        <Clip
          key={ clip.id }
          clip={ clip }
          pixelsPerSecond={ pixelsPerSecond }
          trackHeight={ trackHeight }
          isSelected={ selectedClipId === clip.id }
          onSelect={ onClipSelect }
          onMove={ onClipMove }
          onResize={ onClipResize }
          onMoveToTrack={ onClipMoveToTrack }
        />
      )}

      {/* Upload button for empty tracks */}
      {track.clipIds.length === 0 && !isHovered &&
        <div className='empty-track-upload'>
          <label className='upload-button btn-primary' htmlFor={ `file-upload-${track.id}` }>
            <Upload size={ 16 } />
          </label>

          <input
            id={ `file-upload-${track.id}` }
            type='file'
            accept='audio/*'
            multiple
            onChange={ handleFileUpload }
            style={{ display: 'none' }}
          />
        </div>
      }

      {/* Placeholder when hovering during drag */}
      {isHovered && showPlaceholder &&
        <div className='clip-placeholder'>
          <div className='placeholder-content'>
            <span>Drop audio file here</span>
          </div>
        </div>
      }
    </div>
  </div>
}

export default Track
