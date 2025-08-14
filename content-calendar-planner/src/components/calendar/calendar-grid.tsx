'use client'

import { useDroppable } from "@dnd-kit/core"
import { Card } from "@/components/ui/card"
import { ContentItem } from "./content-item"
import { ContentItemType } from "./calendar-view"
import { isToday, isSameDay } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface CalendarGridProps {
  days: Date[]
  currentDate: Date
  getContentForDay: (day: Date) => ContentItemType[]
  contentItems: ContentItemType[]
}

function CalendarDay({ 
  day, 
  dayIndex, 
  isCurrentMonth, 
  contentItems 
}: { 
  day: Date
  dayIndex: number
  isCurrentMonth: boolean
  contentItems: ContentItemType[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayIndex}`,
  })

  const isTodays = isToday(day)
  const dayNumber = day.getDate()

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "calendar-day bg-background min-h-[120px] p-2 border-0 flex flex-col",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
        isTodays && "bg-primary/5 border-primary border-2",
        isOver && "bg-blue-50 border-blue-200 border-2 border-dashed"
      )}
    >
      {/* Day Number */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-sm font-medium",
          isTodays && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
        )}>
          {dayNumber}
        </span>
        {contentItems.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{contentItems.length - 3}
          </span>
        )}
      </div>

      {/* Content Items */}
      <div className="flex-1 space-y-1 overflow-hidden">
        {contentItems.slice(0, 3).map((item) => (
          <ContentItem
            key={item.id}
            item={item}
            compact={true}
          />
        ))}
      </div>
    </div>
  )
}

export function CalendarGrid({ 
  days, 
  currentDate, 
  getContentForDay 
}: CalendarGridProps) {
  const currentMonth = currentDate.getMonth()

  return (
    <div className="calendar-grid">
      {days.map((day, index) => {
        const isCurrentMonth = day.getMonth() === currentMonth
        const contentItems = getContentForDay(day)
        
        return (
          <CalendarDay
            key={day.toISOString()}
            day={day}
            dayIndex={index}
            isCurrentMonth={isCurrentMonth}
            contentItems={contentItems}
          />
        )
      })}
    </div>
  )
}