const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../database/init');

// Place a bet
router.post('/', authenticateToken, async (req, res) => {
  const { match_id, team_selected, amount } = req.body;
  const user_id = req.user.id;

  // Calculate potential win (1.95x)
  const potential_win = amount * 1.95;

  try {
    // Check user balance
    const userResult = await query("SELECT balance FROM users WHERE id = $1", [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct amount from user balance
    await query("UPDATE users SET balance = balance - $1 WHERE id = $2", [amount, user_id]);

    // Create bet record
    const betResult = await query(
      "INSERT INTO bets (user_id, match_id, team_selected, amount, potential_win) VALUES ($1, $2, $3, $4, $5)",
      [user_id, match_id, team_selected, amount, potential_win]
    );
    const betId = betResult.rows[0]?.id || betResult.lastId;

    // Create transaction record
    await query(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)",
      [user_id, 'bet', amount, `Bet placed on ${team_selected}`]
    );

    res.json({
      id: betId,
      message: 'Bet placed successfully',
      potential_win
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

// Get user's bets
router.get('/my-bets', authenticateToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await query(
      `SELECT b.*, m.team_a, m.team_b, m.sport, m.match_date, m.match_time
       FROM bets b
       JOIN matches m ON b.match_id = m.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

// Get all bets (admin only)
router.get('/all', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = await query(
      `SELECT b.*, u.name as user_name, m.team_a, m.team_b, m.sport
       FROM bets b
       JOIN users u ON b.user_id = u.id
       JOIN matches m ON b.match_id = m.id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bets' });
  }
});

module.exports = router;