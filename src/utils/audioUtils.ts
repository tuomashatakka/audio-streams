/**
 * Audio utility functions for the audio streams module
 */

import { SupportedAudioFormat, TRACK_COLORS, TrackColor, AudioTrack } from '../types/audio'


export function isSupportedAudioFile (file: File): boolean {
  return Object.values(SupportedAudioFormat).includes(file.type as SupportedAudioFormat)
}


export function getRandomTrackColor (): TrackColor {
  return TRACK_COLORS[Math.floor(Math.random() * TRACK_COLORS.length)]
}


export function generateId (): string {
  return Math.random().toString(36)
    .substring(2) + Date.now().toString(36)
}

/**
 * @description Format time in seconds to MM:SS.MS format
 */
export function formatTime (timeInSeconds: number): string {
  const minutes      = Math.floor(timeInSeconds / 60)
  const seconds      = Math.floor(timeInSeconds % 60)
  const milliseconds = Math.floor(timeInSeconds % 1 * 100)

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
}


export function formatBars (
  timeInSeconds: number,
  bpm: number,
  timeSignature: { numerator: number; denominator: number }
): string {
  const beatsPerSecond = bpm / 60
  const totalBeats     = timeInSeconds * beatsPerSecond
  const beatsPerBar    = timeSignature.numerator
  const bars           = Math.floor(totalBeats / beatsPerBar) + 1 // 1-indexed
  const remainingBeats = totalBeats % beatsPerBar
  const beatsPart      = Math.floor(remainingBeats) + 1 // 1-indexed
  const sixteenthsPart = Math.floor((remainingBeats - Math.floor(remainingBeats)) * 4) + 1 // 1-indexed

  return `${bars}.${beatsPart}.${sixteenthsPart}`
}

// Convert pixels to time based on zoom level

export function pixelsToTime (pixels: number, pixelsPerSecond: number): number {
  return pixels / pixelsPerSecond
}

// Convert time to pixels based on zoom level

export function timeToPixels (time: number, pixelsPerSecond: number): number {
  return time * pixelsPerSecond
}

// Clamp a value between min and max

export function clamp (value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Linear interpolation

export function lerp (start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

// Convert decibels to linear gain

export function dbToGain (db: number): number {
  return Math.pow(10, db / 20)
}

// Convert linear gain to decibels

export function gainToDb (gain: number): number {
  return 20 * Math.log10(Math.max(gain, 0.0001)) // Prevent log(0)
}

// Create a gain node with specified value

export function createGainNode (audioContext: AudioContext | OfflineAudioContext, gainValue = 1): GainNode {
  const gainNode = audioContext.createGain()
  gainNode.gain.value = gainValue
  return gainNode
}

// Create a stereo panner node

export function createStereoPanner (audioContext: AudioContext | OfflineAudioContext, panValue = 0): StereoPannerNode {
  const pannerNode = audioContext.createStereoPanner()
  pannerNode.pan.value = clamp(panValue, -1, 1)
  return pannerNode
}

// Create an audio buffer source node

export function createBufferSource (
  audioContext: AudioContext | OfflineAudioContext,
  audioBuffer: AudioBuffer,
  playbackRate = 1
): AudioBufferSourceNode {
  const sourceNode = audioContext.createBufferSource()
  sourceNode.buffer = audioBuffer
  sourceNode.playbackRate.value = playbackRate
  return sourceNode
}

// Download blob as file

export function downloadBlob (blob: Blob, fileName: string): void {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


export function validateAudioContext (audioContext: AudioContext): boolean {
  return audioContext.state !== 'closed' && audioContext.sampleRate > 0
}


export async function resumeAudioContext (audioContext: AudioContext): Promise<void> {
  if (audioContext.state === 'suspended')
    await audioContext.resume()
}


export function calculateWaveformPeaks (audioBuffer: AudioBuffer, width: number, channelIndex = 0): number[] {
  const channelData     = audioBuffer.getChannelData(channelIndex)
  const samplesPerPixel = Math.floor(channelData.length / width)
  const peaks: number[] = []

  for (let i = 0; i < width; i++) {
    const start = i * samplesPerPixel
    const end   = Math.min(start + samplesPerPixel, channelData.length)

    let max = 0
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j])
      if (abs > max)
        max = abs
    }

    peaks.push(max)
  }

  return peaks
}


export function sanitizeFileName (fileName: string, maxLength: number = 50): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, maxLength)
}


export function getAudioFormat (file: File): SupportedAudioFormat | null {
  // Check MIME type first
  if (Object.values(SupportedAudioFormat).includes(file.type as SupportedAudioFormat))
    return file.type as SupportedAudioFormat

  // Fallback to file extension
  const extension = file.name.toLowerCase().split('.')
    .pop()
  switch (extension) {
    case 'wav':
      return SupportedAudioFormat.WAV
    case 'mp3':
      return SupportedAudioFormat.MP3
    case 'm4a':
    case 'mp4':
      return SupportedAudioFormat.M4A
    case 'ogg':
      return SupportedAudioFormat.OGG
    case 'flac':
      return SupportedAudioFormat.FLAC
    default:
      return null
  }
}


export function calculateProjectDuration (tracks: AudioTrack[]): number {
  if (tracks.length === 0)
    return 16 // Default minimum duration

  const maxDuration = Math.max(
    ...tracks.flatMap(track =>
      track.clips.map(clip => clip.startTime + clip.duration)
    )
  )

  return Math.max(maxDuration, 16) // Ensure minimum duration
}
