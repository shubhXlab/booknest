const express = require('express');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Get categories
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  })
);

// Get all books (with optional search & category filter)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, category, minPrice, maxPrice } = req.query;
    let sql = 'SELECT b.*, c.name AS category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE 1=1';
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

    sql += ' ORDER BY b.created_at DESC';
    const books = await db.prepare(sql).all(params);
    res.json(books);
  })
);

// Get single book
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const book = await db
      .prepare(
        'SELECT b.*, c.name AS category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE b.id = ?'
      )
      .get(req.params.id);
    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }
    res.json(book);
  })
);

// Create book (admin)
router.post(
  '/',
  protect,
  admin,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const { title, author, price, description, category_id, stock } = req.body;
    if (!title || !author || !price) {
      res.status(400);
      throw new Error('Please add title, author, price');
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const book = await db
      .prepare(
        'INSERT INTO books (title, author, price, description, category_id, stock, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(title, author, Number(price), description || '', category_id || null, Number(stock || 0), imageUrl);

    res.status(201).json({ id: book.lastInsertRowid, title, author, price, image_url: imageUrl });
  })
);

// Update book (admin)
router.put(
  '/:id',
  protect,
  admin,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const { title, author, price, description, category_id, stock } = req.body;
    const book = await db.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id);
    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    let imageUrl = null;
    const existing = await db.prepare('SELECT image_url FROM books WHERE id = ?').get(req.params.id);
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else {
      imageUrl = existing.image_url;
    }

    await db.prepare(
      'UPDATE books SET title = ?, author = ?, price = ?, description = ?, category_id = ?, stock = ?, image_url = ? WHERE id = ?'
    ).run(title, author, Number(price), description || '', category_id || null, Number(stock || 0), imageUrl, req.params.id);

    res.json({ id: req.params.id, title, author, price, image_url: imageUrl });
  })
);

// Delete book (admin)
router.delete(
  '/:id',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const book = await db.prepare('SELECT id FROM books WHERE id = ?').get(req.params.id);
    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }
    await db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
    res.json({ message: 'Book removed' });
  })
);

module.exports = router;
