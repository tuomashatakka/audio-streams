/**
 * Main Audio View Component - the primary interface for the audio streams module
 */

import { useCallback } from 'react'
import { useAudioEngine } from '../contexts/AudioEngineContext'
import { useDroppable } from '../hooks/useDroppable'
import { AudioClip } from '../types/audio'
import Timeline from './timeline/Timeline'
import Track from './track/Track'
import PlaybackControls from './playback-controls/PlaybackControls'
import './MainAudioView.css'
import '../styles/drag-drop.css'

function MainAudioView () {
  const { state, dispatch, resumeAudioContext, samplesToSeconds, secondsToSamples, handleFilesSelected } = useAudioEngine()

  // Playback controls
  const handlePlay = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', isPlaying: true })
  }, [ dispatch ])

  const handlePause = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', isPlaying: false })
  }, [ dispatch ])

  const handleStop = useCallback(() => {
    dispatch({ type: 'SET_PLAYING', isPlaying: false })
    dispatch({ type: 'SET_CURRENT_SAMPLES', samples: 0 })
  }, [ dispatch ])

  const handleUserGesture = useCallback(async () => {
    console.log('User gesture detected - resuming AudioContext')

    const success = await resumeAudioContext()
    if (success)
      console.log('AudioContext successfully resumed')
    else
      console.warn('Failed to resume AudioContext')
  }, [ resumeAudioContext ])

  const handleScrub = useCallback((time: number) => {
    const samples = secondsToSamples(time)
    dispatch({ type: 'SET_CURRENT_SAMPLES', samples })
  }, [ secondsToSamples, dispatch ])

  const handleVolumeChange = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', volume })
  }, [ dispatch ])

  const handleLoopToggle = useCallback(() => {
    dispatch({ type: 'SET_LOOPING', isLooping: !state.audioEngine.isLooping })
  }, [ dispatch, state.audioEngine.isLooping ])

  // Track management
  const handleTrackUpdate = useCallback((trackId: string, updates: any) => {
    dispatch({ type: 'UPDATE_TRACK', trackId, updates })
  }, [ dispatch ])

  const handleClipSelect = useCallback((clipId: string) => {
    dispatch({ type: 'SELECT_CLIP', clipId })
  }, [ dispatch ])

  const handleClipMove = useCallback((clipId: string, newStartTime: number) => {
    dispatch({ type: 'UPDATE_CLIP', clipId, updates: { startTime: Math.max(0, newStartTime) }})
  }, [ dispatch ])

  const handleClipResize = useCallback((clipId: string, newDuration: number) => {
    dispatch({ type: 'UPDATE_CLIP', clipId, updates: { duration: Math.max(0.1, newDuration) }})
  }, [ dispatch ])

  const handleZoomChange = useCallback((newPixelsPerSecond: number) => {
    dispatch({ type: 'SET_PIXELS_PER_SECOND', pixelsPerSecond: newPixelsPerSecond })
  }, [ dispatch ])

  // Get clips for a track
  const getTrackClips = useCallback((trackId: string) => {
    const track = state.project.tracks.find(t => t.id === trackId)
    if (!track) return []
    
    return track.clipIds
      .map(clipId => state.clips.find(clip => clip.id === clipId))
      .filter(Boolean) as AudioClip[]
  }, [state.project.tracks, state.clips])

  // Drag and drop handling for tracks area
  const { dragProps } = useDroppable({
    onFilesDropped: handleFilesSelected,
    onDragEnter: () => {
      dispatch({ type: 'SET_DRAG_STATE', dragState: { isDragging: true, dragType: 'file' } })
    },
    onDragLeave: () => {
      dispatch({ type: 'RESET_DRAG_STATE' })
    }
  })

  // Track hover handling for drag and drop
  const handleTrackHover = useCallback((trackId: string | null) => {
    if (state.ui.dragState.isDragging && state.ui.dragState.dragType === 'file') {
      dispatch({ type: 'SET_DRAG_STATE', dragState: { hoveredTrackId: trackId } })
    }
  }, [dispatch, state.ui.dragState])

  const handleFilesDropped = useCallback((files: File[]) => {
    handleFilesSelected(files)
  }, [handleFilesSelected])

  const currentTime = samplesToSeconds(state.audioEngine.currentSamples)

  return <div className='main-audio-view'>

    <PlaybackControls
      isPlaying={state.audioEngine.isPlaying}
      currentTime={currentTime}
      bpm={state.project.bpm}
      timeSignature={state.project.timeSignature}
      volume={state.audioEngine.volume}
      isLooping={state.audioEngine.isLooping}
      onPlay={handlePlay}
      onPause={handlePause}
      onStop={handleStop}
      onVolumeChange={handleVolumeChange}
      onLoopToggle={handleLoopToggle}
      onUserGesture={handleUserGesture}
    />

    <div className='audio-workspace'>
      <div className='tracks-area' {...dragProps}>
        <Timeline
          duration={state.project.duration}
          currentTime={currentTime}
          pixelsPerSecond={state.ui.pixelsPerSecond}
          bpm={state.project.bpm}
          timeSignature={state.project.timeSignature}
          onScrub={handleScrub}
          onZoomChange={handleZoomChange}
        />

        <div className='tracks-container'>
          {state.project.tracks.length === 0 ? (
            <div className='empty-tracks-message'>
              <p>Drop audio files here to get started</p>
            </div>
          ) : (
            state.project.tracks.map(track => {
              const trackClips = getTrackClips(track.id)
              return (
                <Track
                  key={track.id}
                  track={{ ...track, clips: trackClips }}
                  pixelsPerSecond={state.ui.pixelsPerSecond}
                  trackHeight={64}
                  projectDuration={state.project.duration}
                  selectedClipId={state.ui.selectedClipId}
                  onTrackUpdate={handleTrackUpdate}
                  onClipSelect={handleClipSelect}
                  onClipMove={handleClipMove}
                  onClipResize={handleClipResize}
                  onTrackHover={handleTrackHover}
                  isHovered={state.ui.dragState.hoveredTrackId === track.id}
                  showPlaceholder={state.ui.dragState.isDragging && state.ui.dragState.dragType === 'file'}
                />
              )
            })
          )}
          
          {state.ui.dragState.isDragging && 
           state.ui.dragState.dragType === 'file' && 
           !state.ui.dragState.hoveredTrackId && (
            <div className='new-track-placeholder'>
              <div className='placeholder-content'>
                <span>Drop here to create new track</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
}

export default MainAudioView
