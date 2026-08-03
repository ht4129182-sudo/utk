const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// PostgreSQL connection pool
let pool;

function getPostgresConnection() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    console.log('Connected to PostgreSQL database');
  }
  return pool;
}

async function initializePostgresDatabase() {
  const pool = getPostgresConnection();
  if (!pool) {
    console.log('PostgreSQL connection not available');
    return;
  }

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        balance REAL DEFAULT 0,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create matches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        match_id INTEGER NOT NULL,
        team_selected TEXT NOT NULL,
        amount REAL NOT NULL,
        potential_win REAL NOT NULL,
        result TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (match_id) REFERENCES matches(id)
      )
    `);

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        user_agent TEXT,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create default admin if not exists
    const adminResult = await pool.query("SELECT * FROM users WHERE email = $1", ['admin@utkarsh.com']);
    if (adminResult.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role, balance) VALUES ($1, $2, $3, $4, $5)",
        ['Admin', 'admin@utkarsh.com', hashedPassword, 'admin', 999999999]
      );
      console.log('✅ Default admin created in PostgreSQL');
    } else {
      console.log('Admin user already exists in PostgreSQL');
    }

    console.log('✅ PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('PostgreSQL initialization error:', error);
    throw error;
  }
}

module.exports = { getPostgresConnection, initializePostgresDatabase };