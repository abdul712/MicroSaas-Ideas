'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Phone, Backspace } from 'lucide-react'

interface DialPadProps {
  onCall: (number: string) => void
  className?: string
}

export function DialPad({ onCall, className }: DialPadProps) {
  const [number, setNumber] = useState('')

  const dialPadNumbers = [
    [
      { key: '1', sub: '' },
      { key: '2', sub: 'ABC' },
      { key: '3', sub: 'DEF' }
    ],
    [
      { key: '4', sub: 'GHI' },
      { key: '5', sub: 'JKL' },
      { key: '6', sub: 'MNO' }
    ],
    [
      { key: '7', sub: 'PQRS' },
      { key: '8', sub: 'TUV' },
      { key: '9', sub: 'WXYZ' }
    ],
    [
      { key: '*', sub: '' },
      { key: '0', sub: '+' },
      { key: '#', sub: '' }
    ]
  ]

  const handleNumberPress = (digit: string) => {
    setNumber(prev => prev + digit)
  }

  const handleBackspace = () => {
    setNumber(prev => prev.slice(0, -1))
  }

  const handleCall = () => {
    if (number.trim()) {
      onCall(number.trim())
      setNumber('')
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    const key = event.key
    if (/[0-9*#]/.test(key)) {
      handleNumberPress(key)
    } else if (key === 'Backspace') {
      handleBackspace()
    } else if (key === 'Enter') {
      handleCall()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-center">Make a Call</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Number Display */}
        <div className="relative">
          <Input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter phone number"
            className="text-center text-lg h-12"
            maxLength={20}
          />
          {number && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={handleBackspace}
            >
              <Backspace className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Dial Pad */}
        <div className="grid grid-cols-3 gap-4">
          {dialPadNumbers.flat().map((button, index) => (
            <Button
              key={index}
              variant="outline"
              className="dial-pad-button"
              onClick={() => handleNumberPress(button.key)}
            >
              <div className="text-center">
                <div className="text-xl font-bold">{button.key}</div>
                {button.sub && (
                  <div className="text-xs text-gray-500 mt-1">{button.sub}</div>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Call Button */}
        <Button
          onClick={handleCall}
          disabled={!number.trim()}
          className="w-full h-12 bg-green-600 hover:bg-green-700"
        >
          <Phone className="h-5 w-5 mr-2" />
          Call
        </Button>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNumber('911')}
          >
            Emergency
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNumber('*67')}
          >
            Block Caller ID
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}