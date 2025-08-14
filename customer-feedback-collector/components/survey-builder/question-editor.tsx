'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { X, Plus, GripVertical, Trash2 } from 'lucide-react'
import type { QuestionInput } from '@/lib/validations'

interface QuestionEditorProps {
  question: Partial<QuestionInput>
  index: number
  onUpdate: (index: number, question: Partial<QuestionInput>) => void
  onDelete: (index: number) => void
  onMove: (from: number, to: number) => void
}

const questionTypes = [
  { value: 'TEXT', label: 'Short Text' },
  { value: 'TEXTAREA', label: 'Long Text' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'URL', label: 'URL' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'DATE', label: 'Date' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'SINGLE_CHOICE', label: 'Single Choice' },
  { value: 'RATING', label: 'Rating Scale' },
  { value: 'NPS', label: 'Net Promoter Score' },
  { value: 'SCALE', label: 'Scale' },
]

export function QuestionEditor({ question, index, onUpdate, onDelete, onMove }: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateQuestion = (updates: Partial<QuestionInput>) => {
    onUpdate(index, { ...question, ...updates })
  }

  const addOption = () => {
    const options = question.options || []
    updateQuestion({ options: [...options, ''] })
  }

  const updateOption = (optionIndex: number, value: string) => {
    const options = question.options || []
    const newOptions = [...options]
    newOptions[optionIndex] = value
    updateQuestion({ options: newOptions })
  }

  const removeOption = (optionIndex: number) => {
    const options = question.options || []
    updateQuestion({ options: options.filter((_, i) => i !== optionIndex) })
  }

  const needsOptions = ['MULTIPLE_CHOICE', 'SINGLE_CHOICE'].includes(question.type || '')

  return (
    <Card className="question-item">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="drag-handle w-4 h-4" />
            <span className="text-sm font-medium text-gray-500">
              Question {index + 1}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Question Preview */}
        <div className="space-y-2">
          <Input
            placeholder="Enter your question..."
            value={question.title || ''}
            onChange={(e) => updateQuestion({ title: e.target.value })}
            className="font-medium"
          />
          {question.description && (
            <p className="text-sm text-gray-600">{question.description}</p>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Question Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={question.type || 'TEXT'}
                onValueChange={(value) => updateQuestion({ type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Settings</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={question.required || false}
                  onCheckedChange={(required) => updateQuestion({ required })}
                />
                <span className="text-sm">Required</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Add a description or help text"
              value={question.description || ''}
              onChange={(e) => updateQuestion({ description: e.target.value })}
              rows={2}
            />
          </div>

          {/* Placeholder */}
          {['TEXT', 'TEXTAREA', 'EMAIL', 'URL', 'NUMBER', 'PHONE'].includes(question.type || '') && (
            <div className="space-y-2">
              <Label>Placeholder Text</Label>
              <Input
                placeholder="Enter placeholder text"
                value={question.placeholder || ''}
                onChange={(e) => updateQuestion({ placeholder: e.target.value })}
              />
            </div>
          )}

          {/* Options for Multiple Choice / Single Choice */}
          {needsOptions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {(question.options || []).map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <Input
                      placeholder={`Option ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(optionIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating Scale Configuration */}
          {question.type === 'RATING' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scale (1 to N)</Label>
                <Select
                  value={question.options?.[0] || '5'}
                  onValueChange={(value) => updateQuestion({ options: [value] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">1 to 3</SelectItem>
                    <SelectItem value="5">1 to 5</SelectItem>
                    <SelectItem value="7">1 to 7</SelectItem>
                    <SelectItem value="10">1 to 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scale Labels</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Low label"
                    value={question.validation?.min?.toString() || ''}
                    onChange={(e) => updateQuestion({
                      validation: { ...question.validation, min: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="High label"
                    value={question.validation?.max?.toString() || ''}
                    onChange={(e) => updateQuestion({
                      validation: { ...question.validation, max: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* NPS Configuration */}
          {question.type === 'NPS' && (
            <div className="space-y-2">
              <Label>Follow-up Question (optional)</Label>
              <Input
                placeholder="Why did you give this score?"
                value={question.description || ''}
                onChange={(e) => updateQuestion({ description: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}