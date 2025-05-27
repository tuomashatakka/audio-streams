/**
 * Audio Streams Module Entry Point
 *
 * This module provides a complete audio streaming and DAW interface
 * with Web Worker-based audio processing for optimal performance.
 */

// Main Components
export { default as MainAudioView } from './components/MainAudioView'

export { default as AudioEngine } from './components/audio-engine/AudioEngine'

export { default as Timeline } from './components/timeline/Timeline'

export { default as Track } from './components/track/Track'

export { default as Clip } from './components/clip/Clip'

export { default as Waveform } from './components/waveform/Waveform'

export { default as PlaybackControls } from './components/playback-controls/PlaybackControls'

export { default as DropZone } from './components/drop-zone/DropZone'

// Types

export type {
  AudioTrack,
  AudioClip,
  AudioProject,
  AudioEngineState,
  TimelineConfig,
  DropZoneState,
  FileProcessingState,
  WorkerMessage,
  WorkerMessageType,
  SupportedAudioFormat,
  WaveformOptions,
  PlaybackControls as PlaybackControlsType,
  TrackColor,
  AudioContextConfig
} from './types/audio'

// Utilities

export {
  isSupportedAudioFile,
  getRandomTrackColor,
  generateId,
  formatTime,
  formatBars,
  pixelsToTime,
  timeToPixels,
  clamp,
  lerp,
  dbToGain,
  gainToDb,
  createGainNode,
  createStereoPanner,
  createBufferSource,
  downloadBlob,
  validateAudioContext,
  resumeAudioContext,
  calculateWaveformPeaks,
  sanitizeFileName,
  getAudioFormat,
  calculateProjectDuration
} from './utils/audioUtils'

// Audio Decoder

export {
  AudioDecoder,
  audioDecoder,
  generateWaveformData,
  createOfflineContext
} from './utils/audioDecoder'

// Constants

export { TRACK_COLORS } from './types/audio'

// Global styles (import this in your main app)

export { default as GlobalStyles } from './styles/globals.css?inline'
