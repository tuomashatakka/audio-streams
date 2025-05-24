/**
 * Web Worker for audio decoding and waveform generation
 * Prevents main thread blocking during intensive audio processing
 */

import {
  WorkerMessage,
  WorkerMessageType,
  DecodeAudioMessage,
  GenerateWaveformMessage
} from '../types/audio'

// Create offline audio context for decoding
let offlineContext: OfflineAudioContext | null = null

function initializeOfflineContext(): OfflineAudioContext {
  if (!offlineContext) {
    // Create a minimal offline context for decoding
    offlineContext = new OfflineAudioContext(2, 44100, 44100)
  }
  return offlineContext
}

// Generate waveform data from AudioBuffer
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
      if (sample > max) max = sample
      if (sample < min) min = sample
    }

    // Store the absolute maximum for visualization
    waveformData.push(Math.max(Math.abs(max), Math.abs(min)))
  }

  return waveformData
}

// Handle incoming messages from main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data

  try {
    switch (message.type) {
      case WorkerMessageType.DECODE_AUDIO: {
        const { id, arrayBuffer, fileName } = message as DecodeAudioMessage

        try {
          // Initialize context if needed
          const context = initializeOfflineContext()

          // Decode the audio data
          const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0))

          // Send the decoded audio buffer back to main thread
          self.postMessage({
            type: WorkerMessageType.AUDIO_DECODED,
            id,
            audioBuffer,
            fileName,
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate
          }, [audioBuffer] as any) // Transfer ownership

        } catch (error) {
          console.error('Audio decoding failed:', error)
          self.postMessage({
            type: WorkerMessageType.DECODE_ERROR,
            id,
            error: error instanceof Error ? error.message : 'Unknown decoding error'
          })
        }
        break
      }

      case WorkerMessageType.GENERATE_WAVEFORM: {
        const { id, audioBuffer, samples } = message as GenerateWaveformMessage

        try {
          const waveformData = generateWaveformData(audioBuffer, samples)

          self.postMessage({
            type: WorkerMessageType.WAVEFORM_GENERATED,
            id,
            waveformData
          })

        } catch (error) {
          console.error('Waveform generation failed:', error)
          self.postMessage({
            type: WorkerMessageType.DECODE_ERROR,
            id,
            error: error instanceof Error ? error.message : 'Waveform generation failed'
          })
        }
        break
      }

      default:
        console.warn('Unknown worker message type:', (message as any).type)
    }
  } catch (error) {
    console.error('Worker error:', error)
    self.postMessage({
      type: WorkerMessageType.DECODE_ERROR,
      id: (message as any).id || 'unknown',
      error: error instanceof Error ? error.message : 'Worker processing error'
    })
  }
}

// Handle worker errors
self.onerror = (error) => {
  console.error('Worker error:', error)
}

// Export empty object to make this a module
export {}
