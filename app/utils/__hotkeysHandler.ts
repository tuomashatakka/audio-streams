/**
 * HotkeysHandler - Global keyboard shortcuts for audio editing - Next.js Edition
 *
 * Supported hotkeys:
 * - Left Arrow: Nudge selected clip left by 1 grid
 * - Right Arrow: Nudge selected clip right by 1 grid
 * - Shift + Left Arrow: Shorten selected clip by 1 grid
 * - Shift + Right Arrow: Lengthen selected clip by 1 grid
 * - Space: Toggle playback
 * - Shift + Space: Start playback from beginning
 */

import { AudioClip } from '@/types/audio'
import { getGridDuration, GridSize, moveByGrid, constrainTime } from './audioUtils'

export interface HotkeysConfig {
  // Clip manipulation
  onNudgeLeft: (clipId: string, newStartTime: number) => void
  onNudgeRight: (clipId: string, newStartTime: number) => void
  onShortenClip: (clipId: string, newDuration: number) => void
  onLengthenClip: (clipId: string, newDuration: number) => void

  // Playback control
  onTogglePlayback: () => void
  onRestartPlayback: () => void

  // State getters
  getSelectedClip: () => AudioClip | null
  getBPM: () => number
  getTimeSignature: () => { numerator: number; denominator: number }
  getProjectDuration: () => number
  isPlaying: () => boolean
}

export class HotkeysHandler {
  private config: HotkeysConfig
  private isEnabled: boolean = false
  private boundHandler: (event: KeyboardEvent) => void

  constructor(config: HotkeysConfig) {
    this.config = config
    this.boundHandler = this.handleKeyDown.bind(this)
  }

  enable(): void {
    if (this.isEnabled)
      return

    document.addEventListener('keydown', this.boundHandler)
    this.isEnabled = true
    console.log('🎹 Hotkeys enabled')
  }

  /**
   * Disable global hotkey listening
   */
  disable(): void {
    if (!this.isEnabled)
      return

    document.removeEventListener('keydown', this.boundHandler)
    this.isEnabled = false
    console.log('🎹 Hotkeys disabled')
  }

  /**
   * Check if hotkeys are currently enabled
   */
  get enabled(): boolean {
    return this.isEnabled
  }

