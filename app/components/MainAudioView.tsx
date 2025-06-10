/* eslint-disable */
/**
 * Main Audio View Component - the primary interface for the audio streams module
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAudioEngine } from '../contexts/AudioEngineContext'
import { useDroppable } from '../hooks/useDroppable'
import { AudioClip } from '../types/audio'
import Timeline from './timeline/Timeline'
import Track from './track/Track'
import PlaybackControls from './playback-controls/PlaybackControls'
import HotkeysHandler, { HotkeysConfig } from '../utils/hotkeysHandler'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import './MainAudioView.css'
import '../styles/drag-drop.css'
import Clip from './clip/Clip'
import { calculateProjectDuration } from '@/utils/audioUtils'

function MainAudioView () {
  const {
    state,
    dispatch,
    resumeAudioContext,
    samplesToSeconds,
    secondsToSamples,
    handleFilesSelected } = useAudioEngine()
  const hotkeysHandlerRef = useRef<HotkeysHandler | null>(null)
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false)

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

  const handleTogglePlayback = useCallback(() => {
    if (state.audioEngine.isPlaying)
      handlePause()
    else
      handlePlay()
  }, [ state.audioEngine.isPlaying, handlePlay, handlePause ])

  const handleRestartPlayback = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_SAMPLES', samples: 0 })
    if (!state.audioEngine.isPlaying)
      handlePlay()
  }, [ dispatch, state.audioEngine.isPlaying, handlePlay ])

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

  const handleAddTrack = useCallback(() => {
    dispatch({ type: 'ADD_TRACK' })
  }, [ dispatch ])

  const handleClipMoveToTrack = useCallback((clipId: string, targetTrackId: string, newStartTime: number) => {
    dispatch({ type: 'MOVE_CLIP_TO_TRACK', clipId, targetTrackId, newStartTime })
  }, [ dispatch ])

  // Adapter function to bridge FileList → File[] for Track component
  const handleTrackFileUpload = useCallback((files: FileList, _trackId: string) => {
    const filesArray = Array.from(files)
    handleFilesSelected(filesArray)
  }, [ handleFilesSelected ])

  const onNudgeLeft    = () => handleClipMove(state.ui.selectedClipId || '', -0.1)
  const onNudgeRight   = () => handleClipMove(state.ui.selectedClipId || '', +0.1)
  const onShortenClip  = () => handleClipResize(state.ui.selectedClipId || '', -1)
  const onLengthenClip = () => handleClipResize(state.ui.selectedClipId || '', +1)

  // Get clips for a track
  const getTrackClips = useCallback((trackId: string) => {
    const track = state.project.tracks.find(t => t.id === trackId)
    if (!track)
      return []

    return track.clipIds
      .map(clipId => state.clips.find(clip => clip.id === clipId))
      .filter(Boolean) as AudioClip[]
  }, [ state.project.tracks, state.clips ])

  // Get currently selected clip
  const getSelectedClip = useCallback((): AudioClip | null => {
    if (!state.ui.selectedClipId)
      return null
    return state.clips.find(clip => clip.id === state.ui.selectedClipId) || null
  }, [ state.ui.selectedClipId, state.clips ])

  // Hotkeys configuration
  const hotkeysConfig: HotkeysConfig = {
    // Clip manipulation
    onNudgeLeft,
    onNudgeRight,
    onShortenClip,
    onLengthenClip,

    // Playback control
    onTogglePlayback:  handleTogglePlayback,
    onRestartPlayback: handleRestartPlayback,

    // State getters
    getSelectedClip,
    getBPM:             () => state.project.bpm,
    getTimeSignature:   () => state.project.timeSignature,
    getProjectDuration: () => state.project.duration,
    isPlaying:          () => state.audioEngine.isPlaying
  }

  // Initialize and cleanup hotkeys
  useEffect(() => {
    if (!hotkeysHandlerRef.current) {
      hotkeysHandlerRef.current = new HotkeysHandler(hotkeysConfig)
      hotkeysHandlerRef.current.enable()
    }

    // Cleanup on unmount
    return () => {
      hotkeysHandlerRef.current?.disable()
      hotkeysHandlerRef.current = null
    }
  }, [])

  // Update hotkeys config when handlers change
  useEffect(() => {
    if (hotkeysHandlerRef.current)
      hotkeysHandlerRef.current.updateConfig(hotkeysConfig)
  }, [
    handleClipMove,
    handleClipResize,
    handleTogglePlayback,
    handleRestartPlayback,
    getSelectedClip,
    state.project.bpm,
    state.project.timeSignature,
    state.project.duration,
    state.audioEngine.isPlaying
  ])

  // Drag and drop handling for tracks area
  const { dragProps } = useDroppable({
    onFilesDropped: handleFilesSelected,
    onDragEnter:    () => {
      dispatch({ type: 'SET_DRAG_STATE', dragState: { isDragging: true, dragType: 'file' }})
    },
    onDragLeave: () => {
      dispatch({ type: 'RESET_DRAG_STATE' })
    }
  })

  const projectDuration = useMemo(() =>
    isNaN(state.project.duration)
    ? calculateProjectDuration(state.project.tracks)
    : state.project.duration || 16, [ state ])

  // Track hover handling for drag and drop
  const handleTrackHover = useCallback((trackId: string | null) => {
    if (state.ui.dragState.isDragging && state.ui.dragState.dragType === 'file')
      dispatch({ type: 'SET_DRAG_STATE', dragState: { hoveredTrackId: trackId }})
  }, [ dispatch, state.ui.dragState ])

  const currentTime = samplesToSeconds(state.audioEngine.currentSamples)

  const trackHeight = 64
  const pixelsPerSecond = state.ui.pixelsPerSecond


  return <div className='main-audio-view'>
    {/* Hotkeys indicator */}
    {hotkeysHandlerRef.current?.enabled &&
      <div className='hotkeys-indicator' title='Keyboard shortcuts are active'>
        🎹
      </div>
    }

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
          duration={projectDuration}
          currentTime={currentTime}
          pixelsPerSecond={state.ui.pixelsPerSecond}
          bpm={state.project.bpm}
          timeSignature={state.project.timeSignature}
          isCollapsed={isControlsCollapsed}
          onScrub={handleScrub}
          onZoomChange={handleZoomChange}
          onToggleCollapse={() => setIsControlsCollapsed(prev => !prev)}
        />

        <div className='tracks-container'>
          {state.project.tracks.length === 0 &&
            <div className='empty-tracks-message'>
              <p>Drop audio files here to get started</p>
              <p className='empty-tracks-subtitle'>or create a track manually</p>
              <button
                className='btn-primary add-track-button-empty'
                onClick={handleAddTrack}
                title='Add new audio track'
              >
                <Plus size={16} />
                Add Track
              </button>
            </div>
          }

          { state.project.tracks
            .flatMap(track => getTrackClips(track.id))
            .map(clip =>
              <Clip clip={clip} key={clip.id} pixelsPerSecond={pixelsPerSecond} trackHeight={trackHeight} />)
          }

          { state.project.tracks.map(track => {
            return <Track
              key={track.id}
              track={{ ...track }}
              pixelsPerSecond={state.ui.pixelsPerSecond}
              trackHeight={64}
              projectDuration={projectDuration}
              selectedClipId={state.ui.selectedClipId}
              isCollapsed={isControlsCollapsed}
              onTrackUpdate={handleTrackUpdate}
              onClipSelect={handleClipSelect}
              onClipMove={handleClipMove}
              onClipResize={handleClipResize}
              onClipMoveToTrack={handleClipMoveToTrack}
              onTrackRemove={(trackId) => dispatch({ type: 'REMOVE_TRACK', trackId })}
              onFileUpload={handleTrackFileUpload}
              onTrackHover={handleTrackHover}
              isHovered={state.ui.dragState.hoveredTrackId === track.id}
              showPlaceholder={state.ui.dragState.isDragging && state.ui.dragState.dragType === 'file'}
            />
          })}

          {state.ui.dragState.isDragging &&
           state.ui.dragState.dragType === 'file' &&
           !state.ui.dragState.hoveredTrackId &&
            <div className='new-track-placeholder'>
              <div className='placeholder-content'>
                <span>Drop here to create new track</span>
              </div>
            </div>
          }

          <div className='add-track-container'>
            <button
              className='btn-primary add-track-button'
              onClick={handleAddTrack}
              title='Add new audio track'
            >
              <Plus size={16} />
              Add Track
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default MainAudioView
