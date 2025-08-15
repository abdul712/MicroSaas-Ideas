'use client'

import { Camera, Plus, Upload, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QuickActions() {
  const handleScanReceipt = () => {
    // Open camera or file picker for receipt scanning
    console.log('Scanning receipt...')
  }

  const handleAddExpense = () => {
    // Navigate to add expense page
    console.log('Adding expense...')
  }

  const handleImportTransactions = () => {
    // Open bank connection or CSV import
    console.log('Importing transactions...')
  }

  const handleCreateBudget = () => {
    // Navigate to budget creation
    console.log('Creating budget...')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleScanReceipt} className="gap-2">
        <Camera className="h-4 w-4" />
        Scan Receipt
      </Button>
      <Button onClick={handleAddExpense} variant="outline" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Expense
      </Button>
      <Button onClick={handleImportTransactions} variant="outline" className="gap-2">
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <Button onClick={handleCreateBudget} variant="outline" className="gap-2">
        <CreditCard className="h-4 w-4" />
        Budget
      </Button>
    </div>
  )
}