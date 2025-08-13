'use client'

import { Button } from "@/components/ui/button"
import { Calendar, List, Grid3X3 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export type ViewType = 'month' | 'week' | 'day' | 'list'

export function ViewToggle() {
  const [currentView, setCurrentView] = useState<ViewType>('month')

  const views = [
    { id: 'month' as ViewType, label: 'Month', icon: Calendar },
    { id: 'week' as ViewType, label: 'Week', icon: Grid3X3 },
    { id: 'day' as ViewType, label: 'Day', icon: Calendar },
    { id: 'list' as ViewType, label: 'List', icon: List },
  ]

  return (
    <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
      {views.map((view) => {
        const Icon = view.icon
        return (
          <Button
            key={view.id}
            variant={currentView === view.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentView(view.id)}
            className={cn(
              "text-xs",
              currentView === view.id 
                ? "bg-background shadow-sm" 
                : "hover:bg-background/60"
            )}
          >
            <Icon className="h-3 w-3 mr-1" />
            {view.label}
          </Button>
        )
      })}
    </div>
  )
}