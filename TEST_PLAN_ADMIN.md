# BookNest Admin Panel Test Plan

## Overview
Comprehensive test strategy for the advanced Admin Panel (M5) and public UI polish. Covers admin dashboards, book/order/user/settings management, public UI flows, responsiveness, accessibility, and performance.

## Tooling
| Layer | Tool | Purpose |
|-------|------|---------|
| Unit / Integration (server) | Vitest (Vite-native, Node env) | Admin API endpoints, RBAC, validation, DB transactions |
| Unit (client) | Vitest (jsdom) | AdminDashboard + admin component rendering, state, user interactions |
| E2E | Playwright (cross-browser) | Full admin flows end-to-end against a running server + client |
| Performance | Lighthouse | Bundle size, load performance, Core Web Vitals |
| Accessibility | axe-core / Playwright axe | ARIA labels, keyboard nav, color contrast |
| Coverage | v8 (built into Vitest) | Line/branch coverage thresholds |

## Test File Locations

| Type | Path |
|------|------|
| Plan | `/workspace/booknest/TEST_PLAN_ADMIN.md` |
| Server: Admin API integration | `/workspace/booknest/server/tests/admin.test.ts` |
| Client: AdminDashboard unit | `/workspace/booknest/client/tests/admin-dashboard.test.jsx` |
| E2E: Admin flows | `/workspace/booknest/client/tests/e2e/admin.spec.ts` |
| E2E: Public UI polish | `/workspace/booknest/client/tests/e2e/public-ui.spec.ts` |
| Smoke Tests | `/workspace/booknest/server/smoke-test.js` |

---

## 1. Admin Dashboard — stats accuracy, chart rendering, date range filters

### Endpoints under test
- `GET /api/admin/stats` — totalBooks, totalUsers, totalOrders, totalSales
- `GET /api/admin/analytics/sales` — daily/weekly/monthly revenue (period, startDate, endDate)
- `GET /api/admin/analytics/top-books` — bestsellers with quantity sold
- `GET /api/admin/analytics/top-categories` — category performance

### Scenarios
| ID | Scenario | Expected |
|----|----------|----------|
| ADM-DASH-01 | Stats endpoint returns counts as numbers | 200, `totalBooks`/`totalUsers`/`totalOrders` are numbers |
| ADM-DASH-02 | Sales analytics respects `period` query param | 200, array of daily/weekly/monthly points |
| ADM-DASH-03 | Sales analytics respects `startDate`/`endDate` range | 200, points filtered to range |
| ADM-DASH-04 | Top books returns bestsellers ordered by quantity | 200, sorted desc by qty |
| ADM-DASH-05 | Top categories returns category performance | 200, includes revenue per category |
| ADM-DASH-06 | Non-admin user accessing stats gets 403 | 403 |
| ADM-DASH-07 | No auth token accessing stats gets 401 | 401 |
| ADM-DASH-08 | Dashboard renders all four stat cards | Cards visible: revenue, orders, users, books |
| ADM-DASH-09 | Dashboard shows loading state before data loads | Skeleton/spinner visible while loading |
| ADM-DASH-10 | Date range filter updates chart data | Chart re-renders with filtered points |

---

## 2. Book Management — CRUD, search/sort/filter/pagination, bulk actions, image upload validation

### Endpoints under test
- `GET /api/admin/books` — paginated, search, filter (category, price range, stock status), sort
- `POST /api/admin/books` — create with image upload (multipart)
- `PUT /api/admin/books/:id` — update, handle image replacement
- `DELETE /api/admin/books/:id` — soft delete
- `POST /api/admin/books/bulk` — bulk actions (delete, publish/unpublish, category change)
- `GET /api/books/categories` — category list (used by admin form)

### Scenarios
| ID | Scenario | Expected |
|----|----------|----------|
| ADM-BOOK-01 | List books paginated with defaults | 200, array of books |
| ADM-BOOK-02 | Search filters by title/author | 200, matching books only |
| ADM-BOOK-03 | Filter by category | 200, books in that category |
| ADM-BOOK-04 | Filter by price range (min/max) | 200, books within range |
| ADM-BOOK-05 | Filter by stock status (in stock/out of stock) | 200, correct subset |
| ADM-BOOK-06 | Sort by title/price/created_at | 200, correctly ordered |
| ADM-BOOK-07 | Create book with valid data + image | 201, book returned with image_url |
| ADM-BOOK-08 | Create book missing required fields → 400 | 400 (title/author/price) |
| ADM-BOOK-09 | Create book with invalid image type → 400 | 400 |
| ADM-BOOK-10 | Update book fields | 200, updated values reflected |
| ADM-BOOK-11 | Update book replaces image | 200, new image_url |
| ADM-BOOK-12 | Delete book (soft delete) | 200, book excluded from list |
| ADM-BOOK-13 | Bulk delete multiple books | 200, all removed |
| ADM-BOOK-14 | Bulk publish/unpublish | 200, `published` flag toggled |
| ADM-BOOK-15 | Bulk category change | 200, category_id updated |
| ADM-BOOK-16 | Non-admin blocked from book CRUD | 403 |
| ADM-BOOK-17 | Admin books table renders in UI | Rows visible with title/price/stock |
| ADM-BOOK-18 | Add book form submits via UI | New row appears in table |

