'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  CheckSquare,
  Users,
  Filter,
  SortAsc
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

interface Note {
  id: string
  title: string
  content: string
  type: 'general' | 'agenda' | 'minutes' | 'follow_up'
  createdAt: string
  updatedAt: string
  meetingTitle?: string
  meetingDate?: string
  authorName?: string
  isShared: boolean
}

interface NotesSidebarProps {
  notes: Note[]
  selectedNoteId?: string
  onNoteSelect: (noteId: string) => void
  onCreateNote: (type: Note['type']) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

const noteTypeColors = {
  general: 'bg-blue-100 text-blue-800',
  agenda: 'bg-green-100 text-green-800',
  minutes: 'bg-purple-100 text-purple-800',
  follow_up: 'bg-orange-100 text-orange-800',
}

const noteTypeLabels = {
  general: 'General',
  agenda: 'Agenda',
  minutes: 'Minutes',
  follow_up: 'Follow-up',
}

export function NotesSidebar({
  notes,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
  searchQuery,
  onSearchChange,
}: NotesSidebarProps) {
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date')
  const [filterType, setFilterType] = useState<Note['type'] | 'all'>('all')

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (note.meetingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      const matchesFilter = filterType === 'all' || note.type === filterType
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'type':
          return a.type.localeCompare(b.type)
        case 'date':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <div className="flex gap-1">
            <Button size="sm" onClick={() => onCreateNote('general')}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as Note['type'] | 'all')}
            className="text-sm border border-border rounded px-2 py-1 bg-background"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="agenda">Agenda</option>
            <option value="minutes">Minutes</option>
            <option value="follow_up">Follow-up</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
            className="text-sm border border-border rounded px-2 py-1 bg-background"
          >
            <option value="date">Recent</option>
            <option value="title">Title</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">No notes found</p>
            <p className="text-xs mt-1">
              {searchQuery ? 'Try a different search term' : 'Create your first note'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedNoteId === note.id ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => onNoteSelect(note.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {note.title || 'Untitled Note'}
                      </h3>
                      {note.meetingTitle && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {note.meetingTitle}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${noteTypeColors[note.type]}`}
                    >
                      {noteTypeLabels[note.type]}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {note.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {note.isShared && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Shared</span>
                        </div>
                      )}
                      {note.authorName && (
                        <span>{note.authorName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {note.meetingDate && (
                        <>
                          <span>{formatDate(note.meetingDate)}</span>
                          <span className="text-muted-foreground/50">•</span>
                        </>
                      )}
                      <span>{formatTime(note.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateNote('agenda')}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Agenda
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateNote('minutes')}
            className="text-xs"
          >
            <FileText className="w-3 h-3 mr-1" />
            Minutes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateNote('follow_up')}
            className="text-xs"
          >
            <CheckSquare className="w-3 h-3 mr-1" />
            Follow-up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateNote('general')}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            General
          </Button>
        </div>
      </div>
    </div>
  )
}