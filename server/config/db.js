const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'database.sqlite');

let db = null;
let sqlInitialized = false;

async function ensureDb() {
  if (sqlInitialized) return;
  
  const SQL = await initSqlJs({
    locateFile: (file) => `node_modules/sql.js/dist/${file}`
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  sqlInitialized = true;
  console.log('Database initialized with sql.js');
}

function saveDB() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function getLastInsertRowid() {
  const result = db.exec('SELECT last_insert_rowid()');
  return result[0]?.values[0]?.[0] || 0;
}

function getChanges() {
  const result = db.exec('SELECT changes()');
  return result[0]?.values[0]?.[0] || 0;
}

// Wrap in Promise-based API for compatibility
function run(sql, params = []) {
  return ensureDb().then(() => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        if (params && params.length > 0) stmt.bind(params);
        stmt.step();
        const result = { 
          lastInsertRowid: getLastInsertRowid(), 
          changes: getChanges() 
        };
        stmt.free();
        saveDB();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function get(sql, params = []) {
  return ensureDb().then(() => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        if (params && params.length > 0) stmt.bind(params);
        const result = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function all(sql, params = []) {
  return ensureDb().then(() => {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        if (params && params.length > 0) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function transaction(fn) {
  return ensureDb().then(() => {
    return new Promise((resolve, reject) => {
      try {
        db.run('BEGIN TRANSACTION');
        const result = fn();
        db.run('COMMIT');
        resolve(result);
      } catch (err) {
        try { db.run('ROLLBACK'); } catch (_) {}
        reject(err);
      }
    });
  });
}

function exec(sql) {
  return ensureDb().then(() => {
    return new Promise((resolve, reject) => {
      try {
        db.exec(sql);
        saveDB();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Connect function for server.js
function connectDB() {
  return ensureDb().then(() => {
    console.log('Database connected');
    return Promise.resolve();
  });
}

// Compatibility layer matching better-sqlite3 API
function normalizeParams(params) {
  // Handle both spread calls (params = [val1, val2]) and array calls (params = [[val1, val2]])
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

module.exports = {
  prepare: (sql) => ({
    run: (...params) => run(sql, normalizeParams(params)),
    get: (...params) => get(sql, normalizeParams(params)),
    all: (...params) => all(sql, normalizeParams(params)),
  }),
  exec,
  transaction,
  close: () => {
    saveDB();
    return Promise.resolve();
  },
  connectDB,
};