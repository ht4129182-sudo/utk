const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { db } = require('../database/init');
const bcrypt = require('bcryptjs');

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare("SELECT id, name, email, phone, balance, role, created_at FROM users WHERE id = ?").get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Get all users (admin only)
router.get('/all', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare("SELECT id, name, email, phone, balance, role, created_at FROM users ORDER BY created_at DESC").all();
  res.json(users);
});

// Add balance to user (admin only)
router.post('/add-balance', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, amount } = req.body;

  db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, user_id);

  // Create transaction record
  db.prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)")
    .run(user_id, 'credit', amount, 'Balance added by admin');

  res.json({ message: 'Balance added successfully' });
});

// Subtract balance from user (admin only)
router.post('/subtract-balance', authenticateToken, requireAdmin, (req, res) => {
  const { user_id, amount } = req.body;

  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(amount, user_id);

  // Create transaction record
  db.prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)")
    .run(user_id, 'debit', amount, 'Balance deducted by admin');

  res.json({ message: 'Balance subtracted successfully' });
});

// Promote user to admin (admin only)
router.post('/promote-admin', authenticateToken, requireAdmin, (req, res) => {
  const { user_id } = req.body;

  db.prepare("UPDATE users SET role = 'admin', balance = 999999999 WHERE id = ?").run(user_id);

  res.json({ message: 'User promoted to admin successfully' });
});

// Demote admin to user (admin only)
router.post('/demote-admin', authenticateToken, requireAdmin, (req, res) => {
  const { user_id } = req.body;

  // Prevent demoting yourself
  if (user_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot demote yourself' });
  }

  db.prepare("UPDATE users SET role = 'user', balance = balance WHERE id = ?").run(user_id);

  res.json({ message: 'Admin demoted to user successfully' });
});

// Create new admin account (admin only)
router.post('/create-admin', authenticateToken, requireAdmin, (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const result = db.prepare(
    "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)"
  ).run(name, email, hashedPassword, 'admin', 999999999);

  res.json({
    message: 'Admin created successfully',
    user: {
      id: result.lastInsertRowid,
      name,
      email,
      role: 'admin',
      balance: 999999999
    }
  });
});

module.exports = router;
