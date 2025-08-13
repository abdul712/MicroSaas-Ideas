'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  ChevronDown,
  Hash,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)

  const navigation = [
    { name: 'Calendar', icon: Calendar, current: true, count: null },
    { name: 'Analytics', icon: BarChart3, current: false, count: null },
    { name: 'Team', icon: Users, current: false, count: 3 },
    { name: 'Settings', icon: Settings, current: false, count: null },
  ]

  const calendars = [
    { name: 'Main Calendar', color: 'bg-blue-500', active: true },
    { name: 'Campaign Q1', color: 'bg-green-500', active: true },
    { name: 'Social Media', color: 'bg-purple-500', active: false },
  ]

  const contentStatus = [
    { name: 'Draft', icon: Clock, count: 12, color: 'text-gray-600' },
    { name: 'Scheduled', icon: Calendar, count: 8, color: 'text-blue-600' },
    { name: 'Published', icon: CheckCircle, count: 24, color: 'text-green-600' },
    { name: 'Failed', icon: AlertCircle, count: 2, color: 'text-red-600' },
  ]

  return (
    <div className={cn(
      "bg-white border-r flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        {!collapsed && (
          <div>
            <h2 className="font-semibold text-lg">Workspace</h2>
            <p className="text-sm text-muted-foreground">Content Planning</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && (
                <>
                  <span>{item.name}</span>
                  {item.count && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.count}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          )
        })}
      </div>

      {!collapsed && (
        <>
          {/* Calendars Section */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">CALENDARS</h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {calendars.map((calendar) => (
                <div key={calendar.name} className="flex items-center space-x-2">
                  <div className={cn("w-3 h-3 rounded-full", calendar.color)} />
                  <span className="text-sm flex-1">{calendar.name}</span>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Content Status */}
          <div className="p-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">CONTENT STATUS</h3>
            <div className="space-y-2">
              {contentStatus.map((status) => {
                const Icon = status.icon
                return (
                  <div key={status.name} className="flex items-center space-x-2">
                    <Icon className={cn("h-4 w-4", status.color)} />
                    <span className="text-sm flex-1">{status.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {status.count}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t mt-auto">
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              New Content
            </Button>
          </div>
        </>
      )}
    </div>
  )
}