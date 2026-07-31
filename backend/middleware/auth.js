const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists in database and is not expired
    const session = db.prepare(
      `SELECT s.*, u.id, u.email, u.role, u.name 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > datetime('now')`
    ).get(token);

    if (!session) {
      return res.status(403).json({ error: 'Session expired or invalid' });
    }

    // Update last active time
    db.prepare("UPDATE sessions SET last_active = datetime('now') WHERE id = ?").run(session.id);

    req.user = {
      id: session.id,
      email: session.email,
      role: session.role,
      name: session.name
    };
    req.session = session;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
