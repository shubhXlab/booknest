import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import http from 'http'
import { spawn } from 'child_process'
import path from 'path'

let serverProc: any
const baseUrl = 'http://localhost:5997'

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
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function waitForServer(maxRetries = 30): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const r = await request({ hostname: 'localhost', port: 5997, path: '/api/health', method: 'GET' })
      if (r.status === 200) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

describe('Order Placement Flow - Integration Tests', () => {
  let authToken: string

  beforeEach(async () => {
    serverProc = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: '5997' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const ready = await waitForServer()
    if (!ready) throw new Error('Server failed to start')

    // Register and login a user
    const email = `order-${Date.now()}@example.com`
    await request({ hostname: 'localhost', port: 5997, path: '/api/auth/register', method: 'POST' }, {
      name: 'Order User', email, password: 'Password123',
    })

    const login = await request({ hostname: 'localhost', port: 5997, path: '/api/auth/login', method: 'POST' }, {
      email, password: 'Password123',
    })
    authToken = login.body.token
  })

  afterEach(async () => {
    serverProc.kill()
    await new Promise((r) => setTimeout(r, 500))
  })

  it('complete order flow: browse -> add to cart -> checkout -> order created', async () => {
    // 1. Browse books
    const books = await request({ hostname: 'localhost', port: 5997, path: '/api/books', method: 'GET' })
    expect(books.status).toBe(200)
    expect(books.body.length).toBeGreaterThan(0)

    const book = books.body[0]

    // 2. Add to cart
    const cartAdd = await request({
      hostname: 'localhost', port: 5997, path: '/api/cart/', method: 'POST',
    }, { book_id: book.id, quantity: 2 }, authToken)

    expect(cartAdd.status).toBe(201 || 200)

    // 3. Get cart
    const cartGet = await request({
      hostname: 'localhost', port: 5997, path: '/api/cart/', method: 'GET',
    }, undefined, authToken)

    expect(cartGet.status).toBe(200)
    expect(Array.isArray(cartGet.body)).toBe(true)
    expect(cartGet.body.length).toBeGreaterThan(0)

    // 4. Create order from cart
    const order = await request({
      hostname: 'localhost', port: 5997, path: '/api/orders', method: 'POST',
    }, { shipping_address: '123 Main St, NYC, 10001' }, authToken)

    expect(order.status).toBe(201)
    expect(order.body.status).toBe('pending')
    expect(order.body.total_amount).toBeGreaterThan(0)

    // 5. Cart should be cleared after order
    const cartAfter = await request({
      hostname: 'localhost', port: 5997, path: '/api/cart/', method: 'GET',
    }, undefined, authToken)

    expect(cartAfter.status).toBe(200)
    expect(cartAfter.body.length).toBe(0)

    // 6. List user orders
    const orders = await request({
      hostname: 'localhost', port: 5997, path: '/api/orders', method: 'GET',
    }, undefined, authToken)

    expect(orders.status).toBe(200)
    expect(orders.body.length).toBeGreaterThan(0)
    expect(orders.body[0].id).toBe(order.body.id)

    // 7. Get single order detail
    const orderDetail = await request({
      hostname: 'localhost', port: 5997, path: `/api/orders/${order.body.id}`, method: 'GET',
    }, undefined, authToken)

    expect(orderDetail.status).toBe(200)
    expect(orderDetail.body.id).toBe(order.body.id)
    expect(orderDetail.body.items.length).toBeGreaterThan(0)
  })

  it('cannot create order from empty cart', async () => {
    const order = await request({
      hostname: 'localhost', port: 5997, path: '/api/orders', method: 'POST',
    }, { shipping_address: '123 Main St, NYC, 10001' }, authToken)

    expect(order.status).toBe(400)
  })

  it('cannot access another user order', async () => {
    // Create an order
    await request({
      hostname: 'localhost', port: 5997, path: '/api/cart/', method: 'POST',
    }, { book_id: 1, quantity: 1 }, authToken)

    const order = await request({
      hostname: 'localhost', port: 5997, path: '/api/orders', method: 'POST',
    }, { shipping_address: '123 Main St, NYC, 10001' }, authToken)

    expect(order.status).toBe(201)

    // Register a different user
    const email2 = `other-${Date.now()}@example.com`
    await request({ hostname: 'localhost', port: 5997, path: '/api/auth/register', method: 'POST' }, {
      name: 'Other User', email: email2, password: 'Password123',
    })

    const login2 = await request({ hostname: 'localhost', port: 5997, path: '/api/auth/login', method: 'POST' }, {
      email: email2, password: 'Password123',
    })
    const token2 = login2.body.token

    // Try to access the first user's order
    const forbidden = await request({
      hostname: 'localhost', port: 5997, path: `/api/orders/${order.body.id}`, method: 'GET',
    }, undefined, token2)

    expect(forbidden.status).toBe(403)
  })
})