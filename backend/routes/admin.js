const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { query } = require('../database/init');

// Get dashboard stats
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Run all queries in parallel
    const [userCountResult, balanceResult, betsTodayResult, profitResult] = await Promise.all([
      query("SELECT COUNT(*) as count FROM users WHERE role = 'user'"),
      query("SELECT SUM(balance) as total FROM users"),
      query("SELECT COUNT(*) as count FROM bets WHERE DATE(created_at) = CURRENT_DATE"),
      query("SELECT SUM(amount * 0.05) as profit FROM bets WHERE result = 'lost'")
    ]);

    res.json({
      total_users: userCountResult.rows[0]?.count || 0,
      total_balance: balanceResult.rows[0]?.total || 0,
      total_bets_today: betsTodayResult.rows[0]?.count || 0,
      total_profit: profitResult.rows[0]?.profit || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Set toss result and process payouts
router.post('/set-result', authenticateToken, requireAdmin, async (req, res) => {
  const { match_id, toss_winner } = req.body;

  try {
    // Update match status
    await query(
      "UPDATE matches SET status = 'completed', toss_winner = $1 WHERE id = $2",
      [toss_winner, match_id]
    );

    // Get all bets for this match
    const betsResult = await query("SELECT * FROM bets WHERE match_id = $1 AND result = 'pending'", [match_id]);
    const bets = betsResult.rows;

    // Process each bet
    for (const bet of bets) {
      if (bet.team_selected === toss_winner) {
        // User won - add potential win to balance
        await query(
          "UPDATE users SET balance = balance + $1 WHERE id = $2",
          [bet.potential_win, bet.user_id]
        );
        await query("UPDATE bets SET result = 'won' WHERE id = $1", [bet.id]);
        await query(
          "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)",
          [bet.user_id, 'win', bet.potential_win, 'Won bet on toss']
        );
      } else {
        // User lost
        await query("UPDATE bets SET result = 'lost' WHERE id = $1", [bet.id]);
      }
    }

    res.json({ message: 'Result set and payouts processed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process result' });
  }
});

module.exports = router;