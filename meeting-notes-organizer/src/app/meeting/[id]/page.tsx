'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NoteEditor } from '@/components/notes/note-editor'
import { NotesSidebar } from '@/components/notes/notes-sidebar'
import { 
  Play,
  Pause,
  Square,
  Mic,
  MicOff,
  Users,
  Calendar,
  Clock,
  FileText,
  CheckSquare,
  MessageSquare,
  Share2,
  Settings,
  Download
} from 'lucide-react'
import { formatDateTime, formatDuration } from '@/lib/utils'

interface Meeting {
  id: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  organizer: { name: string; email: string }
  attendees: Array<{ name?: string; email: string; status: string }>
  summary?: string
  keyTopics?: string[]
  decisions?: string[]
  nextSteps?: string[]
}

interface Note {
  id: string
  title: string
  content: string
  type: 'general' | 'agenda' | 'minutes' | 'follow_up'
  createdAt: string
  updatedAt: string
  authorName?: string
  isShared: boolean
}

interface ActionItem {
  id: string
  title: string
  description?: string
  assignee: { name: string; email: string }
  dueDate?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export default function MeetingPage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string>()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('notes')

  // Mock data - in production, fetch from API
  useEffect(() => {
    if (id) {
      setMeeting({
        id: id as string,
        title: 'Product Strategy Review',
        description: 'Quarterly review of our product roadmap and strategic initiatives.',
        startTime: new Date().toISOString(),
        status: 'in_progress',
        organizer: { name: 'John Doe', email: 'john@company.com' },
        attendees: [
          { name: 'Jane Smith', email: 'jane@company.com', status: 'accepted' },
          { name: 'Bob Wilson', email: 'bob@company.com', status: 'accepted' },
          { name: 'Alice Brown', email: 'alice@company.com', status: 'tentative' },
        ],
        keyTopics: ['Product Roadmap', 'Q4 Priorities', 'Resource Allocation'],
        decisions: ['Prioritize mobile app development', 'Increase engineering headcount'],
        nextSteps: ['Create detailed project timeline', 'Schedule follow-up meetings'],
      })

      setNotes([
        {
          id: '1',
          title: 'Meeting Agenda',
          content: '<h2>Product Strategy Review</h2><ul><li>Review Q3 performance</li><li>Discuss Q4 roadmap</li><li>Resource planning</li></ul>',
          type: 'agenda',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          authorName: 'John Doe',
          isShared: true,
        },
        {
          id: '2',
          title: 'Discussion Points',
          content: '<p>Key discussion points from today\'s meeting...</p>',
          type: 'minutes',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date().toISOString(),
          authorName: 'Jane Smith',
          isShared: true,
        },
      ])

      setActionItems([
        {
          id: '1',
          title: 'Create project timeline for mobile app',
          description: 'Detailed timeline with milestones and dependencies',
          assignee: { name: 'Jane Smith', email: 'jane@company.com' },
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          status: 'pending',
        },
        {
          id: '2',
          title: 'Schedule engineering team interviews',
          assignee: { name: 'Bob Wilson', email: 'bob@company.com' },
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          status: 'pending',
        },
      ])

      setSelectedNoteId('1')
    }
  }, [id])

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const handleStartRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    // Handle recording upload and transcription
  }

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId)
  }

  const handleCreateNote = (type: Note['type']) => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Note`,
      content: '',
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorName: session?.user?.name || 'You',
      isShared: false,
    }
    setNotes(prev => [newNote, ...prev])
    setSelectedNoteId(newNote.id)
    setActiveTab('notes')
  }

  const handleNoteChange = (content: string) => {
    if (!selectedNoteId) return
    setNotes(prev => prev.map(note => 
      note.id === selectedNoteId 
        ? { ...note, content, updatedAt: new Date().toISOString() }
        : note
    ))
  }

  const selectedNote = notes.find(note => note.id === selectedNoteId)

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  }

  if (status === 'loading' || !meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Notes Sidebar */}
      <NotesSidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onNoteSelect={handleNoteSelect}
        onCreateNote={handleCreateNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Meeting Header */}
        <header className="border-b bg-background p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold">{meeting.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(meeting.startTime)}</span>
                  </div>
                  {meeting.endTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 1000)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{meeting.attendees.length + 1} participants</span>
                  </div>
                </div>
              </div>
              <Badge variant={meeting.status === 'in_progress' ? 'default' : 'secondary'}>
                {meeting.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Recording Controls */}
              {meeting.status === 'in_progress' && (
                <div className="flex items-center space-x-2 px-3 py-2 border rounded-md">
                  {isRecording ? (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-mono">{formatDuration(recordingTime)}</span>
                      <Button size="sm" variant="destructive" onClick={handleStopRecording}>
                        <Square className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={handleStartRecording}>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  )}
                </div>
              )}
              
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {meeting.description && (
            <p className="text-muted-foreground">{meeting.description}</p>
          )}
        </header>

        {/* Content Tabs */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="action-items">Action Items ({actionItems.length})</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="flex-1">
              {selectedNote ? (
                <div className="h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{selectedNote.title}</h2>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{selectedNote.type}</Badge>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                  <NoteEditor
                    content={selectedNote.content}
                    onChange={handleNoteChange}
                    meetingId={meeting.id}
                    userId={session?.user?.id}
                    userName={session?.user?.name || 'Anonymous'}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">Select a note to edit</h3>
                    <p className="text-muted-foreground mb-4">
                      Choose a note from the sidebar or create a new one
                    </p>
                    <Button onClick={() => handleCreateNote('general')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Note
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="action-items">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Action Items</h2>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                {actionItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span>Assigned to: {item.assignee.name}</span>
                            {item.dueDate && (
                              <span>Due: {formatDateTime(item.dueDate)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={priorityColors[item.priority]}>
                            {item.priority}
                          </Badge>
                          <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">AI-Generated Insights</h2>
                  
                  {meeting.summary && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle className="text-base">Meeting Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{meeting.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Key Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {meeting.keyTopics?.map((topic, index) => (
                            <Badge key={index} variant="outline">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Decisions Made</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {meeting.decisions?.map((decision, index) => (
                            <li key={index} className="text-sm flex items-start space-x-2">
                              <CheckSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{decision}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transcript">
              <div>
                <h2 className="text-lg font-semibold mb-4">Meeting Transcript</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                      <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">No transcript available</h3>
                      <p className="text-sm">
                        Start recording to generate a live transcript with AI-powered features
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}