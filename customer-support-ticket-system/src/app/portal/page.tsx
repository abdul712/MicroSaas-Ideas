import { Metadata } from 'next'
import { CustomerPortalOverview } from '@/components/portal/overview'
import { QuickActions } from '@/components/portal/quick-actions'
import { RecentTickets } from '@/components/portal/recent-tickets'
import { KnowledgeBaseWidget } from '@/components/portal/knowledge-base-widget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  BookOpen, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Customer Portal - Dashboard',
  description: 'Your customer support dashboard - view tickets, browse knowledge base, and get help.',
}

export default function CustomerPortalPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Support Center
          </h1>
          <p className="text-muted-foreground">
            Get help, track your tickets, and find answers to common questions.
          </p>
        </div>
        <Button className="btn-gradient">
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Overview Stats */}
      <CustomerPortalOverview />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <RecentTickets />
          
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Support Status</CardTitle>
              <CardDescription>
                Current status of our support services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">All Systems Operational</p>
                      <p className="text-sm text-muted-foreground">No current issues</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Operational
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">&lt;2h</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <QuickActions />
          <KnowledgeBaseWidget />
          
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
              <CardDescription>
                Other ways to get in touch with our team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Live Chat</p>
                  <p className="text-sm text-muted-foreground">Available 24/7</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Emergency Line</p>
                  <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Documentation</p>
                  <p className="text-sm text-muted-foreground">Self-service guides</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Office Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Support Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Currently Online</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}