/**
 * Demo App for the Audio Streams Module
 */

import MainAudioView from '../components/MainAudioView'
import '../styles/globals.css'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Audio Streams Demo</h1>
        <p>Drag and drop audio files to get started!</p>
      </header>
      
      <main className="app-main">
        <MainAudioView />
      </main>
    </div>
  )
}

export default App
