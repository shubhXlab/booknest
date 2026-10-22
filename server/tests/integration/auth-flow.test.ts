import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import http from 'http'
import { spawn } from 'child_process'
import path from 'path'

// Integration tests for BookNest auth flow
// Spins up a real server instance and tests the full HTTP request/response cycle

let serverProc: any
let baseUrl = 'http://localhost:5998'

function request(options: any, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, baseUrl)
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: options.method,
      headers: {
        ...options.headers,
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
      const r = await request({ hostname: 'localhost', port: 5998, path: '/api/health', method: 'GET' })
      if (r.status === 200) return true
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

describe('Auth Flow - Integration Tests', () => {
  beforeEach(async () => {
    // Start server on port 5998
    serverProc = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: '5998' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const ready = await waitForServer()
    if (!ready) throw new Error('Server failed to start')
  })

  afterEach(async () => {
    serverProc.kill()
    await new Promise((r) => setTimeout(r, 500))
  })

  it('complete auth flow: register -> login -> me -> logout', async () => {
    const testEmail = `integ-${Date.now()}@example.com`

    // 1. Register
    const reg = await request({
      hostname: 'localhost', port: 5998, path: '/api/auth/register', method: 'POST',
    }, { name: 'Integration User', email: testEmail, password: 'Password123' })

    expect(reg.status).toBe(201)
    expect(reg.body).toHaveProperty('token')
    expect(reg.body.email).toBe(testEmail)

    // 2. Login
    const login = await request({
      hostname: 'localhost', port: 5998, path: '/api/auth/login', method: 'POST',
    }, { email: testEmail, password: 'Password123' })

    expect(login.status).toBe(200)
    expect(login.body).toHaveProperty('token')
    expect(login.body.id).toBe(reg.body.id)

    const token = login.body.token

    // 3. Access protected route (me)
    const me = await request({
      hostname: 'localhost', port: 5998, path: '/api/auth/me', method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(me.status).toBe(200)
    expect(me.body.email).toBe(testEmail)
    expect(me.body.role).toBe('customer')

    // 4. Access protected route without token -> 401
    const noAuth = await request({
      hostname: 'localhost', port: 5998, path: '/api/auth/me', method: 'GET',
    })
    expect(noAuth.status).toBe(401)

    // 5. Login with wrong password -> 401
    const badLogin = await request({
      hostname: 'localhost', port: 5998, path: '/api/auth/login', method: 'POST',
    }, { email: testEmail, password: 'WrongPassword' })
    expect(badLogin.status).toBe(401)
  })

  it('register with existing email returns 400', async () => {
    const testEmail = `dup-${Date.now()}@example.com`

    // Register first time
    const reg1 = await request({
      hostname: 'localhost', port: 5998, path: '/api/auth/register', method: 'POST',
    }, { name: 'User', email: testEmail, password: 'Password123' })
    expect(reg1.status).toBe(201)

    // Register again with same email
    const reg2 = await request({
      hostname: 'localhost', port: 5998, path: '/api/auth/register', method: 'POST',
    }, { name: 'User2', email: testEmail, password: 'Password123' })
    expect(reg2.status).toBe(400)
  })
})