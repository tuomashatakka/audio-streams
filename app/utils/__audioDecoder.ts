/**
 * Audio decoder module (converted from Web Worker for easier development) - Next.js Edition
 * Handles audio decoding and waveform generation
 */

import {
  WorkerMessage,
  WorkerMessageType,
  DecodeAudioMessage,
  GenerateWaveformMessage,
  AudioDecodedMessage,
  WaveformGeneratedMessage,
  DecodeErrorMessage
} from '@/types/audio'
import { generateWaveformDataOffline } from './audioUtils'

// Create offline audio context for decoding (doesn't require user gesture)
function createOfflineContext(): OfflineAudioContext {
  // Create a minimal offline context for decoding
  return new OfflineAudioContext(2, 44100, 44100)
}

// Generate waveform data from AudioBuffer (fallback method)
function generateWaveformData(audioBuffer: AudioBuffer, targetSamples = 1000): number[] {
  const channelData = audioBuffer.getChannelData(0) // Use first channel
  const samplesPerPixel = Math.floor(channelData.length / targetSamples)
  const waveformData: number[] = []

  for (let i = 0; i < targetSamples; i++) {
    const start = i * samplesPerPixel
    const end = Math.min(start + samplesPerPixel, channelData.length)

    let max = 0
    let min = 0

    // Find peak values in this sample range
    for (let j = start; j < end; j++) {
      const sample = channelData[j]
      if (sample > max)
        max = sample
      if (sample < min)
        min = sample
    }

    // Store the absolute maximum for visualization
    waveformData.push(Math.max(Math.abs(max), Math.abs(min)))
  }

  return waveformData
}

// Audio decoder class to handle decoding operations
export class AudioDecoder {
  private messageHandlers: Map<string, (message: any) => void> = new Map()

  onMessage(handler: (message: any) => void): void {
    const id = Math.random().toString(36)
    this.messageHandlers.set(id, handler)
  }

  // Remove message handler
  removeMessageHandler(id: string): void {
    this.messageHandlers.delete(id)
  }

  // Post message (simulates worker postMessage)
  private postMessage(message: any): void {
    // Simulate async behavior like a real worker
    setTimeout(() => {
      this.messageHandlers.forEach(handler => handler({ data: message }))
    }, 0)
  }

  // Process message (simulates worker message handling)
  async processMessage(message: WorkerMessage): Promise<void> {
    try {
      switch (message.type) {
        case WorkerMessageType.DECODE_AUDIO: {
          const { id, arrayBuffer, fileName } = message as DecodeAudioMessage

          try {
            // Create fresh offline context for decoding (doesn't need user gesture)
            const context = createOfflineContext()

            // Decode the audio data
            const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0))

            // Send the decoded audio buffer back
            this.postMessage({
              type: WorkerMessageType.AUDIO_DECODED,
              id,
              audioBuffer,
              fileName,
              duration: audioBuffer.duration,
              sampleRate: audioBuffer.sampleRate
            } as AudioDecodedMessage)
          }
          catch (error) {
            console.error('Audio decoding failed:', error)
            this.postMessage({
              type: WorkerMessageType.DECODE_ERROR,
              id,
              error: error instanceof Error ? error.message : 'Unknown decoding error'
            } as DecodeErrorMessage)
          }
          break
        }

        case WorkerMessageType.GENERATE_WAVEFORM: {
          const { id, audioBuffer, samples } = message as GenerateWaveformMessage

          try {
            // Use the new offline waveform generation method
            const waveformData = await generateWaveformDataOffline(audioBuffer, samples)

            this.postMessage({
              type: WorkerMessageType.WAVEFORM_GENERATED,
              id,
              waveformData
            } as WaveformGeneratedMessage)
          }
          catch (error) {
            console.error('Waveform generation failed:', error)
            this.postMessage({
              type: WorkerMessageType.DECODE_ERROR,
              id,
              error: error instanceof Error ? error.message : 'Waveform generation failed'
            } as DecodeErrorMessage)
          }
          break
        }
        default:
          console.warn('Unknown message type:', (message as any).type)
      }
    }
    catch (error) {
      console.error('Audio decoder error:', error)
      this.postMessage({
        type: WorkerMessageType.DECODE_ERROR,
        id: (message as any).id || 'unknown',
        error: error instanceof Error ? error.message : 'Audio decoder processing error'
      } as DecodeErrorMessage)
    }
  }

  // Terminate (cleanup method)
  terminate(): void {
    this.messageHandlers.clear()
  }
}

// export a singleton instance
export const audioDecoder = new AudioDecoder()

// export individual functions for direct use
export { generateWaveformData, createOfflineContext }