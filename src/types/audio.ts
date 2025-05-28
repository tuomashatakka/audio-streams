/**
 * Audio type definitions for the audio streams module
 */

// Supported audio formats
export enum SupportedAudioFormat {
  WAV = 'audio/wav',
  MP3 = 'audio/mpeg',
  M4A = 'audio/mp4',
  OGG = 'audio/ogg',
  FLAC = 'audio/flac'
}

// Track colors (predefined palette)
export type TrackColor = '#ff006e' | '#fb5607' | '#ffbe0b' | '#8ecae6' | '#219ebc' | '#023047' | '#3a86ff' | '#7209b7'

export const TRACK_COLORS: TrackColor[] = [
  '#ff006e', // Pink
  '#fb5607', // Orange
  '#ffbe0b', // Yellow
  '#8ecae6', // Light Blue
  '#219ebc', // Blue
  '#023047', // Dark Blue
  '#3a86ff', // Bright Blue
  '#7209b7', // Purple
]

// Time signature
export interface TimeSignature {
  numerator:   number
  denominator: number
}

// Audio clip interface
export interface AudioClip {
  id:           string
  name:         string
  trackId:      string
  audioBuffer:  AudioBuffer | null
  waveformData: number[]
  startTime:    number // in seconds (will be converted to samples in context)
  duration:     number // in seconds
  volume:       number // 0-1
  pitch:        number // semitones (-12 to +12)
  color:        string
  isLoading:    boolean
}

// Audio track interface
export interface AudioTrack {
  id:     string
  name:   string
  color:  TrackColor
  volume: number // 0-1
  pan:    number // -1 to 1
  muted:  boolean
  solo:   boolean
  clips:  AudioClip[]
  index:  number
}

// Audio project interface
export interface AudioProject {
  id:            string
  name:          string
  tracks:        AudioTrack[]
  bpm:           number
  timeSignature: TimeSignature
  duration:      number // in seconds
}

// File processing state
export interface FileProcessingState {
  id:       string
  fileName: string
  status:   'processing' | 'completed' | 'error'
  error?:   string
}

// Worker message types
export enum WorkerMessageType {
  DECODE_AUDIO = 'decode_audio',
  AUDIO_DECODED = 'audio_decoded',
  DECODE_ERROR = 'decode_error',
  GENERATE_WAVEFORM = 'generate_waveform',
  WAVEFORM_GENERATED = 'waveform_generated'
}

// Worker message interface
export interface WorkerMessage {
  type:          WorkerMessageType
  id:            string
  arrayBuffer?:  ArrayBuffer
  trackId?:      string
  fileName?:     string
  audioBuffer?:  AudioBuffer
  duration?:     number
  waveformData?: number[]
  samples?:      number
  sampleRate?:   number
  error?:        string
}

// Specific worker message types
export interface DecodeAudioMessage extends WorkerMessage {
  type:        WorkerMessageType.DECODE_AUDIO
  fileName:    string
  arrayBuffer: ArrayBuffer
}

export interface AudioDecodedMessage extends WorkerMessage {
  type:        WorkerMessageType.AUDIO_DECODED
  fileName:    string
  audioBuffer: AudioBuffer
  duration:    number
  sampleRate:  number
}

export interface GenerateWaveformMessage extends WorkerMessage {
  type:        WorkerMessageType.GENERATE_WAVEFORM
  samples:     number
  audioBuffer: AudioBuffer
}

export interface WaveformGeneratedMessage extends WorkerMessage {
  type:         WorkerMessageType.WAVEFORM_GENERATED
  waveformData: number[]
}

export interface DecodeErrorMessage extends WorkerMessage {
  type:  WorkerMessageType.DECODE_ERROR
  error: string
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

// SVG Waveform data
export interface WaveformSvgData {
  svgPath:  string
  width:    number
  height:   number
  duration: number
  samples:  number
}

// Audio Engine State (legacy - moved to context)
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

// Drop zone state
export interface DropZoneState {
  isDragOver:    boolean
  errorMessage?: string
}

// Timeline configuration
export interface TimelineConfig {
  pixelsPerSecond: number
  showBeats:       boolean
  showBars:        boolean
}

// Playback controls interface
export interface PlaybackControls {
  isPlaying:   boolean
  currentTime: number
  volume:      number
  isLooping:   boolean
}

// Audio context configuration
export interface AudioContextConfig {
  sampleRate:  number
  latencyHint: AudioContextLatencyCategory
}
