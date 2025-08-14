'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
  CSS,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Settings, 
  Globe, 
  Mail, 
  Smartphone, 
  MessageSquare, 
  Phone,
  Users,
  ShoppingCart,
  FileText,
  Target
} from 'lucide-react'

export interface TouchpointTemplate {
  id: string
  name: string
  type: 'touchpoint' | 'decision' | 'outcome'
  channel: 'website' | 'email' | 'mobile' | 'social' | 'phone' | 'sms' | 'chat' | 'offline'
  icon: React.ComponentType<{ className?: string }>
  description: string
  metrics: string[]
}

export interface JourneyStage {
  id: string
  name: string
  order: number
  touchpoints: TouchpointInstance[]
  color: string
}

export interface TouchpointInstance {
  id: string
  templateId: string
  name: string
  type: 'touchpoint' | 'decision' | 'outcome'
  channel: string
  config: Record<string, any>
  position: { x: number; y: number }
}

const TOUCHPOINT_TEMPLATES: TouchpointTemplate[] = [
  {
    id: 'website-landing',
    name: 'Landing Page',
    type: 'touchpoint',
    channel: 'website',
    icon: Globe,
    description: 'First impression on your website',
    metrics: ['page_views', 'bounce_rate', 'time_on_page']
  },
  {
    id: 'email-welcome',
    name: 'Welcome Email',
    type: 'touchpoint',
    channel: 'email',
    icon: Mail,
    description: 'Onboarding email sequence',
    metrics: ['open_rate', 'click_rate', 'conversion_rate']
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    type: 'touchpoint',
    channel: 'mobile',
    icon: Smartphone,
    description: 'Mobile application interaction',
    metrics: ['app_opens', 'session_duration', 'feature_usage']
  },
  {
    id: 'social-media',
    name: 'Social Media',
    type: 'touchpoint',
    channel: 'social',
    icon: Users,
    description: 'Social media engagement',
    metrics: ['engagement_rate', 'reach', 'shares']
  },
  {
    id: 'live-chat',
    name: 'Live Chat',
    type: 'touchpoint',
    channel: 'chat',
    icon: MessageSquare,
    description: 'Customer support chat',
    metrics: ['response_time', 'resolution_rate', 'satisfaction']
  },
  {
    id: 'phone-support',
    name: 'Phone Support',
    type: 'touchpoint',
    channel: 'phone',
    icon: Phone,
    description: 'Phone customer service',
    metrics: ['call_duration', 'resolution_rate', 'satisfaction']
  },
  {
    id: 'purchase-decision',
    name: 'Purchase Decision',
    type: 'decision',
    channel: 'website',
    icon: ShoppingCart,
    description: 'Customer decides to purchase',
    metrics: ['conversion_rate', 'cart_abandonment', 'average_order_value']
  },
  {
    id: 'signup-form',
    name: 'Signup Form',
    type: 'touchpoint',
    channel: 'website',
    icon: FileText,
    description: 'Registration or signup form',
    metrics: ['form_completions', 'drop_off_rate', 'validation_errors']
  },
  {
    id: 'conversion-outcome',
    name: 'Conversion',
    type: 'outcome',
    channel: 'website',
    icon: Target,
    description: 'Successful conversion event',
    metrics: ['conversion_rate', 'revenue', 'customer_lifetime_value']
  }
]

const DEFAULT_STAGES: JourneyStage[] = [
  {
    id: 'awareness',
    name: 'Awareness',
    order: 1,
    touchpoints: [],
    color: '#3b82f6'
  },
  {
    id: 'consideration',
    name: 'Consideration',
    order: 2,
    touchpoints: [],
    color: '#f59e0b'
  },
  {
    id: 'decision',
    name: 'Decision',
    order: 3,
    touchpoints: [],
    color: '#10b981'
  },
  {
    id: 'retention',
    name: 'Retention',
    order: 4,
    touchpoints: [],
    color: '#8b5cf6'
  }
]

interface TouchpointCardProps {
  template: TouchpointTemplate
  isDragging?: boolean
}