---

## 3. Order Management — status workflow (all transitions), detail modal, CSV export

### Endpoints under test
- `GET /api/admin/orders` — paginated, filter (status, date range, user), sort
- `GET /api/admin/orders/:id` — full detail with items, timeline
- `PUT /api/admin/orders/:id/status` — status transition (validate workflow)
- `GET /api/admin/orders/export` — CSV export with filters

### Status workflow
`pending → processing → shipped → delivered` or `pending → cancelled`

### Scenarios
| ID | Scenario | Expected |
|----|----------|----------|
| ADM-ORDER-01 | List orders paginated | 200, array with items joined |
| ADM-ORDER-02 | Filter orders by status | 200, matching status only |
| ADM-ORDER-03 | Filter orders by date range | 200, orders within range |
| ADM-ORDER-04 | Get order detail with items | 200, `items` array populated |
| ADM-ORDER-05 | Transition pending → processing | 200, status = processing |
| ADM-ORDER-06 | Transition processing → shipped | 200, status = shipped |
| ADM-ORDER-07 | Transition shipped → delivered | 200, status = delivered |
| ADM-ORDER-08 | Transition pending → cancelled | 200, status = cancelled |
| ADM-ORDER-09 | Invalid transition (delivered → pending) → 400 | 400 |
| ADM-ORDER-10 | CSV export returns text/csv | 200, content-type text/csv |
| ADM-ORDER-11 | CSV export respects status filter | CSV contains only filtered orders |
| ADM-ORDER-12 | Order detail modal opens in UI | Modal visible with items |
| ADM-ORDER-13 | Status workflow dropdown updates order | Status changes in UI |
| ADM-ORDER-14 | Non-admin blocked from order management | 403 |

---

## 4. User Management — role toggle, ban/unban, order history

### Endpoints under test
- `GET /api/admin/users` — paginated, search, filter (role, status), sort
- `PUT /api/admin/users/:id/role` — toggle admin/user
- `PUT /api/admin/users/:id/status` — ban/unban
- `GET /api/admin/users/:id/orders` — user's order history

### Scenarios
| ID | Scenario | Expected |
|----|----------|----------|
| ADM-USER-01 | List users paginated | 200, array with id/name/email/role |
| ADM-USER-02 | Filter users by role (admin/customer) | 200, matching role only |
| ADM-USER-03 | Filter users by status (active/banned) | 200, matching status only |
| ADM-USER-04 | Toggle user role to admin | 200, role = admin |
| ADM-USER-05 | Toggle user role back to customer | 200, role = customer |
| ADM-USER-06 | Ban user (status inactive) | 200, is_active = 0 |
| ADM-USER-07 | Unban user (status active) | 200, is_active = 1 |
| ADM-USER-08 | Get user's order history | 200, array of orders |
| ADM-USER-09 | Cannot ban self (admin) | 400 |
| ADM-USER-10 | Non-admin blocked from user management | 403 |
| ADM-USER-11 | User table renders with role toggle | Toggle visible per row |
| ADM-USER-12 | Ban/unban updates status badge | Badge reflects active/banned |

---

## 5. Settings — config persistence, validation

### Endpoints under test
- `GET /api/admin/settings` — site config
- `PUT /api/admin/settings` — update config (site name, currency, email, payment keys)

### Scenarios
| ID | Scenario | Expected |
|----|----------|----------|
| ADM-SETTING-01 | Get settings returns key-value config | 200, config object |
| ADM-SETTING-02 | Update site name persists | 200, subsequent GET returns new name |
| ADM-SETTING-03 | Update currency persists | 200 |
| ADM-SETTING-04 | Update email config persists | 200 |
| ADM-SETTING-05 | Invalid payment key format → 400 | 400 |
| ADM-SETTING-06 | Non-admin blocked from settings | 403 |
| ADM-SETTING-07 | Settings page persists changes in UI | Form reflects saved values |

---

## 6. Public UI — Homepage animations, filters, dark mode, cart/checkout flow

