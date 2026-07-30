const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { db } = require('../database/init');

// Get all matches
router.get('/', authenticateToken, (req, res) => {
  db.all("SELECT * FROM matches ORDER BY match_date ASC, match_time ASC", [], (err, matches) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch matches' });
    }
    res.json(matches);
  });
});

// Get upcoming matches
router.get('/upcoming', authenticateToken, (req, res) => {
  db.all(
    "SELECT * FROM matches WHERE status = 'upcoming' ORDER BY match_date ASC, match_time ASC",
    [],
    (err, matches) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch matches' });
      }
      res.json(matches);
    }
  );
});

// Get single match
router.get('/:id', authenticateToken, (req, res) => {
  db.get("SELECT * FROM matches WHERE id = ?", [req.params.id], (err, match) => {
    if (err || !match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  });
});

// Add new match (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff } = req.body;

  db.run(
    `INSERT INTO matches (team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add match' });
      }
      res.json({ id: this.lastID, message: 'Match added successfully' });
    }
  );
});

// Update match (admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff, status, toss_winner } = req.body;

  db.run(
    `UPDATE matches SET team_a=?, team_b=?, sport=?, match_date=?, match_time=?, venue=?, series=?, toss_cutoff=?, status=?, toss_winner=?
     WHERE id=?`,
    [team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff, status, toss_winner, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update match' });
      }
      res.json({ message: 'Match updated successfully' });
    }
  );
});

// Delete match (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  db.run("DELETE FROM matches WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete match' });
    }
    res.json({ message: 'Match deleted successfully' });
  });
});

module.exports = router;
