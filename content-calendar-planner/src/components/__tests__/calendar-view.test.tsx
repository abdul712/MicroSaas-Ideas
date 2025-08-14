import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CalendarView } from '@/components/calendar/calendar-view'
import { DndContext } from '@dnd-kit/core'

// Mock the DnD Context for testing
const MockDndProvider = ({ children }: { children: React.ReactNode }) => (
  <DndContext onDragEnd={() => {}} onDragStart={() => {}}>
    {children}
  </DndContext>
)

describe('CalendarView', () => {
  it('renders calendar with correct month header', () => {
    render(
      <MockDndProvider>
        <CalendarView />
      </MockDndProvider>
    )
    
    // Check if current month is displayed
    const currentDate = new Date()
    const monthYear = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
    
    expect(screen.getByText(monthYear)).toBeInTheDocument()
  })

  it('displays week days header', () => {
    render(
      <MockDndProvider>
        <CalendarView />
      </MockDndProvider>
    )
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    weekDays.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument()
    })
  })

  it('shows add content button', () => {
    render(
      <MockDndProvider>
        <CalendarView />
      </MockDndProvider>
    )
    
    expect(screen.getByText('Add Content')).toBeInTheDocument()
  })

  it('renders content items on correct dates', () => {
    render(
      <MockDndProvider>
        <CalendarView />
      </MockDndProvider>
    )
    
    // Check if mock content items are rendered
    expect(screen.getByText('Summer Product Launch')).toBeInTheDocument()
    expect(screen.getByText('Weekly Newsletter')).toBeInTheDocument()
    expect(screen.getByText('Behind the Scenes Video')).toBeInTheDocument()
  })

  it('displays platform badges for content items', () => {
    render(
      <MockDndProvider>
        <CalendarView />
      </MockDndProvider>
    )
    
    // Check for platform indicators
    expect(screen.getByText('📷')).toBeInTheDocument() // Instagram
    expect(screen.getByText('📘')).toBeInTheDocument() // Facebook
    expect(screen.getByText('📺')).toBeInTheDocument() // YouTube
  })

  it('shows status badges for content items', () => {
    render(
      <MockDndProvider>
        <CalendarView />
      </MockDndProvider>
    )
    
    expect(screen.getByText('scheduled')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText('published')).toBeInTheDocument()
  })
})