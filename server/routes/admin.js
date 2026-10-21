const express = require('express');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Dashboard stats
router.get(
  '/stats',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const totalBooks = db.prepare('SELECT COUNT(*) AS c FROM books').get().c;
    const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users WHERE role = "customer"').get().c;
    const totalOrders = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
    const totalSales = db
      .prepare('SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders')
      .get().total;
    res.json({ totalBooks, totalUsers, totalOrders, totalSales });
  })
);

// All orders (admin)
router.get(
  '/orders',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const orders = db
      .prepare(
        `SELECT o.*, u.name, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`
      )
      .all();
    for (const order of orders) {
      order.items = db
        .prepare(
          `SELECT oi.*, b.title, b.author FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?`
        )
        .all(order.id);
    }
    res.json(orders);
  })
);

// Update order status (admin)
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
    const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ id: req.params.id, status });
  })
);

// All users (admin)
router.get(
  '/users',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const users = db
      .prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC')
      .all();
    res.json(users);
  })
);

// All books (admin, includes stock)
router.get(
  '/books',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const books = db.prepare('SELECT * FROM books ORDER BY created_at DESC').all();
    res.json(books);
  })
);

module.exports = router;
