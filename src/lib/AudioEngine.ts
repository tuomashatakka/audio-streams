import { AudioClip, AudioTrack } from '../types/audio'
import {
  createGainNode,
  createStereoPanner,
  createBufferSource,
} from '../utils/audioUtils'

interface ClipNodes {
  source: AudioBufferSourceNode;
  gain:   GainNode;
  panner: StereoPannerNode;
}

interface TrackNodes {
  gain:      GainNode;
  panner:    StereoPannerNode;
  clipNodes: Map<string, ClipNodes>;
}

interface AudioEngineState {
  isPlaying:        boolean;
  currentSamples:   number;
  isLooping:        boolean;
  loopStartSamples: number;
  loopEndSamples:   number;
  volume:           number;
  sampleRate:       number;
}

interface AudioEngineProject {
  tracks: Array<Omit<AudioTrack, 'clips'> & { clipIds: string[] }>;
}

type OnUpdateCurrentSamplesCallback = (samples: number) => void
type OnAudioContextInitializedCallback = (sampleRate: number) => void

export class AudioEngine {
  private audioContext:      AudioContext | null = null
  private mainGainNode:      GainNode | null = null
  private trackNodes:        Map<string, TrackNodes> = new Map()
  private rafId:             number | null = null
  private startTime:         number = 0
  private pausedAtSamples:   number = 0
  private lastUpdateSamples: number = 0

  private onUpdateCurrentSamples:    OnUpdateCurrentSamplesCallback
  private onAudioContextInitialized: OnAudioContextInitializedCallback

  private _state:    AudioEngineState
  private _project:  AudioEngineProject
  private _allClips: AudioClip[] = []

  constructor (
    initialState: AudioEngineState,
    initialProject: AudioEngineProject,
    onUpdateCurrentSamples: OnUpdateCurrentSamplesCallback,
    onAudioContextInitialized: OnAudioContextInitializedCallback,
  ) {
    this._state = { ...initialState }
    this._project = { ...initialProject }
    this.onUpdateCurrentSamples = onUpdateCurrentSamples
    this.onAudioContextInitialized = onAudioContextInitialized
  }

  public updateState (newState: AudioEngineState, newProject: AudioEngineProject, allClips: AudioClip[]): void {
    this._state = { ...newState }
    this._project = { ...newProject }
    this._allClips = [ ...allClips ]

    if (this.mainGainNode)
      this.mainGainNode.gain.value = this._state.volume

    if (this._state.isPlaying && this.audioContext && Math.abs(this._state.currentSamples - this.lastUpdateSamples) > 1000) {
      console.log('AudioEngine: External seek detected, restarting playback.')
      this.stopPlayback()
      setTimeout(() => {
        if (this._state.isPlaying)
          this.startPlayback()
      }, 10)
    }
  }

  public async initializeAudioContext (): Promise<boolean> {
    if (this.audioContext) {
      if (this.audioContext.state === 'running')
        return true
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
        // @ts-expect-error asd
        if (this.audioContext.state === 'running')
          return true
      }
      if (this.audioContext.state === 'closed')
        this.audioContext = null
    }

