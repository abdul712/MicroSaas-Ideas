import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackWidget } from '@/components/feedback/feedback-widget'

// Mock fetch
global.fetch = jest.fn()

describe('FeedbackWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render floating trigger button', () => {
    render(
      <FeedbackWidget 
        type="floating" 
        projectId="test-project" 
      />
    )
    
    const triggerButton = screen.getByRole('button')
    expect(triggerButton).toBeInTheDocument()
    expect(triggerButton).toHaveClass('fixed', 'bottom-4', 'right-4')
  })

  it('should show form when floating button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <FeedbackWidget 
        type="floating" 
        projectId="test-project"
        settings={{
          title: 'Test Feedback',
          description: 'Test Description'
        }}
      />
    )
    
    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)
    
    expect(screen.getByText('Test Feedback')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('should render embedded widget directly', () => {
    render(
      <FeedbackWidget 
        type="embedded" 
        projectId="test-project"
        settings={{
          title: 'Embedded Feedback'
        }}
      />
    )
    
    expect(screen.getByText('Embedded Feedback')).toBeInTheDocument()
  })

  it('should show rating stars when showRating is true', () => {
    render(
      <FeedbackWidget 
        type="embedded" 
        projectId="test-project"
        settings={{
          showRating: true
        }}
      />
    )
    
    const ratingButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')
    )
    expect(ratingButtons).toHaveLength(5)
  })

  it('should show NPS scale when showNPS is true', () => {
    render(
      <FeedbackWidget 
        type="embedded" 
        projectId="test-project"
        settings={{
          showNPS: true
        }}
      />
    )
    
    expect(screen.getByText('How likely are you to recommend us to a friend?')).toBeInTheDocument()
    
    // Should have buttons 0-10 (11 total)
    const npsButtons = screen.getAllByRole('button').filter(btn => 
      /^[0-9]|10$/.test(btn.textContent || '')
    )
    expect(npsButtons).toHaveLength(11)
  })

  it('should collect email when collectEmail is true', () => {
    render(
      <FeedbackWidget 
        type="embedded" 
        projectId="test-project"
        settings={{
          collectEmail: true
        }}
      />
    )
    
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
  })

  it('should collect name when collectName is true', () => {
    render(
      <FeedbackWidget 
        type="embedded" 
        projectId="test-project"
        settings={{
          collectName: true
        }}
      />
    )
    
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
  })

  it('should submit feedback successfully', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' })
    } as Response)

    const user = userEvent.setup()
    const onSubmit = jest.fn()
    
    render(
      <FeedbackWidget 
        type="embedded" 
        projectId="test-project"
        settings={{
          showRating: true,
          collectEmail: true
        }}
        onSubmit={onSubmit}
      />
    )
    
    // Fill out the form
    const textarea = screen.getByPlaceholderText('Share your thoughts...')
    await user.type(textarea, 'Great product!')
    
    const emailInput = screen.getByPlaceholderText('your@email.com')
    await user.type(emailInput, 'test@example.com')
    
    // Click 5-star rating
    const starButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')
    )
    await user.click(starButtons[4]) // 5th star (5-star rating)
    
    // Submit form
    const submitButton = screen.getByText('Send Feedback')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: 'test-project',
          type: 'RATING',
          content: 'Great product!',
          rating: 5,
          metadata: {
            source: 'widget',
            widgetType: 'embedded',
          },
          customer: {
            email: 'test@example.com',
            name: undefined,
          },
        }),
      })
    })
    
    expect(onSubmit).toHaveBeenCalled()
  })

  it('should show thank you message after successful submission', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' })
    } as Response)

    const user = userEvent.setup()
    
    render(
      <FeedbackWidget 
        type="embedded" 
        projectId="test-project"
      />
    )
    
    // Fill required field
    const textarea = screen.getByPlaceholderText('Share your thoughts...')
    await user.type(textarea, 'Great!')
    
    // Submit
    const submitButton = screen.getByText('Send Feedback')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument()
    })
  })

  it('should render custom fields', () => {
    render(
      <FeedbackWidget 
        type="embedded" 
        projectId="test-project"
        settings={{
          customFields: [
            {
              id: 'department',
              label: 'Department',
              type: 'select',
              required: true,
              options: ['Sales', 'Support', 'Engineering']
            },
            {
              id: 'priority',
              label: 'Priority',
              type: 'text',
              required: false
            }
          ]
        }}
      />
    )
    
    expect(screen.getByText('Department')).toBeInTheDocument()
    expect(screen.getByText('Priority')).toBeInTheDocument()
    
    // Check required asterisk
    expect(screen.getByText('*')).toBeInTheDocument()
    
    // Check select options
    const selectElement = screen.getByRole('combobox')
    expect(selectElement).toBeInTheDocument()
  })

  it('should apply custom colors', () => {
    render(
      <FeedbackWidget 
        type="popup" 
        projectId="test-project"
        settings={{
          colors: {
            primary: '#ff0000',
            background: '#ffffff',
            text: '#000000'
          }
        }}
      />
    )
    
    const widget = screen.getByRole('form').closest('div')
    expect(widget).toHaveStyle({
      backgroundColor: '#ffffff',
      color: '#000000'
    })
  })

  it('should close widget when X button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    render(
      <FeedbackWidget 
        type="popup" 
        projectId="test-project"
        onClose={onClose}
      />
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })
})