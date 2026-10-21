const db = require('../config/db');

const categories = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'Business', 'History'];
const books = [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', price: 12.99, description: 'A classic novel of the Jazz Age.', category: 'Fiction', stock: 50 },
  { title: 'Atomic Habits', author: 'James Clear', price: 14.50, description: 'An easy and proven way to build good habits.', category: 'Non-Fiction', stock: 40 },
  { title: 'Clean Code', author: 'Robert C. Martin', price: 39.99, description: 'A handbook of agile software craftsmanship.', category: 'Technology', stock: 25 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', price: 18.75, description: 'A brief history of humankind.', category: 'History', stock: 35 },
  { title: 'The Lean Startup', author: 'Eric Ries', price: 22.00, description: "How today's entrepreneurs use continuous innovation.", category: 'Business', stock: 30 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', price: 16.99, description: 'From the big bang to black holes.', category: 'Science', stock: 20 },
];

for (const cat of categories) {
  db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(cat);
}

const catMap = {};
db.prepare('SELECT * FROM categories').all().forEach(c => { catMap[c.name] = c.id; });

for (const b of books) {
  const existing = db.prepare('SELECT id FROM books WHERE title = ?').get(b.title);
  if (!existing) {
    db.prepare(
      'INSERT INTO books (title, author, price, description, category_id, stock) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(b.title, b.author, b.price, b.description, catMap[b.category], b.stock);
  }
}

console.log('Database seeded.');
