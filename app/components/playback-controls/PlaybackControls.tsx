/**
 * Playback Controls Component - transport controls for audio playback
 */

import { useCallback } from 'react'
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react'
import { formatTime, formatBars } from '../../utils/audioUtils'
import './PlaybackControls.css'


interface PlaybackControlsProps {
  isPlaying:      boolean
  currentTime:    number
  bpm:            number
  timeSignature:  { numerator: number; denominator: number }
  volume:         number
  isLooping:      boolean
  onPlay:         () => void
  onPause:        () => void
  onStop:         () => void
  onVolumeChange: (volume: number) => void
  onLoopToggle:   () => void
  onUserGesture?: () => void
}


function PlaybackControls ({
  isPlaying,
  currentTime,
  bpm,
  timeSignature,
  volume,
  isLooping,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onLoopToggle,
  onUserGesture
}: PlaybackControlsProps) {
  // Handle volume change
  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value)
    onVolumeChange(newVolume)
  }, [ onVolumeChange ])

  // Handle play with user gesture
  const handlePlay = useCallback(() => {
    onUserGesture?.() // Trigger user gesture handler
    onPlay()
  }, [ onPlay, onUserGesture ])

  return <div className='playback-controls'>
    {/* Transport buttons */}
    <div className='transport-buttons'>
      <button
        className={ `transport-button play-pause ${isPlaying ? 'playing' : ''}` }
        onClick={ isPlaying ? onPause : handlePlay }
        title={ isPlaying ? 'Pause' : 'Play' }
      >
        {isPlaying ? <Pause size={ 20 } /> : <Play size={ 20 } />}
      </button>

      <button
        className='transport-button stop'
        onClick={ onStop }
        title='Stop'
      >
        <Square size={ 18 } />
      </button>

      <button
        className={ `transport-button loop ${isLooping ? 'active' : ''}` }
        onClick={ onLoopToggle }
        title={ isLooping ? 'Disable Loop' : 'Enable Loop' }
      >
        <RotateCcw size={ 18 } />
      </button>
    </div>

    {/* Time display */}
    <div className='time-display'>
      <div className='time-format'>
        <span className='time-value'>{formatTime(currentTime)}</span>
        <span className='time-label'>Time</span>
      </div>

      <div className='time-format'>
        <span className='time-value'>{formatBars(currentTime, bpm, timeSignature)}</span>
        <span className='time-label'>Bars</span>
      </div>
    </div>

    {/* BPM display */}
    <div className='bpm-display'>
      <span className='bpm-value'>{bpm}</span>
      <span className='bpm-label'>BPM</span>
    </div>

    {/* Master volume */}
    <div className='master-volume'>
      <Volume2 size={ 16 } className='volume-icon' />

      <input
        type='range'
        min='0'
        max='1'
        step='0.01'
        value={ volume }
        onChange={ handleVolumeChange }
        className='master-volume-slider'
        title={ `Master Volume: ${Math.round(volume * 100)}%` }
      />

      <span className='volume-value'>{Math.round(volume * 100)}%</span>
    </div>
  </div>
}

export default PlaybackControls