    if (!this.audioContext)
      try {
        this.audioContext = new AudioContext({
          sampleRate:  44100,
          latencyHint: 'interactive',
        })
        this.mainGainNode = createGainNode(this.audioContext, this._state.volume)
        this.mainGainNode.connect(this.audioContext.destination)

        this.onAudioContextInitialized(this.audioContext.sampleRate)
        console.log('Audio context initialized:', {
          sampleRate: this.audioContext.sampleRate,
          state:      this.audioContext.state
        })
        return true
      }
      catch (error) {
        console.error('Failed to initialize audio context:', error)
        return false
      }
    return false
  }

  public async resumeAudioContext (): Promise<boolean> {
    const initialized = await this.initializeAudioContext()
    if (!initialized || !this.audioContext)
      return false

    if (this.audioContext.state === 'suspended')
      try {
        await this.audioContext.resume()
        // @ts-expect-error asd
        return this.audioContext.state === 'running'
      }
      catch (error) {
        console.error('Failed to resume audio context:', error)
        return false
      }
    return this.audioContext.state === 'running'
  }

  private setupAudioNodes (): void {
    if (!this.audioContext || !this.mainGainNode)
      return

    this.trackNodes.forEach(track => {
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
    this.trackNodes.clear()

    this._project.tracks.forEach(track => {
      const trackGain = createGainNode(this.audioContext!, track.muted ? 0 : track.volume)
      const trackPanner = createStereoPanner(this.audioContext!, track.pan)

      trackGain.connect(trackPanner)
      trackPanner.connect(this.mainGainNode!)

      const clipNodes = new Map<string, ClipNodes>()
      this.trackNodes.set(track.id, { gain: trackGain, panner: trackPanner, clipNodes })
    })
  }

  private scheduleClip (clip: AudioClip, trackNodes: TrackNodes): void {
    if (!this.audioContext || !clip.audioBuffer)
      return

    const clipStartSamples = this.secondsToSamples(clip.startTime)
    const currentSamplesOffset = this._state.currentSamples

    if (clipStartSamples + this.secondsToSamples(clip.duration) < currentSamplesOffset)
      return

    const source = createBufferSource(this.audioContext, clip.audioBuffer, Math.pow(2, clip.pitch / 12))
    const gain = createGainNode(this.audioContext, clip.volume)
    const panner = createStereoPanner(this.audioContext)

    source.connect(gain)
    gain.connect(panner)
    panner.connect(trackNodes.gain)

    const startOffset = Math.max(0, this.samplesToSeconds(currentSamplesOffset - clipStartSamples))
    const scheduleStartTime = this.audioContext.currentTime + Math.max(0, this.samplesToSeconds(clipStartSamples - currentSamplesOffset))

    source.start(scheduleStartTime, startOffset)
    trackNodes.clipNodes.set(clip.id, { source, gain, panner })

    source.onended = () => {
      trackNodes.clipNodes.delete(clip.id)
    }
  }

  private updateTime () {
    if (!this.audioContext || !this._state.isPlaying) {
      this.rafId = null
      return
    }

    const updateTime = this.updateTime.bind(this)

    const currentAudioTime = this.audioContext.currentTime - this.startTime
    const currentSamples = this.secondsToSamples(Math.max(0, currentAudioTime))

    if (Math.abs(currentSamples - this.lastUpdateSamples) > 1000) {
      this.lastUpdateSamples = currentSamples
      this.onUpdateCurrentSamples(currentSamples)
    }

    if (this._state.isLooping && currentSamples >= this._state.loopEndSamples) {
      const loopStartSamples = this._state.loopStartSamples
      this.startTime = this.audioContext.currentTime - this.samplesToSeconds(loopStartSamples)
      this.lastUpdateSamples = loopStartSamples
      this.onUpdateCurrentSamples(loopStartSamples)

      this.stopPlayback()
      this.startPlayback()
    }
    else if (!this._state.isLooping && currentSamples >= this._state.loopEndSamples) {
      this.stopPlayback()
      this.onUpdateCurrentSamples(this._state.loopEndSamples)
    }

    if (this._state.isPlaying)
      this.rafId = requestAnimationFrame(updateTime)
    else
      this.rafId = null
  }

  public async startPlayback (): Promise<void> {
    const isContextRunning = await this.resumeAudioContext()
    if (!isContextRunning || !this.audioContext)
      return

    const startFromSamples = this._state.currentSamples
    this.startTime = this.audioContext.currentTime - this.samplesToSeconds(startFromSamples)
    this.lastUpdateSamples = startFromSamples

    this.setupAudioNodes()

    this._project.tracks.forEach(track => {
      const trackNodes = this.trackNodes.get(track.id)
      if (!trackNodes)
        return

      const trackClips = track.clipIds
        .map(clipId => this._allClips.find(clip => clip.id === clipId))
        .filter(Boolean) as AudioClip[]

      trackClips.forEach(clip => {
        this.scheduleClip(clip, trackNodes)
      })
    })

    if (this.rafId)
      cancelAnimationFrame(this.rafId)

    const updateTime = this.updateTime.bind(this)
    this.rafId = requestAnimationFrame(updateTime)
  }

  public stopPlayback (): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    if (!this.audioContext)
      return

    this.pausedAtSamples = this._state.currentSamples

    this.trackNodes.forEach(track => {
      track.clipNodes.forEach(clip => {
        try {
          clip.source.stop()
        }
        catch (e) { /* ignore */ }
      })
      track.clipNodes.clear()
    })
  }

  public samplesToSeconds (samples: number): number {
    return samples / this._state.sampleRate
  }

  public secondsToSamples (seconds: number): number {
    return Math.round(seconds * this._state.sampleRate)
  }

  public getAudioContext (): AudioContext | null {
    return this.audioContext
  }

  public dispose (): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed')
      this.audioContext.close()
    this.audioContext = null
    this.mainGainNode = null
    this.trackNodes.clear()
    console.log('AudioEngine disposed.')
  }
}
