'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Mail, 
  TrendingUp, 
  Users,
  Plus,
  ArrowRight,
  Download
} from 'lucide-react'

export function DashboardOverview() {
  // Mock data - replace with real data from API
  const stats = {
    leadMagnets: 5,
    totalLeads: 1247,
    conversionRate: 12.3,
    downloads: 324
  }

  const recentLeadMagnets = [
    {
      id: '1',
      title: 'Ultimate Marketing Checklist',
      type: 'Checklist',
      downloads: 45,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Social Media Strategy Guide',
      type: 'eBook',
      downloads: 32,
      createdAt: '2024-01-12'
    },
    {
      id: '3',
      title: 'Content Calendar Template',
      type: 'Template',
      downloads: 28,
      createdAt: '2024-01-10'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-primary-foreground/90 mb-4">
          Ready to create your next lead magnet? Let's capture some leads!
        </p>
        <Button variant="secondary">
          <Plus className="mr-2 h-4 w-4" />
          Create New Lead Magnet
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Magnets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadMagnets}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +180 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.downloads}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lead Magnets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Lead Magnets</CardTitle>
            <CardDescription>
              Your recently created lead magnets and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLeadMagnets.map((leadMagnet) => (
                <div key={leadMagnet.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{leadMagnet.title}</h4>
                    <p className="text-sm text-muted-foreground">{leadMagnet.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{leadMagnet.downloads} downloads</p>
                    <p className="text-sm text-muted-foreground">{leadMagnet.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Lead Magnets
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to help you get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Lead Magnet
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Browse Templates
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Set Up Email Integration
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Pro Tips</CardTitle>
          <CardDescription>
            Best practices to maximize your lead generation success
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">High-Converting Headlines</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                Use numbers, urgency, and clear value propositions in your lead magnet titles.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100">Mobile Optimization</h4>
              <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                Ensure your forms and landing pages work perfectly on mobile devices.
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">A/B Testing</h4>
              <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                Test different headlines, designs, and form positions to optimize conversions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}