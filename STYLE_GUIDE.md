# Audio Streams Style Guide

This style guide is based on the DAW-collab project's coding patterns and design system.

## Coding Conventions

### TypeScript Usage
- **Use TypeScript for all code** - prefer interfaces over types
- Favor **enums, Sets and Maps** where applicable  
- Use **functional components** with TypeScript interfaces
- Default to **strict TypeScript** settings

### Component Structure
- Use **functional components** with hooks
- **Avoid classes** - prefer functional and declarative patterns
- Structure files: **exported component, subcomponents, helpers, static content, types**
- **Default exports** for React components
- Separate **initialization** from class definitions to their own files

### Naming Conventions
- **lowercase with dashes** for directories (e.g., `components/audio-engine`)
- Use **descriptive variable names** with auxiliary verbs (e.g., `isLoading`, `hasError`)
- **PascalCase** for React components
- **camelCase** for functions and variables
- **SCREAMING_SNAKE_CASE** for constants

### File Organization
- Group **similar components** under single file when appropriate
- Have **subcomponents** in the same file as the main component
- Separate code into **logical folder structure**
- Have **config files** in their own directory

### Syntax and Formatting
- Use the **"function" keyword** for pure functions
- **Avoid unnecessary curly braces** in conditionals
- Use **declarative JSX**
- **Exclude unneeded parentheses** and semis
- Follow **existing linter rules** and code formatting

## Design System

### Color Palette
```css
:root {
  /* Background Colors */
  --color-background: #121212;           /* Main dark background */
  --color-background-light: #1a1a1a;     /* Slightly lighter panels */
  --color-background-lighter: #2a2a2a;   /* Input fields, buttons */
  
  /* Primary Colors */
  --color-primary: #ff5500;              /* Orange accent */
  --color-primary-hover: #ff7733;        /* Hover state */
  
  /* Secondary Colors */
  --color-secondary: #3a86ff;            /* Blue accent */
  --color-secondary-hover: #619bff;      /* Hover state */
  
  /* Semantic Colors */
  --color-success: #38b000;              /* Green for success */
  --color-warning: #ffbe0b;              /* Yellow for warnings */
  --color-danger: #ff006e;               /* Pink for danger */
  
  /* Text Colors */
  --color-text-primary: #ffffff;         /* Main text */
  --color-text-secondary: #dddddd;       /* Secondary text */
  --color-text-tertiary: #aaaaaa;        /* Disabled/meta text */
  
  /* Border Colors */
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-focus: var(--color-primary);
}
```

### Typography
```css
:root {
  /* Font Family */
  --font-family-base: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  
  /* Font Sizes */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;    /* Base size */
  --font-size-lg: 18px;
  --font-size-xl: 24px;
}
```

### Spacing System
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;      /* Base spacing */
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

### Shadows & Effects
```css
:root {
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.24);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
}
```

### Border Radius
```css
:root {
  --border-radius-sm: 2px;
  --border-radius-md: 4px;    /* Default */
  --border-radius-lg: 8px;
}
```

### Transitions
```css
:root {
  --transition-fast: 0.1s ease;
  --transition-base: 0.2s ease;    /* Default */
  --transition-slow: 0.3s ease;
}
```

## Component Architecture

### Audio Engine Components
- **AudioEngine.tsx** - Core audio processing logic (Web Audio API)
- **AudioWorker.ts** - Web Worker for audio decoding
- **Timeline.tsx** - Timeline ruler and playback head
- **Track.tsx** - Individual track with controls
- **Clip.tsx** - Audio clip representation
- **Waveform.tsx** - Canvas-based waveform visualization

### State Management
- Use **React state** for local component state
- Use **useReducer** for complex state logic
- **Avoid prop drilling** - use React Context for shared state
- Keep **state as close to usage** as possible

### Error Handling
- **Always handle async operations** with try/catch
- Provide **user-friendly error messages**
- Use **loading states** for async operations
- **Log errors** to console for debugging

### Performance Guidelines
- Use **Web Workers** for heavy computations
- **Memoize expensive calculations** with useMemo
- Use **useCallback** for stable function references
- **Avoid unnecessary re-renders** with React.memo when appropriate
- **Transfer ArrayBuffers** as transferable objects to Web Workers

## UI/UX Guidelines

### Dark Theme Aesthetic
- **Dark backgrounds** with subtle lighting variations
- **High contrast** for readability
- **Orange and blue accents** for interactive elements
- **Professional, minimalist** appearance

### Interactive Elements
- **Clear hover states** with color transitions
- **Consistent spacing** using the spacing system
- **Visual feedback** for all user actions
- **Accessible focus indicators**

### Audio-Specific UI
- **Waveform visualizations** with appropriate detail levels
- **Timeline scrubbing** with precise feedback
- **Track layouts** with clear visual separation
- **Drop zones** with obvious visual cues

## Code Example

```tsx
'use client'

import { useState, useCallback } from 'react'
import './audio-track.css'

interface AudioTrackProps {
  id: string
  name: string
  volume: number
  onVolumeChange: (id: string, volume: number) => void
}

function AudioTrack({ id, name, volume, onVolumeChange }: AudioTrackProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value)
    onVolumeChange(id, newVolume)
  }, [id, onVolumeChange])

  return (
    <div 
      className="audio-track"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="track-header">
        <h3 className="track-name">{name}</h3>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  )
}

export default AudioTrack
```

## CSS Example

```css
.audio-track {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  transition: all var(--transition-base);
}

.audio-track:hover {
  background-color: var(--color-background-lighter);
  border-color: var(--color-primary);
}

.track-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.track-name {
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: 500;
  margin: 0;
}

.volume-slider {
  width: 80px;
  background-color: var(--color-background);
  border-radius: var(--border-radius-sm);
}
```
