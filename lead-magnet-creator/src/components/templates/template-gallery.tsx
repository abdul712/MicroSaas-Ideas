'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter,
  FileText,
  CheckSquare,
  BookOpen,
  Layout,
  Star,
  Download,
  Eye
} from 'lucide-react'

// Mock template data - replace with real data from API
const templates = [
  {
    id: '1',
    title: 'Ultimate Marketing Checklist',
    description: 'A comprehensive checklist for marketing campaigns',
    category: 'checklist',
    industry: 'marketing',
    isPremium: false,
    rating: 4.8,
    downloads: 1247,
    thumbnailUrl: '/templates/marketing-checklist.jpg',
    tags: ['marketing', 'checklist', 'campaigns']
  },
  {
    id: '2',
    title: 'Social Media Strategy Guide',
    description: 'Complete guide to building a social media strategy',
    category: 'ebook',
    industry: 'marketing',
    isPremium: true,
    rating: 4.9,
    downloads: 892,
    thumbnailUrl: '/templates/social-media-guide.jpg',
    tags: ['social media', 'strategy', 'guide']
  },
  {
    id: '3',
    title: 'Content Calendar Template',
    description: 'Plan your content with this beautiful calendar template',
    category: 'template',
    industry: 'content',
    isPremium: false,
    rating: 4.7,
    downloads: 2156,
    thumbnailUrl: '/templates/content-calendar.jpg',
    tags: ['content', 'planning', 'calendar']
  },
  {
    id: '4',
    title: 'Email Marketing Worksheet',
    description: 'Step-by-step worksheet for email marketing success',
    category: 'worksheet',
    industry: 'marketing',
    isPremium: false,
    rating: 4.6,
    downloads: 743,
    thumbnailUrl: '/templates/email-worksheet.jpg',
    tags: ['email', 'marketing', 'worksheet']
  },
  {
    id: '5',
    title: 'Business Plan Template',
    description: 'Professional business plan template for startups',
    category: 'template',
    industry: 'business',
    isPremium: true,
    rating: 4.9,
    downloads: 567,
    thumbnailUrl: '/templates/business-plan.jpg',
    tags: ['business', 'planning', 'startup']
  },
  {
    id: '6',
    title: 'SEO Optimization Guide',
    description: 'Complete guide to search engine optimization',
    category: 'guide',
    industry: 'seo',
    isPremium: false,
    rating: 4.8,
    downloads: 1089,
    thumbnailUrl: '/templates/seo-guide.jpg',
    tags: ['seo', 'optimization', 'guide']
  }
]

const categories = [
  { id: 'all', name: 'All Templates', icon: Layout },
  { id: 'ebook', name: 'eBooks', icon: BookOpen },
  { id: 'checklist', name: 'Checklists', icon: CheckSquare },
  { id: 'template', name: 'Templates', icon: FileText },
  { id: 'worksheet', name: 'Worksheets', icon: FileText },
  { id: 'guide', name: 'Guides', icon: BookOpen }
]

export function TemplateGallery() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesPremium = !showPremiumOnly || template.isPremium
    
    return matchesSearch && matchesCategory && matchesPremium
  })

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'ebook':
        return <BookOpen className="h-4 w-4" />
      case 'checklist':
        return <CheckSquare className="h-4 w-4" />
      case 'guide':
        return <BookOpen className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showPremiumOnly ? 'default' : 'outline'}
            onClick={() => setShowPremiumOnly(!showPremiumOnly)}
          >
            <Star className="mr-2 h-4 w-4" />
            Premium Only
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </Button>
          )
        })}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredTemplates.length} templates
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="p-4">
              {/* Template Preview */}
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  {getTemplateIcon(template.category)}
                  <span className="ml-2 text-sm font-medium">Preview</span>
                </div>
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm">
                    Use Template
                  </Button>
                </div>
                
                {/* Premium Badge */}
                {template.isPremium && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-lg">{template.title}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {template.description}
              </p>
            </CardHeader>
            
            <CardContent className="p-4 pt-0">
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{template.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  <span>{template.downloads.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Action Button */}
              <Button className="w-full">
                Use This Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}