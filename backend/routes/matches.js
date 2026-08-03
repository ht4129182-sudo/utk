const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { query } = require('../database/init');

// Get all matches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query("SELECT * FROM matches ORDER BY match_date ASC, match_time ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get upcoming matches
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM matches WHERE status = 'upcoming' ORDER BY match_date ASC, match_time ASC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get single match
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query("SELECT * FROM matches WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Add new match (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff } = req.body;

  try {
    const result = await query(
      `INSERT INTO matches (team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff]
    );
    const id = result.rows[0]?.id || result.lastId;
    res.json({ id, message: 'Match added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add match' });
  }
});

// Update match (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff, status, toss_winner } = req.body;

  try {
    await query(
      `UPDATE matches SET team_a=$1, team_b=$2, sport=$3, match_date=$4, match_time=$5, venue=$6, series=$7, toss_cutoff=$8, status=$9, toss_winner=$10
       WHERE id=$11`,
      [team_a, team_b, sport, match_date, match_time, venue, series, toss_cutoff, status, toss_winner, req.params.id]
    );
    res.json({ message: 'Match updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Delete match (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query("DELETE FROM matches WHERE id = $1", [req.params.id]);
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

module.exports = router;
