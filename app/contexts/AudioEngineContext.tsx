/**
 * AudioEngine Context - Global audio state and engine management
 * Centralizes ALL application state using useReducer pattern
 */

import { createContext, useContext, useRef, useReducer, useCallback, useEffect, ReactNode, PropsWithChildren } from 'react'
import { AudioTrack, AudioClip, AudioProject, FileProcessingState, WorkerMessage, WorkerMessageType, TrackColor } from '../types/audio'
import { generateId, getRandomTrackColor, sanitizeFileName, calculateProjectDuration, isSupportedAudioFile, snapToGrid, GridSize } from '../utils/audioUtils'
import { audioDecoder } from '../utils/audioDecoder'
import {
  createGainNode,
  createStereoPanner,
  createBufferSource,
} from '../utils/audioUtils'
import { AudioEngine } from '@/lib/AudioEngine'

// Comprehensive application state
interface AppState {
  // Project data
  project: Omit<AudioProject, 'tracks'> & {
    tracks: Array<Omit<AudioTrack, 'clips'> & { clipIds: string[] }>
  }

  // Separate clips storage
  clips: AudioClip[]

  // Audio engine state
  audioEngine: {
    isPlaying:        boolean
    currentSamples:   number
    isLooping:        boolean
    loopStartSamples: number
    loopEndSamples:   number
    volume:           number
    sampleRate:       number
    isInitialized:    boolean
  }

  // UI state
  ui: {
    selectedClipId:  string | null
    pixelsPerSecond: number
    isProcessing:    boolean
    dragState: {
      isDragging:              boolean
      dragType:                'file' | null
      hoveredTrackId:          string | null
      showNewTrackPlaceholder: boolean
      placeholderClip: {
        trackId:   string
        startTime: number
        name:      string
      } | null
    }
  }

  // File processing
  fileProcessing: FileProcessingState[]
}

// Action types for the reducer
type AppAction =
  | { type: 'INITIALIZE_AUDIO_CONTEXT'; sampleRate: number }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'SET_CURRENT_SAMPLES'; samples: number }
  | { type: 'SET_LOOPING'; isLooping: boolean }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SET_PIXELS_PER_SECOND'; pixelsPerSecond: number }
  | { type: 'SELECT_CLIP'; clipId: string | null }
  | { type: 'SET_PROCESSING'; isProcessing: boolean }
  | { type: 'ADD_PROCESSING_FILES'; files: FileProcessingState[] }
  | { type: 'UPDATE_PROCESSING_FILE'; id: string; updates: Partial<FileProcessingState> }
  | { type: 'REMOVE_PROCESSING_FILE'; id: string }
  | { type: 'ADD_CLIP'; clip: AudioClip }
  | { type: 'ADD_TRACK'; track?: Omit<AudioTrack, 'clips'> & { clipIds: string[] }}
  | { type: 'ASSIGN_CLIP_TO_TRACK'; clipId: string; trackId: string }
  | { type: 'UPDATE_TRACK'; trackId: string; updates: Partial<Omit<AudioTrack, 'clips'>> }
  | { type: 'UPDATE_CLIP'; clipId: string; updates: Partial<AudioClip> }
  | { type: 'UPDATE_CLIP_WAVEFORM'; clipId: string; waveformData: number[] }
  | { type: 'SET_DRAG_STATE'; dragState: Partial<AppState['ui']['dragState']> }
  | { type: 'RESET_DRAG_STATE' }
  | { type: 'REMOVE_TRACK'; trackId: string }
  | { type: 'MOVE_CLIP_TO_TRACK'; clipId: string; targetTrackId: string; newStartTime: number }

// Initial state
const initialState: AppState = {
  project: {
    id:            generateId(),
    name:          'New Project',
    tracks:        [],
    bpm:           120,
    timeSignature: { numerator: 4, denominator: 4 },
    duration:      16
  },
  clips:       [],
  audioEngine: {
    isPlaying:        false,
    currentSamples:   0,
    isLooping:        false,
    loopStartSamples: 0,
    loopEndSamples:   44100 * 16, // 16 seconds at 48kHz
    volume:           0.8,
    sampleRate:       44100,
    isInitialized:    false
  },
  ui: {
    selectedClipId:  null,
    pixelsPerSecond: 50,
    isProcessing:    false,
    dragState:       {
      isDragging:              false,
      dragType:                null,
      hoveredTrackId:          null,
      showNewTrackPlaceholder: false,
      placeholderClip:         null
    }
  },
  fileProcessing: []
}

