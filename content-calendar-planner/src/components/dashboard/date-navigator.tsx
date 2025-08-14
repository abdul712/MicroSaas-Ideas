'use client'

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { formatDate } from "@/lib/utils"

export function DateNavigator() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={goToToday}>
        Today
      </Button>
      <div className="flex items-center space-x-1">
        <Button variant="ghost" size="sm" onClick={goToPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-[120px] text-center">
          <span className="font-medium">
            {formatDate(currentDate)}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={goToNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}