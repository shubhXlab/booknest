import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import express from 'express'
import http from 'http'
import { spawn } from 'child_process'
import path from 'path'

// Admin API integration tests using an in-memory Express server
// (avoids port/socket issues with spawning separate processes)

const authRoutes = require('../routes/auth')
const bookRoutes = require('../routes/books')
const cartRoutes = require('../routes/cart')
const orderRoutes = require('../routes/orders')
const adminRoutes = require('../routes/admin')
const { errorHandler } = require('../middleware/errorMiddleware')

let testServer: any
let baseUrl: string

function makeApp() {
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use('/api/auth', authRoutes)
  app.use('/api/books', bookRoutes)
  app.use('/api/cart', cartRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/admin', adminRoutes)
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
  app.use(errorHandler)
  return app
}

function request(options: any, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, baseUrl)
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: options.method,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers })
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers })
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function registerAndLogin(name: string, email: string, password = 'Password123') {
  await request({
    hostname: 'localhost', port: testServer.address().port, path: '/api/auth/register', method: 'POST',
  }, { name, email, password })

  const login = await request({
    hostname: 'localhost', port: testServer.address().port, path: '/api/auth/login', method: 'POST',
  }, { email, password })
  expect(login.status).toBe(200)
  expect(login.body).toHaveProperty('token')
  return login.body.token
}

