'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Globe, Plus } from 'lucide-react'

interface Website {
  id: string
  name: string
  domain: string
  isActive: boolean
  plan: string
}

interface WebsiteSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

const mockWebsites: Website[] = [
  {
    id: 'demo-site',
    name: 'Demo Website',
    domain: 'demo.example.com',
    isActive: true,
    plan: 'Pro'
  },
  {
    id: 'my-store',
    name: 'My Online Store',
    domain: 'mystore.com',
    isActive: true,
    plan: 'Business'
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    domain: 'landing.example.com',
    isActive: false,
    plan: 'Starter'
  }
]

export function WebsiteSelector({ value, onValueChange }: WebsiteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedWebsite = mockWebsites.find(w => w.id === value) || mockWebsites[0]

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-64 justify-between"
      >
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{selectedWebsite.name}</span>
            <span className="text-xs text-gray-500">{selectedWebsite.domain}</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Your Websites</div>
            
            {mockWebsites.map((website) => (
              <button
                key={website.id}
                onClick={() => {
                  onValueChange(website.id)
                  setIsOpen(false)
                }}
                className={`w-full text-left p-2 rounded hover:bg-gray-50 flex items-center justify-between ${
                  website.id === value ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{website.name}</span>
                    {!website.isActive && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{website.domain}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {website.plan}
                </Badge>
              </button>
            ))}

            <hr className="my-2" />
            
            <button className="w-full text-left p-2 rounded hover:bg-gray-50 flex items-center space-x-2 text-blue-600">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add New Website</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}