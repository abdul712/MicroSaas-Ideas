'use client'

import { useState } from 'react'
import { User, Organization, TeamMember, Team } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Bell, Search, Settings, Plus, Brain, User as UserIcon } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { getUserInitials, getAvatarColor } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

interface DashboardHeaderProps {
  user: User & {
    organization: Organization
    teamMemberships: (TeamMember & { team: Team })[]
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-gray-900 dark:text-white">TaskAI</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{user.organization.name}</span>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="Search tasks, projects, or team members..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <kbd className="bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Create */}
            <Button size="sm" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
              {/* Notification badge */}
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                3
              </span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.id)} flex items-center justify-center text-white text-sm font-medium`}>
                    {getUserInitials(user.name)}
                  </div>
                )}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.name || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role}
                  </span>
                </div>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <UserIcon className="w-4 h-4 inline mr-3" />
                      Your Profile
                    </Link>
                    
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="w-4 h-4 inline mr-3" />
                      Settings
                    </Link>

                    <div className="border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}