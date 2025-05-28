/**
 * Waveform visualization component using SVG
 * Generates scalable vector graphics for better performance and quality
 */

import { useMemo } from 'react'


interface WaveformProps {
  waveformData:     number[]
  width:            number
  height:           number
  color?:           string
  backgroundColor?: string
  strokeWidth?:     number
  className?:       string
}


function Waveform ({
  waveformData,
  width,
  height,
  color = 'currentColor',
  backgroundColor = 'transparent',
  strokeWidth = 0.5,
  className
}: WaveformProps) {
  // Generate SVG path from waveform data
  const svgPath = useMemo(() => {
    if (!waveformData.length)
      return ''

    const centerY              = height / 2
    const maxAmplitude         = height / 2 - 2 // Leave small margin
    const topPath: string[]    = []
    const bottomPath: string[] = []

    for (let i = 0; i < waveformData.length; i++) {
      const x         = i / (waveformData.length - 1) * width
      const amplitude = waveformData[i] * maxAmplitude

      const topY    = centerY - amplitude
      const bottomY = centerY + amplitude

      if (i === 0) {
        topPath.push(`M ${x} ${topY}`)
        bottomPath.push(`M ${x} ${bottomY}`)
      }
      else {
        topPath.push(`L ${x} ${topY}`)
        bottomPath.push(`L ${x} ${bottomY}`)
      }
    }

    // Create closed path for filled waveform
    const pathCommands = [
      ...topPath,
      ...bottomPath.reverse(),
      'Z'
    ].join(' ')

    return pathCommands
  }, [ waveformData, width, height ])

  // Generate stroke path (outline only)
  const strokePath = useMemo(() => {
    if (!waveformData.length)
      return ''

    const centerY              = height / 2
    const maxAmplitude         = height / 2 - 2
    const topPath: string[]    = []
    const bottomPath: string[] = []

    for (let i = 0; i < waveformData.length; i++) {
      const x         = i / (waveformData.length - 1) * width
      const amplitude = waveformData[i] * maxAmplitude

      const topY    = centerY - amplitude
      const bottomY = centerY + amplitude

      if (i === 0) {
        topPath.push(`M ${x} ${topY}`)
        bottomPath.push(`M ${x} ${bottomY}`)
      }
      else {
        topPath.push(`L ${x} ${topY}`)
        bottomPath.push(`L ${x} ${bottomY}`)
      }
    }

    return [ topPath.join(' '), bottomPath.join(' ') ].join(' ')
  }, [ waveformData, width, height ])

  if (!waveformData.length)
    return <svg style={{ color }} className={`audio-waveform ${className}`} width={width} height={height} role='img' aria-label='Empty audio waveform'>
      <rect className='background' width={width} height={height} />
    </svg>


  return <svg style={{ color }} className={`audio-waveform ${className}`} width={width} height={height} role='img' aria-label='Audio waveform visualization'>
    <rect className='background' width={width} height={height} fill={backgroundColor} />
    <path className='fill' d={svgPath} fill={ color } />
    <path className='stroke' d={strokePath} stroke={ color } />
  </svg>
}

export default Waveform
