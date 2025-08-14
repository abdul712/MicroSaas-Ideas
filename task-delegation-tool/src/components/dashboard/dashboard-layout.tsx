'use client'

import { ReactNode } from 'react'
import { User, Organization, TeamMember, Team } from '@prisma/client'
import { DashboardHeader } from './dashboard-header'
import { DashboardSidebar } from './dashboard-sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  user: User & {
    organization: Organization
    teamMemberships: (TeamMember & { team: Team })[]
  }
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardSidebar user={user} />
        <main className="flex-1 p-6 lg:p-8 ml-64">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}