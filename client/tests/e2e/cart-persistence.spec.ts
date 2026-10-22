import { test, expect } from '@playwright/test'

test.describe('Cart Persistence', () => {
  const uniqueEmail = `cart-e2e-${Date.now()}@example.com`

  test('add as guest → login → cart merges → logout → login → cart retained', async ({ page }) => {
    // 1. Browse as guest and add item to cart
    await page.goto('/')
    await expect(page.locator('[data-testid="book-card"]')).toBeVisible()

    await page.locator('[data-testid="book-card"]').first().click()
    await page.locator('[data-testid="add-to-cart"]').click()

    // Cart should show 1 item as guest
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')

    // 2. Login
    await page.locator('[data-testid="login-button"]').click()
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()

    await page.locator('[data-testid="login-email"]').fill(uniqueEmail)
    await page.locator('[data-testid="login-password"]').fill('Password123')
    await page.locator('[data-testid="login-submit"]').click()

    await expect(page).toHaveURL(/\/$/)

    // 3. Cart should still have the item (merged)
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')

    // 4. Logout
    await page.locator('[data-testid="user-menu"]').click()
    await page.locator('[data-testid="logout-button"]').click()

    // 5. Login again
    await page.locator('[data-testid="login-button"]').click()
    await page.locator('[data-testid="login-email"]').fill(uniqueEmail)
    await page.locator('[data-testid="login-password"]').fill('Password123')
    await page.locator('[data-testid="login-submit"]').click()

    // 6. Cart should be retained after re-login
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')
  })

  test('cart totals update correctly', async ({ page }) => {
    await page.goto('/')

    // Add first book
    await page.locator('[data-testid="book-card"]').first().click()
    await page.locator('[data-testid="add-to-cart"]').click()

    // Go back and add second book
    await page.goBack()
    await page.locator('[data-testid="book-card"]').nth(1).click()
    await page.locator('[data-testid="add-to-cart"]').click()

    // Cart should have 2 items
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2')

    // Open cart and verify totals
    await page.locator('[data-testid="cart-button"]').click()
    await expect(page.locator('[data-testid="cart-subtotal"]')).toBeVisible()
  })

  test('remove item from cart', async ({ page }) => {
    await page.goto('/')

    // Add item to cart
    await page.locator('[data-testid="book-card"]').first().click()
    await page.locator('[data-testid="add-to-cart"]').click()

    // Open cart
    await page.locator('[data-testid="cart-button"]').click()
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible()

    // Remove item
    await page.locator('[data-testid="remove-from-cart"]').first().click()

    // Cart should be empty
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('0')
    await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible()
  })
})