/**
 * useDroppable hook - handles drag and drop functionality - Next.js Edition
 * Follows project style guide for hook patterns
 */

import { useCallback, useRef } from 'react'
import { isSupportedAudioFile } from '@/utils/audioUtils'

interface DropState {
  isDragOver:     boolean
  dragType:       'file' | null
  hoveredElement: HTMLElement | null
}

interface UseDroppableOptions {
  onFilesDropped: (files: File[]) => void
  onDragEnter?:   (state: DropState) => void
  onDragLeave?:   (state: DropState) => void
  onDragOver?:    (state: DropState) => void
  acceptedTypes?: string[]
}

interface UseDroppableReturn {
  dragProps: {
    onDragEnter: (event: React.DragEvent) => void
    onDragLeave: (event: React.DragEvent) => void
    onDragOver:  (event: React.DragEvent) => void
    onDrop:      (event: React.DragEvent) => void
  }
  isDragOver: boolean
}

export function useDroppable ({
  onFilesDropped,
  onDragEnter,
  onDragLeave,
  onDragOver
}: UseDroppableOptions): UseDroppableReturn {
  const dragStateRef = useRef<DropState>({
    isDragOver:     false,
    dragType:       null,
    hoveredElement: null
  })

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const hasFiles = Array.from(event.dataTransfer.types).includes('Files')
    if (!hasFiles)
      return

    dragStateRef.current = {
      isDragOver:     true,
      dragType:       'file',
      hoveredElement: event.currentTarget as HTMLElement
    }

    onDragEnter?.(dragStateRef.current)
  }, [ onDragEnter ])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Only trigger leave if we're actually leaving the drop zone
    const relatedTarget = event.relatedTarget as HTMLElement
    const currentTarget = event.currentTarget as HTMLElement

    if (!currentTarget.contains(relatedTarget)) {
      dragStateRef.current = {
        isDragOver:     false,
        dragType:       null,
        hoveredElement: null
      }

      onDragLeave?.(dragStateRef.current)
    }
  }, [ onDragLeave ])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    onDragOver?.(dragStateRef.current)
  }, [ onDragOver ])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    dragStateRef.current = {
      isDragOver:     false,
      dragType:       null,
      hoveredElement: null
    }

    const files = Array.from(event.dataTransfer.files)
    const audioFiles = files.filter(isSupportedAudioFile)

    if (audioFiles.length > 0)
      onFilesDropped(audioFiles)

    onDragLeave?.(dragStateRef.current)
  }, [ onFilesDropped, onDragLeave ])

  return {
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver:  handleDragOver,
      onDrop:      handleDrop
    },
    isDragOver: dragStateRef.current.isDragOver
  }
}
