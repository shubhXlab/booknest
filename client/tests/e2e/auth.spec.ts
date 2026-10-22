import { test, expect } from '@playwright/test'

test.describe('Auth Journey', () => {
  const uniqueEmail = `auth-e2e-${Date.now()}@example.com`

  test('register new user', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible()

    await page.locator('[data-testid="register-name"]').fill('Auth E2E User')
    await page.locator('[data-testid="register-email"]').fill(uniqueEmail)
    await page.locator('[data-testid="register-password"]').fill('Password123')
    await page.locator('[data-testid="register-submit"]').click()

    // After registration, should be redirected to home and logged in
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('login with existing credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()

    await page.locator('[data-testid="login-email"]').fill(uniqueEmail)
    await page.locator('[data-testid="login-password"]').fill('Password123')
    await page.locator('[data-testid="login-submit"]').click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')

    await page.locator('[data-testid="login-email"]').fill('wrong@example.com')
    await page.locator('[data-testid="login-password"]').fill('wrongpassword')
    await page.locator('[data-testid="login-submit"]').click()

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials')
  })

  test('logout clears session', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.locator('[data-testid="login-email"]').fill(uniqueEmail)
    await page.locator('[data-testid="login-password"]').fill('Password123')
    await page.locator('[data-testid="login-submit"]').click()

    // Then logout
    await page.locator('[data-testid="user-menu"]').click()
    await page.locator('[data-testid="logout-button"]').click()

    // Should see login button again
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
  })

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/cart')
    await expect(page).toHaveURL(/\/login/)
  })
})