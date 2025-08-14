"use client"

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'react-flow-renderer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Settings, Eye, MousePointer } from 'lucide-react'

interface ConditionNodeData {
  label: string
  conditionType: 'opened' | 'clicked' | 'replied' | 'tag_has' | 'field_equals' | 'custom'
  conditions: Array<{
    field: string
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
    value: any
  }>
  timeWindow?: number // hours to wait for condition
}

export const ConditionNode = memo<NodeProps<ConditionNodeData>>(({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getConditionIcon = () => {
    switch (data.conditionType) {
      case 'opened': return <Eye className="w-4 h-4" />
      case 'clicked': return <MousePointer className="w-4 h-4" />
      case 'replied': return <GitBranch className="w-4 h-4" />
      default: return <GitBranch className="w-4 h-4" />
    }
  }

  const getConditionLabel = () => {
    switch (data.conditionType) {
      case 'opened': return 'Email Opened'
      case 'clicked': return 'Link Clicked'
      case 'replied': return 'Email Replied'
      case 'tag_has': return 'Has Tag'
      case 'field_equals': return 'Field Equals'
      case 'custom': return 'Custom Logic'
      default: return 'Condition'
    }
  }

  const getConditionColor = () => {
    switch (data.conditionType) {
      case 'opened': return 'bg-green-100 text-green-700 border-green-300'
      case 'clicked': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'replied': return 'bg-purple-100 text-purple-700 border-purple-300'
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    }
  }

  return (
    <Card 
      className={`
        min-w-[240px] transition-all duration-200 cursor-pointer
        ${selected ? 'ring-2 ring-yellow-500 shadow-lg' : 'shadow-md'}
        ${isHovered ? 'shadow-lg scale-105' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle 
        type="target" 
        position={Position.Top}
        className="w-3 h-3 !bg-yellow-500"
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <GitBranch className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{data.label}</h3>
              <p className="text-xs text-gray-500">Decision Point</p>
            </div>
          </div>

          <Badge variant="outline" className="text-xs">
            If/Then
          </Badge>
        </div>

        {/* Condition Display */}
        <div className={`p-3 rounded-lg mb-3 border ${getConditionColor()}`}>
          <div className="flex items-center justify-center space-x-2">
            {getConditionIcon()}
            <span className="font-medium text-sm">{getConditionLabel()}</span>
          </div>
          
          {data.timeWindow && (
            <div className="text-center mt-2">
              <Badge variant="secondary" className="text-xs">
                Wait {data.timeWindow}h
              </Badge>
            </div>
          )}
        </div>

        {/* Conditions List */}
        {data.conditions && data.conditions.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-2">Rules:</div>
            <div className="space-y-1">
              {data.conditions.slice(0, 2).map((condition, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                  {condition.field} {condition.operator} {condition.value}
                </div>
              ))}
              {data.conditions.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{data.conditions.length - 2} more rules
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
            <Settings className="w-3 h-3 mr-1" />
            Configure
          </Button>
        </div>
      </div>

      {/* Multiple Handles for Yes/No branches */}
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="yes"
        className="w-3 h-3 !bg-green-500"
        style={{ left: '25%' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        id="no"
        className="w-3 h-3 !bg-red-500"
        style={{ left: '75%' }}
      />

      {/* Branch Labels */}
      <div className="absolute bottom-[-20px] left-0 right-0 flex justify-between px-6">
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
          Yes
        </Badge>
        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
          No
        </Badge>
      </div>
    </Card>
  )
})