'use client'

import { Button } from '@/components/ui/button'
import { Plus, Database, FileUpload, Settings } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm">
        <FileUpload className="h-4 w-4 mr-2" />
        Upload Data
      </Button>
      
      <Button variant="outline" size="sm">
        <Database className="h-4 w-4 mr-2" />
        Connect Source
      </Button>
      
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Analysis
      </Button>
    </div>
  )
}