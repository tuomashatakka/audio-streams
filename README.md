# Audio Streams 🎵

A professional web-based audio streaming and DAW (Digital Audio Workstation) module built with React, TypeScript, and the Web Audio API. Features drag-and-drop file support, real-time waveform visualization, and Web Worker-powered audio processing for optimal performance.

## ✨ Features

- **🎧 Professional Audio Engine**: 48kHz/16-bit audio processing using Web Audio API
- **📁 Drag & Drop Support**: Simply drag audio files onto the interface to create tracks
- **🎨 Real-time Waveform Visualization**: Beautiful canvas-based waveform rendering
- **⚡ Optimized Audio Processing**: Efficient audio decoding and processing for smooth UI
- **🎛️ Multi-track Mixing**: Volume, pan, mute, and solo controls for each track
- **⏯️ Transport Controls**: Professional playback controls with timeline scrubbing
- **🔄 Looping Support**: Set loop points for seamless playback
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **🎯 TypeScript**: Fully typed for better development experience
- **🌙 Dark Theme**: Professional dark interface optimized for audio work

## 🚀 Quick Start

### Installation

```bash
npm install audio-streams
```

### Basic Usage

```tsx
import { MainAudioView } from 'audio-streams'
import 'audio-streams/styles' // Import global styles

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <MainAudioView />
    </div>
  )
}
```

### Development

```bash
# Clone the repository
git clone <repository-url>
cd audio-streams

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎮 Usage

### Getting Started

1. **Launch the application** - Open your browser to the development server
2. **Drop audio files** - Drag WAV, MP3, M4A, OGG, or FLAC files onto the drop zone
3. **Wait for processing** - Files are decoded in the background using Web Workers
4. **Start creating** - Use the transport controls to play, pause, and navigate your audio

### Supported Audio Formats

- **WAV** - Uncompressed audio (recommended for best quality)
- **MP3** - Common compressed format
- **M4A/MP4** - Apple's audio format
- **OGG** - Open-source audio format
- **FLAC** - Lossless compressed audio

### Keyboard Shortcuts

- **Spacebar** - Play/Pause
- **Home** - Go to beginning
- **End** - Go to end
- **Left/Right** arrows - Fine navigation
- **L** - Toggle loop

## 🏗️ Architecture

### Core Components

```
src/
├── components/
│   ├── audio-engine/      # Core Web Audio API logic
│   ├── timeline/          # Timeline ruler and scrubbing
│   ├── track/            # Individual track management
│   ├── clip/             # Audio clip visualization
│   ├── waveform/         # Canvas-based waveform rendering
│   ├── playback-controls/ # Transport controls
│   ├── drop-zone/        # File drag-and-drop handling
│   └── MainAudioView.tsx # Main container component
├── workers/
│   └── audioDecoder.worker.ts # Web Worker for audio processing
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── styles/               # Global CSS styles
```

### Audio Processing Architecture

The module uses an optimized audio decoder module for processing tasks:

- **Audio Decoding** - Converting file data to AudioBuffer objects
- **Waveform Generation** - Processing audio data for visualization  
- **Efficient Processing** - Streamlined audio operations for performance

```typescript
// Audio decoder communication
audioDecoder.processMessage({
  type: 'DECODE_AUDIO',
  id: 'clip-123',
  arrayBuffer: fileData
})
```

## 🎛️ API Reference

### MainAudioView

The primary component that provides the complete DAW interface.

```tsx
<MainAudioView />
```

### Individual Components

For custom implementations, you can use individual components:

```tsx
import { 
  AudioEngine, 
  Timeline, 
  Track, 
  PlaybackControls,
  DropZone 
} from 'audio-streams'

// Custom implementation
function CustomDAW() {
  return (
    <div>
      <PlaybackControls {...controlProps} />
      <Timeline {...timelineProps} />
      <Track {...trackProps} />
      <AudioEngine {...engineProps} />
    </div>
  )
}
```

### Types

```typescript
import type {
  AudioTrack,
  AudioClip,
  AudioProject,
  WorkerMessage
} from 'audio-streams'
```

## ⚙️ Configuration

### Audio Context Settings

```typescript
const audioContextConfig = {
  sampleRate: 48000,
  latencyHint: 'interactive' as AudioContextLatencyCategory
}
```

### Waveform Visualization

```typescript
const waveformOptions = {
  samples: 1000,        // Resolution
  color: '#3a86ff',     // Waveform color
  strokeWidth: 1        // Line thickness
}
```

## 🎨 Styling

The module includes a comprehensive design system based on professional DAW interfaces:

### CSS Variables

```css
:root {
  --bg-primary: #121212;
  --bg-secondary: #1a1a1a;
  --accent-primary: #ff5500;
  --accent-secondary: #3a86ff;
  --text-primary: #ffffff;
  /* ... more variables */
}
```

### Customization

Override CSS variables to match your application's theme:

```css
.my-daw {
  --accent-primary: #your-color;
  --bg-primary: #your-bg;
}
```

## 🔧 Advanced Usage

### Custom Audio Processing

```typescript
import { AudioEngine, createGainNode } from 'audio-streams'

// Add custom audio effects
const customEffect = (audioContext: AudioContext) => {
  const delay = audioContext.createDelay()
  const feedback = createGainNode(audioContext, 0.3)
  // ... configure effect
  return { input: delay, output: feedback }
}
```

### Audio Decoder Extensions

```typescript
// Extend the audio decoder for custom processing
audioDecoder.onMessage((event) => {
  if (event.data.type === 'CUSTOM_PROCESS') {
    // Your custom audio processing
    const result = processAudio(event.data.audioBuffer)
    // Handle custom result
  }
})
```

## 📱 Browser Support

- **Chrome/Edge** 88+ (recommended)
- **Firefox** 84+
- **Safari** 14.1+
- **Mobile Safari** 14.5+
- **Chrome Mobile** 88+

### Required APIs

- Web Audio API
- Web Workers
- File API
- Canvas API
- ES2020+ features

## 🚀 Performance Tips

### Optimization Guidelines

1. **Use WAV files** for best performance and quality
2. **Limit concurrent files** being processed (Web Worker queue)
3. **Enable hardware acceleration** in browser settings
4. **Use appropriate waveform resolution** based on track length
5. **Consider file size** - larger files take longer to decode

### Memory Management

```typescript
// Clean up audio resources
audioBuffer = null
audioContext.close()
audioDecoder.terminate()
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone your-fork-url
cd audio-streams

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Code Style

- Use **TypeScript** for all new code
- Follow the **existing code patterns**
- Add **comprehensive tests** for new features
- Update **documentation** for API changes

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Web Audio API** specification and implementations
- **React** team for the excellent framework
- **TypeScript** team for type safety
- **Vite** for blazing fast development
- **Lucide** for beautiful icons
- Professional **DAW interfaces** for design inspiration

## 📞 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](issues/)
- 💬 [Discussions](discussions/)
- 📧 [Email Support](mailto:support@audio-streams.dev)

---

Built with ❤️ for the web audio community! 🎵
