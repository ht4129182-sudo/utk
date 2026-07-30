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
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Password hashing failed' });
        }

        db.run(
          "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
          [name, email, phone, hashedPassword],
          function(err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({ error: 'Registration failed: ' + err.message });
            }

            const token = jwt.sign(
              { id: this.lastID, email, role: 'user' },
              process.env.JWT_SECRET,
              { expiresIn: '7d' }
            );

            // Calculate expiration date (7 days from now)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            // Store session in database
            db.run(
              `INSERT INTO sessions (user_id, token, device_info, ip_address, user_agent, expires_at) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [this.lastID, token, deviceInfo, ipAddress, deviceInfo, expiresAt.toISOString()],
              function(err) {
                if (err) {
                  console.error('Session creation error:', err);
                }

                res.json({
                  token,
                  user: {
                    id: this.lastID,
                    name,
                    email,
                    phone,
                    balance: 0,
                    role: 'user'
                  }
                });
              }
            );
          }
        );
      });
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

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
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
    db.run(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, user_agent, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, token, deviceInfo, ipAddress, deviceInfo, expiresAt.toISOString()],
      function(err) {
        if (err) {
          console.error('Session creation error:', err);
          // Still return token even if session creation fails
        }

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
      }
    );
  });
});

// Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  db.run("DELETE FROM sessions WHERE token = ?", [token], (err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get active sessions (for admin)
router.get('/sessions', (req, res) => {
  db.all(
    `SELECT s.*, u.name, u.email 
     FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.expires_at > datetime('now') 
     ORDER BY s.last_active DESC`,
    [],
    (err, sessions) => {
      if (err) {
        console.error('Sessions fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch sessions' });
      }
      res.json({ sessions });
    }
  );
});

// Revoke specific session (for admin)
router.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM sessions WHERE id = ?", [id], (err) => {
    if (err) {
      console.error('Session revoke error:', err);
      return res.status(500).json({ error: 'Failed to revoke session' });
    }
    res.json({ message: 'Session revoked successfully' });
  });
});

// Temporary: Reset admin endpoint (REMOVE IN PRODUCTION)
router.post('/reset-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.run("DELETE FROM users WHERE email = ?", ['admin@utkarsh.com'], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting admin' });
      }
      
      db.run(
        "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)",
        ['Admin', 'admin@utkarsh.com', hashedPassword, 'admin', 999999999],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error creating admin' });
          }
          res.json({ message: 'Admin reset successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
