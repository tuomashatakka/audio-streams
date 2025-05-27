/**
 * Demo App for the Audio Streams Module
 */

import MainAudioView from '../components/MainAudioView'
import '../styles/globals.css'
import './App.css'


function App () {
  return <div className='app'>
    <header className='app-header'>
      <h1>audioblocks </h1>
      <p>audio-streams</p>
    </header>

    <main className='app-main'>
      <MainAudioView />
    </main>
  </div>
}

export default App
