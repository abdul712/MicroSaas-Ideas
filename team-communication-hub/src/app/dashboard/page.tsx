'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare, 
  Users, 
  Plus, 
  Settings, 
  Hash, 
  Lock, 
  Globe,
  Clock,
  Activity
} from 'lucide-react'

interface Team {
  id: string
  name: string
  slug: string
  description?: string
  avatarUrl?: string
  owner: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }
  members: Array<{
    user: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatarUrl?: string
      status: string
      lastSeenAt?: string
    }
    role: string
  }>
  channels: Array<{
    id: string
    name: string
    slug: string
    type: string
  }>
  _count: {
    members: number
    channels: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchTeams()
    }
  }, [status, router])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const data = await response.json()
      setTeams(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500'
      case 'AWAY':
        return 'bg-yellow-500'
      case 'BUSY':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const formatLastSeen = (lastSeenAt: string | undefined) => {
    if (!lastSeenAt) return 'Never'
    const date = new Date(lastSeenAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchTeams} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">TeamHub</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.avatarUrl} />
                <AvatarFallback>
                  {session?.user?.firstName?.[0]}{session?.user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.firstName}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here are your teams and recent activity
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="flex space-x-4">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Join Team
            </Button>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Your Teams</h3>
            <Badge variant="secondary">{teams.length} teams</Badge>
          </div>

          {teams.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first team to start collaborating with your colleagues
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/teams/${team.slug}`)}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={team.avatarUrl} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {team.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        <CardDescription className="text-sm">
                          @{team.slug}
                        </CardDescription>
                      </div>
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-600 mt-2">{team.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {team._count.members} members
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Hash className="h-4 w-4 mr-1" />
                          {team._count.channels} channels
                        </div>
                      </div>

                      {/* Channels Preview */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Channels</h4>
                        <div className="space-y-1">
                          {team.channels.slice(0, 3).map((channel) => (
                            <div key={channel.id} className="flex items-center text-sm text-gray-600">
                              {channel.type === 'PRIVATE' ? (
                                <Lock className="h-3 w-3 mr-2" />
                              ) : (
                                <Hash className="h-3 w-3 mr-2" />
                              )}
                              {channel.name}
                            </div>
                          ))}
                          {team.channels.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{team.channels.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Online Members */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Active Members</h4>
                        <div className="flex -space-x-2">
                          {team.members
                            .filter(member => member.user.status === 'ONLINE')
                            .slice(0, 5)
                            .map((member) => (
                              <div key={member.user.id} className="relative">
                                <Avatar className="h-6 w-6 border-2 border-white">
                                  <AvatarImage src={member.user.avatarUrl} />
                                  <AvatarFallback className="text-xs">
                                    {member.user.firstName[0]}{member.user.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${getStatusColor(member.user.status)}`} />
                              </div>
                            ))}
                          {team.members.filter(member => member.user.status === 'ONLINE').length > 5 && (
                            <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                +{team.members.filter(member => member.user.status === 'ONLINE').length - 5}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>No recent activity</p>
                <p className="text-sm">Start a conversation to see activity here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}