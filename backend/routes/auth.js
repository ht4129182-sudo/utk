const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase, query, isPostgres } = require('../database/init');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check if user exists
    const existingUser = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const insertResult = await query(
      "INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, email, phone, hashedPassword]
    );

    const userId = insertResult.rows[0]?.id || insertResult.lastId;

    const token = jwt.sign(
      { id: userId, email, role: 'user' },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, user_agent, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, token, deviceInfo, ipAddress, deviceInfo, expiresAt.toISOString()]
    );

    res.json({
      token,
      user: {
        id: userId,
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
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress;

    const userResult = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, user_agent, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, token, deviceInfo, ipAddress, deviceInfo, expiresAt.toISOString()]
    );

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    await query("DELETE FROM sessions WHERE token = $1", [token]);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get active sessions (for admin)
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await query(
      `SELECT s.*, u.name, u.email 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.expires_at > NOW() 
       ORDER BY s.last_active DESC`
    );
    res.json({ sessions: sessions.rows });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Revoke specific session (for admin)
router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM sessions WHERE id = $1", [id]);
    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Session revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

module.exports = router;
