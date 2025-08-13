'use client'

import { useDraggable } from "@dnd-kit/core"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ContentItemType } from "./calendar-view"
import { formatTime, getPlatformColor, getStatusColor, truncateText } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Clock, User, Globe } from "lucide-react"

interface ContentItemProps {
  item: ContentItemType
  compact?: boolean
  isDragging?: boolean
}

export function ContentItem({ item, compact = false, isDragging = false }: ContentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingFromHook,
  } = useDraggable({
    id: item.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const platformIcons = {
    instagram: '📷',
    facebook: '📘', 
    twitter: '🐦',
    linkedin: '💼',
    youtube: '📺',
    tiktok: '🎵',
    email: '📧',
    pinterest: '📌'
  }

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "content-item cursor-grab text-xs p-2 mb-1",
          isDragging || isDraggingFromHook ? "opacity-50 scale-95" : "",
          "hover:shadow-md hover:scale-[1.02] transition-all duration-200"
        )}
        style={{
          ...style,
          borderLeft: `3px solid ${item.color || '#3B82F6'}`
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-medium text-xs leading-tight">
            {truncateText(item.title, 25)}
          </h4>
          <Badge 
            variant="outline" 
            className={cn("text-[10px] px-1 py-0", `status-badge ${item.status}`)}
          >
            {item.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-2.5 w-2.5" />
            <span>{formatTime(item.publishDate)}</span>
          </div>
          <div className="flex space-x-0.5">
            {item.platforms.slice(0, 2).map((platform) => (
              <span key={platform} title={platform}>
                {platformIcons[platform as keyof typeof platformIcons] || '🌐'}
              </span>
            ))}
            {item.platforms.length > 2 && (
              <span className="text-muted-foreground">+{item.platforms.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "content-item cursor-grab",
        isDragging || isDraggingFromHook ? "opacity-50 scale-95" : "",
        "hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            {item.description && (
              <p className="text-xs text-muted-foreground">
                {truncateText(item.description, 50)}
              </p>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={cn("ml-2", `status-badge ${item.status}`)}
          >
            {item.status}
          </Badge>
        </div>

        {/* Platforms */}
        <div className="flex items-center space-x-2 mb-3">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <div className="flex space-x-1">
            {item.platforms.map((platform) => (
              <Badge 
                key={platform} 
                variant="outline" 
                className={cn("text-xs", `platform-badge ${platform}`)}
              >
                {platformIcons[platform as keyof typeof platformIcons]} {platform}
              </Badge>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatTime(item.publishDate)}</span>
          </div>
          {item.assignee && (
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{item.assignee.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}