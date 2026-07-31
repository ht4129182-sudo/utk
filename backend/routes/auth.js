const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check if user exists
    const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare("INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)");
    const result = stmt.run(name, email, phone, hashedPassword);

    const token = jwt.sign(
      { id: result.lastInsertRowid, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store session in database
    const sessionStmt = db.prepare(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, user_agent, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    sessionStmt.run(result.lastInsertRowid, token, deviceInfo, ipAddress, deviceInfo, expiresAt.toISOString());

    res.json({
      token,
      user: {
        id: result.lastInsertRowid,
        name,
        email,
        phone,
        balance: 0,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = req.ip || req.connection.remoteAddress;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Calculate expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store session in database
  const sessionStmt = db.prepare(
    `INSERT INTO sessions (user_id, token, device_info, ip_address, user_agent, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  sessionStmt.run(user.id, token, deviceInfo, ipAddress, deviceInfo, expiresAt.toISOString());

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      role: user.role
    }
  });
});

// Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  const stmt = db.prepare("DELETE FROM sessions WHERE token = ?");
  stmt.run(token);
  res.json({ message: 'Logged out successfully' });
});

// Get active sessions (for admin)
router.get('/sessions', (req, res) => {
  const sessions = db.prepare(
    `SELECT s.*, u.name, u.email 
     FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.expires_at > datetime('now') 
     ORDER BY s.last_active DESC`
  ).all();
  res.json({ sessions });
});

// Revoke specific session (for admin)
router.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare("DELETE FROM sessions WHERE id = ?");
  stmt.run(id);
  res.json({ message: 'Session revoked successfully' });
});

// Temporary: Reset admin endpoint (REMOVE IN PRODUCTION)
router.post('/reset-admin', (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    const deleteStmt = db.prepare("DELETE FROM users WHERE email = ?");
    deleteStmt.run('admin@utkarsh.com');
    
    const insertStmt = db.prepare(
      "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)"
    );
    insertStmt.run('Admin', 'admin@utkarsh.com', hashedPassword, 'admin', 999999999);
    
    res.json({ message: 'Admin reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
