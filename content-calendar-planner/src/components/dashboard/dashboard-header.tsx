'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Plus, Settings, Bell, Search, Filter } from "lucide-react"
import { useSession } from "next-auth/react"
import { UserMenu } from "./user-menu"
import { ViewToggle } from "./view-toggle"
import { DateNavigator } from "./date-navigator"

export function DashboardHeader() {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Content Calendar</h1>
              <p className="text-sm text-muted-foreground">
                {session?.user?.organization?.name || 'Workspace'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="ml-4">
            {session?.user?.organization?.planType || 'Starter'} Plan
          </Badge>
        </div>

        {/* Center Section - Date Navigation */}
        <div className="flex items-center space-x-4">
          <DateNavigator />
          <ViewToggle />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Content
          </Button>

          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}