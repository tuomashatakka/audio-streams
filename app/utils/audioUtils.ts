/**
 * Audio utility functions for the audio streams module
 */

import { SupportedAudioFormat, TRACK_COLORS, TrackColor, AudioTrack } from '../types/audio'


export function isSupportedAudioFile (file: File): boolean {
  return file.type.startsWith('audio/') || Object.values(SupportedAudioFormat).includes(file.type as SupportedAudioFormat)
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
  if (tracks?.length === 0)
    return 16 // Default minimum duration

  const maxDuration = Math.max(
    ...(tracks || []).flatMap(track =>
      track.clipIds.map(clip => clip.startTime + clip.duration)
    )
  )

  return Math.max(maxDuration, 16) // Ensure minimum duration
}

/**
 * Generate waveform data using OfflineAudioContext for better accuracy
 */
export async function generateWaveformDataOffline (audioBuffer: AudioBuffer, samples: number = 1000): Promise<number[]> {
  try {
    // Create offline context with same sample rate as source
    const offlineContext = new OfflineAudioContext(1 /* mono output */, audioBuffer.length, audioBuffer.sampleRate)

    // Create source node
    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer

    // Connect to destination
    source.connect(offlineContext.destination)
    source.start(0)

    // Render the audio
    const renderedBuffer = await offlineContext.startRendering()

    // Calculate peaks from rendered buffer
    return calculateWaveformPeaks(renderedBuffer, samples, 0)
  }
  catch (error) {
    console.error('Failed to generate waveform data offline:', error)
    // Fallback to direct calculation
    return calculateWaveformPeaks(audioBuffer, samples, 0)
  }
}

export function samplesToSeconds (samples: number, sampleRate: number): number {
  return samples / sampleRate
}

export function secondsToSamples (seconds: number, sampleRate: number): number {
  return seconds * sampleRate
}

/**
 * Grid and timing utilities for audio editing
 */

// Grid sizes in note divisions
export enum GridSize {
  WHOLE = 1, // Whole note
  HALF = 2, // Half note
  QUARTER = 4, // Quarter note (1 beat)
  EIGHTH = 8, // Eighth note
  SIXTEENTH = 16, // Sixteenth note (default for nudging)
  THIRTY_SECOND = 32 // Thirty-second note
}

/**
 * Calculate the duration of one grid unit in seconds
 * @param bpm Beats per minute
 * @param gridSize Grid division (default: sixteenth note)
 * @param timeSignature Time signature (default: 4/4)
 * @returns Duration in seconds
 */
export function getGridDuration (
  bpm: number,
  gridSize: GridSize = GridSize.SIXTEENTH,
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 }
): number {
  // Defensive programming - prevent NaN cascade
  if (!bpm || isNaN(bpm) || bpm <= 0) {
    console.warn('🎵 Invalid BPM in getGridDuration:', bpm, 'falling back to 120')
    bpm = 120
  }
  
  if (!gridSize || isNaN(gridSize) || gridSize <= 0) {
    console.warn('🎵 Invalid gridSize in getGridDuration:', gridSize, 'falling back to SIXTEENTH')
    gridSize = GridSize.SIXTEENTH
  }

  // Duration of one beat in seconds
  const beatDuration = 60 / bpm

  // Duration of one grid unit
  // For quarter note grid: beatDuration / 1 = full beat
  // For sixteenth note grid: beatDuration / 4 = quarter beat
  const gridDuration = beatDuration / (gridSize / 4)

  if (isNaN(gridDuration) || gridDuration <= 0) {
    console.error('🎵 gridDuration calculation failed:', { bpm, gridSize, beatDuration, gridDuration })
    return 0.125 // Fallback to reasonable sixteenth note duration at 120 BPM
  }

  return gridDuration
}

/**
 * Snap a time value to the nearest grid position
 * @param time Time in seconds
 * @param bpm Beats per minute
 * @param gridSize Grid division
 * @param timeSignature Time signature
 * @returns Snapped time in seconds
 */
