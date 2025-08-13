'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceWithRelations } from '@/types'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PaymentPortalPage() {
  const params = useParams()
  const publicId = params.publicId as string
  
  const [invoice, setInvoice] = useState<InvoiceWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (publicId) {
      fetchInvoice()
    }
  }, [publicId])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/public/${publicId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data.data)
      } else {
        setError('Invoice not found')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      setError('Failed to load invoice')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!invoice || Number(invoice.dueAmount) <= 0) return

    setIsProcessingPayment(true)
    setError(null)

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: Number(invoice.dueAmount),
          currency: invoice.currency,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { data } = await response.json()
      const stripe = await stripePromise

      if (!stripe) {
        throw new Error('Stripe not loaded')
      }

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Payment processing failed. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const downloadPDF = async () => {
    if (!invoice) return

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>
              {error || 'Invoice not found'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const businessName = invoice.business?.name || 
                      invoice.user?.company || 
                      `${invoice.user?.firstName} ${invoice.user?.lastName}`.trim() ||
                      'Business'

  const clientName = `${invoice.client.firstName} ${invoice.client.lastName || ''}`.trim()
  const isPaid = invoice.status === 'PAID'
  const isOverdue = new Date(invoice.dueDate) < new Date() && !isPaid

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Invoice Payment</h1>
          <p className="text-gray-600 mt-2">
            From {businessName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Invoice #{invoice.invoiceNumber}</CardTitle>
                    <CardDescription>
                      Issued to {clientName}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isPaid ? 'bg-green-100 text-green-800' :
                      isOverdue ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invoice Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Issue Date</p>
                      <p className="text-sm text-gray-600">{formatDate(invoice.issueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Due Date</p>
                      <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(invoice.dueDate)}
                        {isOverdue && ' (Overdue)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="border-t pt-4">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">From</p>
                      <p className="text-sm text-gray-600">{businessName}</p>
                      {(invoice.business?.email || invoice.user?.email) && (
                        <p className="text-sm text-gray-600">
                          {invoice.business?.email || invoice.user?.email}
                        </p>
                      )}
                      {(invoice.business?.phone || invoice.user?.phone) && (
                        <p className="text-sm text-gray-600">
                          {invoice.business?.phone || invoice.user?.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Items</h4>
                  <div className="space-y-2">
                    {invoice.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{item.description}</p>
                          <p className="text-xs text-gray-600">
                            {item.quantity} × {formatCurrency(Number(item.rate), invoice.currency)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(Number(item.amount), invoice.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                    </span>
                  </div>
                  
                  {Number(invoice.taxAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="text-gray-900">
                        {formatCurrency(Number(invoice.taxAmount), invoice.currency)}
                      </span>
                    </div>
                  )}
                  
                  {Number(invoice.discountAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="text-gray-900">
                        -{formatCurrency(Number(invoice.discountAmount), invoice.currency)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(Number(invoice.total), invoice.currency)}</span>
                  </div>
                  
                  {Number(invoice.paidAmount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid</span>
                      <span>
                        -{formatCurrency(Number(invoice.paidAmount), invoice.currency)}
                      </span>
                    </div>
                  )}
                  
                  {Number(invoice.dueAmount) > 0 && (
                    <div className="flex justify-between text-lg font-semibold text-red-600 border-t pt-2">
                      <span>Amount Due</span>
                      <span>{formatCurrency(Number(invoice.dueAmount), invoice.currency)}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Actions */}
          <div className="space-y-6">
            {isPaid ? (
              <Card>
                <CardHeader className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <CardTitle className="text-green-600">Paid in Full</CardTitle>
                  <CardDescription>
                    This invoice has been paid
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={downloadPDF}
                    variant="outline" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <DollarSign className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <CardTitle>Make Payment</CardTitle>
                  <CardDescription>
                    Pay securely with credit card
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(Number(invoice.dueAmount), invoice.currency)}
                    </p>
                    <p className="text-sm text-gray-600">Amount due</p>
                  </div>
                  
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={downloadPDF}
                    variant="outline" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  
                  <div className="text-center text-xs text-gray-500">
                    <p>Secure payment powered by Stripe</p>
                    <p>Your payment information is encrypted and secure</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Questions?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{businessName}</p>
                  {(invoice.business?.email || invoice.user?.email) && (
                    <p className="text-gray-600">
                      {invoice.business?.email || invoice.user?.email}
                    </p>
                  )}
                  {(invoice.business?.phone || invoice.user?.phone) && (
                    <p className="text-gray-600">
                      {invoice.business?.phone || invoice.user?.phone}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}