  /**
   * Main keyboard event handler
   */
  private handleKeyDown(event: KeyboardEvent): void {
    // Don't handle hotkeys when user is typing in inputs
    if (this.isInputFocused())
      return

    const { code, shiftKey, ctrlKey, metaKey, altKey } = event

    // Ignore if modifier keys other than shift are pressed
    if (ctrlKey || metaKey || altKey)
      return

    let handled = false

    try {
      switch (code) {
        case 'ArrowLeft':
          handled = shiftKey ? this.handleShortenClip() : this.handleNudgeLeft()
          break
        case 'ArrowRight':
          handled = shiftKey ? this.handleLengthenClip() : this.handleNudgeRight()
          break
        case 'Space':
          handled = shiftKey ? this.handleRestartPlayback() : this.handleTogglePlayback()
          break
      }

      if (handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    catch (error) {
      console.error('Error handling hotkey:', error)
    }
  }

  /**
   * Handle nudging selected clip to the left
   */
  private handleNudgeLeft(): boolean {
    const selectedClip = this.config.getSelectedClip()
    if (!selectedClip) {
      console.log('🎹 No clip selected for nudge left')
      return false
    }

    const gridDuration = this.getGridDuration()
    const newStartTime = moveByGrid(
      selectedClip.startTime,
      -1, // Move left by 1 grid unit
      this.config.getBPM(),
      GridSize.SIXTEENTH,
      this.config.getTimeSignature()
    )

    // Constrain to valid bounds (don't go negative)
    const constrainedStartTime = constrainTime(newStartTime, 0)

    if (constrainedStartTime !== selectedClip.startTime) {
      this.config.onNudgeLeft(selectedClip.id, constrainedStartTime)
      console.log(`🎹 Nudged clip left: ${selectedClip.startTime.toFixed(3)}s → ${constrainedStartTime.toFixed(3)}s`)
      return true
    }

    return false
  }

  /**
   * Handle nudging selected clip to the right
   */
  private handleNudgeRight(): boolean {
    const selectedClip = this.config.getSelectedClip()
    if (!selectedClip) {
      console.log('🎹 No clip selected for nudge right')
      return false
    }

    const newStartTime = moveByGrid(
      selectedClip.startTime,
      1, // Move right by 1 grid unit
      this.config.getBPM(),
      GridSize.SIXTEENTH,
      this.config.getTimeSignature()
    )

    // Constrain to project duration (clip start + duration shouldn't exceed project)
    const projectDuration = this.config.getProjectDuration()
    const constrainedStartTime = constrainTime(newStartTime, 0, Math.max(0, projectDuration - selectedClip.duration))

    if (constrainedStartTime !== selectedClip.startTime) {
      this.config.onNudgeRight(selectedClip.id, constrainedStartTime)
      console.log(`🎹 Nudged clip right: ${selectedClip.startTime.toFixed(3)}s → ${constrainedStartTime.toFixed(3)}s`)
      return true
    }

    return false
  }

  /**
   * Handle shortening selected clip
   */
  private handleShortenClip(): boolean {
    const selectedClip = this.config.getSelectedClip()
    if (!selectedClip) {
      console.log('🎹 No clip selected for shorten')
      return false
    }

    const gridDuration = this.getGridDuration()
    const newDuration = selectedClip.duration - gridDuration

    // Don't allow clips shorter than one grid unit
    const minDuration = gridDuration
    const constrainedDuration = Math.max(minDuration, newDuration)

    if (constrainedDuration !== selectedClip.duration && constrainedDuration > 0) {
      this.config.onShortenClip(selectedClip.id, constrainedDuration)
      console.log(`🎹 Shortened clip: ${selectedClip.duration.toFixed(3)}s → ${constrainedDuration.toFixed(3)}s`)
      return true
    }

    return false
  }

  /**
   * Handle lengthening selected clip
   */
  private handleLengthenClip(): boolean {
    const selectedClip = this.config.getSelectedClip()
    if (!selectedClip) {
      console.log('🎹 No clip selected for lengthen')
      return false
    }

    const gridDuration = this.getGridDuration()
    const newDuration = selectedClip.duration + gridDuration

    // Don't exceed project duration
    const projectDuration = this.config.getProjectDuration()
    const maxDuration = projectDuration - selectedClip.startTime
    const constrainedDuration = Math.min(maxDuration, newDuration)

    if (constrainedDuration !== selectedClip.duration && constrainedDuration > selectedClip.duration) {
      this.config.onLengthenClip(selectedClip.id, constrainedDuration)
      console.log(`🎹 Lengthened clip: ${selectedClip.duration.toFixed(3)}s → ${constrainedDuration.toFixed(3)}s`)
      return true
    }

    return false
  }

  /**
   * Handle toggle playback
   */
  private handleTogglePlayback(): boolean {
    this.config.onTogglePlayback()
    console.log(`🎹 Toggled playback: ${this.config.isPlaying() ? 'playing' : 'paused'}`)
    return true
  }

  /**
   * Handle restart playback from beginning
   */
  private handleRestartPlayback(): boolean {
    this.config.onRestartPlayback()
    console.log('🎹 Restarted playback from beginning')
    return true
  }

  /**
   * Get current grid duration in seconds
   */
  private getGridDuration(): number {
    return getGridDuration(
      this.config.getBPM(),
      GridSize.SIXTEENTH,
      this.config.getTimeSignature()
    )
  }

  /**
   * Check if an input element is currently focused
   */
  private isInputFocused(): boolean {
    const activeElement = document.activeElement
    if (!activeElement)
      return false

    const tagName = activeElement.tagName.toLowerCase()
    const isContentEditable = activeElement.getAttribute('contenteditable') === 'true'
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select'

    return isInput || isContentEditable
  }

  /**
   * Update the configuration (useful for changing handlers)
   */
  updateConfig(newConfig: Partial<HotkeysConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current grid info for debugging
   */
  getGridInfo(): { duration: number; bpm: number; gridSize: string } {
    return {
      duration: this.getGridDuration(),
      bpm: this.config.getBPM(),
      gridSize: '1/16 note'
    }
  }
}

export default HotkeysHandler