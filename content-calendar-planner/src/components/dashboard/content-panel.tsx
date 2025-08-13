'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  X, 
  Edit, 
  Calendar, 
  Clock, 
  Users, 
  Share,
  MoreHorizontal,
  Image,
  Video,
  FileText
} from "lucide-react"
import { useState } from "react"

export function ContentPanel() {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedContent, setSelectedContent] = useState(null)

  // Mock selected content data
  const mockContent = {
    id: '1',
    title: 'Summer Product Launch Campaign',
    description: 'Announcing our new summer collection with vibrant visuals and engaging copy.',
    status: 'scheduled',
    publishDate: '2024-01-20T14:00:00Z',
    platforms: ['instagram', 'facebook', 'twitter'],
    assignee: 'Sarah Johnson',
    tags: ['summer', 'product-launch', 'campaign'],
    media: [
      { type: 'image', url: '/placeholder-1.jpg', name: 'summer-hero.jpg' },
      { type: 'video', url: '/placeholder-video.mp4', name: 'product-demo.mp4' }
    ],
    content: {
      text: 'Get ready for summer! ☀️ Our new collection is here with fresh styles and vibrant colors. Shop now and save 20% with code SUMMER20! #SummerVibes #NewCollection',
      hashtags: ['#SummerVibes', '#NewCollection', '#Sale', '#Fashion']
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="w-96 border-l bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Content Details</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {selectedContent || mockContent ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Content Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg">{mockContent.title}</h3>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {mockContent.description}
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="capitalize">
                {mockContent.status}
              </Badge>
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" />
                Jan 20, 2:00 PM
              </Badge>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <h4 className="font-medium mb-2">Publishing Platforms</h4>
            <div className="flex flex-wrap gap-2">
              {mockContent.platforms.map((platform) => (
                <Badge key={platform} variant="outline" className="capitalize">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          {/* Content Preview */}
          <div>
            <h4 className="font-medium mb-2">Content Preview</h4>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm mb-3">{mockContent.content.text}</p>
                <div className="flex flex-wrap gap-1">
                  {mockContent.content.hashtags.map((hashtag) => (
                    <span key={hashtag} className="text-xs text-blue-600">
                      {hashtag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Media Assets */}
          <div>
            <h4 className="font-medium mb-2">Media Assets</h4>
            <div className="space-y-2">
              {mockContent.media.map((media, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 border rounded-lg">
                  {media.type === 'image' ? (
                    <Image className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Video className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm flex-1">{media.name}</span>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment & Collaboration */}
          <div>
            <h4 className="font-medium mb-2">Assignment</h4>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium">SJ</span>
              </div>
              <div>
                <p className="text-sm font-medium">{mockContent.assignee}</p>
                <p className="text-xs text-muted-foreground">Content Creator</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Add Collaborators
            </Button>
          </div>

          {/* Tags */}
          <div>
            <h4 className="font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {mockContent.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t">
            <Button className="w-full">
              <Edit className="h-4 w-4 mr-2" />
              Edit Content
            </Button>
            <Button variant="outline" className="w-full">
              <Share className="h-4 w-4 mr-2" />
              Share Preview
            </Button>
            <Button variant="outline" className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No content selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a content item from the calendar to view details
            </p>
          </div>
        </div>
      )}
    </div>
  )
}