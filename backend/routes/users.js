const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { db } = require('../database/init');

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  db.get("SELECT id, name, email, phone, balance, role, created_at FROM users WHERE id = ?", [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Get all users (admin only)
router.get('/all', authenticateToken, requireAdmin, (req, res) => {
  db.all("SELECT id, name, email, phone, balance, role, created_at FROM users ORDER BY created_at DESC", [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(users);
  });
});

// Add balance to user (admin only)
router.post('/add-balance', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, amount } = req.body;

  db.run("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, user_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to add balance' });
    }

    // Create transaction record
    db.run(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)",
      [user_id, 'credit', amount, 'Balance added by admin']
    );

    res.json({ message: 'Balance added successfully' });
  });
});

// Subtract balance from user (admin only)
router.post('/subtract-balance', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, amount } = req.body;

  db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, user_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to subtract balance' });
    }

    // Create transaction record
    db.run(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)",
      [user_id, 'debit', amount, 'Balance deducted by admin']
    );

    res.json({ message: 'Balance subtracted successfully' });
  });
});

// Promote user to admin (admin only)
router.post('/promote-admin', authenticateToken, requireAdmin, (req, res) => {
  const { user_id } = req.body;

  db.run("UPDATE users SET role = 'admin', balance = 999999999 WHERE id = ?", [user_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to promote user' });
    }

    res.json({ message: 'User promoted to admin successfully' });
  });
});

// Demote admin to user (admin only)
router.post('/demote-admin', authenticateToken, requireAdmin, (req, res) => {
  const { user_id } = req.body;

  // Prevent demoting yourself
  if (user_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot demote yourself' });
  }

  db.run("UPDATE users SET role = 'user', balance = balance WHERE id = ?", [user_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to demote admin' });
    }

    res.json({ message: 'Admin demoted to user successfully' });
  });
});

// Create new admin account (admin only)
router.post('/create-admin', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  const bcrypt = require('bcryptjs');

  // Check if user exists
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, 'admin', 999999999],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create admin' });
        }

        res.json({
          message: 'Admin created successfully',
          user: {
            id: this.lastID,
            name,
            email,
            role: 'admin',
            balance: 999999999
          }
        });
      }
    );
  });
});

module.exports = router;
