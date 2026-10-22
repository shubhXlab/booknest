#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function waitForServer(maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const r = await request({
        hostname: 'localhost', port: 5999, path: '/api/health', method: 'GET',
      });
      if (r.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  // Start server on port 5999 to avoid conflicts
  const serverProc = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: '5999' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProc.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  serverProc.stderr.on('data', (d) => process.stderr.write(`[server-err] ${d}`));

  const ready = await waitForServer();
  if (!ready) {
    console.error('Server failed to start');
    serverProc.kill();
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  function check(name, cond, detail = '') {
    if (cond) { passed++; console.log(`  PASS: ${name}`); }
    else { failed++; console.log(`  FAIL: ${name} ${detail || ''}`); }
  }

  const base = { hostname: 'localhost', port: 5999 };

  // === AUTH ===
  console.log('\n=== AUTH ===');
  const reg = await request({ ...base, path: '/api/auth/register', method: 'POST' }, {
    name: 'Smoke User', email: 'smoke@example.com', password: 'Password123',
  });
  check('Register', reg.status === 201 || reg.status === 400, `status=${reg.status} body=${JSON.stringify(reg.body).slice(0,150)}`);

  const login = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: 'smoke@example.com', password: 'Password123',
  });
  console.log(`  Login: status=${login.status} body=${JSON.stringify(login.body).slice(0,150)}`);
  const token = login.body.token;
  check('Login returns token', !!token && login.status === 200, `status=${login.status}`);

  const me = await request({
    ...base, path: '/api/auth/me', method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  check('Me returns user', me.status === 200 && !!me.body.id, `status=${me.status}`);

  // === BOOKS ===
  console.log('\n=== BOOKS ===');
  const cats = await request({ ...base, path: '/api/books/categories', method: 'GET' });
  check('Categories returns 6', cats.status === 200 && cats.body.length === 6, `count=${cats.body.length}`);

  const books = await request({ ...base, path: '/api/books', method: 'GET' });
  check('Books returns 6', books.status === 200 && books.body.length === 6, `count=${books.body.length}`);

  const book1 = await request({ ...base, path: '/api/books/1', method: 'GET' });
  check('Book detail id=1', book1.status === 200 && book1.body.title === 'The Great Gatsby', `status=${book1.status}`);

  const book999 = await request({ ...base, path: '/api/books/999', method: 'GET' });
  check('Book detail id=999 returns 404', book999.status === 404, `status=${book999.status}`);

  // === CART ===
  console.log('\n=== CART ===');
  const cartAdd = await request({
    ...base, path: '/api/cart/', method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, { book_id: 1, quantity: 2 });
  check('Cart add', cartAdd.status === 201 || cartAdd.status === 200, `status=${cartAdd.status}`);

  const cartGet = await request({
    ...base, path: '/api/cart/', method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  check('Cart get returns items', cartGet.status === 200 && Array.isArray(cartGet.body), `status=${cartGet.status}`);

  const cartItemId = Array.isArray(cartGet.body) && cartGet.body.length > 0 ? cartGet.body[0].id : null;
  if (cartItemId) {
    const cartUpd = await request({
      ...base, path: `/api/cart/${cartItemId}`, method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }, { quantity: 5 });
    check('Cart update', cartUpd.status === 200, `status=${cartUpd.status}`);
  }

  // === ORDERS ===
  console.log('\n=== ORDERS ===');
  const createOrder = await request({
    ...base, path: '/api/orders', method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, { shipping_address: '123 Main St, NYC, 10001' });
  check('Create order', createOrder.status === 201 && createOrder.body.status === 'pending', `status=${createOrder.status}`);

  const ordersList = await request({
    ...base, path: '/api/orders', method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  check('Orders list', ordersList.status === 200 && ordersList.body.length >= 1, `count=${ordersList.body.length}`);

  const orderId = ordersList.body.length > 0 ? ordersList.body[0].id : null;
  if (orderId) {
    const orderDetail = await request({
      ...base, path: `/api/orders/${orderId}`, method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    check('Order detail', orderDetail.status === 200 && orderDetail.body.id === orderId, `status=${orderDetail.status}`);
  }

  // === EDGE CASES ===
  console.log('\n=== EDGE CASES ===');
  const noAuth = await request({ ...base, path: '/api/cart/', method: 'GET' });
  check('Cart without auth returns 401', noAuth.status === 401, `status=${noAuth.status}`);

  const emptyOrder = await request({
    ...base, path: '/api/orders', method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }, { shipping_address: 'somewhere' });
  check('Order from empty cart returns 400', emptyOrder.status === 400, `status=${emptyOrder.status}`);

  // === ADMIN ===
  console.log('\n=== ADMIN ===');
  // Create admin user via script
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/create-admin.js', { cwd: __dirname, stdio: 'pipe' });
  } catch {}

  const adminLogin = await request({ ...base, path: '/api/auth/login', method: 'POST' }, {
    email: 'admin@booknest.com', password: 'admin123',
  });
  const adminToken = adminLogin.body.token;
  check('Admin login returns token', !!adminToken && adminLogin.status === 200, `status=${adminLogin.status}`);

  if (adminToken) {
    const adminStats = await request({
      ...base, path: '/api/admin/stats', method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    check('Admin stats', adminStats.status === 200 && typeof adminStats.body.totalBooks === 'number', `status=${adminStats.status}`);

    const adminOrders = await request({
      ...base, path: '/api/admin/orders', method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    check('Admin orders list', adminOrders.status === 200 && Array.isArray(adminOrders.body), `status=${adminOrders.status}`);

    const adminUsers = await request({
      ...base, path: '/api/admin/users', method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    check('Admin users list', adminUsers.status === 200 && Array.isArray(adminUsers.body), `status=${adminUsers.status}`);

    const adminBooks = await request({
      ...base, path: '/api/admin/books', method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    check('Admin books list', adminBooks.status === 200 && Array.isArray(adminBooks.body), `status=${adminBooks.status}`);

    // Update order status
    if (ordersList.body.length > 0) {
      const orderId = ordersList.body[0].id;
      const statusUpd = await request({
        ...base, path: `/api/admin/orders/${orderId}/status`, method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, { status: 'shipped' });
      check('Admin update order status', statusUpd.status === 200 && statusUpd.body.status === 'shipped', `status=${statusUpd.status}`);
    }

    // Non-admin accessing admin returns 403
    const forbidden = await request({
      ...base, path: '/api/admin/stats', method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    check('Non-admin blocked from admin (403)', forbidden.status === 403, `status=${forbidden.status}`);
  }

  // Cleanup
  serverProc.kill();

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});