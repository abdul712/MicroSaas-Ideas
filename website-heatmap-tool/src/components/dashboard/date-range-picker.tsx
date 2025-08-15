'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronDown } from 'lucide-react'

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (dateRange: DateRange) => void
}

const presetRanges = [
  {
    label: 'Last 7 days',
    days: 7
  },
  {
    label: 'Last 14 days',
    days: 14
  },
  {
    label: 'Last 30 days',
    days: 30
  },
  {
    label: 'Last 90 days',
    days: 90
  }
]

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDateRange = (from: Date, to: Date) => {
    const diffTime = Math.abs(to.getTime() - from.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) return 'Today'
    if (diffDays <= 7) return 'Last 7 days'
    if (diffDays <= 14) return 'Last 14 days'
    if (diffDays <= 30) return 'Last 30 days'
    if (diffDays <= 90) return 'Last 90 days'
    
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`
  }

  const handlePresetClick = (days: number) => {
    const to = new Date()
    const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
    onChange({ from, to })
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-48 justify-between"
      >
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{formatDateRange(value.from, value.to)}</span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Quick Select</div>
            
            {presetRanges.map((preset) => {
              const presetFrom = new Date(Date.now() - (preset.days - 1) * 24 * 60 * 60 * 1000)
              const presetTo = new Date()
              const isSelected = 
                value.from.toDateString() === presetFrom.toDateString() &&
                value.to.toDateString() === presetTo.toDateString()

              return (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset.days)}
                  className={`w-full text-left p-2 rounded hover:bg-gray-50 flex items-center justify-between ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-sm">{preset.label}</span>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs">Selected</Badge>
                  )}
                </button>
              )
            })}

            <hr className="my-2" />
            
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-2">Custom Range</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={value.from.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newFrom = new Date(e.target.value)
                    onChange({ ...value, from: newFrom })
                  }}
                  className="text-xs border rounded px-2 py-1"
                />
                <input
                  type="date"
                  value={value.to.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newTo = new Date(e.target.value)
                    onChange({ ...value, to: newTo })
                  }}
                  className="text-xs border rounded px-2 py-1"
                />
              </div>
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => setIsOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}