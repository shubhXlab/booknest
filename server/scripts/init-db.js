const path = require('path');
const fs = require('fs');
const db = require('../config/db');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log('Database initialized.');