// Reducer function

// eslint-disable-next-line complexity
function appReducer (state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INITIALIZE_AUDIO_CONTEXT':
      return {
        ...state,
        audioEngine: {
          ...state.audioEngine,
          isInitialized: true,
          sampleRate:    action.sampleRate
        }
      }
    case 'SET_PLAYING':
      return {
        ...state,
        audioEngine: { ...state.audioEngine, isPlaying: action.isPlaying }
      }
    case 'SET_CURRENT_SAMPLES':
      return {
        ...state,
        audioEngine: { ...state.audioEngine, currentSamples: action.samples }
      }
    case 'SET_LOOPING':
      return {
        ...state,
        audioEngine: { ...state.audioEngine, isLooping: action.isLooping }
      }
    case 'SET_VOLUME':
      return {
        ...state,
        audioEngine: { ...state.audioEngine, volume: action.volume }
      }
    case 'SET_PIXELS_PER_SECOND':
      return {
        ...state,
        ui: { ...state.ui, pixelsPerSecond: Math.max(4, Math.min(400, action.pixelsPerSecond)) }
      }
    case 'SELECT_CLIP':
      return {
        ...state,
        ui: { ...state.ui, selectedClipId: action.clipId }
      }
    case 'SET_PROCESSING':
      return {
        ...state,
        ui: { ...state.ui, isProcessing: action.isProcessing }
      }
    case 'ADD_PROCESSING_FILES':
      return {
        ...state,
        fileProcessing: [ ...state.fileProcessing, ...action.files ]
      }
    case 'UPDATE_PROCESSING_FILE':
      return {
        ...state,
        fileProcessing: state.fileProcessing.map(file =>
          file.id === action.id ? { ...file, ...action.updates } : file
        )
      }
    case 'REMOVE_PROCESSING_FILE':
      return {
        ...state,
        fileProcessing: state.fileProcessing.filter(file => file.id !== action.id)
      }
    case 'ADD_CLIP':
      return {
        ...state,
        clips: [ ...state.clips, action.clip ]
      }
    case 'ADD_TRACK': {
      // Create new track if not provided
      const newTrack = action.track || {
        id:      generateId(),
        name:    `Track ${state.project.tracks.length + 1}`,
        color:   getRandomTrackColor(),
        volume:  0.8,
        pan:     0,
        muted:   false,
        solo:    false,
        clipIds: [],
        index:   state.project.tracks.length
      }

      const updatedTracks   = [ ...state.project.tracks, newTrack ]
      const tracksWithClips = updatedTracks.map(track => ({
        ...track,
        clips: track.clipIds.map(clipId => state.clips.find(clip => clip.id === clipId)).filter(Boolean) as AudioClip[]
      }))
      const newDuration     = calculateProjectDuration(tracksWithClips)

      return {
        ...state,
        project: {
          ...state.project,
          tracks:   updatedTracks,
          duration: newDuration
        }
      }
    }

    case 'ASSIGN_CLIP_TO_TRACK': {
      const updatedTracks = state.project.tracks.map(track =>
        track.id === action.trackId
          ? { ...track, clipIds: [ ...track.clipIds, action.clipId ]}
          : track
      )

      // Calculate new duration
      const tracksWithClips = updatedTracks.map(track => ({
        ...track,
        clips: track.clipIds.map(clipId => state.clips.find(clip => clip.id === clipId)).filter(Boolean) as AudioClip[]
      }))
      const newDuration     = calculateProjectDuration(tracksWithClips)

      return {
        ...state,
        project: {
          ...state.project,
          tracks:   updatedTracks,
          duration: newDuration
        }
      }
    }
    case 'UPDATE_TRACK':
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(track =>
            track.id === action.trackId ? { ...track, ...action.updates } : track
          )
        }
      }
    case 'UPDATE_CLIP': {
      const updatedClips = state.clips.map(clip => {
        if (clip.id === action.clipId) {
          const updates = { ...action.updates }

          // If updating startTime, snap it to grid
          if (updates.startTime !== undefined)
            updates.startTime = snapToGrid(
              updates.startTime,
              state.project.bpm,
              GridSize.SIXTEENTH,
              state.project.timeSignature
            )

          return { ...clip, ...updates }
        }
        return clip
      })

      // Recalculate duration
      const tracksWithClips = state.project.tracks.map(track => ({
        ...track,
        clips: track.clipIds.map(clipId => updatedClips.find(clip => clip.id === clipId)).filter(Boolean) as AudioClip[]
      }))
      const newDuration     = calculateProjectDuration(tracksWithClips)

      return {
        ...state,
        clips:   updatedClips,
        project: {
          ...state.project,
          duration: newDuration
        }
      }
    }
    case 'UPDATE_CLIP_WAVEFORM':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.clipId
            ? { ...clip, waveformData: action.waveformData }
            : clip
        )
      }
    case 'SET_DRAG_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          dragState: { ...state.ui.dragState, ...action.dragState }
        }
      }
    case 'RESET_DRAG_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          dragState: {
            isDragging:              false,
            dragType:                null,
            hoveredTrackId:          null,
            showNewTrackPlaceholder: false,
            placeholderClip:         null
          }
        }
      }
    case 'REMOVE_TRACK': {
      // Remove the track and its clips
      const trackToRemove = state.project.tracks.find(track => track.id === action.trackId)
      if (!trackToRemove)
        return state

      const updatedTracks = state.project.tracks.filter(track => track.id !== action.trackId)
      const updatedClips = state.clips.filter(clip => !trackToRemove.clipIds.includes(clip.id))

      // Recalculate duration
      const tracksWithClips = updatedTracks.map(track => ({
        ...track,
        clips: track.clipIds.map(clipId => updatedClips.find(clip => clip.id === clipId)).filter(Boolean) as AudioClip[]
      }))
      const newDuration = calculateProjectDuration(tracksWithClips)

      return {
        ...state,
        clips:   updatedClips,
        project: {
          ...state.project,
          tracks:   updatedTracks,
          duration: newDuration
        }
      }
    }
    case 'MOVE_CLIP_TO_TRACK': {
      // Remove clip from current track and add to target track
      const updatedTracks = state.project.tracks.map(track => {
        if (track.clipIds.includes(action.clipId))
          return {
            ...track,
            clipIds: track.clipIds.filter(clipId => clipId !== action.clipId)
          }
        if (track.id === action.targetTrackId)
          return {
            ...track,
            clipIds: [ ...track.clipIds, action.clipId ]
          }
        return track
      })

      // Snap the new start time to grid
      const snappedStartTime = snapToGrid(
        action.newStartTime,
        state.project.bpm,
        GridSize.SIXTEENTH,
        state.project.timeSignature
      )

      // Update clip with new track and snapped start time
      const updatedClips = state.clips.map(clip =>
        clip.id === action.clipId
          ? { ...clip, trackId: action.targetTrackId, startTime: snappedStartTime }
          : clip
      )

      // Recalculate duration
      const tracksWithClips = updatedTracks.map(track => ({
        ...track,
        clips: track.clipIds.map(clipId => updatedClips.find(clip => clip.id === clipId)).filter(Boolean) as AudioClip[]
      }))
      const newDuration = calculateProjectDuration(tracksWithClips)

      return {
        ...state,
        clips:   updatedClips,
        project: {
          ...state.project,
          tracks:   updatedTracks,
          duration: newDuration
        }
      }
    }
    default:
      return state
  }
}

