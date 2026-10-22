const express = require('express');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { protect, admin } = require('../middleware/authMiddleware');
const { conditionalUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// ============================================================
// DASHBOARD ANALYTICS
// ============================================================

// GET /api/admin/stats — revenue, orders, users, books count, growth %
router.get(
  '/stats',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const totalBooksRow = await db.prepare('SELECT COUNT(*) AS c FROM books WHERE deleted_at IS NULL').get();
    const totalUsersRow = await db.prepare('SELECT COUNT(*) AS c FROM users').get();
    const totalOrdersRow = await db.prepare('SELECT COUNT(*) AS c FROM orders').get();
    const totalSalesRow = await db
      .prepare('SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders')
      .get();

    // Growth %: compare this month vs last month for orders
    const thisMonthRow = await db
      .prepare(
        'SELECT COUNT(*) AS c FROM orders WHERE created_at >= date(\'now\', \'start of month\')'
      )
      .get();
    const lastMonthRow = await db
      .prepare(
        'SELECT COUNT(*) AS c FROM orders WHERE created_at >= date(\'now\', \'-1 month\', \'start of month\') AND created_at < date(\'now\', \'start of month\')'
      )
      .get();

    const thisMonth = thisMonthRow.c;
    const lastMonth = lastMonthRow.c || 0;
    const growthPct = lastMonth === 0 ? 0 : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

    res.json({
      totalBooks: totalBooksRow.c,
      totalUsers: totalUsersRow.c,
      totalOrders: totalOrdersRow.c,
      totalSales: totalSalesRow.total,
      growthPct,
    });
  })
);

// GET /api/admin/analytics/sales — daily/weekly/monthly revenue
router.get(
  '/analytics/sales',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { period = 'daily', startDate, endDate } = req.query;

    let dateFormat;
    switch (period) {
    case 'weekly':
      dateFormat = 'strftime(\'%Y-%W\', created_at)';
      break;
    case 'monthly':
      dateFormat = 'strftime(\'%Y-%m\', created_at)';
      break;
    default:
      dateFormat = 'date(created_at)';
    }

    let where = '';
    const params = [];
    if (startDate) {
      where += 'WHERE created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += `${where ? ' AND' : ' WHERE'} created_at <= ?`;
      params.push(endDate);
    }

    const rows = await db
      .prepare(
        `SELECT ${dateFormat} AS period, COUNT(*) AS orders, COALESCE(SUM(total_amount), 0) AS revenue FROM orders ${where} GROUP BY period ORDER BY period`
      )
      .all(...params);

    res.json(rows);
  })
);

// GET /api/admin/analytics/top-books — bestsellers with quantity sold
router.get(
  '/analytics/top-books',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const limit = Number(req.query.limit || 10);
    const rows = await db
      .prepare(
        `SELECT b.id, b.title, b.author, b.image_url,
                SUM(oi.quantity) AS quantity_sold,
                COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
         FROM order_items oi
         JOIN books b ON b.id = oi.book_id
         GROUP BY b.id
         ORDER BY quantity_sold DESC
         LIMIT ?`
      )
      .all(limit);
    res.json(rows);
  })
);

// GET /api/admin/analytics/top-categories — category performance
router.get(
  '/analytics/top-categories',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const rows = await db
      .prepare(
        `SELECT c.id, c.name,
                COUNT(DISTINCT o.id) AS orders,
                COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
         FROM categories c
         LEFT JOIN books b ON b.category_id = c.id
         LEFT JOIN order_items oi ON oi.book_id = b.id
         LEFT JOIN orders o ON o.id = oi.order_id
         GROUP BY c.id
         ORDER BY revenue DESC`
      )
      .all();
    res.json(rows);
  })
);

// ============================================================
// BOOK MANAGEMENT
// ============================================================

