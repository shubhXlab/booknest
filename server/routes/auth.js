const express = require('express');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all fields');
    }

    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(400);
      throw new Error('User already exists');
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await db
      .prepare(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
      )
      .run(name, email, hashedPassword, 'customer');

    const token = signToken(user.lastInsertRowid, email, 'customer');

    res.status(201).json({
      id: user.lastInsertRowid,
      name,
      email,
      role: 'customer',
      token,
    });
  })
);

// Login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error('Please add email and password');
    }

    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: signToken(user.id, email, user.role),
    });
  })
);

// Get profile
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json(user);
  })
);

function signToken(id, email, role) {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

const jwt = require('jsonwebtoken');

module.exports = router;
