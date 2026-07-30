const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { db } = require('../database/init');

// Get dashboard stats
router.get('/dashboard', authenticateToken, requireAdmin, (req, res) => {
  // Total users
  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'", [], (err, userCount) => {
    // Total balance in system
    db.get("SELECT SUM(balance) as total FROM users", [], (err, balanceResult) => {
      // Total bets today
      db.get("SELECT COUNT(*) as count FROM bets WHERE DATE(created_at) = DATE('now')", [], (err, betsToday) => {
        // Total profit (house edge - 5% of losing bets)
        db.get(
          "SELECT SUM(amount * 0.05) as profit FROM bets WHERE result = 'lost'",
          [],
          (err, profitResult) => {
            res.json({
              total_users: userCount?.count || 0,
              total_balance: balanceResult?.total || 0,
              total_bets_today: betsToday?.count || 0,
              total_profit: profitResult?.profit || 0
            });
          }
        );
      });
    });
  });
});

// Set toss result and process payouts
router.post('/set-result', authenticateToken, requireAdmin, (req, res) => {
  const { match_id, toss_winner } = req.body;

  // Update match status
  db.run(
    "UPDATE matches SET status = 'completed', toss_winner = ? WHERE id = ?",
    [toss_winner, match_id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update match' });
      }

      // Get all bets for this match
      db.all("SELECT * FROM bets WHERE match_id = ? AND result = 'pending'", [match_id], (err, bets) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch bets' });
        }

        bets.forEach((bet) => {
          if (bet.team_selected === toss_winner) {
            // User won - add potential win to balance
            db.run(
              "UPDATE users SET balance = balance + ? WHERE id = ?",
              [bet.potential_win, bet.user_id],
              () => {
                db.run("UPDATE bets SET result = 'won' WHERE id = ?", [bet.id]);
                db.run(
                  "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, ?, ?, ?)",
                  [bet.user_id, 'win', bet.potential_win, 'Won bet on toss']
                );
              }
            );
          } else {
            // User lost
            db.run("UPDATE bets SET result = 'lost' WHERE id = ?", [bet.id]);
          }
        });

        res.json({ message: 'Result set and payouts processed' });
      });
    }
  );
});

module.exports = router;