export function snapToGrid (
  time: number,
  bpm: number,
  gridSize: GridSize = GridSize.SIXTEENTH,
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 }
): number {
  // Defensive programming - prevent NaN cascade
  if (isNaN(time) || time === null || time === undefined) {
    console.warn('🎵 Invalid time in snapToGrid:', time, 'returning 0')
    return 0
  }

  const gridDuration = getGridDuration(bpm, gridSize, timeSignature)
  
  if (gridDuration <= 0) {
    console.warn('🎵 Invalid grid duration in snapToGrid, returning original time')
    return time
  }
  
  const snapped = Math.round(time / gridDuration) * gridDuration
  
  if (isNaN(snapped)) {
    console.error('🎵 snapToGrid produced NaN:', { time, gridDuration, snapped })
    return time
  }
  
  return snapped
}

/**
 * Snap a pixel position to the grid based on pixels per second
 * @param pixels Pixel position
 * @param pixelsPerSecond Zoom level
 * @param bpm Beats per minute
 * @param gridSize Grid division
 * @param timeSignature Time signature
 * @returns Snapped pixel position
 */
export function snapPixelsToGrid (
  pixels: number,
  pixelsPerSecond: number,
  bpm: number,
  gridSize: GridSize = GridSize.SIXTEENTH,
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 }
): number {
  const timeAtPixels = pixelsToTime(pixels, pixelsPerSecond)
  const snappedTime = snapToGrid(timeAtPixels, bpm, gridSize, timeSignature)
  return timeToPixels(snappedTime, pixelsPerSecond)
}

/**
 * Calculate the nearest track position from a Y coordinate
 * @param clientY Mouse Y position
 * @param trackHeight Height of each track
 * @param trackAreaTop Top position of tracks area
 * @returns Track index (0-based)
 */
export function getTrackIndexFromY (
  clientY: number,
  trackHeight: number,
  trackAreaTop: number
): number {
  const relativeY = clientY - trackAreaTop
  return Math.max(0, Math.floor(relativeY / trackHeight))
}

/**
 * Move a time value by a number of grid units
 * @param time Current time in seconds
 * @param gridUnits Number of grid units to move (positive = right, negative = left)
 * @param bpm Beats per minute
 * @param gridSize Grid division
 * @param timeSignature Time signature
 * @returns New time in seconds
 */
export function moveByGrid (
  time: number,
  gridUnits: number,
  bpm: number,
  gridSize: GridSize = GridSize.SIXTEENTH,
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 }
): number {
  const gridDuration = getGridDuration(bpm, gridSize, timeSignature)
  return time + gridUnits * gridDuration
}

/**
 * Constrain a time value to valid bounds
 * @param time Time in seconds
 * @param minTime Minimum allowed time (default: 0)
 * @param maxTime Maximum allowed time
 * @returns Constrained time
 */
export function constrainTime (time: number, minTime: number = 0, maxTime?: number): number {
  let constrainedTime = Math.max(minTime, time)
  if (maxTime !== undefined)
    constrainedTime = Math.min(maxTime, constrainedTime)
  return constrainedTime
}

/**
 * Calculate drag delta and determine target track and snapped time
 * @param startX Starting X position
 * @param startY Starting Y position  
 * @param currentX Current X position
 * @param currentY Current Y position
 * @param pixelsPerSecond Current zoom level
 * @param bpm Project BPM
 * @param trackHeight Height of each track
 * @param timeSignature Project time signature
 * @param gridSize Grid snap size
 * @returns Calculated values for clip positioning
 */
export function calculateClipDragResult (
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  pixelsPerSecond: number,
  bpm: number,
  trackHeight: number,
  timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 },
  gridSize: GridSize = GridSize.SIXTEENTH
): {
  deltaX: number
  deltaY: number
  deltaTime: number
  snappedDeltaTime: number
  targetTrackDelta: number
} {
  const deltaX = currentX - startX
  const deltaY = currentY - startY
  
  // Convert pixel delta to time delta
  const deltaTime = pixelsToTime(deltaX, pixelsPerSecond)
  
  // Snap the time delta to grid
  const snappedDeltaTime = snapToGrid(deltaTime, bpm, gridSize, timeSignature)
  
  // Calculate how many tracks we've moved
  const targetTrackDelta = Math.round(deltaY / trackHeight)
  
  return {
    deltaX,
    deltaY, 
    deltaTime,
    snappedDeltaTime,
    targetTrackDelta
  }
}
