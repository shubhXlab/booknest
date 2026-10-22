const path = require('path');
const fs = require('fs');
const db = require('../config/db');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

// Migrations for existing databases (safe to re-run; errors if column exists are ignored)
const migrations = [
  'ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1',
  'ALTER TABLE books ADD COLUMN published INTEGER DEFAULT 1',
  'ALTER TABLE books ADD COLUMN deleted_at DATETIME',
];

async function runMigration(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => {
      if (err && err.message.includes('duplicate column name')) {
        // Column already exists — safe to ignore
        return resolve();
      }
      if (err) return reject(err);
      resolve();
    });
  });
}

async function init() {
  await db.exec(schema);
  console.log('Database schema initialized.');

  for (const migration of migrations) {
    try {
      await runMigration(migration);
      console.log(`Migration applied: ${migration.split('ADD COLUMN')[0].trim()}...`);
    } catch (err) {
      console.warn(`Migration skipped (may already exist): ${err.message}`);
    }
  }

  console.log('Database initialized.');
  process.exit(0);
}

init().catch(err => {
  console.error(err);
  process.exit(1);
});