// Context value interface
export interface AudioEngineContextValue {
  // State
  state: AppState

  // Actions
  dispatch: React.Dispatch<AppAction>

  // Audio methods
  resumeAudioContext: () => Promise<boolean>

  // Utility methods
  samplesToSeconds: (samples: number) => number
  secondsToSamples: (seconds: number) => number

  // File handling
  openFileDialog:      () => void
  handleFilesSelected: (files: File[]) => void
}

interface ClipNodes {
  source: AudioBufferSourceNode
  gain:   GainNode
  panner: StereoPannerNode
}

interface TrackNodes {
  gain:      GainNode
  panner:    StereoPannerNode
  clipNodes: Map<string, ClipNodes>
}

const AudioEngineContext = createContext<AudioEngineContextValue | null>(null)

type AudioEngineProviderProps = PropsWithChildren

export function AudioEngineProvider ({ children }: AudioEngineProviderProps) {
  const [ state, dispatch ] = useReducer(appReducer, initialState)

  // Use a ref to hold the AudioEngine instance
  const audioEngineInstanceRef = useRef<AudioEngine | null>(null)
  const fileInputRef           = useRef<HTMLInputElement>(null)

  // Callback for AudioEngine to update currentSamples in context state
  const onUpdateCurrentSamples = useCallback((samples: number) => {
    dispatch({ type: 'SET_CURRENT_SAMPLES', samples })
  }, [ dispatch ])

  // Callback for AudioEngine to notify about successful AudioContext initialization
  const onAudioContextInitialized = useCallback((sampleRate: number) => {
    dispatch({ type: 'INITIALIZE_AUDIO_CONTEXT', sampleRate })
  }, [ dispatch ])

  // Initialize AudioEngine once and keep it in a ref
  useEffect(() => {
    calculateProjectDuration()

    if (!audioEngineInstanceRef.current)
      audioEngineInstanceRef.current = new AudioEngine(
        state.audioEngine,
        state.project,
        onUpdateCurrentSamples,
        onAudioContextInitialized
      )

    // This effect ensures AudioEngine always has the latest state from React
    // Call updateState on the AudioEngine instance
    audioEngineInstanceRef.current.updateState(state.audioEngine, state.project, state.clips)

    // Dispose on unmount
    return () => {
      // audioEngineInstanceRef.current?.dispose()
      // audioEngineInstanceRef.current = null
    }
  }, [
    state.audioEngine,
    state.project,
    state.clips, // Add state.clips to dependencies
    onUpdateCurrentSamples,
    onAudioContextInitialized
  ])

  // Resume audio context
  const resumeAudioContext = useCallback(async () => {
    if (!audioEngineInstanceRef.current) {
      console.warn('AudioEngine not initialized yet.')
      return false
    }
    return await audioEngineInstanceRef.current.resumeAudioContext()
  }, [])

  // Start audio playback
  const startPlayback = useCallback(async () => {
    if (!audioEngineInstanceRef.current)
      return
    await audioEngineInstanceRef.current.startPlayback()
  }, [])

  // Stop audio playback
  const stopPlayback = useCallback(() => {
    audioEngineInstanceRef.current?.stopPlayback()
  }, [])

  // Handle play/pause state changes with proper effect
  useEffect(() => {
    if (state.audioEngine.isPlaying)
      startPlayback(); else
      stopPlayback()
  }, [ state.audioEngine.isPlaying, startPlayback, stopPlayback ])

  // Utility functions now proxy to AudioEngine methods
  const samplesToSeconds = useCallback((samples: number): number => {
    if (!audioEngineInstanceRef.current)
      return 0
    return audioEngineInstanceRef.current.samplesToSeconds(samples)
  }, [])

  const secondsToSamples = useCallback((seconds: number): number => {
    if (!audioEngineInstanceRef.current)
      return 0
    return audioEngineInstanceRef.current.secondsToSamples(seconds)
  }, [])

  // Handle file selection (this logic remains in the context, as it dispatches state updates)
  const handleFilesSelected = (files: File[], trackId = '') => {
    const audioFiles = [ ...files ].filter(isSupportedAudioFile)
    if (audioFiles.length === 0)
      return

    dispatch({ type: 'SET_PROCESSING', isProcessing: true })

    const newProcessingFiles: FileProcessingState[] = audioFiles.map(file => ({
      id:       generateId(),
      fileName: file.name,
      status:   'processing'
    }))

    dispatch({ type: 'ADD_PROCESSING_FILES', files: newProcessingFiles })

    // Setup decoder message handler (remains here as it interacts with local dispatch)
    const handleMessage = (event: { data: WorkerMessage }) => {
      const message = event.data

      switch (message.type) {
        case WorkerMessageType.AUDIO_DECODED: {
          if (message.audioBuffer && message.fileName && message.duration)
            handleAudioDecoded(message.id, message.audioBuffer, message.fileName, message.duration, message.trackId as string)
          break
        }
        case WorkerMessageType.DECODE_ERROR: {
          if (message.error)
            handleDecodeError(message.id, message.error)
          break
        }
        case WorkerMessageType.WAVEFORM_GENERATED: {
          if (message.waveformData)
            handleWaveformGenerated(message.id, message.waveformData)
          break
        }
      }
    }

    audioDecoder.onMessage(handleMessage)

    // Process each file
    audioFiles.forEach((file, index) => {
      const fileId = newProcessingFiles[index].id

      const reader = new FileReader()
      reader.onload = event => {
        const arrayBuffer = event.target?.result as ArrayBuffer
        if (arrayBuffer)
          audioDecoder.processMessage({
            type:     WorkerMessageType.DECODE_AUDIO,
            id:       fileId,
            arrayBuffer,
            fileName: file.name,
            trackId
          })
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleAudioDecoded = useCallback((
    id: string,
    audioBuffer: AudioBuffer,
    fileName: string,
    duration: number,
    trackId: string,
  ) => {
    dispatch({ type: 'UPDATE_PROCESSING_FILE', id, updates: { status: 'completed' }})

    const clipId   = generateId()
    const clipName = sanitizeFileName(fileName.replace(/\.[^/.]+$/, ''))

    // Calculate grid-snapped start time (default to 0, but snap for visual consistency)
    const snappedStartTime = snapToGrid(0, state.project.bpm, GridSize.SIXTEENTH, state.project.timeSignature)

    // Create the clip first
    const newClip: AudioClip = {
      id:           clipId,
      name:         clipName,
      trackId:      '', // Will be assigned when placed on track
      audioBuffer,
      waveformData: [],
      startTime:    snappedStartTime,
      duration,
      volume:       1,
      pitch:        0,
      color:        getRandomTrackColor(),
      isLoading:    false
    }

    dispatch({ type: 'ADD_CLIP', clip: newClip })

    // Determine track assignment based on drag state
    const dragState = state.ui.dragState
    let targetTrackId = trackId || dragState.hoveredTrackId || ''

    if (targetTrackId)
      dispatch({ type: 'ASSIGN_CLIP_TO_TRACK', clipId, trackId: targetTrackId })
    else {
      targetTrackId = generateId()

      const newTrack = {
        id:      targetTrackId,
        name:    `Track ${state.project.tracks.length + 1}`,
        color:   newClip.color as TrackColor,
        volume:  0.8,
        pan:     0,
        muted:   false,
        solo:    false,
        clipIds: [ clipId ],
        index:   state.project.tracks.length
      }
      dispatch({ type: 'ADD_TRACK', track: newTrack })
    }

    // Update clip with assigned track
    dispatch({ type: 'UPDATE_CLIP', clipId, updates: { trackId: targetTrackId }})

    // Request waveform generation
    audioDecoder.processMessage({
      type:    WorkerMessageType.GENERATE_WAVEFORM,
      id:      clipId,
      audioBuffer,
      samples: Math.min(1000, Math.floor(duration * 100))
    })

    // Reset drag state
    dispatch({ type: 'RESET_DRAG_STATE' })

    // Clean up after delay
    setTimeout(() => {
      dispatch({ type: 'REMOVE_PROCESSING_FILE', id })
      if (state.fileProcessing.length <= 1)
        dispatch({ type: 'SET_PROCESSING', isProcessing: false })
    }, 1000)
  }, [ state.project.tracks.length, state.fileProcessing.length, state.ui.dragState, dispatch ])

  const handleDecodeError = useCallback((id: string, error: string) => {
    console.error('Audio decode error:', error)
    dispatch({ type: 'UPDATE_PROCESSING_FILE', id, updates: { status: 'error', error }})

    setTimeout(() => {
      dispatch({ type: 'REMOVE_PROCESSING_FILE', id })
      if (state.fileProcessing.length <= 1)
        dispatch({ type: 'SET_PROCESSING', isProcessing: false })
    }, 3000)
  }, [ state.fileProcessing.length, dispatch ])

  const handleWaveformGenerated = useCallback((id: string, waveformData: number[]) => {
    dispatch({ type: 'UPDATE_CLIP_WAVEFORM', clipId: id, waveformData })
  }, [ dispatch ])

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const contextValue: AudioEngineContextValue = {
    state,
    dispatch,
    resumeAudioContext,
    samplesToSeconds,
    secondsToSamples,
    openFileDialog,
    handleFilesSelected
  }

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      handleFilesSelected(files)
      // Reset input
      event.target.value = ''
    }
  }, [ handleFilesSelected ])

  return <AudioEngineContext.Provider value={ contextValue }>
    {children}

    <input
      type='file'
      accept='audio/*,.wav,.mp3,.m4a,.mp4,.ogg,.flac'
      ref={ fileInputRef }
      multiple={ true }
      style={{ display: 'none' }}
      onChange={ handleFileInputChange }
    />

  </AudioEngineContext.Provider>
}

// Custom hook to use the audio engine context
export function useAudioEngine (): AudioEngineContextValue {
  const context = useContext(AudioEngineContext)
  if (!context)
    throw new Error('useAudioEngine must be used within an AudioEngineProvider')
  return context
}
