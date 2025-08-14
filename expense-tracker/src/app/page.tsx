import { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'ExpenseTracker Pro - AI-Powered Expense Management for Modern Businesses',
  description: 'Transform your expense management with AI-powered OCR receipt scanning, intelligent categorization, and enterprise-grade security. Perfect for small businesses, freelancers, and growing teams.',
}

export default function HomePage() {
  return <LandingPage />
}