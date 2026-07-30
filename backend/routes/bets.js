const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../database/init');

// Place a bet
router.post('/', authenticateToken, (req, res) => {
  const { match_id, team_selected, amount } = req.body;
  const user_id = req.user.id;

  // Calculate potential win (1.95x)
  const potential_win = amount * 1.95;

  // Check user balance
  db.get("SELECT balance FROM users WHERE id = ?", [user_id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct amount from user balance
    db.run("UPDATE users SET balance = balance - ? WHERE id = ?", [amount, user_id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to deduct balance' });
      }

      // Create bet record
      db.run(
        "INSERT INTO bets (user_id, match_id, team_selected, amount, potential_win) VALUES (?, ?, ?, ?, ?)",
        [user_id, match_id, team_selected, amount, potential_win],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to place bet' });
          }

          // Create transaction record
          db.run(
            "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)",
            [user_id, 'bet', amount, `Bet placed on ${team_selected}`]
          );

          res.json({
            id: this.lastID,
            message: 'Bet placed successfully',
            potential_win
          });
        }
      );
    });
  });
});

// Get user's bets
router.get('/my-bets', authenticateToken, (req, res) => {
  const user_id = req.user.id;

  db.all(
    `SELECT b.*, m.team_a, m.team_b, m.sport, m.match_date, m.match_time
     FROM bets b
     JOIN matches m ON b.match_id = m.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`,
    [user_id],
    (err, bets) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch bets' });
      }
      res.json(bets);
    }
  );
});

// Get all bets (admin only)
router.get('/all', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(
    `SELECT b.*, u.name as user_name, m.team_a, m.team_b, m.sport
     FROM bets b
     JOIN users u ON b.user_id = u.id
     JOIN matches m ON b.match_id = m.id
     ORDER BY b.created_at DESC`,
    [],
    (err, bets) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch bets' });
      }
      res.json(bets);
    }
  );
});

module.exports = router;
