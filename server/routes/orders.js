const express = require('express');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Create order from cart
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { shipping_address } = req.body;
    if (!shipping_address) {
      res.status(400);
      throw new Error('Shipping address is required');
    }

    const cartItems = await db
      .prepare(
        'SELECT c.book_id, c.quantity, b.price, b.stock FROM cart c JOIN books b ON c.book_id = b.id WHERE c.user_id = ?'
      )
      .all(req.user.id);

    if (!cartItems.length) {
      res.status(400);
      throw new Error('Cart is empty');
    }

    // Validate stock
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        res.status(400);
        throw new Error(`Not enough stock for book id ${item.book_id}`);
      }
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const insertOrder = db.prepare(
      'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)'
    );
    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)'
    );
    const updateStock = db.prepare('UPDATE books SET stock = stock - ? WHERE id = ?');

    const order = await insertOrder.run(req.user.id, Number(totalAmount.toFixed(2)), shipping_address, 'pending');
    for (const item of cartItems) {
      await insertItem.run(order.lastInsertRowid, item.book_id, item.quantity, item.price);
      await updateStock.run(item.quantity, item.book_id);
    }
    await db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);

    res.status(201).json({ id: order.lastInsertRowid, total_amount: totalAmount, status: 'pending' });
  })
);

// Get user orders
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const orders = await db
      .prepare(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
      )
      .all(req.user.id);
    for (const order of orders) {
      order.items = await db
        .prepare(
          'SELECT oi.*, b.title, b.author, b.image_url FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?'
        )
        .all(order.id);
    }
    res.json(orders);
  })
);

// Get single order
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }
    order.items = await db
      .prepare(
        'SELECT oi.*, b.title, b.author, b.image_url FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = ?'
      )
      .all(order.id);
    res.json(order);
  })
);

module.exports = router;
