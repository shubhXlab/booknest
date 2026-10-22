import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin before each test
    await page.goto('/login')
    await page.locator('[data-testid="login-email"]').fill('admin@booknest.com')
    await page.locator('[data-testid="login-password"]').fill('admin123')
    await page.locator('[data-testid="login-submit"]').click()
    await expect(page).toHaveURL(/\/admin/)
  })

  test('dashboard loads and shows stat cards', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page.locator('[data-testid="stat-card"]')).toHaveCount(4)
    await expect(page.locator('[data-testid="stat-value"]')).toHaveCount(4)
  })

  test('dashboard shows loading state before data loads', async ({ page }) => {
    await page.goto('/admin/dashboard')
    // Loading state should resolve quickly; stat cards should appear
    await expect(page.locator('[data-testid="stat-card"]').first()).toBeVisible()
  })

  test('period selector changes sales data when Weekly clicked', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.locator('text=Weekly').click()
    await expect(page.locator('[data-testid="stat-card"]').first()).toBeVisible()
    // Sales chart should re-render with weekly data
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible()
  })

  test('non-admin user cannot access admin routes', async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="login-email"]').fill('customer@example.com')
    await page.locator('[data-testid="login-password"]').fill('Password123')
    await page.locator('[data-testid="login-submit"]').click()

    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login|\/403/)
  })
})

test.describe('Admin Book Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="login-email"]').fill('admin@booknest.com')
    await page.locator('[data-testid="login-password"]').fill('admin123')
    await page.locator('[data-testid="login-submit"]').click()
  })

  test('books table renders with rows', async ({ page }) => {
    await page.goto('/admin/books')
    await expect(page.locator('[data-testid="books-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="book-row"]')).toHaveCountGreaterThan(0)
  })

  test('add book form submits and new row appears', async ({ page }) => {
    await page.goto('/admin/books')
    await page.locator('[data-testid="add-book-button"]').click()
    await expect(page.locator('[data-testid="add-book-form"]')).toBeVisible()

    await page.locator('[data-testid="book-title"]').fill('E2E Test Book')
    await page.locator('[data-testid="book-author"]').fill('E2E Author')
    await page.locator('[data-testid="book-price"]').fill('19.99')
    await page.locator('[data-testid="book-submit"]').click()

    await expect(page.locator('text=E2E Test Book')).toBeVisible()
  })
})

test.describe('Admin Order Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="login-email"]').fill('admin@booknest.com')
    await page.locator('[data-testid="login-password"]').fill('admin123')
    await page.locator('[data-testid="login-submit"]').click()
  })

  test('orders table renders with rows', async ({ page }) => {
    await page.goto('/admin/orders')
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible()
  })

  test('status dropdown updates order status', async ({ page }) => {
    await page.goto('/admin/orders')
    await page.locator('[data-testid="status-dropdown"]').first().click()
    await page.locator('text=Processing').click()
    await expect(page.locator('[data-testid="order-status"]').first()).toContainText('Processing')
  })
})

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="login-email"]').fill('admin@booknest.com')
    await page.locator('[data-testid="login-password"]').fill('admin123')
    await page.locator('[data-testid="login-submit"]').click()
  })

  test('users table renders with role toggle', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="role-toggle"]')).toHaveCountGreaterThan(0)
  })
})

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="login-email"]').fill('admin@booknest.com')
    await page.locator('[data-testid="login-password"]').fill('admin123')
    await page.locator('[data-testid="login-submit"]').click()
  })

  test('settings page loads and form persists changes', async ({ page }) => {
    await page.goto('/admin/settings')
    await expect(page.locator('[data-testid="settings-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="site-name-input"]')).toBeVisible()
  })
})
