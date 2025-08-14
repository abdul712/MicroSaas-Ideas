"use client"

import React, { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'react-flow-renderer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Webhook, Settings, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

interface WebhookNodeData {
  label: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  payload?: Record<string, any>
  timeout?: number
  retries?: number
  lastStatus?: 'success' | 'failed' | 'pending'
  lastExecuted?: string
}

export const WebhookNode = memo<NodeProps<WebhookNodeData>>(({ data, selected }) => {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = () => {
    switch (data.lastStatus) {
      case 'success': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (data.lastStatus) {
      case 'success': return <CheckCircle className="w-3 h-3" />
      case 'failed': return <XCircle className="w-3 h-3" />
      default: return null
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'POST': return 'bg-green-100 text-green-700 border-green-300'
      case 'PUT': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'PATCH': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + '...'
  }

  return (
    <Card 
      className={`
        min-w-[260px] transition-all duration-200 cursor-pointer
        ${selected ? 'ring-2 ring-purple-500 shadow-lg' : 'shadow-md'}
        ${isHovered ? 'shadow-lg scale-105' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle 
        type="target" 
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500"
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Webhook className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{data.label}</h3>
              <p className="text-xs text-gray-500">Webhook Call</p>
            </div>
          </div>

          {data.lastStatus && (
            <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
                {data.lastStatus}
              </Badge>
            </div>
          )}
        </div>

        {/* Method and URL */}
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={`text-xs font-mono ${getMethodColor(data.method)}`}>
              {data.method}
            </Badge>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </div>
          
          <div className="bg-gray-50 p-2 rounded text-xs font-mono break-all">
            {data.url ? truncateUrl(data.url) : 'No URL configured'}
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">Timeout</div>
            <div className="font-medium">{data.timeout || 30}s</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">Retries</div>
            <div className="font-medium">{data.retries || 3}</div>
          </div>
        </div>

        {/* Headers & Payload Indicators */}
        <div className="mb-3">
          <div className="flex space-x-2">
            {data.headers && Object.keys(data.headers).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {Object.keys(data.headers).length} Headers
              </Badge>
            )}
            {data.payload && Object.keys(data.payload).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Custom Payload
              </Badge>
            )}
          </div>
        </div>

        {/* Last Execution */}
        {data.lastExecuted && (
          <div className="mb-3 text-xs text-gray-600">
            Last run: {new Date(data.lastExecuted).toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
            <Settings className="w-3 h-3 mr-1" />
            Configure
          </Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
            <ExternalLink className="w-3 h-3 mr-1" />
            Test
          </Button>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500"
      />
    </Card>
  )
})