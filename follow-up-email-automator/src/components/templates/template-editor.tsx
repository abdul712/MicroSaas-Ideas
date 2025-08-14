"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  Eye, 
  Wand2, 
  Code, 
  Smartphone, 
  Monitor, 
  Settings,
  Plus,
  X,
  Copy
} from 'lucide-react'
import { aiEmailGenerator } from '@/services/ai-email-generator'
import { extractEmailVariables } from '@/lib/utils'

interface TemplateEditorProps {
  templateId?: string
  onSave?: (template: any) => void
  onPreview?: (template: any) => void
}

interface EmailTemplate {
  id?: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
  category: string
  isPublic: boolean
}

export function TemplateEditor({ templateId, onSave, onPreview }: TemplateEditorProps) {
  const [template, setTemplate] = useState<EmailTemplate>({
    name: 'Untitled Template',
    subject: '',
    htmlContent: '',
    textContent: '',
    variables: [],
    category: 'general',
    isPublic: false,
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState('content')
  const [customVariables, setCustomVariables] = useState<string[]>([])
  const [newVariable, setNewVariable] = useState('')

  useEffect(() => {
    // Extract variables from content
    const subjectVars = extractEmailVariables(template.subject)
    const htmlVars = extractEmailVariables(template.htmlContent)
    const textVars = extractEmailVariables(template.textContent)
    
    const allVars = [...new Set([...subjectVars, ...htmlVars, ...textVars, ...customVariables])]
    setTemplate(prev => ({ ...prev, variables: allVars }))
  }, [template.subject, template.htmlContent, template.textContent, customVariables])

  const handleGenerateContent = async () => {
    if (!template.subject && !template.htmlContent) return

    setIsGenerating(true)
    try {
      const generated = await aiEmailGenerator.generateEmailContent({
        type: 'follow_up',
        recipientName: 'John',
        company: 'Example Company',
        tone: 'professional',
        context: 'Follow up after initial meeting'
      })

      setTemplate(prev => ({
        ...prev,
        subject: generated.subject,
        htmlContent: generated.htmlContent,
        textContent: generated.textContent,
      }))
    } catch (error) {
      console.error('Content generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(template)
    }
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(template)
    }
  }

  const addVariable = () => {
    if (newVariable && !customVariables.includes(newVariable)) {
      setCustomVariables(prev => [...prev, newVariable])
      setNewVariable('')
    }
  }

  const removeVariable = (variable: string) => {
    setCustomVariables(prev => prev.filter(v => v !== variable))
  }

  const insertVariable = (variable: string) => {
    const variableTag = `{{${variable}}}`
    
    if (activeTab === 'content') {
      // Insert into HTML content
      setTemplate(prev => ({
        ...prev,
        htmlContent: prev.htmlContent + variableTag
      }))
    } else if (activeTab === 'subject') {
      // Insert into subject
      setTemplate(prev => ({
        ...prev,
        subject: prev.subject + variableTag
      }))
    }
  }

  const predefinedVariables = [
    'firstName', 'lastName', 'fullName', 'email', 'company', 
    'jobTitle', 'phone', 'city', 'country', 'website'
  ]

  return (
    <div className="h-screen flex">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Input
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg font-semibold border-none p-0 h-auto"
                placeholder="Template Name"
              />
              <Badge variant="outline">
                {template.category}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleGenerateContent} disabled={isGenerating}>
                <Wand2 className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="flex-1 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="subject">Subject</TabsTrigger>
              <TabsTrigger value="text">Plain Text</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* HTML Editor */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">HTML Content</CardTitle>
                      <Button variant="ghost" size="sm">
                        <Code className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={template.htmlContent}
                      onChange={(e) => setTemplate(prev => ({ ...prev, htmlContent: e.target.value }))}
                      placeholder="Enter HTML content..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Preview</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setPreviewMode('desktop')}
                        >
                          <Monitor className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setPreviewMode('mobile')}
                        >
                          <Smartphone className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className={`
                        border rounded p-4 bg-white min-h-[400px] overflow-auto
                        ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}
                      `}
                      dangerouslySetInnerHTML={{ __html: template.htmlContent }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="subject" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Line</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      value={template.subject}
                      onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter subject line..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Character Count</Label>
                    <div className="text-sm text-gray-600">
                      {template.subject.length} characters
                      {template.subject.length > 50 && (
                        <span className="text-red-600 ml-2">
                          (Consider shortening for better open rates)
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plain Text Version</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={template.textContent}
                    onChange={(e) => setTemplate(prev => ({ ...prev, textContent: e.target.value }))}
                    placeholder="Enter plain text version..."
                    className="min-h-[300px]"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={template.category}
                        onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., welcome, follow-up, promotion"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={template.isPublic}
                        onChange={(e) => setTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                      />
                      <Label htmlFor="isPublic">Make template public</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="font-bold text-green-700">24.5%</div>
                        <div className="text-green-600">Open Rate</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="font-bold text-blue-700">3.2%</div>
                        <div className="text-blue-600">Click Rate</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="font-bold text-purple-700">1,247</div>
                        <div className="text-purple-600">Times Used</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="font-bold text-orange-700">4.8</div>
                        <div className="text-orange-600">Avg Rating</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Variables Sidebar */}
      <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Variables Section */}
          <div>
            <h3 className="font-semibold mb-3">Variables</h3>
            
            {/* Current Variables */}
            <div className="mb-4">
              <Label className="text-sm text-gray-600">Used in template:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {template.variables.map(variable => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
                {template.variables.length === 0 && (
                  <div className="text-sm text-gray-500">No variables used</div>
                )}
              </div>
            </div>

            {/* Add Custom Variable */}
            <div className="mb-4">
              <Label className="text-sm">Add custom variable:</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  placeholder="variableName"
                  size="sm"
                />
                <Button size="sm" onClick={addVariable}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Custom Variables */}
            {customVariables.length > 0 && (
              <div className="mb-4">
                <Label className="text-sm text-gray-600">Custom variables:</Label>
                <div className="space-y-1 mt-2">
                  {customVariables.map(variable => (
                    <div key={variable} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span 
                        className="text-sm cursor-pointer hover:text-blue-600"
                        onClick={() => insertVariable(variable)}
                      >
                        {`{{${variable}}}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariable(variable)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predefined Variables */}
            <div>
              <Label className="text-sm text-gray-600">Common variables:</Label>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {predefinedVariables.map(variable => (
                  <Button
                    key={variable}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs h-8"
                    onClick={() => insertVariable(variable)}
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Template
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Template Settings
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use personalization variables for better engagement</li>
              <li>• Keep subject lines under 50 characters</li>
              <li>• Include a clear call-to-action</li>
              <li>• Test on both desktop and mobile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}