# BookNest Test Plan

## Overview
Test strategy for BookNest e-commerce application covering unit, integration, and E2E testing.

## Tooling
- **Unit/Integration**: Vitest (fast, Vite-native, good TypeScript support)
- **E2E**: Playwright (cross-browser, reliable, good debugging)
- **Coverage**: v8 (built into Vitest)

---

## 1. Unit Tests — Backend Routes (Vitest)

### Target: `/workspace/booknest/server/tests/`

| Route Group | Test Files | Key Scenarios |
|-------------|------------|---------------|
| **Auth** | `auth.test.ts` | register, login, logout, token refresh, password reset, invalid credentials, expired tokens |
| **Books** | `books.test.ts` | list (pagination, filters), get by ID, search, create/update/delete (admin), validation |
| **Cart** | `cart.test.ts` | add item, update quantity, remove item, clear cart, get cart, merge guest→user cart |
| **Orders** | `orders.test.ts` | create from cart, list user orders, get order details, cancel order, status transitions |

### Conventions
- Mock database (Prisma/SQLite in-memory) and external services
- Test each handler in isolation
- Validate request/response schemas (Zod)
- Cover happy paths + error cases (400, 401, 403, 404, 500)

---

## 2. Integration Tests (Vitest)

### Target: `/workspace/booknest/server/tests/integration/`

| Flow | Test File | Key Scenarios |
|------|-----------|---------------|
| **Auth Flow** | `auth-flow.test.ts` | register → login → access protected route → refresh token → logout |
| **Order Placement** | `order-flow.test.ts` | browse books → add to cart → checkout → payment (mocked) → order created → email queued |

### Conventions
- Use test database (separate from unit test DB)
- Test real HTTP request/response cycle via test server
- Clean state between tests (transactions + rollback or truncate)

---

## 3. E2E Tests — Critical User Journeys (Playwright)

### Target: `/workspace/booknest/client/tests/e2e/`

| Journey | Test File | Steps |
|---------|-----------|-------|
| **Browse → Cart → Checkout → Order** | `purchase-flow.spec.ts` | 1. Homepage loads<br>2. Browse books list<br>3. View book detail<br>4. Add to cart<br>5. Open cart, verify items<br>6. Proceed to checkout<br>7. Fill shipping/payment (test card)<br>8. Confirm order<br>9. Verify order confirmation page |
| **Auth Journey** | `auth.spec.ts` | Register → login → logout → login again |
| **Cart Persistence** | `cart-persistence.spec.ts` | Add as guest → login → cart merges → logout → login → cart retained |

### Conventions
- Run against staging-like environment (or local with seeded DB)
- Use data-testid attributes for selectors
- Screenshots on failure, trace viewer for debugging
- Parallel execution with sharding

---

## 4. Quality Gates (CI)

| Gate | Threshold |
|------|-----------|
| Unit test pass rate | 100% |
| Integration test pass rate | 100% |
| E2E test pass rate | 100% (flaky < 1%) |
| Code coverage (unit) | ≥ 80% lines, ≥ 70% branches |
| Lint/TypeCheck | Zero errors |
| Bundle size | Within budget |

---

## 5. Test Data & Fixtures

- **Fixtures**: `/workspace/booknest/server/tests/fixtures/` — users, books, carts, orders
- **Factories**: `createUser()`, `createBook()`, `createCart()`, `createOrder()`
- **Seeded DB**: Consistent baseline for integration/E2E

---

## 6. Environments

| Env | Purpose | Tests Run |
|-----|---------|-----------|
| Local | Dev iteration | Unit, Integration (watch mode) |
| CI (PR) | Gate merges | Unit, Integration, E2E (smoke subset) |
| CI (main) | Release candidate | Full suite + performance |
| Staging | Pre-prod validation | Full E2E, smoke |

---

## 7. Reporting

- **CI**: JUnit XML + HTML coverage → artifact upload
- **Playwright**: HTML report + trace zip on failure
- **Dashboard**: Trends over time (coverage, duration, flakiness)

---

## 8. Maintenance

- Review flaky tests weekly → fix or quarantine
- Update selectors when UI changes (data-testid preferred)
- Add tests for new features before merge (Definition of Done)
- Quarterly: audit coverage gaps, remove obsolete tests