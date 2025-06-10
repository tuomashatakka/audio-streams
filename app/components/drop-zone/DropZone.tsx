/**
 * Drop Zone Component - handles drag and drop for audio files
 */

import { useState, useCallback } from 'react'
import { Upload, FileAudio, AlertCircle } from 'lucide-react'
import { DropZoneState, FileProcessingState } from '../../types/audio'
import { isSupportedAudioFile } from '../../utils/audioUtils'
import { useAudioEngine } from '../../contexts/AudioEngineContext'
import './DropZone.css'


interface DropZoneProps {
  onFilesDropped?: (files: File[]) => void
  processingFiles: FileProcessingState[]
  isProcessing:    boolean
  className?:      string
}


function DropZone ({
  processingFiles,
  isProcessing,
  className
}: DropZoneProps) {
  const { openFileDialog }                  = useAudioEngine()
  const [ dropZoneState, setDropZoneState ] = useState<DropZoneState>({ isDragOver: false })

  // Handle drag events
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!dropZoneState.isDragOver)
      setDropZoneState((prev: DropZoneState) => ({ ...prev, isDragOver: true }))
  }, [ dropZoneState.isDragOver ])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Only set isDragOver to false if we're leaving the drop zone itself
    if (!event.currentTarget.contains(event.relatedTarget as Node))
      setDropZoneState((prev: DropZoneState) => ({ ...prev, isDragOver: false }))
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setDropZoneState((prev: DropZoneState) => ({ ...prev, isDragOver: false }))

    const files      = Array.from(event.dataTransfer.files)
    const audioFiles = files.filter(isSupportedAudioFile)

    console.log(audioFiles)

    if (audioFiles.length === 0) {
      setDropZoneState((prev: DropZoneState) => ({
        ...prev,
        errorMessage: 'No supported audio files found. Please drop WAV, MP3, M4A, OGG, or FLAC files.'
      }))
      setTimeout(() => {
        setDropZoneState((prev: DropZoneState) => ({ ...prev, errorMessage: undefined }))
      }, 3000)
      return
    }

    if (audioFiles.length !== files.length) {
      setDropZoneState((prev: DropZoneState) => ({
        ...prev,
        errorMessage: `${files.length - audioFiles.length} unsupported file(s) ignored.`
      }))
      setTimeout(() => {
        setDropZoneState((prev: DropZoneState) => ({ ...prev, errorMessage: undefined }))
      }, 3000)
    }
  }, [])

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!isProcessing)
      openFileDialog()
  }, [ isProcessing, openFileDialog ])

  const dropZoneClasses = [
    'drop-zone',
    dropZoneState.isDragOver ? 'drag-over' : '',
    isProcessing ? 'processing' : '',
    dropZoneState.errorMessage ? 'error' : '',
    className
  ].filter(Boolean).join(' ')

  return <div
    className={ dropZoneClasses }
    onDragOver={ handleDragOver }
    onDragLeave={ handleDragLeave }
    onDrop={ handleDrop }
    onClick={ handleClick }
    role='button'
    tabIndex={ 0 }
    aria-label='Drop audio files here or click to select'>

    {/* Main drop zone content */}
    {!isProcessing && processingFiles.length === 0 &&
      <div className='drop-zone-content'>
        <div className='drop-zone-icon'>
          {dropZoneState.isDragOver
            ? <FileAudio size={ 48 } />
            : <Upload size={ 48 } />
          }
        </div>

        <div className='drop-zone-text'>
          <h3>
            {dropZoneState.isDragOver
              ? 'Drop audio files here'
              : 'Drop audio files or click to browse'
            }
          </h3>

          <p>Supports WAV, MP3, M4A, OGG, and FLAC files</p>
        </div>
      </div>
    }

    {/* Processing state */}
    {(isProcessing || processingFiles.length > 0) &&
    <div className='processing-content'>
      <div className='processing-header'>
        <div className='processing-spinner' />
        <h3>Processing Audio Files</h3>
      </div>

      <div className='processing-files'>
        {processingFiles.map(file =>
          <div key={ file.id } className={ `processing-file ${file.status}` }>
            <span className='file-name'>{file.fileName}</span>

            <span className='file-status'>
              {file.status === 'processing' && '⏳ Decoding...'}
              {file.status === 'completed' && '✅ Complete'}
              {file.status === 'error' && '❌ Error'}
            </span>
          </div>
        )}
      </div>
    </div>
    }

    {/* Error message */}
    {dropZoneState.errorMessage &&
      <div className='error-message'>
        <AlertCircle size={ 20 } />
        <span>{dropZoneState.errorMessage}</span>
      </div>
    }
  </div>
}

export default DropZone
