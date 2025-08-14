import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display homepage with correct title and content', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page).toHaveTitle(/Customer Support System/)

    // Check main heading
    await expect(page.getByRole('heading', { name: /Customer Support.*Reimagined/i })).toBeVisible()

    // Check navigation elements
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible()

    // Check CTA buttons
    await expect(page.getByRole('button', { name: /Start Free Trial/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Watch Demo/i })).toBeVisible()

    // Check stats section
    await expect(page.getByText('99.9%')).toBeVisible()
    await expect(page.getByText('Uptime Guarantee')).toBeVisible()
    await expect(page.getByText('<1s')).toBeVisible()
    await expect(page.getByText('Response Time')).toBeVisible()

    // Check features section
    await expect(page.getByText('Multi-Channel Support')).toBeVisible()
    await expect(page.getByText('AI-Powered Automation')).toBeVisible()
    await expect(page.getByText('Team Collaboration')).toBeVisible()
    await expect(page.getByText('Advanced Analytics')).toBeVisible()
    await expect(page.getByText('Enterprise Security')).toBeVisible()
    await expect(page.getByText('Lightning Fast')).toBeVisible()
  })

  test('should have responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/')
    
    // Features should be in grid layout on desktop
    const featuresSection = page.locator('section').filter({ hasText: 'Everything you need for world-class support' })
    await expect(featuresSection).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()

    // Check that content is still visible and accessible on mobile
    await expect(page.getByRole('heading', { name: /Customer Support.*Reimagined/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Start Free Trial/i })).toBeVisible()
  })

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/')

    // Test features link (should scroll to features section)
    await page.getByRole('link', { name: 'Features' }).click()
    await expect(page.url()).toContain('#features')

    // Test sign in button
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await expect(signInButton).toBeVisible()
  })

  test('should display footer with correct information', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check footer content
    await expect(page.getByText('SupportFlow')).toBeVisible()
    await expect(page.getByText('Enterprise-grade customer support platform')).toBeVisible()
    
    // Check footer links
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible()
    
    // Check copyright
    await expect(page.getByText('© 2024 SupportFlow. All rights reserved.')).toBeVisible()
  })

  test('should have accessible markup', async ({ page }) => {
    await page.goto('/')

    // Check that main sections have proper heading structure
    const mainHeading = page.getByRole('heading', { level: 1 })
    await expect(mainHeading).toBeVisible()

    // Check that buttons have accessible names
    const startTrialButton = page.getByRole('button', { name: /Start Free Trial/i })
    await expect(startTrialButton).toHaveAttribute('type', 'button')

    // Check that links have proper href attributes
    const featuresLink = page.getByRole('link', { name: 'Features' })
    await expect(featuresLink).toHaveAttribute('href', '#features')
  })

  test('should display technology stack information', async ({ page }) => {
    await page.goto('/')

    // Check technology stack section
    await expect(page.getByText('Built with Modern Technology')).toBeVisible()
    await expect(page.getByText('Next.js 14')).toBeVisible()
    await expect(page.getByText('OpenAI GPT-4')).toBeVisible()
    await expect(page.getByText('Real-time')).toBeVisible()
    await expect(page.getByText('Enterprise Security')).toBeVisible()
    
    // Check technology description
    await expect(page.getByText(/Powered by TypeScript, PostgreSQL, Prisma/)).toBeVisible()
  })
})