const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { getPostgresConnection, initializePostgresDatabase } = require('./postgres');

// Check if PostgreSQL is available
const usePostgres = !!process.env.DATABASE_URL;

let db; // SQLite database
let pool; // PostgreSQL pool

function getDatabase() {
  if (usePostgres) {
    return getPostgresConnection();
  }
  return db;
}

function isPostgres() {
  return usePostgres;
}

async function query(sql, params = []) {
  if (usePostgres) {
    const pool = getPostgresConnection();
    const result = await pool.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount
    };
  } else {
    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows: rows || [], rowCount: rows?.length || 0 });
        });
      } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ rows: [], rowCount: this.changes, lastId: this.lastID });
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ rows: [], rowCount: this.changes });
        });
      }
    });
  }
}

async function initializeDatabase() {
  if (usePostgres) {
    await initializePostgresDatabase();
  } else {
    // SQLite initialization
    let dbPath;
    if (process.env.NODE_ENV === 'production') {
      const dataDir = '/opt/render/project/data';
      if (fs.existsSync(dataDir)) {
        dbPath = path.join(dataDir, 'database.sqlite');
        console.log('Using Render persistent disk for database');
      } else {
        dbPath = '/tmp/database.sqlite';
        console.log('Using temp directory for database (data will reset on restart)');
      }
    } else {
      dbPath = path.join(__dirname, '../../database.sqlite');
    }

    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err);
      } else {
        console.log('Connected to SQLite database at:', dbPath);
      }
    });

    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        balance REAL DEFAULT 0,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Matches table
    db.exec(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_a TEXT NOT NULL,
        team_b TEXT NOT NULL,
        sport TEXT NOT NULL,
        match_date TEXT NOT NULL,
        match_time TEXT NOT NULL,
        venue TEXT,
        series TEXT,
        toss_cutoff TEXT NOT NULL,
        status TEXT DEFAULT 'upcoming',
        toss_winner TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bets table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        match_id INTEGER NOT NULL,
        team_selected TEXT NOT NULL,
        amount REAL NOT NULL,
        potential_win REAL NOT NULL,
        result TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (match_id) REFERENCES matches(id)
      )
    `);

    // Transactions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Sessions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        user_agent TEXT,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create default admin if not exists
    db.get("SELECT * FROM users WHERE email = ?", ['admin@utkarsh.com'], (err, admin) => {
      if (err) {
        console.error('Error checking for admin:', err);
        return;
      }
      
      if (!admin) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(
          "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)",
          ['Admin', 'admin@utkarsh.com', hashedPassword, 'admin', 999999999],
          (err) => {
            if (err) {
              console.error('Error creating admin:', err);
            } else {
              console.log('Default admin created');
            }
          }
        );
      } else {
        console.log('Admin user already exists');
      }
    });

    console.log('Database initialized');
  }
}

module.exports = { getDatabase, initializeDatabase, isPostgres, query };

function getDatabase() {
  return db;
}

function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      balance REAL DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      sport TEXT NOT NULL,
      match_date TEXT NOT NULL,
      match_time TEXT NOT NULL,
      venue TEXT,
      series TEXT,
      toss_cutoff TEXT NOT NULL,
      status TEXT DEFAULT 'upcoming',
      toss_winner TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id INTEGER NOT NULL,
      team_selected TEXT NOT NULL,
      amount REAL NOT NULL,
      potential_win REAL NOT NULL,
      result TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (match_id) REFERENCES matches(id)
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Sessions table for multi-device support
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      device_info TEXT,
      ip_address TEXT,
      user_agent TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create default admin if not exists - use synchronous approach for serverless
  try {
    const admin = db.get("SELECT * FROM users WHERE email = ?", ['admin@utkarsh.com']);
    if (!admin) {
      console.log('No admin found, creating default admin...');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)",
        ['Admin', 'admin@utkarsh.com', hashedPassword, 'admin', 999999999]
      );
      console.log('✅ Default admin created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error with admin creation:', err);
  }

  console.log('Database initialized');
}

module.exports = { getDatabase, initializeDatabase };