### Scenarios
| ID | Scenario | Expected |
|----|----------|----------|
| PUB-UI-01 | Homepage hero animation plays on load | Hero element visible/animated |
| PUB-UI-02 | Featured categories render | Category cards visible |
| PUB-UI-03 | Testimonials section renders | Testimonial cards visible |
| PUB-UI-04 | Newsletter signup accepts email | Submission success state |
| PUB-UI-05 | Books page advanced filters (price, rating, author, genre) | Filter results update |
| PUB-UI-06 | Grid/list toggle switches view | Layout changes |
| PUB-UI-07 | Infinite scroll loads more books | Additional books appear on scroll |
| PUB-UI-08 | Product page image gallery renders | Gallery images visible |
| PUB-UI-09 | Product page reviews/ratings render | Rating stars + reviews visible |
| PUB-UI-10 | Related books carousel renders | Related books visible |
| PUB-UI-11 | Dark mode toggle switches theme | `dark` class applied to root |
| PUB-UI-12 | Cart/checkout progress indicator shows steps | Stepper visible |
| PUB-UI-13 | Order summary sidebar shows totals | Subtotal/tax/total visible |
| PUB-UI-14 | Toast notifications appear on action | Toast visible after add-to-cart |
| PUB-UI-15 | Loading skeletons appear during data fetch | Skeleton visible while loading |

---

## 7. Responsive — mobile/tablet/desktop admin layout

### Scenarios
| ID | Scenario | Viewport | Expected |
|----|----------|----------|----------|
| RSP-01 | Admin sidebar collapses on mobile | 375px | Sidebar hidden/collapsible |
| RSP-02 | Admin sidebar expanded on desktop | 1280px | Sidebar fully visible |
| RSP-03 | Stats cards stack on mobile | 375px | Single column grid |
| RSP-04 | Stats cards 4-col on desktop | 1280px | 4-column grid |
| RSP-05 | Books table scrolls horizontally on mobile | 375px | Table horizontally scrollable |
| RSP-06 | Top bar user menu accessible on mobile | 375px | Menu button visible |
| RSP-07 | Admin forms usable on tablet | 768px | Inputs tappable, form submits |

---

## 8. Accessibility — keyboard nav, ARIA labels, color contrast

### Scenarios
| ID | Scenario | Expected |
|----|----------|----------|
| A11Y-01 | Admin sidebar reachable via Tab | Focus moves through nav items |
| A11Y-02 | Buttons have accessible names | ARIA label or text content present |
| A11Y-03 | Form inputs have associated labels | `label` or `aria-label` present |
| A11Y-04 | Color contrast meets WCAG AA | Contrast ratio ≥ 4.5:1 for text |
| A11Y-05 | Modal traps focus | Focus stays within modal when open |
| A11Y-06 | Escape key closes modal/dropdown | Modal closes on Esc |
| A11Y-07 | Status dropdown keyboard operable | Arrow keys + Enter change status |
| A11Y-08 | No axe violations on admin pages | 0 critical/serious violations |

---

## 9. Performance — bundle size, lazy loading, skeleton states

### Scenarios
| ID | Scenario | Threshold |
|----|----------|-----------|
| PERF-01 | Admin bundle size within budget | < 500 KB gzipped |
| PERF-02 | Lazy-loaded routes split chunks | Separate chunks per route |
| PERF-03 | Skeleton states render before data | Skeleton visible < 100ms |
| PERF-04 | Lighthouse performance score | ≥ 90 |
| PERF-05 | Lighthouse accessibility score | ≥ 90 |
| PERF-06 | Admin dashboard time-to-interactive | < 3s |

---

## 10. Quality Gates (CI)

| Gate | Threshold |
|------|-----------|
| Unit test pass rate (server admin) | 100% |
| Unit test pass rate (client admin) | 100% |
| E2E test pass rate | 100% (flaky < 1%) |
| Code coverage (admin APIs) | ≥ 80% lines, ≥ 70% branches |
| Lighthouse performance | ≥ 90 |
| Lighthouse accessibility | ≥ 90 |
| Axe accessibility violations | 0 critical/serious |
| Lint/TypeCheck | Zero errors |

---

## 11. Test Data & Fixtures

- **Admin user**: `admin@booknest.com` / `admin123` (created via `server/scripts/create-admin.js`)
- **Customer user**: registered per test with unique email
- **Seed data**: 6 categories, 6 books (from `server/scripts/seed.js`)
- **Test DB**: `server/database.sqlite` — reset between test runs via seed
- **Auth**: JWT token from login endpoint, sent as `Bearer` header

---

## 12. Environments

| Env | Purpose | Tests Run |
|-----|---------|-----------|
| Local | Dev iteration | Unit, Integration (watch mode) |
| CI (PR) | Gate merges | Unit, Integration, E2E (smoke subset) |
| CI (main) | Release candidate | Full suite + Lighthouse + Axe |
| Staging | Pre-prod validation | Full E2E, smoke, accessibility |

---

## 13. Reporting

- **CI**: JUnit XML + HTML coverage → artifact upload
- **Playwright**: HTML report + trace zip on failure
- **Lighthouse**: HTML report per run
- **Dashboard**: Trends over time (coverage, duration, flakiness, Lighthouse scores)

---

## 14. Maintenance

- Review flaky tests weekly → fix or quarantine
- Update selectors when UI changes (data-testid preferred)
- Add tests for new admin features before merge (Definition of Done)
- Quarterly: audit coverage gaps, remove obsolete tests
- Update this plan when new admin endpoints/pages are added
