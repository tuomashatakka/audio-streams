/**
 * Core Audio Engine Component
 * Manages Web Audio API context and audio playback
 */

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { AudioTrack, AudioClip, AudioEngineState } from '../../types/audio'
import { 
  createGainNode, 
  createStereoPanner, 
  createBufferSource,
  validateAudioContext,
  resumeAudioContext
} from '../../utils/audioUtils'

interface AudioEngineProps {
  tracks: AudioTrack[]
  isPlaying: boolean
  currentTime: number
  isLooping: boolean
  loopStart: number
  loopEnd: number
  volume: number
  bpm: number
  onTimeUpdate: (time: number) => void
  onPlaybackEnd: () => void
  onStateChange?: (state: AudioEngineState) => void
}

export interface AudioEngineRef {
  resumeAudioContext: () => Promise<boolean>
}

interface ClipNodes {
  source: AudioBufferSourceNode
  gain: GainNode
  panner: StereoPannerNode
}

interface TrackNodes {
  gain: GainNode
  panner: StereoPannerNode
  clipNodes: Map<string, ClipNodes>
}

const AudioEngine = forwardRef<AudioEngineRef, AudioEngineProps>(({
  tracks,
  isPlaying,
  currentTime,
  isLooping,
  loopStart,
  loopEnd,
  volume,
  bpm,
  onTimeUpdate,
  onPlaybackEnd,
  onStateChange
}, ref) => {
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null)
  const mainGainNodeRef = useRef<GainNode | null>(null)
  const trackNodesRef = useRef<Map<string, TrackNodes>>(new Map())
  
  // Playback state
  const rafIdRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedAtRef = useRef<number>(currentTime)
  
  // Component state
  const [isInitialized, setIsInitialized] = useState(false)
  const [audioState, setAudioState] = useState<AudioEngineState>({
    isPlaying: false,
    currentTime: 0,
    isLooping: false,
    loopStart: 0,
    loopEnd: 0,
    bpm: 120,
    volume: 0.8,
    isInitialized: false
  })

  // Initialize audio context (only on user gesture)
  const initializeAudioContext = useCallback(async () => {
    if (audioContextRef.current) return

    try {
      // Create AudioContext - this will be suspended until user gesture
      audioContextRef.current = new AudioContext({
        sampleRate: 48000,
        latencyHint: 'interactive'
      })

      // Create master gain node
      mainGainNodeRef.current = createGainNode(audioContextRef.current, volume)
      mainGainNodeRef.current.connect(audioContextRef.current.destination)

      setIsInitialized(true)
      setAudioState(prev => ({ ...prev, isInitialized: true }))
      
      console.log('Audio context created:', {
        sampleRate: audioContextRef.current.sampleRate,
        state: audioContextRef.current.state
      })

    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }, [volume])

  // Resume audio context on user gesture
  const resumeAudioContextOnUserGesture = useCallback(async () => {
    if (!audioContextRef.current) {
      console.warn('No audio context to resume, creating new one')
      await initializeAudioContext()
      if (!audioContextRef.current) return false
    }

    try {
      console.log('Audio context state before resume:', audioContextRef.current.state)
      
      // If context is closed, create a new one
      if (audioContextRef.current.state === 'closed') {
        console.log('AudioContext was closed, creating new one')
        audioContextRef.current = null
        await initializeAudioContext()
        if (!audioContextRef.current) return false
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
        console.log('Audio context resumed, new state:', audioContextRef.current.state)
      }
      
      const isRunning = audioContextRef.current.state === 'running'
      console.log('Audio context is running:', isRunning)
      return isRunning
    } catch (error) {
      console.error('Failed to resume audio context:', error)
      return false
    }
  }, [initializeAudioContext])

  // Setup audio nodes for all tracks
  const setupAudioNodes = useCallback(() => {
    if (!audioContextRef.current || !mainGainNodeRef.current) return

    const audioContext = audioContextRef.current
    const mainGain = mainGainNodeRef.current

    // Clear existing nodes
    cleanupAudioNodes()

    // Create nodes for each track
    tracks.forEach(track => {
      const trackGain = createGainNode(audioContext, track.muted ? 0 : track.volume)
      const trackPanner = createStereoPanner(audioContext, track.pan)

      trackGain.connect(trackPanner)
      trackPanner.connect(mainGain)

      const clipNodes = new Map<string, ClipNodes>()
      trackNodesRef.current.set(track.id, { gain: trackGain, panner: trackPanner, clipNodes })
    })
  }, [tracks])

  // Cleanup audio nodes
  const cleanupAudioNodes = useCallback(() => {
    trackNodesRef.current.forEach(track => {
      track.clipNodes.forEach(clip => {
        try {
          clip.source.stop()
        } catch (e) {
          // Ignore if already stopped
        }
        clip.source.disconnect()
        clip.gain.disconnect()
        clip.panner.disconnect()
      })
      track.gain.disconnect()
      track.panner.disconnect()
    })

    trackNodesRef.current.clear()
  }, [])

  // Schedule a clip for playback
  const scheduleClip = useCallback((clip: AudioClip, track: AudioTrack, trackNodes: TrackNodes) => {
    if (!audioContextRef.current || !clip.audioBuffer) return

    const audioContext = audioContextRef.current
    const clipStartTime = clip.startTime
    const currentTimeOffset = pausedAtRef.current

    // Only schedule clips that should be playing
    if (clipStartTime + clip.duration < currentTimeOffset) {
      return // Clip is in the past
    }

    // Create nodes for this clip
    const source = createBufferSource(audioContext, clip.audioBuffer, Math.pow(2, clip.pitch / 12))
    const gain = createGainNode(audioContext, clip.volume)
    const panner = createStereoPanner(audioContext)

    // Connect nodes
    source.connect(gain)
    gain.connect(panner)
    panner.connect(trackNodes.gain)

    // Calculate timing
    const startOffset = Math.max(0, currentTimeOffset - clipStartTime)
    const scheduleStartTime = audioContext.currentTime + Math.max(0, clipStartTime - currentTimeOffset)

    // Schedule playback
    source.start(scheduleStartTime, startOffset)

    // Store nodes for cleanup
    trackNodes.clipNodes.set(clip.id, { source, gain, panner })

    // Handle clip end
    source.onended = () => {
      trackNodes.clipNodes.delete(clip.id)
    }
  }, [])

  // Start audio playback
  const startPlayback = useCallback(async () => {
    if (!isInitialized) return

    // Ensure audio context is running (requires user gesture)
    const isContextRunning = await resumeAudioContextOnUserGesture()
    if (!isContextRunning) {
      console.warn('AudioContext not running - requires user gesture')
      return
    }

    if (!audioContextRef.current) {
      console.warn('No audio context available after resume')
      return
    }

    const audioContext = audioContextRef.current
    startTimeRef.current = audioContext.currentTime - pausedAtRef.current

    // Setup audio nodes if needed
    setupAudioNodes()

    // Schedule all clips
    tracks.forEach(track => {
      const trackNodes = trackNodesRef.current.get(track.id)
      if (!trackNodes) return

      track.clips.forEach(clip => {
        scheduleClip(clip, track, trackNodes)
      })
    })

    // Start time update loop
    const updateTime = () => {
      if (!audioContextRef.current || !isPlaying) return

      const currentAudioTime = audioContextRef.current.currentTime - startTimeRef.current
      onTimeUpdate(Math.max(0, currentAudioTime))

      // Handle looping
      if (isLooping && currentAudioTime >= loopEnd) {
        pausedAtRef.current = loopStart
        startTimeRef.current = audioContextRef.current.currentTime - loopStart

        // Reschedule clips for loop
        cleanupAudioNodes()
        setupAudioNodes()
        tracks.forEach(track => {
          const trackNodes = trackNodesRef.current.get(track.id)
          if (!trackNodes) return
          track.clips.forEach(clip => {
            scheduleClip(clip, track, trackNodes)
          })
        })
      }

      if (isPlaying) {
        rafIdRef.current = requestAnimationFrame(updateTime)
      }
    }

    rafIdRef.current = requestAnimationFrame(updateTime)
  }, [isInitialized, isPlaying, tracks, isLooping, loopStart, loopEnd, onTimeUpdate, scheduleClip, setupAudioNodes, cleanupAudioNodes, resumeAudioContextOnUserGesture])

  // Stop audio playback
  const stopPlayback = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    if (!audioContextRef.current) return

    // Store current position
    pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current

    // Stop all sources
    trackNodesRef.current.forEach(track => {
      track.clipNodes.forEach(clip => {
        try {
          clip.source.stop()
        } catch (e) {
          // Ignore if already stopped
        }
      })
      track.clipNodes.clear()
    })
  }, [])

  // Update volume
  useEffect(() => {
    if (!mainGainNodeRef.current) return
    mainGainNodeRef.current.gain.value = volume
  }, [volume])

  // Update audio state
  useEffect(() => {
    const newState: AudioEngineState = {
      isPlaying,
      currentTime,
      isLooping,
      loopStart,
      loopEnd,
      bpm,
      volume,
      isInitialized
    }
    setAudioState(newState)
    onStateChange?.(newState)
  }, [isPlaying, currentTime, isLooping, loopStart, loopEnd, bpm, volume, isInitialized, onStateChange])

  // Initialize on mount
  useEffect(() => {
    initializeAudioContext()

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      cleanupAudioNodes()
      // Don't close AudioContext on unmount - it might be needed for resume
      // The context will be garbage collected when the page unloads
    }
  }, [initializeAudioContext, cleanupAudioNodes])

  // Setup nodes when tracks change
  useEffect(() => {
    if (!isInitialized) return
    setupAudioNodes()
  }, [isInitialized, tracks, setupAudioNodes])

  // Handle play/pause state changes
  useEffect(() => {
    if (!isInitialized) return

    if (isPlaying) {
      // Add a small delay to ensure user gesture has been processed
      setTimeout(() => {
        startPlayback()
      }, 50)
    } else {
      stopPlayback()
    }
  }, [isInitialized, isPlaying, startPlayback, stopPlayback])

  // Handle time changes when not playing
  useEffect(() => {
    if (!isPlaying) {
      pausedAtRef.current = currentTime
    }
  }, [currentTime, isPlaying])

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    resumeAudioContext: resumeAudioContextOnUserGesture
  }), [resumeAudioContextOnUserGesture])

  // This component handles logic only, no UI
  return null
})

AudioEngine.displayName = 'AudioEngine'

export default AudioEngine
