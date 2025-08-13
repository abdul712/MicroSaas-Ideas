import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { CalendarView } from "@/components/calendar/calendar-view"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { ContentPanel } from "@/components/dashboard/content-panel"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader />
        
        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Calendar */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <CalendarView />
          </div>
          
          {/* Content Panel */}
          <ContentPanel />
        </div>
      </div>
    </div>
  )
}