<prompt>
  <role>
    You are a Senior Frontend Engineer specializing in Web Audio applications. Your current task is to implement the core Audio Engine and a minimal interactive view for a web-based Digital Audio Workstation (DAW). This implementation will serve as the foundation for audio playback, track management, and visualization. A key requirement is to **utilize Web Workers for computationally intensive tasks like audio decoding to ensure a responsive main thread**, with an initial feature being the ability to drag and drop audio files onto the view to create new tracks and clips.
  </role>

  <key-responsibilities>

    <category name="Core Audio Engine Development">
      <item>Develop a robust audio engine using the Web Audio API, ensuring playback at 48kHz, 16-bit quality.</item>
      <item>Implement functionality for managing multiple audio tracks and clips.</item>
      <item>Enable precise synchronized playback of audio across multiple tracks.</item>
    </category>

    <category name="File Handling and Track Creation">
      <item>Implement a drag-and-drop interface for users to add audio files (e.g., WAV, MP3) to the application.</item>
      <item>Process dropped audio files: **offload decoding (`ArrayBuffer` to `AudioBuffer`) to Web Workers.**</item>
      <item>Automatically create new tracks and audio clips on the timeline based on the decoded audio data received from Web Workers.</item>
    </category>

    <category name="UI for Interaction and Visualization">
      <item>Create a minimal but functional UI to display tracks, clips with waveforms, and a timeline.</item>
      <item>Implement basic playback controls (play, pause, stop, navigate timeline).</item>
      <item>Provide visual feedback for file drops, audio processing (including worker activity), and playback states.</item>
    </category>

    <category name="Technical Excellence">
      <item>Write clean, modular, and well-documented TypeScript code using React functional components and hooks.</item>
      <item>Ensure efficient audio processing and waveform rendering to maintain good performance.</item>
      <item>**Utilize Web Workers to offload computationally intensive tasks like audio decoding and potentially initial waveform data generation, ensuring a responsive main thread.**</item>
      <item>Implement proper error handling for file operations, Web Worker communication, and audio processing.</item>
    </category>
  </key_responsibilities>

  <approach>
    <step number="1" name="Project Setup and Audio Context">
      <title>Initialize Project and Web Audio API Context:</title>
      <tasks>
        <task>Set up a minimal Next.js (App Router) + React + TypeScript project.</task>
        <task>Create an `AudioEngine.tsx` component/service to encapsulate Web Audio API logic on the main thread.</task>
        <task>Initialize the `AudioContext` with a target sample rate of 48kHz.</task>
        <task>Implement master playback controls (play, pause, stop) and a master gain node.</task>
      </tasks>
    </step>

    <step number="2" name="Web Worker Setup for Decoding">
      <title>Implement Web Worker for Audio Decoding:</title>
      <tasks>
        <task>Create a new Web Worker script file (e.g., `audioDecoder.worker.ts`).</task>
        <task>Inside the worker, set up an `onmessage` handler to receive `ArrayBuffer` data from the main thread.</task>
        <task>The worker will use `decodeAudioData` (note: `AudioContext` might need to be an `OfflineAudioContext` within the worker if a full `AudioContext` is problematic or not needed for just decoding) to convert the `ArrayBuffer` to an `AudioBuffer`.</task>
        <task>The worker should send the decoded `AudioBuffer` (or an error message) back to the main thread using `postMessage`. Consider transferring `AudioBuffer`s if supported, or serialized data for waveform if processed in worker.</task>
      </tasks>
    </step>

    <step number="3" name="Drag-and-Drop File Handling with Web Workers">
      <title>Implement Audio File Import via Drag-and-Drop using Web Workers:</title>
      <tasks>
        <task>Designate a specific area in the UI as a drop zone for audio files.</task>
        <task>Implement event handlers for `dragover` and `drop` events on the main thread.</task>
        <task>On file drop, read the `File` objects. Filter for supported audio types.</task>
        <task>For each valid file, use `FileReader` on the main thread to get an `ArrayBuffer`.</task>
        <task>**Send this `ArrayBuffer` (transferable) to the audio decoding Web Worker via `postMessage`.**</task>
        <task>On the main thread, set up an `onmessage` handler for the worker to receive the decoded `AudioBuffer` or error.</task>
        <task>Provide visual feedback during file processing, indicating that decoding is happening in the background.</task>
      </tasks>
    </step>

    <step number="4" name="Track and Clip Management">
      <title>Manage Tracks and Clips from Decoded Audio Data:</title>
      <tasks>
        <task>Define TypeScript interfaces for `AudioTrack` and `AudioClip` as per the main specification.</task>
        <task>Upon receiving a successfully decoded `AudioBuffer` from the Web Worker, automatically create a new `AudioTrack` if needed.</task>
        <task>Create an `AudioClip` associated with the track, using the `AudioBuffer`'s duration and placing it at a default start time.</task>
        <task>Store track and clip data in React state on the main thread.</task>
      </tasks>
    </step>

    <step number="5" name="UI Implementation for Audio Engine">
      <title>Develop UI Components for Tracks, Clips, Timeline, and Waveforms:</title>
      <tasks>
        <task>Create a `Timeline.tsx` component displaying a ruler and a playback head indicator.</task>
        <task>Create a `Track.tsx` component to render a single track lane, containing `Clip.tsx` components.</task>
        <task>Create a `Clip.tsx` component to render an audio clip, hosting a `Waveform.tsx` component.</task>
        <task>Create a `Waveform.tsx` component that takes an `AudioBuffer` (or pre-processed waveform data, potentially also generated in a worker) and renders its waveform using the Canvas API.</task>
        <task>Implement basic volume and pan controls for each track.</task>
        <task>Style UI elements using plain CSS, drawing inspiration from the dark theme of the reference image.</task>
      </tasks>
    </step>

    <step number="6" name="Playback Logic and Synchronization">
      <title>Implement Audio Playback and Synchronization on the Main Thread:</title>
      <tasks>
        <task>When 'play' is initiated, iterate through all clips on all tracks (using data managed on the main thread).</task>
        <task>For each audible clip, create an `AudioBufferSourceNode` (using the `AudioBuffer` received from the worker), connect it, and schedule its playback.</task>
        <task>Ensure precise synchronization of playback across multiple tracks.</task>
        <task>Implement timeline scrubbing and playback controls.</task>
      </tasks>
    </step>
  </approach>

  <specific_tasks_or_actions>

    <section name="Audio Core (Main Thread - `AudioEngine.tsx` or similar)">
      <item>Manage `AudioContext` lifecycle.</item>
      <item>Provide methods for playing, pausing, stopping, and seeking.</item>
      <item>Manage connections for `AudioBufferSourceNode` -> Track Gain/Pan -> Master Gain -> `AudioContext.destination`.</item>
      <item>Calculate and expose current playback time.</item>
    </section>

    <section name="Web Worker Implementation (`audioDecoder.worker.ts`)">
      <item>Handle incoming messages with `ArrayBuffer` data.</item>
      <item>Perform audio decoding using `decodeAudioData` (within an `OfflineAudioContext` if necessary).</item>
      <item>Potentially perform initial waveform data extraction/simplification within the worker to reduce data sent back to main thread.</item>
      <item>Post decoded `AudioBuffer` (or processed data) or error messages back to the main thread.</item>
      <item>Ensure the worker script is correctly bundled and accessible by the main application.</item>
    </section>

    <section name="File Handling and Data Preparation (Main Thread)">
      <item>Implement the drop zone UI with clear visual cues.</item>
      <item>Manage the lifecycle of the Web Worker(s) (creation, termination if needed).</item>
      <item>Handle communication with the worker: sending `ArrayBuffer`s (transferable objects) and receiving results.</item>
      <item>Handle errors reported by the worker or communication errors.</item>
    </section>

    <section name="UI Components (React/TypeScript/Plain CSS - Main Thread)">
      <item>**`MainAudioView.tsx`**: Container for the drop zone, timeline, and tracks.</item>
      <item>**`Timeline.tsx`**: Ruler, playback head, click-to-seek.</item>
      <item>**`TrackView.tsx`**: List of `Track.tsx` components.</item>
      <item>**`Track.tsx`**: Track info, volume/pan, container for clips.</item>
      <item>**`Clip.tsx`**: Visual region, hosts `Waveform.tsx`.</item>
      <item>**`Waveform.tsx`**: Renders waveform from `AudioBuffer` or pre-processed data using `\<canvas\>`.</item>
      <item>**`PlaybackControls.tsx`**: Play, Pause, Stop buttons.</item>
    </section>

    <section name="State Management (Local to this Module - Main Thread)">
      <item>Use React state for `tracks`, `clips`, playback state (`isPlaying`, `currentTime`).</item>
      <item>Manage loading states for files being processed by workers.</item>
      <item>Update UI reactively based on state changes and data received from workers.</item>
    </section>
  </specific_tasks_or_actions>

  <additional_considerations_or_tips>
    <consideration>
    Focus on a clean separation of concerns: UI, main thread audio
  logic, Web Worker logic, and state.
    </consideration>
    <consideration>
    **Leverage Web Workers to prevent the main UI thread from
  freezing during audio decoding and potentially intensive waveform processing.
  This is crucial for a smooth user experience.**
    </consideration>
    <consideration>
    **Be mindful of data transfer costs to/from Web Workers. Transfer
  `ArrayBuffer`s as transferable objects to avoid copying large data.** If sending
  processed waveform data, ensure it's compact.
    </consideration>
    <consideration>
    For waveform rendering on the main thread, still consider
  techniques like drawing peaks or averaging samples for performance, especially
  for long audio files or zoomed-out views
    </consideration>
    <consideration>
    Consider a pool of Web Workers or a queueing system if users can
  drop many files simultaneously, to manage resource usage.
    </consideration>
    <consideration>
    Handle the `AudioContext` state (running, suspended, closed)
  correctly on the main thread.
    </consideration>
    <consideration>
    All styling should be done with plain CSS. Adhere to a dark,
  professional aesthetic similar to the provided DAW reference
  image.
    </consideration>
  </additional_considerations_or_tips>

  <exclusions_for_this_prompt>
    <exclusion>
      No backend integration (Supabase) is required for this specific task.
    </exclusion>
    <exclusion>
      No real-time collaboration or WebSocket features.
    </exclusion>
    <exclusion>
      No advanced theming system (beyond a basic functional dark style).
    </exclusion>
    <exclusion>
      No routing beyond a single page to host this audio engine view.
    </exclusion>
    <exclusion>
      No complex project saving/loading mechanisms.
    </exclusion>
    <exclusion>
      No advanced audio effects, MIDI, or recording features (beyond what's
      needed for playback of decoded audio).
    </exclusion>
  </exclusions_for_this_prompt>

  <closing_note>
    Your primary objective is to deliver a functional core audio
    engine with a simple interface for adding (via drag-and-drop with Web
    Worker-based decoding) and playing back audio files. This module must
    demonstrate effective use of Web Workers to maintain main thread responsiveness.
    This will form a critical part of the larger Collaborative DAW application.
  </closing_note>
</prompt>
