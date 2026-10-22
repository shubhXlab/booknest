import { test, expect } from '@playwright/test'

test.describe('Browse → Cart → Checkout → Order Flow', () => {
  test('complete purchase journey', async ({ page }) => {
    // 1. Homepage loads
    await page.goto('/')
    await expect(page).toHaveTitle(/BookNest/)

    // 2. Browse books list
    await expect(page.locator('[data-testid="book-list"]')).toBeVisible()
    const bookCount = await page.locator('[data-testid="book-card"]').count()
    expect(bookCount).toBeGreaterThan(0)

    // 3. View book detail
    await page.locator('[data-testid="book-card"]').first().click()
    await expect(page.locator('[data-testid="book-detail"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-to-cart"]')).toBeVisible()

    // 4. Add to cart
    await page.locator('[data-testid="add-to-cart"]').click()
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')

    // 5. Open cart, verify items
    await page.locator('[data-testid="cart-button"]').click()
    await expect(page.locator('[data-testid="cart-items"]')).toBeVisible()
    await expect(page.locator('[data-testid="cart-item"]').first()).toBeVisible()

    // 6. Proceed to checkout
    await page.locator('[data-testid="checkout-button"]').click()
    await expect(page).toHaveURL(/\/checkout/)

    // 7. Fill shipping and payment
    await page.locator('[data-testid="shipping-address"]').fill('123 Main St, NYC, 10001')
    await page.locator('[data-testid="card-number"]').fill('4242424242424242')
    await page.locator('[data-testid="card-expiry"]').fill('12/30')
    await page.locator('[data-testid="card-cvc"]').fill('123')

    // 8. Confirm order
    await page.locator('[data-testid="place-order"]').click()

    // 9. Verify order confirmation page
    await expect(page).toHaveURL(/\/order-confirmation/)
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible()
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
  })

  test('auth journey: register → login → logout → login again', async ({ page }) => {
    // 1. Go to register
    await page.goto('/register')
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible()

    // 2. Register
    const email = `e2e-${Date.now()}@example.com`
    await page.locator('[data-testid="register-name"]').fill('E2E User')
    await page.locator('[data-testid="register-email"]').fill(email)
    await page.locator('[data-testid="register-password"]').fill('Password123')
    await page.locator('[data-testid="register-submit"]').click()

    // Should be redirected to home after successful registration
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()

    // 3. Logout
    await page.locator('[data-testid="user-menu"]').click()
    await page.locator('[data-testid="logout-button"]').click()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()

    // 4. Login again
    await page.locator('[data-testid="login-button"]').click()
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    await page.locator('[data-testid="login-email"]').fill(email)
    await page.locator('[data-testid="login-password"]').fill('Password123')
    await page.locator('[data-testid="login-submit"]').click()

    // Should be logged in
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })
})