// GET /api/admin/books — paginated, search, filter, sort
router.get(
  '/books',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const { search, category, minPrice, maxPrice, stock, sort = 'created_at', order = 'DESC', published } = req.query;

    let sql = 'SELECT b.*, c.name AS category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE b.deleted_at IS NULL';
    const params = [];

    if (search) {
      sql += ' AND (b.title LIKE ? OR b.author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND c.name = ?';
      params.push(category);
    }
    if (minPrice) {
      sql += ' AND b.price >= ?';
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      sql += ' AND b.price <= ?';
      params.push(Number(maxPrice));
    }
    if (stock === 'in_stock') {
      sql += ' AND b.stock > 0';
    } else if (stock === 'out_of_stock') {
      sql += ' AND b.stock <= 0';
    } else if (stock === 'low_stock') {
      sql += ' AND b.stock > 0 AND b.stock <= 10';
    }
    if (published !== undefined) {
      sql += ' AND b.published = ?';
      params.push(published === 'true' ? 1 : 0);
    }

    const validSort = ['title', 'author', 'price', 'stock', 'created_at', 'id'];
    const sortField = validSort.includes(sort) ? sort : 'created_at';
    const sortDir = order === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY b.${sortField} ${sortDir}`;

    const countRow = await db.prepare(`SELECT COUNT(*) AS c FROM (${sql})`).all(...params);
    const total = countRow[0].c;

    sql += ' LIMIT ? OFFSET ?';
    const books = await db.prepare(sql).all(...params, limit, (page - 1) * limit);

    res.json({
      books,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

// POST /api/admin/books — create with image upload
router.post(
  '/books',
  protect,
  admin,
  conditionalUpload('image'),
  asyncHandler(async (req, res) => {
    const { title, author, price, description, category_id, stock, published } = req.body;
    if (!title || !author || !price) {
      res.status(400);
      throw new Error('Please add title, author, price');
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await db
      .prepare(
        'INSERT INTO books (title, author, price, description, category_id, stock, image_url, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        title,
        author,
        Number(price),
        description || '',
        category_id || null,
        Number(stock || 0),
        imageUrl,
        published === 'false' ? 0 : 1
      );

    const book = await db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(book);
  })
);

// PUT /api/admin/books/:id — update, handle image replacement
router.put(
  '/books/:id',
  protect,
  admin,
  conditionalUpload('image'),
  asyncHandler(async (req, res) => {
    const { title, author, price, description, category_id, stock, published } = req.body;

    const existing = await db.prepare('SELECT * FROM books WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('Book not found');
    }

    let imageUrl = existing.image_url;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    await db
      .prepare(
        'UPDATE books SET title = ?, author = ?, price = ?, description = ?, category_id = ?, stock = ?, image_url = ?, published = ? WHERE id = ? AND deleted_at IS NULL'
      )
      .run(
        title || existing.title,
        author || existing.author,
        price !== undefined ? Number(price) : existing.price,
        description !== undefined ? description : existing.description,
        category_id !== undefined ? (category_id || null) : existing.category_id,
        stock !== undefined ? Number(stock) : existing.stock,
        imageUrl,
        published !== undefined ? (published === 'false' ? 0 : 1) : existing.published,
        req.params.id
      );

    const book = await db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    res.json(book);
  })
);

// DELETE /api/admin/books/:id — soft delete
router.delete(
  '/books/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const existing = await db.prepare('SELECT id FROM books WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('Book not found');
    }

    await db.prepare('UPDATE books SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.json({ message: 'Book removed' });
  })
);

// POST /api/admin/books/bulk — bulk actions (delete, publish/unpublish, category change)
router.post(
  '/books/bulk',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { action, bookIds, data } = req.body;
    if (!action || !Array.isArray(bookIds) || bookIds.length === 0) {
      res.status(400);
      throw new Error('Action and bookIds are required');
    }

    const placeholders = bookIds.map(() => '?').join(',');

    switch (action) {
    case 'delete':
      await db.prepare(`UPDATE books SET deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND deleted_at IS NULL`).run(...bookIds);
      break;
    case 'publish':
      await db.prepare(`UPDATE books SET published = 1 WHERE id IN (${placeholders})`).run(...bookIds);
      break;
    case 'unpublish':
      await db.prepare(`UPDATE books SET published = 0 WHERE id IN (${placeholders})`).run(...bookIds);
      break;
    case 'change_category':
      if (data === undefined || data.category_id === undefined) {
        res.status(400);
        throw new Error('category_id is required for change_category action');
      }
      await db.prepare(`UPDATE books SET category_id = ? WHERE id IN (${placeholders})`).run(data.category_id, ...bookIds);
      break;
    default:
      res.status(400);
      throw new Error(`Unknown bulk action: ${action}`);
    }

    res.json({ message: `Bulk ${action} completed`, affected: bookIds.length });
  })
);

// ============================================================
// ORDER MANAGEMENT
// ============================================================

const ORDER_STATUS_FLOW = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function validateStatusTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) return true;
  const allowed = ORDER_STATUS_FLOW[currentStatus] || [];
  return allowed.includes(newStatus);
}

// GET /api/admin/orders — paginated, filter, sort
router.get(
  '/orders',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const { status, startDate, endDate, user, sort = 'created_at', order = 'DESC', search } = req.query;

    let sql = 'SELECT o.*, u.name, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (startDate) {
      sql += ' AND o.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND o.created_at <= ?';
      params.push(endDate);
    }
    if (user) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${user}%`, `%${user}%`);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR o.shipping_address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const validSort = ['created_at', 'total_amount', 'status', 'id'];
    const sortField = validSort.includes(sort) ? sort : 'created_at';
    const sortDir = order === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY o.${sortField} ${sortDir}`;

    const countRow = await db.prepare(`SELECT COUNT(*) AS c FROM (${sql})`).all(...params);
    const total = countRow[0].c;

    sql += ' LIMIT ? OFFSET ?';
    const orders = await db.prepare(sql).all(...params, limit, (page - 1) * limit);

    // Attach items to each order
    for (const order of orders) {
      order.items = await db
        .prepare(
          'SELECT oi.*, b.title, b.author, b.image_url FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?'
        )
        .all(order.id);
    }

    res.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

// GET /api/admin/orders/:id — full detail with items, timeline
router.get(
  '/orders/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const order = await db.prepare('SELECT o.*, u.name, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?').get(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    order.items = await db
      .prepare(
        'SELECT oi.*, b.title, b.author, b.image_url FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?'
      )
      .all(order.id);

    res.json(order);
  })
);

// PUT /api/admin/orders/:id/status — status transition (validate workflow)
router.put(
  '/orders/:id/status',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) {
      res.status(400);
      throw new Error('Status required');
    }

    const order = await db.prepare('SELECT id, status FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (!validateStatusTransition(order.status, status)) {
      res.status(400);
      throw new Error(`Invalid status transition: ${order.status} → ${status}`);
    }

    await db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ id: req.params.id, status, previousStatus: order.status });
  })
);

// GET /api/admin/orders/export — CSV export with filters
router.get(
  '/orders/export',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { status, startDate, endDate, user } = req.query;

    let sql = 'SELECT o.id, o.total_amount, o.status, o.shipping_address, o.created_at, u.name, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    if (startDate) {
      sql += ' AND o.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND o.created_at <= ?';
      params.push(endDate);
    }
    if (user) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${user}%`, `%${user}%`);
    }

    sql += ' ORDER BY o.created_at DESC';
    const orders = await db.prepare(sql).all(...params);

    // Build CSV manually
    const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Total Amount', 'Status', 'Shipping Address', 'Created At'];
    const escapeCsv = (val) => {
      const s = String(val == null ? '' : val);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [headers.join(',')];
    for (const o of orders) {
      lines.push([
        escapeCsv(o.id),
        escapeCsv(o.name),
        escapeCsv(o.email),
        escapeCsv(o.total_amount),
        escapeCsv(o.status),
        escapeCsv(o.shipping_address),
        escapeCsv(o.created_at),
      ].join(','));
    }

    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv');
    res.send(csv);
  })
);

