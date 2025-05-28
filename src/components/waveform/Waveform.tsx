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
  color = '#3a86ff',
  backgroundColor = 'transparent',
  strokeWidth = 1,
  className
}: WaveformProps) {
  
  // Generate SVG path from waveform data
  const svgPath = useMemo(() => {
    if (!waveformData.length) return ''

    const centerY = height / 2
    const maxAmplitude = height / 2 - 2 // Leave small margin
    
    // Generate path commands for top and bottom halves
    const topPath: string[] = []
    const bottomPath: string[] = []

    for (let i = 0; i < waveformData.length; i++) {
      const x = (i / (waveformData.length - 1)) * width
      const amplitude = waveformData[i] * maxAmplitude
      
      const topY = centerY - amplitude
      const bottomY = centerY + amplitude
      
      if (i === 0) {
        topPath.push(`M ${x} ${topY}`)
        bottomPath.push(`M ${x} ${bottomY}`)
      } else {
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
  }, [waveformData, width, height])

  // Generate stroke path (outline only)
  const strokePath = useMemo(() => {
    if (!waveformData.length) return ''

    const centerY = height / 2
    const maxAmplitude = height / 2 - 2
    
    const topPath: string[] = []
    const bottomPath: string[] = []

    for (let i = 0; i < waveformData.length; i++) {
      const x = (i / (waveformData.length - 1)) * width
      const amplitude = waveformData[i] * maxAmplitude
      
      const topY = centerY - amplitude
      const bottomY = centerY + amplitude
      
      if (i === 0) {
        topPath.push(`M ${x} ${topY}`)
        bottomPath.push(`M ${x} ${bottomY}`)
      } else {
        topPath.push(`L ${x} ${topY}`)
        bottomPath.push(`L ${x} ${bottomY}`)
      }
    }

    return [topPath.join(' '), bottomPath.join(' ')].join(' ')
  }, [waveformData, width, height])

  if (!waveformData.length) {
    return (
      <svg
        width={width}
        height={height}
        className={className}
        role='img'
        aria-label='Empty audio waveform'
      >
        <rect 
          width={width} 
          height={height} 
          fill={backgroundColor} 
        />
      </svg>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      className={className}
      role='img'
      aria-label='Audio waveform visualization'
      style={{ display: 'block' }}
    >
      {/* Background */}
      {backgroundColor !== 'transparent' && (
        <rect 
          width={width} 
          height={height} 
          fill={backgroundColor} 
        />
      )}
      
      {/* Filled waveform */}
      <path
        d={svgPath}
        fill={`${color}40`} // Add transparency
        stroke='none'
      />
      
      {/* Stroke outline */}
      <path
        d={strokePath}
        fill='none'
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default Waveform
