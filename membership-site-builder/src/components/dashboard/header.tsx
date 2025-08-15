'use client'

import { Button } from '@/components/ui/button'
import { Building2, Plus } from 'lucide-react'
import { UserNav } from './user-nav'
import Link from 'next/link'

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">MembershipBuilder</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Button asChild>
            <Link href="/dashboard/sites/new">
              <Plus className="mr-2 h-4 w-4" />
              New Site
            </Link>
          </Button>
          <UserNav user={user} />
        </div>
      </div>
    </header>
  )
}