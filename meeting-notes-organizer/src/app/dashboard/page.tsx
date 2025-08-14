'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Calendar, 
  Mic, 
  Users, 
  FileText, 
  Clock,
  Play,
  Pause,
  Square,
  Settings
} from 'lucide-react'
import { useMeeting } from '@/components/meeting-provider'
import { formatDateTime, formatDuration } from '@/lib/utils'

interface Meeting {
  id: string
  title: string
  startTime: string
  endTime?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  participants: number
  duration?: number
  hasRecording?: boolean
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { state, startRecording, stopRecording } = useMeeting()
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: 'Weekly Team Standup',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      status: 'scheduled',
      participants: 5,
    },
    {
      id: '2',
      title: 'Product Strategy Review',
      startTime: new Date(Date.now() - 7200000).toISOString(),
      endTime: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
      participants: 8,
      duration: 3600,
      hasRecording: true,
    },
    {
      id: '3',
      title: 'Client Presentation',
      startTime: new Date().toISOString(),
      status: 'in_progress',
      participants: 3,
    },
  ])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    window.location.href = '/auth/login'
    return null
  }

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled')
  const activeMeetings = meetings.filter(m => m.status === 'in_progress')
  const recentMeetings = meetings.filter(m => m.status === 'completed').slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome back, {session?.user?.name || 'User'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Meetings
                  </p>
                  <p className="text-3xl font-bold">24</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Hours Recorded
                  </p>
                  <p className="text-3xl font-bold">48</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Action Items
                  </p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Team Members
                  </p>
                  <p className="text-3xl font-bold">8</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Meetings */}
        {activeMeetings.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Active Meetings</h2>
            <div className="space-y-4">
              {activeMeetings.map((meeting) => (
                <Card key={meeting.id} className="border-orange-200 bg-orange-50/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        <div>
                          <h3 className="font-semibold">{meeting.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Started {formatDateTime(meeting.startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {meeting.participants}
                        </Badge>
                        <div className="flex space-x-1">
                          {state.currentMeeting?.isRecording ? (
                            <Button size="sm" variant="destructive" onClick={stopRecording}>
                              <Square className="w-4 h-4 mr-2" />
                              Stop Recording
                            </Button>
                          ) : (
                            <Button size="sm" onClick={startRecording}>
                              <Mic className="w-4 h-4 mr-2" />
                              Start Recording
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            Join
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Meetings */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
          {upcomingMeetings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No upcoming meetings</h3>
                <p className="text-muted-foreground mb-4">
                  Schedule your next meeting to get started
                </p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingMeetings.map((meeting) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <Badge variant="secondary">Scheduled</Badge>
                    </div>
                    <CardDescription>
                      {formatDateTime(meeting.startTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{meeting.participants} participants</span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recent Meetings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Meetings</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {recentMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <h3 className="font-medium">{meeting.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatDateTime(meeting.startTime)}</span>
                          {meeting.duration && (
                            <span>Duration: {formatDuration(meeting.duration)}</span>
                          )}
                          <span>{meeting.participants} participants</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {meeting.hasRecording && (
                        <Badge variant="outline">
                          <Mic className="w-3 h-3 mr-1" />
                          Recorded
                        </Badge>
                      )}
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        View Notes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}