/**
 * AudioEngine Context - Global audio state and engine management
 * Centralizes ALL application state using useReducer pattern
 */

import { createContext, useContext, useRef, useReducer, useCallback, useEffect, ReactNode } from 'react'
import { AudioTrack, AudioClip, AudioProject, FileProcessingState, WorkerMessage, WorkerMessageType, TrackColor } from '../types/audio'
import { generateId, getRandomTrackColor, sanitizeFileName, calculateProjectDuration, isSupportedAudioFile } from '../utils/audioUtils'
import { audioDecoder } from '../utils/audioDecoder'
import {
  createGainNode,
  createStereoPanner,
  createBufferSource,
} from '../utils/audioUtils'

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
    isPlaying: boolean
    currentSamples: number
    isLooping: boolean
    loopStartSamples: number
    loopEndSamples: number
    volume: number
    sampleRate: number
    isInitialized: boolean
  }
  
  // UI state
  ui: {
    selectedClipId: string | null
    pixelsPerSecond: number
    isProcessing: boolean
    dragState: {
      isDragging: boolean
      dragType: 'file' | null
      hoveredTrackId: string | null
      showNewTrackPlaceholder: boolean
      placeholderClip: {
        trackId: string
        startTime: number
        name: string
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
  | { type: 'ADD_TRACK'; track: Omit<AudioTrack, 'clips'> & { clipIds: string[] } }
  | { type: 'ASSIGN_CLIP_TO_TRACK'; clipId: string; trackId: string }
  | { type: 'UPDATE_TRACK'; trackId: string; updates: Partial<Omit<AudioTrack, 'clips'>> }
  | { type: 'UPDATE_CLIP'; clipId: string; updates: Partial<AudioClip> }
  | { type: 'UPDATE_CLIP_WAVEFORM'; clipId: string; waveformData: number[] }
  | { type: 'SET_DRAG_STATE'; dragState: Partial<AppState['ui']['dragState']> }
  | { type: 'RESET_DRAG_STATE' }

// Initial state
const initialState: AppState = {
  project: {
    id: generateId(),
    name: 'New Project',
    tracks: [],
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    duration: 16
  },
  clips: [],
  audioEngine: {
    isPlaying: false,
    currentSamples: 0,
    isLooping: false,
    loopStartSamples: 0,
    loopEndSamples: 48000 * 16, // 16 seconds at 48kHz
    volume: 0.8,
    sampleRate: 48000,
    isInitialized: false
  },
  ui: {
    selectedClipId: null,
    pixelsPerSecond: 50,
    isProcessing: false,
    dragState: {
      isDragging: false,
      dragType: null,
      hoveredTrackId: null,
      showNewTrackPlaceholder: false,
      placeholderClip: null
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
        clips: [...state.clips, action.clip]
      }
      
    case 'ADD_TRACK': {
      const updatedTracks = [...state.project.tracks, action.track]
      // Calculate duration using current clips
      const tracksWithClips = updatedTracks.map(track => ({
        ...track,
        clips: track.clipIds.map(clipId => state.clips.find(clip => clip.id === clipId)).filter(Boolean) as AudioClip[]
      }))
      const newDuration = calculateProjectDuration(tracksWithClips)
      
      return {
        ...state,
        project: {
          ...state.project,
          tracks: updatedTracks,
          duration: newDuration
        }
      }
    }
    
    case 'ASSIGN_CLIP_TO_TRACK': {
      const updatedTracks = state.project.tracks.map(track =>
        track.id === action.trackId
          ? { ...track, clipIds: [...track.clipIds, action.clipId] }
          : track
      )
      
      // Calculate new duration
      const tracksWithClips = updatedTracks.map(track => ({
        ...track,
        clips: track.clipIds.map(clipId => state.clips.find(clip => clip.id === clipId)).filter(Boolean) as AudioClip[]
      }))
      const newDuration = calculateProjectDuration(tracksWithClips)
      
      return {
        ...state,
        project: {
          ...state.project,
          tracks: updatedTracks,
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
      const updatedClips = state.clips.map(clip =>
        clip.id === action.clipId ? { ...clip, ...action.updates } : clip
      )
      
      // Recalculate duration
      const tracksWithClips = state.project.tracks.map(track => ({
        ...track,
        clips: track.clipIds.map(clipId => updatedClips.find(clip => clip.id === clipId)).filter(Boolean) as AudioClip[]
      }))
      const newDuration = calculateProjectDuration(tracksWithClips)
      
      return {
        ...state,
        clips: updatedClips,
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
            isDragging: false,
            dragType: null,
            hoveredTrackId: null,
            showNewTrackPlaceholder: false,
            placeholderClip: null
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
  openFileDialog: () => void
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

// Create the context
const AudioEngineContext = createContext<AudioEngineContextValue | null>(null)

// Provider props
interface AudioEngineProviderProps {
  children: ReactNode
}

export function AudioEngineProvider ({ children }: AudioEngineProviderProps) {
  const [ state, dispatch ] = useReducer(appReducer, initialState)

  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null)
  const mainGainNodeRef = useRef<GainNode | null>(null)
  const trackNodesRef   = useRef<Map<string, TrackNodes>>(new Map())
  const fileInputRef    = useRef<HTMLInputElement>(null)

  // Playback state
  const rafIdRef           = useRef<number | null>(null)
  const startTimeRef       = useRef<number>(0)
  const pausedAtSamplesRef = useRef<number>(0)
  const lastUpdateSamplesRef = useRef<number>(0)

  // Mouse listener for AudioContext initialization
  const mouseListenerRef = useRef<(() => void) | null>(null)

  // Utility functions for sample/time conversion
  const samplesToSeconds = useCallback((samples: number): number => samples / state.audioEngine.sampleRate, [ state.audioEngine.sampleRate ])
  const secondsToSamples = useCallback((seconds: number): number => Math.round(seconds * state.audioEngine.sampleRate), [ state.audioEngine.sampleRate ])

  // Initialize audio context
  const initializeAudioContext = useCallback(async () => {
    if (audioContextRef.current)
      return

    try {
      audioContextRef.current = new AudioContext({
        sampleRate:  48000,
        latencyHint: 'interactive'
      })

      mainGainNodeRef.current = createGainNode(audioContextRef.current, state.audioEngine.volume)
      mainGainNodeRef.current.connect(audioContextRef.current.destination)

      dispatch({ type: 'INITIALIZE_AUDIO_CONTEXT', sampleRate: audioContextRef.current.sampleRate })

      // Remove mouse listener once initialized
      if (mouseListenerRef.current) {
        document.removeEventListener('mousemove', mouseListenerRef.current)
        mouseListenerRef.current = null
      }

      console.log('Audio context initialized:', {
        sampleRate: audioContextRef.current.sampleRate,
        state:      audioContextRef.current.state
      })
    }
    catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }, [ state.audioEngine.volume ])

  // Setup mouse listener for audio context initialization
  if (!state.audioEngine.isInitialized && !mouseListenerRef.current) {
    mouseListenerRef.current = () => {
      initializeAudioContext()
    }
    document.addEventListener('mousemove', mouseListenerRef.current, { once: true })
  }


  // Resume audio context
  const resumeAudioContext = useCallback(async () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = null
      await initializeAudioContext()
      if (!audioContextRef.current)
        return false
    }

    try {
      if (audioContextRef.current.state === 'suspended')
        await audioContextRef.current.resume()

      return audioContextRef.current.state === 'running'
    }
    catch (error) {
      console.error('Failed to resume audio context:', error)
      return false
    }
  }, [ initializeAudioContext ])

  // Setup audio nodes for all tracks
  const setupAudioNodes = useCallback(() => {
    if (!audioContextRef.current || !mainGainNodeRef.current)
      return

    const audioContext = audioContextRef.current
    const mainGain     = mainGainNodeRef.current

    // Clear existing nodes
    trackNodesRef.current.forEach(track => {
      track.clipNodes.forEach(clip => {
        try {
          clip.source.stop()
        }
        catch (e) { /* ignore */ }
        clip.source.disconnect()
        clip.gain.disconnect()
        clip.panner.disconnect()
      })
      track.gain.disconnect()
      track.panner.disconnect()
    })
    trackNodesRef.current.clear()

    // Create nodes for each track
    state.project.tracks.forEach(track => {
      const trackGain   = createGainNode(audioContext, track.muted ? 0 : track.volume)
      const trackPanner = createStereoPanner(audioContext, track.pan)

      trackGain.connect(trackPanner)
      trackPanner.connect(mainGain)

      const clipNodes = new Map<string, ClipNodes>()
      trackNodesRef.current.set(track.id, { gain: trackGain, panner: trackPanner, clipNodes })
    })
  }, [ state.project.tracks ])

  // Schedule a clip for playback
  const scheduleClip = useCallback((clip: AudioClip, trackNodes: TrackNodes) => {
    if (!audioContextRef.current || !clip.audioBuffer)
      return

    const audioContext         = audioContextRef.current
    const clipStartSamples     = secondsToSamples(clip.startTime)
    const currentSamplesOffset = state.audioEngine.currentSamples

    if (clipStartSamples + secondsToSamples(clip.duration) < currentSamplesOffset)
      return

    const source = createBufferSource(audioContext, clip.audioBuffer, Math.pow(2, clip.pitch / 12))
    const gain   = createGainNode(audioContext, clip.volume)
    const panner = createStereoPanner(audioContext)

    source.connect(gain)
    gain.connect(panner)
    panner.connect(trackNodes.gain)

    const startOffset       = Math.max(0, samplesToSeconds(currentSamplesOffset - clipStartSamples))
    const scheduleStartTime = audioContext.currentTime + Math.max(0, samplesToSeconds(clipStartSamples - currentSamplesOffset))

    source.start(scheduleStartTime, startOffset)
    trackNodes.clipNodes.set(clip.id, { source, gain, panner })

    source.onended = () => {
      trackNodes.clipNodes.delete(clip.id)
    }
  }, [ secondsToSamples, samplesToSeconds, state.audioEngine.currentSamples ])

  // Start audio playback
  const startPlayback = useCallback(async () => {
    if (!state.audioEngine.isInitialized)
      return

    const isContextRunning = await resumeAudioContext()
    if (!isContextRunning || !audioContextRef.current)
      return

    const audioContext = audioContextRef.current
    
    // Use state.audioEngine.currentSamples as the source of truth
    const startFromSamples = state.audioEngine.currentSamples
    startTimeRef.current = audioContext.currentTime - samplesToSeconds(startFromSamples)
    pausedAtSamplesRef.current = startFromSamples
    lastUpdateSamplesRef.current = startFromSamples

    setupAudioNodes()

    // Schedule all clips
    state.project.tracks.forEach(track => {
      const trackNodes = trackNodesRef.current.get(track.id)
      if (!trackNodes)
        return

      // Get clips for this track
      const trackClips = track.clipIds
        .map(clipId => state.clips.find(clip => clip.id === clipId))
        .filter(Boolean) as AudioClip[]
        
      trackClips.forEach(clip => {
        scheduleClip(clip, trackNodes)
      })
    })

    // Start time update loop
    const updateTime = () => {
      if (!audioContextRef.current || !state.audioEngine.isPlaying)
        return

      const currentAudioTime = audioContextRef.current.currentTime - startTimeRef.current
      const currentSamples   = secondsToSamples(Math.max(0, currentAudioTime))

      // Only update if the samples have actually changed to avoid unnecessary re-renders
      if (Math.abs(currentSamples - lastUpdateSamplesRef.current) > 100) { // ~2ms threshold
        lastUpdateSamplesRef.current = currentSamples
        dispatch({ type: 'SET_CURRENT_SAMPLES', samples: currentSamples })
      }

      // Handle looping
      if (state.audioEngine.isLooping && currentSamples >= state.audioEngine.loopEndSamples) {
        const loopStartSamples = state.audioEngine.loopStartSamples
        startTimeRef.current = audioContextRef.current.currentTime - samplesToSeconds(loopStartSamples)
        lastUpdateSamplesRef.current = loopStartSamples
        dispatch({ type: 'SET_CURRENT_SAMPLES', samples: loopStartSamples })

        // Reschedule clips for loop
        setupAudioNodes()
        state.project.tracks.forEach(track => {
          const trackNodes = trackNodesRef.current.get(track.id)
          if (!trackNodes)
            return
          // Get clips for this track
          const trackClips = track.clipIds
            .map(clipId => state.clips.find(clip => clip.id === clipId))
            .filter(Boolean) as AudioClip[]
            
          trackClips.forEach(clip => {
            scheduleClip(clip, trackNodes)
          })
        })
      }

      if (state.audioEngine.isPlaying)
        rafIdRef.current = requestAnimationFrame(updateTime)
    }

    rafIdRef.current = requestAnimationFrame(updateTime)
  }, [ state.audioEngine.isInitialized, state.audioEngine.isPlaying, state.audioEngine.isLooping, state.audioEngine.loopStartSamples, state.audioEngine.loopEndSamples, state.audioEngine.currentSamples, state.project.tracks, resumeAudioContext, setupAudioNodes, scheduleClip, samplesToSeconds, secondsToSamples ])

  // Stop audio playback
  const stopPlayback = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    if (!audioContextRef.current)
      return

    // Update pausedAtSamplesRef to match current state
    pausedAtSamplesRef.current = state.audioEngine.currentSamples

    trackNodesRef.current.forEach(track => {
      track.clipNodes.forEach(clip => {
        try {
          clip.source.stop()
        }
        catch (e) { /* ignore */ }
      })
      track.clipNodes.clear()
    })
  }, [ state.audioEngine.currentSamples ])

  // Handle volume changes
  useEffect(() => {
    if (mainGainNodeRef.current) {
      mainGainNodeRef.current.gain.value = state.audioEngine.volume
    }
  }, [state.audioEngine.volume])

  // Handle play/pause state changes with proper effect
  useEffect(() => {
    if (state.audioEngine.isInitialized) {
      if (state.audioEngine.isPlaying) {
        startPlayback()
      } else {
        stopPlayback()
      }
    }
    
    // Cleanup on unmount
    return () => {
      stopPlayback()
    }
  }, [state.audioEngine.isInitialized, state.audioEngine.isPlaying, startPlayback, stopPlayback])

  // Handle seeking during playback - restart audio when currentSamples changes externally
  useEffect(() => {
    if (state.audioEngine.isPlaying && state.audioEngine.isInitialized) {
      // Check if currentSamples was changed externally (not from our animation frame)
      const samplesChanged = Math.abs(state.audioEngine.currentSamples - lastUpdateSamplesRef.current) > 1000 // ~20ms threshold
      
      if (samplesChanged) {
        // User seeked during playback - restart from new position
        console.log('Seek detected during playback, restarting from:', samplesToSeconds(state.audioEngine.currentSamples))
        stopPlayback()
        // Small delay to let audio context stabilize
        setTimeout(() => {
          if (state.audioEngine.isPlaying) {
            startPlayback()
          }
        }, 10)
      }
    }
  }, [state.audioEngine.currentSamples, state.audioEngine.isPlaying, state.audioEngine.isInitialized, startPlayback, stopPlayback, samplesToSeconds])

  // Handle file selection
  const handleFilesSelected = useCallback((files: File[]) => {
    const audioFiles = files.filter(isSupportedAudioFile)
    if (audioFiles.length === 0)
      return

    dispatch({ type: 'SET_PROCESSING', isProcessing: true })

    const newProcessingFiles: FileProcessingState[] = audioFiles.map(file => ({
      id:       generateId(),
      fileName: file.name,
      status:   'processing'
    }))

    dispatch({ type: 'ADD_PROCESSING_FILES', files: newProcessingFiles })

    // Setup decoder message handler
    const handleMessage = (event: { data: WorkerMessage }) => {
      const message = event.data

      switch (message.type) {
        case WorkerMessageType.AUDIO_DECODED: {
          if (message.audioBuffer && message.fileName && message.duration)
            handleAudioDecoded(message.id, message.audioBuffer, message.fileName, message.duration)
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
            fileName: file.name
          })
      }
      reader.readAsArrayBuffer(file)
    })
  }, [])

  const handleAudioDecoded = useCallback((
    id: string,
    audioBuffer: AudioBuffer,
    fileName: string,
    duration: number
  ) => {
    dispatch({ type: 'UPDATE_PROCESSING_FILE', id, updates: { status: 'completed' }})

    const clipId = generateId()
    const clipName = sanitizeFileName(fileName.replace(/\.[^/.]+$/, ''))

    // Create the clip first
    const newClip: AudioClip = {
      id: clipId,
      name: clipName,
      trackId: '', // Will be assigned when placed on track
      audioBuffer,
      waveformData: [],
      startTime: 0,
      duration,
      volume: 1,
      pitch: 0,
      color: getRandomTrackColor(),
      isLoading: false
    }

    dispatch({ type: 'ADD_CLIP', clip: newClip })

    // Determine track assignment based on drag state
    const dragState = state.ui.dragState
    let targetTrackId = ''

    if (dragState.hoveredTrackId) {
      // Assign to hovered track
      targetTrackId = dragState.hoveredTrackId
      dispatch({ type: 'ASSIGN_CLIP_TO_TRACK', clipId, trackId: targetTrackId })
    } else {
      // Create new track
      const trackId = generateId()
      const newTrack = {
        id: trackId,
        name: `Track ${state.project.tracks.length + 1}`,
        color: newClip.color as TrackColor,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        clipIds: [clipId],
        index: state.project.tracks.length
      }
      
      targetTrackId = trackId
      dispatch({ type: 'ADD_TRACK', track: newTrack })
    }

    // Update clip with assigned track
    dispatch({ type: 'UPDATE_CLIP', clipId, updates: { trackId: targetTrackId } })

    // Request waveform generation
    audioDecoder.processMessage({
      type: WorkerMessageType.GENERATE_WAVEFORM,
      id: clipId,
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
  }, [ state.project.tracks.length, state.fileProcessing.length, state.ui.dragState ])

  const handleDecodeError = useCallback((id: string, error: string) => {
    console.error('Audio decode error:', error)
    dispatch({ type: 'UPDATE_PROCESSING_FILE', id, updates: { status: 'error', error }})

    setTimeout(() => {
      dispatch({ type: 'REMOVE_PROCESSING_FILE', id })
      if (state.fileProcessing.length <= 1)
        dispatch({ type: 'SET_PROCESSING', isProcessing: false })
    }, 3000)
  }, [ state.fileProcessing.length ])

  const handleWaveformGenerated = useCallback((id: string, waveformData: number[]) => {
    dispatch({ type: 'UPDATE_CLIP_WAVEFORM', clipId: id, waveformData })
  }, [])

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

  return <AudioEngineContext.Provider value={contextValue}>
    {children}

    <input
      type='file'
      accept='audio/*,.wav,.mp3,.m4a,.mp4,.ogg,.flac'
      ref={fileInputRef}
      multiple={true}
      style={{ display: 'none' }}
      onChange={handleFileInputChange}
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