describe('Admin APIs - Integration Tests (in-memory)', () => {
  let adminToken: string
  let customerToken: string

  beforeAll(async () => {
    // Ensure admin user exists in the shared SQLite DB
    try {
      spawn('node', ['scripts/create-admin.js'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'ignore',
      }).on('exit', () => {})
    } catch {}
    // Give the DB script a moment to complete
    await new Promise((r) => setTimeout(r, 800))

    const app = makeApp()
    testServer = http.createServer(app)
    await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://localhost:${testServer.address().port}`

    adminToken = await registerAndLogin('Admin User', 'admin@booknest.com', 'admin123')
  })

  beforeEach(async () => {
    customerToken = await registerAndLogin(
      `Customer ${Date.now()}`, `cust-${Date.now()}@example.com`
    )
  })

  afterAll(async () => {
    if (testServer) testServer.close()
  })

  // ---------- Authentication & RBAC ----------
  describe('Authentication & RBAC', () => {
    it('rejects admin endpoints without a token (401)', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/stats', method: 'GET',
      })
      expect(res.status).toBe(401)
    })

    it('rejects non-admin access to admin endpoints (403)', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/stats', method: 'GET',
      }, undefined, customerToken)
      expect(res.status).toBe(403)
    })

    it('allows admin access to admin endpoints with valid token', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/stats', method: 'GET',
      }, undefined, adminToken)
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('totalBooks')
      expect(res.body).toHaveProperty('totalUsers')
      expect(res.body).toHaveProperty('totalOrders')
      expect(res.body).toHaveProperty('totalSales')
      expect(typeof res.body.totalBooks).toBe('number')
      expect(typeof res.body.totalSales).toBe('number')
    })
  })

  // ---------- Dashboard Stats ----------
  describe('Admin Dashboard Stats', () => {
    it('returns stats with correct types', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/stats', method: 'GET',
      }, undefined, adminToken)
      expect(res.status).toBe(200)
      expect(res.body.totalBooks).toBeGreaterThanOrEqual(0)
      expect(res.body.totalUsers).toBeGreaterThanOrEqual(0)
      expect(res.body.totalOrders).toBeGreaterThanOrEqual(0)
    })
  })

  // ---------- Admin Books ----------
  describe('Admin Book Management', () => {
    it('lists all books', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/books', method: 'GET',
      }, undefined, adminToken)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.books)).toBe(true)
      expect(res.body.books.length).toBeGreaterThan(0)
      expect(res.body.pagination).toBeDefined()
    })

    it('creates a new book (admin)', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/books', method: 'POST',
      }, {
        title: 'Admin Test Book',
        author: 'QA Author',
        price: 19.99,
        description: 'A test book created by admin API',
        category_id: 1,
        stock: 10,
      }, adminToken)
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.title).toBe('Admin Test Book')
    })

    it('rejects book creation with missing fields', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/books', method: 'POST',
      }, { title: '' }, adminToken)
      expect(res.status).toBe(400)
    })

    it('updates a book (admin)', async () => {
      const createRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/books', method: 'POST',
      }, {
        title: 'To Be Updated',
        author: 'Author',
        price: 9.99,
        stock: 5,
      }, adminToken)
      const bookId = createRes.body.id

      const updRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: `/api/admin/books/${bookId}`, method: 'PUT',
      }, { title: 'Updated Title', price: 14.99 }, adminToken)
      expect(updRes.status).toBe(200)
      expect(updRes.body.title).toBe('Updated Title')
    })

    it('deletes a book (admin)', async () => {
      const createRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/books', method: 'POST',
      }, {
        title: 'To Be Deleted',
        author: 'Author',
        price: 5.00,
        stock: 1,
      }, adminToken)
      const bookId = createRes.body.id

      const delRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: `/api/admin/books/${bookId}`, method: 'DELETE',
      }, undefined, adminToken)
      expect(delRes.status).toBe(200)
    })

    it('returns 404 for updating non-existent book', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/books/999999', method: 'PUT',
      }, { title: 'Nope' }, adminToken)
      expect(res.status).toBe(404)
    })

    it('returns 404 for deleting non-existent book', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/books/999999', method: 'DELETE',
      }, undefined, adminToken)
      expect(res.status).toBe(404)
    })

    it('blocks non-admin from book CRUD', async () => {
      const postRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/books', method: 'POST',
      }, { title: 'X', author: 'Y', price: 1 }, customerToken)
      expect(postRes.status).toBe(403)
    })
  })

  // ---------- Admin Orders ----------
  describe('Admin Order Management', () => {
    it('lists all orders', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/orders', method: 'GET',
      }, undefined, adminToken)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.orders)).toBe(true)
      expect(res.body.pagination).toBeDefined()
    })

    it('returns order detail with items', async () => {
      // Create an order as customer
      const bookRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/books', method: 'GET',
      }, undefined, customerToken)
      const bookId = bookRes.body[0].id

      await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/cart/', method: 'POST',
      }, { book_id: bookId, quantity: 1 }, customerToken)

      const ordRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/orders', method: 'POST',
      }, { shipping_address: '123 Test St' }, customerToken)
      expect(ordRes.status).toBe(201)

      const detRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: `/api/admin/orders/${ordRes.body.id}`, method: 'GET',
      }, undefined, adminToken)
      expect(detRes.status).toBe(200)
      expect(detRes.body).toHaveProperty('id', ordRes.body.id)
      expect(Array.isArray(detRes.body.items)).toBe(true)
      expect(detRes.body.items.length).toBeGreaterThan(0)
    })

    it('updates order status through valid workflow transitions', async () => {
      const bookRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/books', method: 'GET',
      }, undefined, customerToken)
      const bookId = bookRes.body[0].id

      await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/cart/', method: 'POST',
      }, { book_id: bookId, quantity: 1 }, customerToken)

      const ordRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/orders', method: 'POST',
      }, { shipping_address: '123 Workflow St' }, customerToken)
      const orderId = ordRes.body.id

      // pending -> processing
      const p1 = await request({
        hostname: 'localhost', port: testServer.address().port, path: `/api/admin/orders/${orderId}/status`, method: 'PUT',
      }, { status: 'processing' }, adminToken)
      expect(p1.status).toBe(200)
      expect(p1.body.status).toBe('processing')

      // processing -> shipped
      const p2 = await request({
        hostname: 'localhost', port: testServer.address().port, path: `/api/admin/orders/${orderId}/status`, method: 'PUT',
      }, { status: 'shipped' }, adminToken)
      expect(p2.status).toBe(200)
      expect(p2.body.status).toBe('shipped')

      // shipped -> delivered
      const p3 = await request({
        hostname: 'localhost', port: testServer.address().port, path: `/api/admin/orders/${orderId}/status`, method: 'PUT',
      }, { status: 'delivered' }, adminToken)
      expect(p3.status).toBe(200)
      expect(p3.body.status).toBe('delivered')
    })

    it('rejects missing status on order update (400)', async () => {
      const bookRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/books', method: 'GET',
      }, undefined, customerToken)
      const bookId = bookRes.body[0].id

      await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/cart/', method: 'POST',
      }, { book_id: bookId, quantity: 1 }, customerToken)

      const ordRes = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/orders', method: 'POST',
      }, { shipping_address: '123 Invalid St' }, customerToken)
      const orderId = ordRes.body.id

      const bad = await request({
        hostname: 'localhost', port: testServer.address().port, path: `/api/admin/orders/${orderId}/status`, method: 'PUT',
      }, {}, adminToken)
      expect(bad.status).toBe(400)
    })

    it('returns 404 for status update on non-existent order', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/orders/999999/status', method: 'PUT',
      }, { status: 'shipped' }, adminToken)
      expect(res.status).toBe(404)
    })
  })

  // ---------- Admin Users ----------
  describe('Admin User Management', () => {
    it('lists all users', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/users', method: 'GET',
      }, undefined, adminToken)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.users)).toBe(true)
      expect(res.body.users.length).toBeGreaterThan(0)
      expect(res.body.pagination).toBeDefined()
    })

    it('returns 403 for non-admin accessing users', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/admin/users', method: 'GET',
      }, undefined, customerToken)
      expect(res.status).toBe(403)
    })
  })

  // ---------- Health ----------
  describe('Health', () => {
    it('health endpoint returns ok', async () => {
      const res = await request({
        hostname: 'localhost', port: testServer.address().port, path: '/api/health', method: 'GET',
      })
      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })
  })
})
