const express = require('express');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Get cart items for logged-in user
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const items = await db
      .prepare(
        `SELECT c.id, c.book_id, c.quantity, b.title, b.author, b.price, b.image_url, b.stock
         FROM cart c JOIN books b ON c.book_id = b.id WHERE c.user_id = ?`
      )
      .all(req.user.id);
    res.json(items);
  })
);

// Add to cart
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { book_id, quantity = 1 } = req.body;
    if (!book_id) {
      res.status(400);
      throw new Error('Book id is required');
    }

    const book = await db.prepare('SELECT id, stock FROM books WHERE id = ?').get(book_id);
    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }
    if (Number(quantity) > book.stock) {
      res.status(400);
      throw new Error('Not enough stock');
    }

    const existing = await db
      .prepare('SELECT * FROM cart WHERE user_id = ? AND book_id = ?')
      .get(req.user.id, book_id);

    if (existing) {
      const newQty = existing.quantity + Number(quantity);
      if (newQty > book.stock) {
        res.status(400);
        throw new Error('Not enough stock');
      }
      await db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(newQty, existing.id);
      res.json({ ...existing, quantity: newQty });
    } else {
      const item = await db
        .prepare('INSERT INTO cart (user_id, book_id, quantity) VALUES (?, ?, ?)')
        .run(req.user.id, book_id, Number(quantity));
      res.status(201).json({ id: item.lastInsertRowid, user_id: req.user.id, book_id, quantity: Number(quantity) });
    }
  })
);

// Update cart item quantity
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    if (!quantity || Number(quantity) < 1) {
      res.status(400);
      throw new Error('Valid quantity required');
    }

    const cartItem = await db
      .prepare('SELECT * FROM cart WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!cartItem) {
      res.status(404);
      throw new Error('Cart item not found');
    }

    const book = await db.prepare('SELECT stock FROM books WHERE id = ?').get(cartItem.book_id);
    if (Number(quantity) > book.stock) {
      res.status(400);
      throw new Error('Not enough stock');
    }

    await db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(Number(quantity), req.params.id);
    res.json({ id: req.params.id, quantity: Number(quantity) });
  })
);

// Remove cart item
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const cartItem = await db
      .prepare('SELECT * FROM cart WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!cartItem) {
      res.status(404);
      throw new Error('Cart item not found');
    }
    await db.prepare('DELETE FROM cart WHERE id = ?').run(req.params.id);
    res.json({ message: 'Removed from cart' });
  })
);

// Clear cart
router.delete(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    await db.prepare('DELETE FROM cart WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Cart cleared' });
  })
);

module.exports = router;
