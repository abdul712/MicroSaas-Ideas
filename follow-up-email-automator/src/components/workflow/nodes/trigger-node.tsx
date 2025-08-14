"use client"

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'react-flow-renderer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Settings, 
  User, 
  Calendar, 
  ShoppingCart, 
  Tag,
  Zap
} from 'lucide-react'

interface TriggerNodeData {
  label: string
  triggerType: 'manual' | 'form_submit' | 'tag_added' | 'purchase' | 'date' | 'api' | 'webhook'
  conditions?: Record<string, any>
  isActive?: boolean
}

export const TriggerNode = memo<NodeProps<TriggerNodeData>>(({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getTriggerIcon = () => {
    switch (data.triggerType) {
      case 'manual': return <User className="w-4 h-4" />
      case 'form_submit': return <Play className="w-4 h-4" />
      case 'tag_added': return <Tag className="w-4 h-4" />
      case 'purchase': return <ShoppingCart className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'api': return <Zap className="w-4 h-4" />
      case 'webhook': return <Zap className="w-4 h-4" />
      default: return <Play className="w-4 h-4" />
    }
  }

  const getTriggerLabel = () => {
    switch (data.triggerType) {
      case 'manual': return 'Manual Start'
      case 'form_submit': return 'Form Submitted'
      case 'tag_added': return 'Tag Added'
      case 'purchase': return 'Purchase Made'
      case 'date': return 'Date/Time'
      case 'api': return 'API Call'
      case 'webhook': return 'Webhook'
      default: return 'Trigger'
    }
  }

  const getTriggerDescription = () => {
    switch (data.triggerType) {
      case 'manual': return 'Start sequence manually'
      case 'form_submit': return 'When form is submitted'
      case 'tag_added': return 'When tag is added to contact'
      case 'purchase': return 'When purchase is completed'
      case 'date': return 'On specific date/time'
      case 'api': return 'Via API integration'
      case 'webhook': return 'Via webhook call'
      default: return 'Sequence trigger'
    }
  }

  const getTriggerColor = () => {
    if (!data.isActive) return 'bg-gray-100 text-gray-700 border-gray-300'
    
    switch (data.triggerType) {
      case 'manual': return 'bg-green-100 text-green-700 border-green-300'
      case 'form_submit': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'tag_added': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'purchase': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'date': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'api': return 'bg-indigo-100 text-indigo-700 border-indigo-300'
      case 'webhook': return 'bg-pink-100 text-pink-700 border-pink-300'
      default: return 'bg-green-100 text-green-700 border-green-300'
    }
  }

  return (
    <Card 
      className={`
        min-w-[250px] transition-all duration-200 cursor-pointer
        ${selected ? 'ring-2 ring-green-500 shadow-lg' : 'shadow-md'}
        ${isHovered ? 'shadow-lg scale-105' : ''}
        ${!data.isActive ? 'opacity-60' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{data.label}</h3>
              <p className="text-xs text-gray-500">Sequence Trigger</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Badge 
              variant="outline" 
              className={`text-xs ${data.isActive ? 'border-green-500 text-green-700' : 'border-gray-400 text-gray-600'}`}
            >
              {data.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Trigger Type Display */}
        <div className={`p-3 rounded-lg mb-3 border ${getTriggerColor()}`}>
          <div className="flex items-center justify-center space-x-2 mb-2">
            {getTriggerIcon()}
            <span className="font-medium text-sm">{getTriggerLabel()}</span>
          </div>
          <div className="text-center text-xs opacity-80">
            {getTriggerDescription()}
          </div>
        </div>

        {/* Conditions Preview */}
        {data.conditions && Object.keys(data.conditions).length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">Conditions:</div>
            <div className="bg-gray-50 p-2 rounded text-xs">
              {Object.keys(data.conditions).length} condition(s) configured
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
            <Settings className="w-3 h-3 mr-1" />
            Configure
          </Button>
          <Button 
            size="sm" 
            variant={data.isActive ? "outline" : "default"} 
            className="flex-1 text-xs h-8"
          >
            <Play className="w-3 h-3 mr-1" />
            {data.isActive ? 'Pause' : 'Activate'}
          </Button>
        </div>

        {/* API/Webhook Info */}
        {(data.triggerType === 'api' || data.triggerType === 'webhook') && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-gray-600">
              <Badge variant="secondary" className="text-xs">
                🔗 External trigger configured
              </Badge>
            </div>
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500"
      />
    </Card>
  )
})