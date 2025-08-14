'use client'

import { getSeoScoreColor, getSeoScoreLabel } from '@/lib/utils'

interface SeoScoreCircleProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function SeoScoreCircle({ 
  score, 
  size = 120, 
  strokeWidth = 8,
  className = "" 
}: SeoScoreCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  const scoreColor = getSeoScoreColor(score)
  const scoreLabel = getSeoScoreLabel(score)

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${
            score >= 90 ? 'text-seo-excellent' :
            score >= 75 ? 'text-seo-good' :
            score >= 60 ? 'text-seo-fair' :
            score >= 40 ? 'text-seo-poor' :
            'text-seo-critical'
          }`}
        />
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${scoreColor}`}>
          {score}
        </span>
        <span className="text-xs text-gray-500 font-medium">
          {scoreLabel}
        </span>
      </div>
    </div>
  )
}