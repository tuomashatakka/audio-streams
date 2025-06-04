/**
 * Audio Streams Module
 */

import { AudioEngineProvider } from '@/contexts/AudioEngineContext'
import MainAudioView from '@/components/MainAudioView'

import '@/styles/globals.css'
import { useCallback, useEffect } from 'react'

const usePreventPinchZoom = () => {
  const handler = useCallback((e: WheelEvent) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    document.addEventListener('wheel', handler, { passive: false, capture: false })
    return () => {
      document.removeEventListener('wheel', handler)
    }
  }, [])
}

function App () {
  usePreventPinchZoom()

  return <div className='app'>
    <header className='app-header'>
      <h1>audioblocks</h1>
      <p>audio-streams</p>
    </header>

    <main className='app-main'>
      <AudioEngineProvider>
        <MainAudioView />
      </AudioEngineProvider>
    </main>
  </div>
}

export default App
