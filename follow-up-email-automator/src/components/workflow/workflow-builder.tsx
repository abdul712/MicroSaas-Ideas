"use client"

import React, { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Node,
  Edge,
  Connection,
  ReactFlowProvider,
  MarkerType,
} from 'react-flow-renderer'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmailNode } from './nodes/email-node'
import { DelayNode } from './nodes/delay-node'
import { ConditionNode } from './nodes/condition-node'
import { TriggerNode } from './nodes/trigger-node'
import { WebhookNode } from './nodes/webhook-node'
import { 
  Mail, 
  Clock, 
  GitBranch, 
  Play, 
  Webhook, 
  Plus,
  Save,
  Eye,
  Settings,
  Zap
} from 'lucide-react'

const nodeTypes = {
  emailNode: EmailNode,
  delayNode: DelayNode,
  conditionNode: ConditionNode,
  triggerNode: TriggerNode,
  webhookNode: WebhookNode,
}

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'triggerNode',
    position: { x: 250, y: 25 },
    data: {
      label: 'Sequence Start',
      triggerType: 'manual',
      conditions: {},
    },
  },
]

const initialEdges: Edge[] = []

interface WorkflowBuilderProps {
  sequenceId?: string
  onSave?: (nodes: Node[], edges: Edge[]) => void
  onPreview?: (nodes: Node[], edges: Edge[]) => void
}

export function WorkflowBuilder({ sequenceId, onSave, onPreview }: WorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null)

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      const edge = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6366f1',
        },
        style: {
          stroke: '#6366f1',
          strokeWidth: 2,
        },
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type || !reactFlowInstance || !reactFlowBounds) {
        return
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `${type}-${nodes.length + 1}`,
        type,
        position,
        data: getDefaultNodeData(type),
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, nodes, setNodes]
  )

  const getDefaultNodeData = (nodeType: string) => {
    switch (nodeType) {
      case 'emailNode':
        return {
          label: 'Email Step',
          subject: 'New Email',
          templateId: null,
          variables: {},
        }
      case 'delayNode':
        return {
          label: 'Delay',
          delayDays: 1,
          delayHours: 0,
          delayMinutes: 0,
        }
      case 'conditionNode':
        return {
          label: 'Condition',
          conditionType: 'opened',
          conditions: [],
        }
      case 'webhookNode':
        return {
          label: 'Webhook',
          url: '',
          method: 'POST',
          headers: {},
        }
      default:
        return { label: 'New Node' }
    }
  }

  const onNodeDragStart = (nodeType: string) => {
    return (event: React.DragEvent) => {
      event.dataTransfer.setData('application/reactflow', nodeType)
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges)
    }
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(nodes, edges)
    }
  }

  const nodeCategories = [
    {
      title: 'Triggers',
      nodes: [
        { type: 'triggerNode', label: 'Trigger', icon: Play, color: 'bg-green-100 text-green-700' },
      ],
    },
    {
      title: 'Actions',
      nodes: [
        { type: 'emailNode', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-700' },
        { type: 'webhookNode', label: 'Webhook', icon: Webhook, color: 'bg-purple-100 text-purple-700' },
      ],
    },
    {
      title: 'Logic',
      nodes: [
        { type: 'delayNode', label: 'Delay', icon: Clock, color: 'bg-orange-100 text-orange-700' },
        { type: 'conditionNode', label: 'Condition', icon: GitBranch, color: 'bg-yellow-100 text-yellow-700' },
      ],
    },
  ]

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Workflow Builder</h2>
            <Badge variant="outline" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <Button size="sm" onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handlePreview} className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Node Categories */}
        {nodeCategories.map((category) => (
          <div key={category.title} className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{category.title}</h3>
            <div className="space-y-2">
              {category.nodes.map((node) => (
                <div
                  key={node.type}
                  className={`
                    p-3 rounded-lg border-2 border-dashed border-gray-300 cursor-move
                    hover:border-blue-400 transition-colors ${node.color}
                  `}
                  draggable
                  onDragStart={onNodeDragStart(node.type)}
                >
                  <div className="flex items-center space-x-3">
                    <node.icon className="w-5 h-5" />
                    <span className="font-medium">{node.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Node Properties */}
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Node Properties</h3>
          {selectedNodeType ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Selected: {selectedNodeType}
              </p>
              <Button size="sm" variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Select a node to configure its properties
            </p>
          )}
        </Card>
      </div>

      {/* Main Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="top-right"
          >
            <MiniMap 
              nodeStrokeColor="#6366f1"
              nodeColor="#e0e7ff"
              nodeBorderRadius={8}
              className="!bg-white"
            />
            <Controls />
            <Background color="#f3f4f6" gap={16} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  )
}