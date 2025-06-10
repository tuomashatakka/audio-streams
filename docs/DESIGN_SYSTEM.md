# Audio Streams Design System

A minimal but comprehensive design system for the audio streaming module, inspired by professional DAW interfaces.

## Design Principles

### 1. **Dark-First Aesthetic**
- Professional audio software traditionally uses dark themes
- Reduces eye strain during long editing sessions
- Better contrast for waveform visualizations
- Minimizes screen glare in studio environments

### 2. **Functional Clarity**
- Every element serves a clear purpose
- Visual hierarchy guides user attention
- Immediate feedback for all interactions
- Error states are obvious but not alarming

### 3. **Audio-Centric Design**
- Waveforms are the primary visual element
- Timeline provides precise temporal reference
- Controls are optimized for audio workflows
- Visual feedback matches audio behavior

## Color System

### Core Palette
```css
:root {
  /* Primary Dark Theme */
  --bg-primary: #121212;        /* Main background */
  --bg-secondary: #1a1a1a;      /* Cards, panels */
  --bg-tertiary: #2a2a2a;       /* Inputs, elevated elements */
  
  /* Interactive Colors */
  --accent-primary: #ff5500;    /* Play buttons, active states */
  --accent-secondary: #3a86ff;  /* Secondary actions, links */
  --accent-success: #38b000;    /* Success, recording */
  --accent-warning: #ffbe0b;    /* Warnings, clip borders */
  --accent-danger: #ff006e;     /* Delete, error states */
  
  /* Text Hierarchy */
  --text-primary: #ffffff;      /* Headers, important text */
  --text-secondary: #dddddd;    /* Body text, labels */
  --text-tertiary: #aaaaaa;     /* Hints, disabled text */
  --text-inverse: #121212;      /* Text on light backgrounds */
  
  /* Borders & Dividers */
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-focus: var(--accent-primary);
  --border-hover: rgba(255, 255, 255, 0.2);
}
```

### Semantic Colors
```css
:root {
  /* Audio-Specific Colors */
  --waveform-color: #3a86ff;
  --waveform-inactive: rgba(58, 134, 255, 0.3);
  --playhead-color: #ff5500;
  --timeline-ruler: #666666;
  --track-separator: var(--border-primary);
  
  /* Drop Zone States */
  --dropzone-idle: transparent;
  --dropzone-hover: rgba(255, 85, 0, 0.1);
  --dropzone-active: rgba(255, 85, 0, 0.2);
}
```

## Typography Scale

### Font Stack
```css
:root {
  --font-primary: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace;
}
```

### Size Scale
```css
:root {
  --text-xs: 10px;    /* Fine print, timestamps */
  --text-sm: 12px;    /* Labels, metadata */
  --text-base: 14px;  /* Body text, controls */
  --text-lg: 16px;    /* Headings, emphasis */
  --text-xl: 20px;    /* Section headers */
  --text-2xl: 24px;   /* Page titles */
}
```

### Weight Scale
```css
:root {
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

## Spacing System

### Base Unit: 4px
```css
:root {
  --space-0: 0;
  --space-1: 4px;     /* xs - tight spacing */
  --space-2: 8px;     /* sm - small padding */
  --space-3: 12px;    /* default gap */
  --space-4: 16px;    /* md - standard padding */
  --space-5: 20px;    /* comfortable spacing */
  --space-6: 24px;    /* lg - section spacing */
  --space-8: 32px;    /* xl - major spacing */
  --space-10: 40px;   /* 2xl - large margins */
  --space-12: 48px;   /* 3xl - page spacing */
  --space-16: 64px;   /* 4xl - major sections */
}
```

### Audio-Specific Spacing
```css
:root {
  /* Component Heights */
  --track-height: 64px;
  --timeline-height: 48px;
  --toolbar-height: 56px;
  --clip-min-width: 24px;
  
  /* Interactive Areas */
  --touch-target: 44px;    /* Minimum clickable area */
  --slider-height: 20px;
  --button-height: 32px;
}
```

## Layout Grid

### Responsive Breakpoints
```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
}
```

### Audio Interface Layout
```css
.audio-interface {
  display: grid;
  grid-template-areas:
    "toolbar toolbar"
    "controls timeline"
    "tracks tracks";
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto auto 1fr;
  height: 100vh;
}
```

## Shadows & Elevation

### Shadow Scale
```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 8px 10px rgba(0, 0, 0, 0.04);
}
```

### Elevation Levels
- **Level 0**: Base surface (tracks, timeline)
- **Level 1**: Cards, clips (`--shadow-sm`)
- **Level 2**: Dropdowns, tooltips (`--shadow-md`)
- **Level 3**: Modals, drawers (`--shadow-lg`)
- **Level 4**: Top-level overlays (`--shadow-xl`)

## Motion & Transitions

### Duration Scale
```css
:root {
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
}
```

### Easing Functions
```css
:root {
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Common Transitions
```css
:root {
  --transition-base: all var(--duration-normal) var(--ease-out);
  --transition-colors: color var(--duration-fast) var(--ease-out),
                       background-color var(--duration-fast) var(--ease-out);
  --transition-transform: transform var(--duration-normal) var(--ease-out);
}
```

## Component Specifications

### Buttons
```css
.btn {
  /* Base styles */
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  transition: var(--transition-colors);
  cursor: pointer;
  border: none;
  
  /* Touch target */
  min-height: var(--touch-target);
  min-width: var(--touch-target);
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}
```

### Form Controls
```css
.form-control {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: var(--transition-colors);
}

.form-control:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 2px rgba(255, 85, 0, 0.1);
}
```

### Cards & Panels
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.panel {
  background: var(--bg-primary);
  border-right: 1px solid var(--border-primary);
}
```

## Iconography

### Icon System
- Use **lucide-react** for consistency
- **16px** for inline icons
- **20px** for buttons and controls
- **24px** for headers and navigation
- **32px** for large actions

### Audio-Specific Icons
- Play: `Play` triangle
- Pause: `Pause` bars
- Stop: `Square` 
- Record: `Circle` (red)
- Mute: `VolumeX`
- Solo: `Headphones`

## Accessibility

### Focus Management
- Visible focus indicators on all interactive elements
- Logical tab order through audio controls
- Keyboard shortcuts for common actions

### Color Contrast
- Minimum 4.5:1 ratio for normal text
- Minimum 3:1 ratio for large text and UI elements
- Color is never the only indicator of state

### Audio Accessibility
- Screen reader support for audio controls
- Visual indicators for audio state changes
- Alternative text for waveform visualizations

## Usage Examples

### Track Component
```tsx
<div className="track">
  <div className="track-header">
    <h3 className="track-title">Bass Line</h3>
    <div className="track-controls">
      <button className="btn-icon" aria-label="Mute track">
        <VolumeX size={16} />
      </button>
      <input 
        type="range" 
        className="volume-slider"
        min="0" 
        max="1" 
        step="0.01"
        aria-label="Track volume"
      />
    </div>
  </div>
  <div className="track-content">
    {/* Clips go here */}
  </div>
</div>
```

### Waveform Canvas
```tsx
<canvas 
  className="waveform"
  width={clipWidth}
  height={trackHeight - 20}
  role="img"
  aria-label={`Waveform for ${clipName}`}
/>
```

This design system provides a solid foundation for building professional audio interfaces while maintaining consistency and accessibility throughout the module! ♪(´▽｀)
