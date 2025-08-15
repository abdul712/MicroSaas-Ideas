import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the index page (which should redirect to auth)
    await page.goto('/');
  });

  test('should redirect to sign in page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should display sign in form', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check for sign in form elements
    await expect(page.locator('text=Sign in')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show OAuth providers', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check for OAuth buttons
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('text=Continue with GitHub')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Try to submit with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  test('should show password requirements', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Fill out signup form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123'); // Short password
    
    // Should show password requirements
    await expect(page.locator('text=Password must be at least')).toBeVisible();
  });

  test('should handle sign in error', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Try to sign in with non-existent credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should navigate between sign in and sign up', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Click sign up link
    await page.click('text=Create an account');
    await expect(page).toHaveURL(/.*\/auth\/signup/);
    
    // Go back to sign in
    await page.click('text=Already have an account');
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should handle forgotten password', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Click forgot password link
    await page.click('text=Forgot password');
    await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
    
    // Should show reset form
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('text=Reset password')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to signin for protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/contacts',
      '/templates',
      '/sequences',
      '/analytics',
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*\/auth\/signin/);
    }
  });
});

test.describe('Authenticated User Flow', () => {
  test.skip('should complete full authentication flow', async ({ page }) => {
    // This test would require actual authentication setup
    // Skip for now as it requires database and email setup
    
    await page.goto('/auth/signup');
    
    // Fill signup form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'securepassword123');
    await page.click('button[type="submit"]');
    
    // Should redirect to verification or dashboard
    await expect(page).toHaveURL(/.*\/(verify-email|dashboard)/);
  });
});