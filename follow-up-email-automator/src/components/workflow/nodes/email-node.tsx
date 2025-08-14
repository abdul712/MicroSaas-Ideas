"use client"

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'react-flow-renderer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Edit, Settings, BarChart3 } from 'lucide-react'

interface EmailNodeData {
  label: string
  subject: string
  templateId?: string
  variables?: Record<string, any>
  metrics?: {
    sent: number
    opened: number
    clicked: number
  }
}

export const EmailNode = memo<NodeProps<EmailNodeData>>(({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)

  const openRate = data.metrics ? 
    Math.round((data.metrics.opened / data.metrics.sent) * 100) : 0
  const clickRate = data.metrics ? 
    Math.round((data.metrics.clicked / data.metrics.sent) * 100) : 0

  return (
    <Card 
      className={`
        min-w-[280px] transition-all duration-200 cursor-pointer
        ${selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md'}
        ${isHovered ? 'shadow-lg scale-105' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle 
        type="target" 
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500"
      />

      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{data.label}</h3>
              <p className="text-xs text-gray-500">Email Step</p>
            </div>
          </div>
          
          {data.metrics && (
            <Badge variant="outline" className="text-xs">
              Sent: {data.metrics.sent}
            </Badge>
          )}
        </div>

        {/* Subject Line */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 font-medium truncate">
            {data.subject || 'No subject set'}
          </p>
        </div>

        {/* Metrics */}
        {data.metrics && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="text-center p-2 bg-green-50 rounded">
              <p className="text-xs text-green-600 font-medium">Open Rate</p>
              <p className="text-sm font-bold text-green-700">{openRate}%</p>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <p className="text-xs text-purple-600 font-medium">Click Rate</p>
              <p className="text-sm font-bold text-purple-700">{clickRate}%</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
            <BarChart3 className="w-3 h-3 mr-1" />
            Stats
          </Button>
          <Button size="sm" variant="outline" className="px-2 h-8">
            <Settings className="w-3 h-3" />
          </Button>
        </div>

        {/* Variables Indicator */}
        {data.variables && Object.keys(data.variables).length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex flex-wrap gap-1">
              {Object.keys(data.variables).slice(0, 3).map((variable) => (
                <Badge key={variable} variant="secondary" className="text-xs">
                  {variable}
                </Badge>
              ))}
              {Object.keys(data.variables).length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{Object.keys(data.variables).length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </Card>
  )
})