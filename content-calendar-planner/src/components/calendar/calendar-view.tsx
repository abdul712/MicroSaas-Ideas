'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  getCalendarDays, 
  isToday, 
  isSameDay,
  formatDate,
  formatTime
} from "@/lib/utils"
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from "@dnd-kit/core"
import { ContentItem } from "./content-item"
import { CalendarGrid } from "./calendar-grid"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ContentItemType = {
  id: string
  title: string
  description?: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  publishDate: Date
  platforms: string[]
  assignee?: string
  color?: string
}

export function CalendarView() {
  const [currentDate] = useState(new Date())
  const [contentItems, setContentItems] = useState<ContentItemType[]>([
    {
      id: '1',
      title: 'Summer Product Launch',
      description: 'Announcing our new summer collection',
      status: 'scheduled',
      publishDate: new Date(2024, 0, 15, 14, 0),
      platforms: ['instagram', 'facebook'],
      assignee: 'Sarah Johnson',
      color: '#3B82F6'
    },
    {
      id: '2',
      title: 'Weekly Newsletter',
      description: 'Newsletter featuring top stories',
      status: 'draft',
      publishDate: new Date(2024, 0, 18, 9, 0),
      platforms: ['email'],
      assignee: 'Mike Chen',
      color: '#10B981'
    },
    {
      id: '3',
      title: 'Behind the Scenes Video',
      description: 'Team working on new features',
      status: 'published',
      publishDate: new Date(2024, 0, 12, 16, 30),
      platforms: ['youtube', 'linkedin'],
      assignee: 'Alex Rivera',
      color: '#8B5CF6'
    },
  ])
  
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<ContentItemType | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const calendarDays = getCalendarDays(currentDate)

  const getContentForDay = (day: Date) => {
    return contentItems.filter(item => 
      isSameDay(item.publishDate, day)
    )
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    const item = contentItems.find(item => item.id === active.id)
    setDraggedItem(item || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // If dropping on a calendar day
    if (overId.startsWith('day-')) {
      const dayIndex = parseInt(overId.split('-')[1])
      const newDate = calendarDays[dayIndex]
      
      setContentItems(prev => 
        prev.map(item => 
          item.id === activeId 
            ? { ...item, publishDate: new Date(newDate.getTime() + (item.publishDate.getHours() * 60 + item.publishDate.getMinutes()) * 60000) }
            : item
        )
      )
    }

    setActiveId(null)
    setDraggedItem(null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>
          
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-px bg-border">
            {weekDays.map(day => (
              <div key={day} className="bg-background p-3 text-center font-medium text-sm">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto bg-border">
          <CalendarGrid 
            days={calendarDays}
            currentDate={currentDate}
            getContentForDay={getContentForDay}
            contentItems={contentItems}
          />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedItem ? (
          <ContentItem
            item={draggedItem}
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}