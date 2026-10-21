const path = require('path');
const fs = require('fs');
const db = require('../config/db');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

async function init() {
  await db.exec(schema);
  console.log('Database initialized.');
  process.exit(0);
}

init().catch(err => {
  console.error(err);
  process.exit(1);
});