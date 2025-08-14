"use client"

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'react-flow-renderer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Settings, Calendar } from 'lucide-react'

interface DelayNodeData {
  label: string
  delayDays: number
  delayHours: number
  delayMinutes: number
  delayType?: 'fixed' | 'dynamic' | 'business_hours'
}

export const DelayNode = memo<NodeProps<DelayNodeData>>(({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)

  const formatDelay = () => {
    const parts = []
    if (data.delayDays > 0) parts.push(`${data.delayDays}d`)
    if (data.delayHours > 0) parts.push(`${data.delayHours}h`)
    if (data.delayMinutes > 0) parts.push(`${data.delayMinutes}m`)
    return parts.join(' ') || '0m'
  }

  const getDelayDescription = () => {
    const total = data.delayDays + (data.delayHours / 24) + (data.delayMinutes / (24 * 60))
    if (total === 0) return 'Immediate'
    if (total < 1) return 'Same day'
    if (total === 1) return 'Next day'
    return `${Math.ceil(total)} days`
  }

  return (
    <Card 
      className={`
        min-w-[200px] transition-all duration-200 cursor-pointer
        ${selected ? 'ring-2 ring-orange-500 shadow-lg' : 'shadow-md'}
        ${isHovered ? 'shadow-lg scale-105' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle 
        type="target" 
        position={Position.Top}
        className="w-3 h-3 !bg-orange-500"
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{data.label}</h3>
              <p className="text-xs text-gray-500">Wait Step</p>
            </div>
          </div>

          {data.delayType && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                data.delayType === 'dynamic' ? 'border-purple-500 text-purple-700' :
                data.delayType === 'business_hours' ? 'border-blue-500 text-blue-700' :
                'border-gray-500 text-gray-700'
              }`}
            >
              {data.delayType === 'dynamic' ? 'AI' : 
               data.delayType === 'business_hours' ? 'Business' : 'Fixed'}
            </Badge>
          )}
        </div>

        {/* Delay Display */}
        <div className="text-center mb-4 p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-700 mb-1">
            {formatDelay()}
          </div>
          <div className="text-xs text-orange-600">
            {getDelayDescription()}
          </div>
        </div>

        {/* Delay Type Indicator */}
        <div className="mb-3">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>
              {data.delayType === 'dynamic' ? 'AI-optimized timing' :
               data.delayType === 'business_hours' ? 'Business hours only' :
               'Fixed delay'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
            <Settings className="w-3 h-3 mr-1" />
            Configure
          </Button>
        </div>

        {/* Smart Timing Info */}
        {data.delayType === 'dynamic' && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs text-center text-purple-600">
              <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                🤖 AI will optimize send time
              </Badge>
            </div>
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom}
        className="w-3 h-3 !bg-orange-500"
      />
    </Card>
  )
})