const jwt = require('jsonwebtoken');
const { query } = require('../database/init');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');

    // Check if session exists in database and is not expired
    const sessionResult = await query(
      `SELECT s.*, u.id, u.email, u.role, u.name 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    const session = sessionResult.rows[0];

    if (!session) {
      return res.status(403).json({ error: 'Session expired or invalid' });
    }

    // Update last active time
    await query("UPDATE sessions SET last_active = NOW() WHERE id = $1", [session.id]);

    req.user = {
      id: session.user_id,
      email: session.email,
      role: session.role,
      name: session.name
    };
    req.session = session;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };
