"use client"

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Save,
  Eye,
  Settings,
  Plus,
  FileText,
  MessageSquare,
  Calendar,
  Image as ImageIcon,
  Layout,
  Palette
} from 'lucide-react'

interface PortalModule {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  type: 'files' | 'messages' | 'calendar' | 'gallery' | 'custom'
  enabled: boolean
}

const availableModules: PortalModule[] = [
  {
    id: 'files',
    name: 'File Manager',
    description: 'Secure file sharing and organization',
    icon: <FileText className="h-5 w-5" />,
    type: 'files',
    enabled: false
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'Real-time communication hub',
    icon: <MessageSquare className="h-5 w-5" />,
    type: 'messages',
    enabled: false
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Meeting scheduling and events',
    icon: <Calendar className="h-5 w-5" />,
    type: 'calendar',
    enabled: false
  },
  {
    id: 'gallery',
    name: 'Gallery',
    description: 'Image and media showcase',
    icon: <ImageIcon className="h-5 w-5" />,
    type: 'gallery',
    enabled: false
  }
]

export default function PortalBuilderPage() {
  const [modules, setModules] = useState<PortalModule[]>(availableModules)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [portalName, setPortalName] = useState('New Client Portal')
  const [selectedTheme, setSelectedTheme] = useState('default')

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && over.id === 'enabled-area') {
      setModules(prev => prev.map(module => 
        module.id === active.id 
          ? { ...module, enabled: true }
          : module
      ))
    }
    
    if (over && over.id === 'available-area') {
      setModules(prev => prev.map(module => 
        module.id === active.id 
          ? { ...module, enabled: false }
          : module
      ))
    }

    setActiveId(null)
  }

  const enabledModules = modules.filter(m => m.enabled)
  const availableModulesFiltered = modules.filter(m => !m.enabled)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Layout className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Portal Builder</h1>
                <p className="text-sm text-gray-600">Design your client portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Portal
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Portal Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portal Settings</CardTitle>
                <CardDescription>Basic portal configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Portal Name</label>
                  <input
                    type="text"
                    value={portalName}
                    onChange={(e) => setPortalName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">URL Slug</label>
                  <div className="mt-1 flex">
                    <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      yoursite.com/
                    </span>
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="client-portal"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Theme
                </CardTitle>
                <CardDescription>Choose your portal's appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {['default', 'dark', 'minimal', 'corporate'].map((theme) => (
                    <div
                      key={theme}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTheme === theme
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTheme(theme)}
                    >
                      <div className="h-8 w-full bg-gradient-to-r from-blue-400 to-purple-500 rounded mb-2"></div>
                      <p className="text-xs font-medium capitalize">{theme}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Modules</CardTitle>
                <CardDescription>Drag modules to add them to your portal</CardDescription>
              </CardHeader>
              <CardContent>
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <div id="available-area" className="space-y-2">
                    <SortableContext items={availableModulesFiltered.map(m => m.id)} strategy={verticalListSortingStrategy}>
                      {availableModulesFiltered.map((module) => (
                        <div
                          key={module.id}
                          className="p-3 border border-gray-200 rounded-lg cursor-grab hover:shadow-sm transition-all bg-white"
                          draggable
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-600">{module.icon}</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{module.name}</p>
                              <p className="text-xs text-gray-500">{module.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </SortableContext>
                  </div>
                </DndContext>
              </CardContent>
            </Card>
          </div>

          {/* Portal Preview */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Portal Preview</CardTitle>
                    <CardDescription>This is how your portal will look to clients</CardDescription>
                  </div>
                  <Badge variant="secondary">{enabledModules.length} modules enabled</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[600px]">
                  {/* Portal Header Preview */}
                  <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{portalName}</h2>
                    <p className="text-gray-600">Welcome to your client portal</p>
                  </div>

                  {/* Enabled Modules Area */}
                  <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div id="enabled-area" className="space-y-4">
                      <SortableContext items={enabledModules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                        {enabledModules.length === 0 ? (
                          <div className="text-center py-12">
                            <Plus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules added yet</h3>
                            <p className="text-gray-600">
                              Drag modules from the left panel to add them to your portal
                            </p>
                          </div>
                        ) : (
                          enabledModules.map((module) => (
                            <div
                              key={module.id}
                              className="bg-white rounded-lg shadow-sm border p-6 cursor-grab hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="text-blue-600">{module.icon}</div>
                                  <div>
                                    <h3 className="text-lg font-semibold">{module.name}</h3>
                                    <p className="text-sm text-gray-600">{module.description}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Module Content Preview */}
                              <div className="bg-gray-50 rounded-md p-4">
                                <p className="text-sm text-gray-500 text-center">
                                  {module.name} content will appear here
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </SortableContext>
                    </div>
                  </DndContext>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <DragOverlay>
          {activeId ? (
            <div className="p-3 border border-blue-500 rounded-lg cursor-grabbing shadow-lg bg-white">
              {(() => {
                const module = modules.find(m => m.id === activeId)
                return module ? (
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600">{module.icon}</div>
                    <div>
                      <p className="text-sm font-medium">{module.name}</p>
                      <p className="text-xs text-gray-500">{module.description}</p>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}