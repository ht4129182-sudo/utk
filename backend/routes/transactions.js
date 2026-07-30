const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../database/init');

// Get user's transactions
router.get('/my-transactions', authenticateToken, (req, res) => {
  const user_id = req.user.id;

  db.all(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC",
    [user_id],
    (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }
      res.json(transactions);
    }
  );
});

// Get all transactions (admin only)
router.get('/all', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    `SELECT t.*, u.name as user_name
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     ORDER BY t.created_at DESC`,
    [],
    (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }
      res.json(transactions);
    }
  );
});

module.exports = router;