function TouchpointCard({ template, isDragging }: TouchpointCardProps) {
  const Icon = template.icon

  return (
    <Card className={`cursor-move transition-all hover:shadow-md ${isDragging ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{template.name}</div>
            <div className="text-xs text-muted-foreground">{template.description}</div>
          </div>
        </div>
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            {template.channel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

interface SortableTouchpointProps {
  id: string
  template: TouchpointTemplate
}

function SortableTouchpoint({ id, template }: SortableTouchpointProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TouchpointCard template={template} isDragging={isDragging} />
    </div>
  )
}

interface JourneyStageCardProps {
  stage: JourneyStage
  onAddTouchpoint: (stageId: string, templateId: string) => void
  onRemoveTouchpoint: (stageId: string, touchpointId: string) => void
  onConfigureTouchpoint: (stageId: string, touchpointId: string) => void
}

function JourneyStageCard({ 
  stage, 
  onAddTouchpoint, 
  onRemoveTouchpoint, 
  onConfigureTouchpoint 
}: JourneyStageCardProps) {
  return (
    <Card className="min-h-[300px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <span>{stage.name}</span>
          </CardTitle>
          <Badge variant="outline">{stage.touchpoints.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <SortableContext 
          items={stage.touchpoints.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {stage.touchpoints.map((touchpoint) => {
            const template = TOUCHPOINT_TEMPLATES.find(t => t.id === touchpoint.templateId)
            if (!template) return null

            return (
              <div key={touchpoint.id} className="relative group">
                <SortableTouchpoint id={touchpoint.id} template={template} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onConfigureTouchpoint(stage.id, touchpoint.id)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => onRemoveTouchpoint(stage.id, touchpoint.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </SortableContext>
        
        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 text-center">
          <div className="text-sm text-muted-foreground mb-2">
            Drop touchpoints here or
          </div>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            Add Touchpoint
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface JourneyBuilderProps {
  onJourneyChange?: (stages: JourneyStage[]) => void
  className?: string
}

export function JourneyBuilder({ onJourneyChange, className }: JourneyBuilderProps) {
  const [stages, setStages] = useState<JourneyStage[]>(DEFAULT_STAGES)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    // Check if dropping a template onto a stage
    const template = TOUCHPOINT_TEMPLATES.find(t => t.id === active.id)
    const targetStage = stages.find(s => over.id === s.id)

    if (template && targetStage) {
      const newTouchpoint: TouchpointInstance = {
        id: `${template.id}-${Date.now()}`,
        templateId: template.id,
        name: template.name,
        type: template.type,
        channel: template.channel,
        config: {},
        position: { x: 0, y: 0 }
      }

      setStages(prev => prev.map(stage => 
        stage.id === targetStage.id 
          ? { ...stage, touchpoints: [...stage.touchpoints, newTouchpoint] }
          : stage
      ))

      onJourneyChange?.(stages)
    }

    setActiveId(null)
  }, [stages, onJourneyChange])

  const handleAddTouchpoint = useCallback((stageId: string, templateId: string) => {
    const template = TOUCHPOINT_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    const newTouchpoint: TouchpointInstance = {
      id: `${templateId}-${Date.now()}`,
      templateId,
      name: template.name,
      type: template.type,
      channel: template.channel,
      config: {},
      position: { x: 0, y: 0 }
    }

    setStages(prev => prev.map(stage => 
      stage.id === stageId 
        ? { ...stage, touchpoints: [...stage.touchpoints, newTouchpoint] }
        : stage
    ))

    onJourneyChange?.(stages)
  }, [stages, onJourneyChange])

  const handleRemoveTouchpoint = useCallback((stageId: string, touchpointId: string) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId 
        ? { ...stage, touchpoints: stage.touchpoints.filter(t => t.id !== touchpointId) }
        : stage
    ))

    onJourneyChange?.(stages)
  }, [stages, onJourneyChange])

  const handleConfigureTouchpoint = useCallback((stageId: string, touchpointId: string) => {
    // Open configuration modal/panel
    console.log('Configure touchpoint:', stageId, touchpointId)
  }, [])

  const activeTouchpoint = activeId ? TOUCHPOINT_TEMPLATES.find(t => t.id === activeId) : null

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Touchpoint Templates Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Touchpoint Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <SortableContext 
                items={TOUCHPOINT_TEMPLATES.map(t => t.id)}
                strategy={horizontalListSortingStrategy}
              >
                {TOUCHPOINT_TEMPLATES.map((template) => (
                  <SortableTouchpoint 
                    key={template.id} 
                    id={template.id} 
                    template={template} 
                  />
                ))}
              </SortableContext>
            </div>

            <DragOverlay>
              {activeTouchpoint ? (
                <TouchpointCard template={activeTouchpoint} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      {/* Journey Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage) => (
          <JourneyStageCard
            key={stage.id}
            stage={stage}
            onAddTouchpoint={handleAddTouchpoint}
            onRemoveTouchpoint={handleRemoveTouchpoint}
            onConfigureTouchpoint={handleConfigureTouchpoint}
          />
        ))}
      </div>

      {/* Journey Actions */}
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
          <Button variant="outline">
            Import Template
          </Button>
        </div>
        <div className="space-x-2">
          <Button variant="outline">
            Save Draft
          </Button>
          <Button>
            Publish Journey
          </Button>
        </div>
      </div>
    </div>
  )
}