// ============================================================
// USER MANAGEMENT
// ============================================================

// GET /api/admin/users — paginated, search, filter, sort
router.get(
  '/users',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const { search, role, is_active, sort = 'created_at', order = 'DESC' } = req.query;

    let sql = 'SELECT id, name, email, role, is_active, created_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (is_active !== undefined) {
      sql += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    const validSort = ['name', 'email', 'role', 'created_at', 'id'];
    const sortField = validSort.includes(sort) ? sort : 'created_at';
    const sortDir = order === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortField} ${sortDir}`;

    const countRow = await db.prepare(`SELECT COUNT(*) AS c FROM (${sql})`).all(...params);
    const total = countRow[0].c;

    sql += ' LIMIT ? OFFSET ?';
    const users = await db.prepare(sql).all(...params, limit, (page - 1) * limit);

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

// PUT /api/admin/users/:id/role — toggle admin/user
router.put(
  '/users/:id/role',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!role || !['admin', 'customer'].includes(role)) {
      res.status(400);
      throw new Error('Valid role (admin/customer) required');
    }

    const user = await db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent self-demotion
    if (Number(req.params.id) === req.user.id && role !== 'admin') {
      res.status(400);
      throw new Error('Cannot change your own admin role');
    }

    await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    res.json({ id: req.params.id, role, previousRole: user.role });
  })
);

// PUT /api/admin/users/:id/status — ban/unban
router.put(
  '/users/:id/status',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { is_active } = req.body;
    if (is_active === undefined) {
      res.status(400);
      throw new Error('is_active is required');
    }

    const user = await db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent self-ban
    if (Number(req.params.id) === req.user.id && is_active === 'false') {
      res.status(400);
      throw new Error('Cannot deactivate your own account');
    }

    await db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active === 'true' ? 1 : 0, req.params.id);
    res.json({ id: req.params.id, is_active: is_active === 'true' ? 1 : 0, previousIsActive: user.is_active });
  })
);

// GET /api/admin/users/:id/orders — user's order history
router.get(
  '/users/:id/orders',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));

    const user = await db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    let sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
    const params = [req.params.id];

    const countRow = await db.prepare(`SELECT COUNT(*) AS c FROM (${sql})`).all(...params);
    const total = countRow[0].c;

    sql += ' LIMIT ? OFFSET ?';
    const orders = await db.prepare(sql).all(...params, limit, (page - 1) * limit);

    for (const order of orders) {
      order.items = await db
        .prepare(
          'SELECT oi.*, b.title, b.author FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?'
        )
        .all(order.id);
    }

    res.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

// ============================================================
// SETTINGS
// ============================================================

// GET /api/admin/settings — site config
router.get(
  '/settings',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const rows = await db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    res.json(settings);
  })
);

// PUT /api/admin/settings — update config (site name, currency, email, payment keys)
router.put(
  '/settings',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const settings = req.body;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      res.status(400);
      throw new Error('Invalid settings payload');
    }

    const tx = db.transaction(async () => {
      for (const [key, value] of Object.entries(settings)) {
        await db
          .prepare(
            `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
          )
          .run(key, String(value));
      }
    });

    await tx();

    const rows = await db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    res.json(result);
  })
);

module.exports = router;