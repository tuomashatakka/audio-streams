/**
 * Core type definitions for the Audio Streams module
 */

// Audio Engine State
export interface AudioEngineState {
  isPlaying:     boolean
  currentTime:   number
  isLooping:     boolean
  loopStart:     number
  loopEnd:       number
  bpm:           number
  volume:        number
  isInitialized: boolean
}

// Audio Track definition

export interface AudioTrack {
  id:     string
  name:   string
  color:  string
  volume: number
  pan:    number
  muted:  boolean
  solo:   boolean
  clips:  AudioClip[]
  index:  number
}

// Audio Clip definition

export interface AudioClip {
  id:           string
  name:         string
  trackId:      string
  audioBuffer:  AudioBuffer | null
  audioUrl?:    string
  waveformData: number[]
  startTime:    number
  duration:     number
  volume:       number
  pitch:        number
  color?:       string
  isLoading?:   boolean
}

// Timeline configuration

export interface TimelineConfig {
  width:           number
  height:          number
  pixelsPerSecond: number
  bpm:             number
  timeSignature: {
    numerator:   number
    denominator: number
  }
}

// Web Worker message types

export enum WorkerMessageType {
  DECODE_AUDIO = 'DECODE_AUDIO',
  AUDIO_DECODED = 'AUDIO_DECODED',
  DECODE_ERROR = 'DECODE_ERROR',
  GENERATE_WAVEFORM = 'GENERATE_WAVEFORM',
  WAVEFORM_GENERATED = 'WAVEFORM_GENERATED'
}

// Web Worker message interfaces

export interface DecodeAudioMessage {
  type:        WorkerMessageType.DECODE_AUDIO
  id:          string
  arrayBuffer: ArrayBuffer
  fileName:    string
}

export interface AudioDecodedMessage {
  type:        WorkerMessageType.AUDIO_DECODED
  id:          string
  audioBuffer: AudioBuffer
  fileName:    string
  duration:    number
  sampleRate:  number
}

export interface DecodeErrorMessage {
  type:  WorkerMessageType.DECODE_ERROR
  id:    string
  error: string
}

export interface GenerateWaveformMessage {
  type:        WorkerMessageType.GENERATE_WAVEFORM
  id:          string
  audioBuffer: AudioBuffer
  samples:     number
}

export interface WaveformGeneratedMessage {
  type:         WorkerMessageType.WAVEFORM_GENERATED
  id:           string
  waveformData: number[]
}

export type WorkerMessage =
  | DecodeAudioMessage
  | AudioDecodedMessage
  | DecodeErrorMessage
  | GenerateWaveformMessage
  | WaveformGeneratedMessage

// Drag and Drop types

export interface DropZoneState {
  isDragOver:    boolean
  isProcessing:  boolean
  errorMessage?: string
}

// Audio file processing state

export interface FileProcessingState {
  id:        string
  fileName:  string
  status:    'processing' | 'completed' | 'error'
  progress?: number
  error?:    string
}

// Project state

export interface AudioProject {
  id:            string
  name:          string
  tracks:        AudioTrack[]
  bpm:           number
  timeSignature: {
    numerator:   number
    denominator: number
  }
  duration: number
}

// Playback controls

export interface PlaybackControls {
  play:       () => void
  pause:      () => void
  stop:       () => void
  seek:       (time: number) => void
  setVolume:  (volume: number) => void
  toggleLoop: () => void
}

// Supported audio formats

export enum SupportedAudioFormat {
  WAV = 'audio/wav',
  MP3 = 'audio/mpeg',
  M4A = 'audio/mp4',
  OGG = 'audio/ogg',
  FLAC = 'audio/flac'
}

// Audio context configuration

export interface AudioContextConfig {
  sampleRate:  number
  latencyHint: AudioContextLatencyCategory
}

// Waveform visualization options

export interface WaveformOptions {
  width:           number
  height:          number
  color:           string
  backgroundColor: string
  strokeWidth:     number
  samples:         number
}

// Track colors (predefined palette)

export const TRACK_COLORS = [
  '#ff5500', // Orange
  '#3a86ff', // Blue
  '#38b000', // Green
  '#ffbe0b', // Yellow
  '#ff006e', // Pink
  '#8338ec', // Purple
  '#fb8500', // Dark orange
  '#219ebc', // Teal
  '#023047', // Dark blue
  '#126782' // Steel blue
] as const

export type TrackColor = typeof TRACK_COLORS[number]
