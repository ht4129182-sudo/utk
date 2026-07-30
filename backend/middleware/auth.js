const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Check if session exists in database and is not expired
    db.get(
      `SELECT s.*, u.id, u.email, u.role, u.name 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
      [token],
      (err, session) => {
        if (err) {
          console.error('Session check error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!session) {
          return res.status(403).json({ error: 'Session expired or invalid' });
        }

        // Update last active time
        db.run(
          "UPDATE sessions SET last_active = datetime('now') WHERE id = ?",
          [session.id],
          (err) => {
            if (err) {
              console.error('Session update error:', err);
            }
          }
        );

        req.user = {
          id: session.id,
          email: session.email,
          role: session.role,
          name: session.name
        };
        req.session = session;
        next();
      }
    );
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
