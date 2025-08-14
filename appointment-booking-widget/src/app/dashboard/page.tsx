import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings,
  Plus,
  Eye,
  Bell
} from 'lucide-react'
import Link from 'next/link'

// Dashboard stats component
function DashboardStats() {
  const stats = [
    {
      title: "Total Bookings",
      value: "1,234",
      change: "+12%",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "This Month",
      value: "89",
      change: "+5%",
      icon: Clock,
      color: "text-green-600"
    },
    {
      title: "Revenue",
      value: "$12,450",
      change: "+18%",
      icon: DollarSign,
      color: "text-yellow-600"
    },
    {
      title: "Conversion Rate",
      value: "68%",
      change: "+3%",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Recent bookings component
function RecentBookings() {
  const bookings = [
    {
      id: "1",
      customerName: "Sarah Johnson",
      service: "Hair Cut & Style",
      time: "2:00 PM",
      date: "Today",
      status: "confirmed"
    },
    {
      id: "2",
      customerName: "Mike Chen",
      service: "Consultation",
      time: "3:30 PM",
      date: "Today",
      status: "pending"
    },
    {
      id: "3",
      customerName: "Emma Wilson",
      service: "Massage Therapy",
      time: "10:00 AM",
      date: "Tomorrow",
      status: "confirmed"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>Your latest appointment bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm font-medium">{booking.customerName}</p>
                  <p className="text-xs text-muted-foreground">{booking.service}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{booking.time}</p>
                <p className="text-xs text-muted-foreground">{booking.date}</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/dashboard/bookings">View All Bookings</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

// Quick actions component
function QuickActions() {
  const actions = [
    {
      title: "Add Service",
      description: "Create a new bookable service",
      icon: Plus,
      href: "/dashboard/services/new",
      color: "bg-blue-500"
    },
    {
      title: "View Calendar",
      description: "Check your schedule",
      icon: Calendar,
      href: "/dashboard/calendar",
      color: "bg-green-500"
    },
    {
      title: "Widget Settings",
      description: "Customize your booking widget",
      icon: Settings,
      href: "/dashboard/widget",
      color: "bg-purple-500"
    },
    {
      title: "Preview Widget",
      description: "See how customers view your widget",
      icon: Eye,
      href: "/dashboard/preview",
      color: "bg-orange-500"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-md ${action.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Main dashboard page
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back! Here's what's happening with your bookings.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button size="sm" asChild>
                <Link href="/dashboard/bookings/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats */}
          <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
            <DashboardStats />
          </Suspense>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left column - Recent bookings */}
            <div className="lg:col-span-2">
              <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
                <RecentBookings />
              </Suspense>
            </div>

            {/* Right column - Quick actions */}
            <div className="lg:col-span-1">
              <QuickActions />
            </div>
          </div>

          {/* Widget status card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Booking Widget Status</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </CardTitle>
              <CardDescription>Your booking widget is live and accepting appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Widget URL:</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    https://widget.bookingapp.com/your-business
                  </code>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/widget">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/preview">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}