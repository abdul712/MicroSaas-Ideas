import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserPlus, FileText, CreditCard, MessageCircle } from 'lucide-react'

export function RecentActivity() {
  // Mock data - in real app, this would come from the database
  const activities = [
    {
      id: 1,
      type: 'member_joined',
      user: { name: 'Sarah Johnson', image: null },
      description: 'joined Premium tier',
      time: '2 hours ago',
      icon: UserPlus,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'content_published',
      user: { name: 'You', image: null },
      description: 'published "Advanced Marketing"',
      time: '4 hours ago',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'payment_received',
      user: { name: 'Mike Chen', image: null },
      description: 'paid $29 for Basic tier',
      time: '6 hours ago',
      icon: CreditCard,
      color: 'text-green-600'
    },
    {
      id: 4,
      type: 'comment_posted',
      user: { name: 'Emma Davis', image: null },
      description: 'commented on "Getting Started"',
      time: '1 day ago',
      icon: MessageCircle,
      color: 'text-purple-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={activity.user.image || ''} />
                      <AvatarFallback className="text-xs">
                        {activity.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{activity.user.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}