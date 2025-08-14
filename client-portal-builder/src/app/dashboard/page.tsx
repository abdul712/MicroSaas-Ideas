"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Globe,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface Portal {
  id: string
  name: string
  slug: string
  status: string
  clientCount: number
  lastAccessed: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [portals, setPortals] = useState<Portal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Mock data for now - will be replaced with real API calls
    setPortals([
      {
        id: '1',
        name: 'Acme Corp Portal',
        slug: 'acme-corp',
        status: 'active',
        clientCount: 5,
        lastAccessed: '2 hours ago'
      },
      {
        id: '2',
        name: 'Design Agency Portal',
        slug: 'design-agency',
        status: 'active',
        clientCount: 12,
        lastAccessed: '1 day ago'
      }
    ])
    setIsLoading(false)
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PortalCraft</h1>
                <p className="text-sm text-gray-600">Welcome back, {session.user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Portal
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portals</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portals.length}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {portals.reduce((sum, portal) => sum + portal.clientCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +5 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Shared</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portal Views</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,429</div>
              <p className="text-xs text-muted-foreground">
                +18% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Portals Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Portals</h2>
              <p className="text-gray-600">Manage and monitor your client portals</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Portal
            </Button>
          </div>

          {portals.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No portals yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first client portal
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Portal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portals.map((portal) => (
                <Card key={portal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{portal.name}</CardTitle>
                        <CardDescription>/{portal.slug}</CardDescription>
                      </div>
                      <Badge variant={portal.status === 'active' ? 'default' : 'secondary'}>
                        {portal.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Clients:</span>
                        <span className="font-medium">{portal.clientCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last accessed:</span>
                        <span className="font-medium">{portal.lastAccessed}</span>
                      </div>
                      <div className="flex justify-between pt-4 border-t">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg w-fit">
                  <Plus className="h-6 w-6" />
                </div>
                <CardTitle>Create Portal</CardTitle>
                <CardDescription>
                  Set up a new client portal in minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-green-100 text-green-600 p-3 rounded-lg w-fit">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Invite Clients</CardTitle>
                <CardDescription>
                  Add new clients to your existing portals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-100 text-purple-600 p-3 rounded-lg w-fit">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle>View Analytics</CardTitle>
                <CardDescription>
                  Monitor portal usage and client engagement
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}