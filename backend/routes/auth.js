const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

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

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
