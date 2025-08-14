'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Search, 
  TrendingUp,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react'
import { useState } from 'react'

// Mock data for popular articles
const popularArticles = [
  {
    id: '1',
    title: 'How to reset your password',
    category: 'Account',
    views: 1234,
    helpful: 89,
    lastUpdated: '2 days ago',
  },
  {
    id: '2',
    title: 'Troubleshooting login issues',
    category: 'Account',
    views: 987,
    helpful: 76,
    lastUpdated: '1 week ago',
  },
  {
    id: '3',
    title: 'Understanding your billing cycle',
    category: 'Billing',
    views: 756,
    helpful: 92,
    lastUpdated: '3 days ago',
  },
  {
    id: '4',
    title: 'Mobile app getting started guide',
    category: 'Mobile',
    views: 654,
    helpful: 84,
    lastUpdated: '5 days ago',
  },
]

const quickCategories = [
  { name: 'Account', count: 12, color: 'bg-blue-100 text-blue-800' },
  { name: 'Billing', count: 8, color: 'bg-green-100 text-green-800' },
  { name: 'Technical', count: 15, color: 'bg-purple-100 text-purple-800' },
  { name: 'Mobile', count: 6, color: 'bg-orange-100 text-orange-800' },
]

export function KnowledgeBaseWidget() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log('Searching knowledge base for:', searchQuery)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>Knowledge Base</span>
        </CardTitle>
        <CardDescription>
          Find answers to common questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Search */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Quick Categories */}
        <div>
          <h4 className="text-sm font-medium mb-2">Browse by Category</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickCategories.map((category) => (
              <Link key={category.name} href={`/portal/knowledge?category=${category.name.toLowerCase()}`}>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto p-3"
                >
                  <span className="text-sm font-medium">{category.name}</span>
                  <Badge variant="secondary" className={category.color}>
                    {category.count}
                  </Badge>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Popular Articles</h4>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            {popularArticles.slice(0, 3).map((article) => (
              <Link key={article.id} href={`/portal/knowledge/${article.id}`}>
                <div className="p-2 border rounded hover:bg-accent transition-colors cursor-pointer">
                  <h5 className="text-sm font-medium line-clamp-1 mb-1">
                    {article.title}
                  </h5>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        <span>{article.helpful}%</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{article.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Browse All Link */}
        <Link href="/portal/knowledge">
          <Button variant="ghost" className="w-full">
            Browse All Articles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}