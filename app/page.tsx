'use client'

/**
 * Audio Streams Module - Next.js Main Page
 */

import { useCallback, useEffect } from 'react'
import { AudioEngineProvider } from '@/contexts/AudioEngineContext'
import MainAudioView from '@/components/MainAudioView'

function AudioStreamsApp() {
  // Prevent pinch zoom in audio interface
  const usePreventPinchZoom = useCallback(() => {
    const handler = (e: WheelEvent) => {
      e.preventDefault()
    }

    useEffect(() => {
      document.addEventListener('wheel', handler, { passive: false, capture: false })
      return () => {
        document.removeEventListener('wheel', handler)
      }
    }, [])
  }, [])

  usePreventPinchZoom()

  return (
    <div className="app">
      <header className="app-header">
        <h1>audioblocks</h1>
        <p>audio-streams</p>
      </header>

      <main className="app-main">
        <AudioEngineProvider>
          <MainAudioView />
        </AudioEngineProvider>
      </main>
    </div>
  )
}

export default AudioStreamsApp