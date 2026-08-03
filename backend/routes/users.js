const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { query } = require('../database/init');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query("SELECT id, name, email, phone, balance, role, created_at FROM users WHERE id = $1", [req.user.id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all users (admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query("SELECT id, name, email, phone, balance, role, created_at FROM users ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add balance to user (admin only)
router.post('/add-balance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    await query("UPDATE users SET balance = balance + $1 WHERE id = $2", [amount, user_id]);

    // Create transaction record
    await query(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)",
      [user_id, 'credit', amount, 'Balance added by admin']
    );

    res.json({ message: 'Balance added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add balance' });
  }
});

// Subtract balance from user (admin only)
    await query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, user_id]);

    // Create transaction record
    await query(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)",
      [user_id, 'debit', amount, 'Balance deducted by admin']
    );

    res.json({ message: 'Balance subtracted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to subtract balance' });
  }
});

// Promote user to admin (admin only)
router.post('/promote-admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;

    await query("UPDATE users SET role = 'admin', balance = 999999999 WHERE id = $1", [user_id]);

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Demote admin to user (admin only)
router.post('/demote-admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;

    // Prevent demoting yourself
    if (user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot demote yourself' });
    }

    await query("UPDATE users SET role = 'user', balance = balance WHERE id = $1", [user_id]);

    res.json({ message: 'Admin demoted to user successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to demote admin' });
  }
});

// Create new admin account (admin only)
router.post('/create-admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const bcrypt = require('bcryptjs');

    // Check if user exists
    const existingUser = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await query(
      "INSERT INTO users (name, email, password, role, balance) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, email, hashedPassword, 'admin', 999999999]
    );

    res.json({
      message: 'Admin created successfully',
      user: {
        id: result.rows[0]?.id || result.lastId,
        name,
        email,
        role: 'admin',
        balance: 999999999
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

module.exports = router;
