'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CallInterface } from '@/components/call/CallInterface'
import { 
  Phone, 
  Users, 
  MessageSquare, 
  BarChart3,
  Settings,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  Clock
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    incomingCalls: 0,
    outgoingCalls: 0,
    missedCalls: 0,
    averageCallDuration: '0:00',
    activeUsers: 0
  })

  const [recentCalls, setRecentCalls] = useState([
    {
      id: '1',
      type: 'outgoing',
      number: '+1 (555) 123-4567',
      name: 'John Doe',
      time: '10:30 AM',
      duration: '5:32',
      status: 'completed'
    },
    {
      id: '2',
      type: 'incoming',
      number: '+1 (555) 987-6543',
      name: 'Sarah Johnson',
      time: '9:45 AM',
      duration: '12:15',
      status: 'completed'
    },
    {
      id: '3',
      type: 'missed',
      number: '+1 (555) 456-7890',
      name: 'Unknown',
      time: '8:20 AM',
      duration: '0:00',
      status: 'missed'
    }
  ])

  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setStats({
        totalCalls: 45,
        incomingCalls: 28,
        outgoingCalls: 17,
        missedCalls: 3,
        averageCallDuration: '8:45',
        activeUsers: 12
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getCallIcon = (type: string, status: string) => {
    if (status === 'missed') return <PhoneMissed className="h-4 w-4 text-red-500" />
    if (type === 'incoming') return <PhoneIncoming className="h-4 w-4 text-green-500" />
    return <PhoneCall className="h-4 w-4 text-blue-500" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Phone className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CloudPhone Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Team
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats and Recent Calls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Calls</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalCalls}</p>
                    </div>
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Incoming</p>
                      <p className="text-2xl font-bold text-green-600">{stats.incomingCalls}</p>
                    </div>
                    <PhoneIncoming className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Outgoing</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.outgoingCalls}</p>
                    </div>
                    <PhoneCall className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Missed</p>
                      <p className="text-2xl font-bold text-red-600">{stats.missedCalls}</p>
                    </div>
                    <PhoneMissed className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-16 flex-col">
                    <Phone className="h-6 w-6 mb-2" />
                    Make Call
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <Users className="h-6 w-6 mb-2" />
                    Contacts
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Messages
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Calls */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCalls.map((call) => (
                    <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getCallIcon(call.type, call.status)}
                        <div>
                          <p className="font-medium text-gray-900">{call.name}</p>
                          <p className="text-sm text-gray-600">{call.number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">{call.time}</p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {call.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Call Interface */}
          <div className="space-y-6">
            <CallInterface />
            
            {/* Team Status */}
            <Card>
              <CardHeader>
                <CardTitle>Team Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">John Smith</span>
                    </div>
                    <span className="text-xs text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Sarah Davis</span>
                    </div>
                    <span className="text-xs text-gray-600">On Call</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Mike Johnson</span>
                    </div>
                    <span className="text-xs text-gray-600">Away</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">Lisa Wilson</span>
                    </div>
                    <span className="text-xs text-gray-600">Offline</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}