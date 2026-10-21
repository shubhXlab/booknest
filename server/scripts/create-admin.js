const db = require('../config/db');
const bcrypt = require('bcryptjs');

(async () => {
  const email = 'admin@booknest.com';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('admin123', salt);
  db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run('Admin User', email, hash, 'admin');
  console.log('Admin created: admin@booknest.com / admin123');
  process.exit(0);
})();
