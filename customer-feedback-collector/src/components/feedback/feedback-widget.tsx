'use client'

import { useState } from 'react'
import { X, Star, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FeedbackWidgetProps {
  type?: 'popup' | 'sidebar' | 'embedded' | 'floating'
  projectId: string
  settings?: {
    title?: string
    description?: string
    collectEmail?: boolean
    collectName?: boolean
    showRating?: boolean
    showNPS?: boolean
    customFields?: Array<{
      id: string
      label: string
      type: 'text' | 'email' | 'select'
      required?: boolean
      options?: string[]
    }>
    colors?: {
      primary?: string
      background?: string
      text?: string
    }
  }
  onSubmit?: (data: any) => void
  onClose?: () => void
}

export function FeedbackWidget({
  type = 'popup',
  projectId,
  settings = {},
  onSubmit,
  onClose,
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(type !== 'floating')
  const [step, setStep] = useState<'trigger' | 'form' | 'thanks'>('trigger')
  const [formData, setFormData] = useState({
    rating: 0,
    npsScore: 0,
    content: '',
    email: '',
    name: '',
    customFields: {} as Record<string, string>,
  })

  const {
    title = 'Share your feedback',
    description = 'Help us improve by sharing your thoughts',
    collectEmail = false,
    collectName = false,
    showRating = true,
    showNPS = false,
    customFields = [],
    colors = {},
  } = settings

  const handleOpen = () => {
    setIsOpen(true)
    setStep('form')
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep('trigger')
    onClose?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const feedbackData = {
      projectId,
      type: showNPS ? 'NPS' : showRating ? 'RATING' : 'TEXT',
      content: formData.content,
      rating: showRating ? formData.rating : showNPS ? formData.npsScore : undefined,
      metadata: {
        source: 'widget',
        widgetType: type,
        ...formData.customFields,
      },
      customer: (collectEmail || collectName) ? {
        email: collectEmail ? formData.email : undefined,
        name: collectName ? formData.name : undefined,
      } : undefined,
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      })

      if (response.ok) {
        setStep('thanks')
        onSubmit?.(feedbackData)
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const renderRatingStars = () => (
    <div className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, rating: value }))}
          className={cn(
            'w-8 h-8 transition-colors',
            value <= formData.rating
              ? 'text-yellow-500 fill-current'
              : 'text-gray-300 hover:text-yellow-400'
          )}
        >
          <Star className="w-full h-full" />
        </button>
      ))}
    </div>
  )

  const renderNPSScale = () => (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Not likely</span>
        <span>Extremely likely</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, npsScore: value }))}
            className={cn(
              'w-8 h-8 text-xs font-medium rounded transition-colors',
              value === formData.npsScore
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )

  // Floating trigger button
  if (type === 'floating' && !isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors z-50 flex items-center justify-center"
        style={{ backgroundColor: colors.primary }}
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    )
  }

  if (!isOpen) return null

  const widgetContent = (
    <>
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </div>
            {type !== 'embedded' && (
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {showRating && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                How would you rate your experience?
              </label>
              {renderRatingStars()}
            </div>
          )}

          {showNPS && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                How likely are you to recommend us to a friend?
              </label>
              {renderNPSScale()}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tell us more about your experience
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white"
              rows={3}
              required
            />
          </div>

          {collectName && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Name (optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Your name"
              />
            </div>
          )}

          {collectEmail && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="your@email.com"
              />
            </div>
          )}

          {customFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData.customFields[field.id] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customFields: { ...prev.customFields, [field.id]: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required={field.required}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={formData.customFields[field.id] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customFields: { ...prev.customFields, [field.id]: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required={field.required}
                />
              )}
            </div>
          ))}

          <Button 
            type="submit" 
            className="w-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Feedback
          </Button>
        </form>
      )}

      {step === 'thanks' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">✓</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Thank you for your feedback!
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Your input helps us improve our product.
          </p>
        </div>
      )}
    </>
  )

  if (type === 'embedded') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {widgetContent}
        </CardContent>
      </Card>
    )
  }

  return (
    <div
      className={cn(
        'feedback-widget',
        type === 'popup' && 'feedback-widget-popup',
        type === 'sidebar' && 'feedback-widget-sidebar'
      )}
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div className="p-6">
        {widgetContent}
      </div>
    </div>
  )
}