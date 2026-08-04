const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./database/init');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Load routes first
const authRoutes = require('./routes/auth');
const matchesRoutes = require('./routes/matches');
const betsRoutes = require('./routes/bets');
const usersRoutes = require('./routes/users');
const transactionsRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');

// Implement auth routes directly to bypass Vercel routing issues
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('./database/init');

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress;
    const db = getDatabase();

    // Check if user exists
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Password hashing failed' });
        }

        db.run(
          "INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)",
          [name, email, phone, hashedPassword],
          function(err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({ error: 'Registration failed: ' + err.message });
            }

            const token = jwt.sign(
              { id: this.lastID, email, role: 'user' },
              process.env.JWT_SECRET || 'default-secret',
              { expiresIn: '7d' }
            );

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            db.run(
              `INSERT INTO sessions (user_id, token, device_info, ip_address, user_agent, expires_at) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [this.lastID, token, deviceInfo, ipAddress, deviceInfo, expiresAt.toISOString()],
              function(err) {
                if (err) {
                  console.error('Session creation error:', err);
                }

                res.json({
                  token,
                  user: {
                    id: this.lastID,
                    name,
                    email,
                    phone,
                    balance: 0,
                    role: 'user'
                  }
                });
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = req.ip || req.connection.remoteAddress;
  const db = getDatabase();

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Ensure admin has unlimited balance
    if (user.role === 'admin') {
      db.run("UPDATE users SET balance = 999999999 WHERE id = ?", [user.id], (err) => {
        if (err) console.error('Error updating admin balance:', err);
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    db.run(
      `INSERT INTO sessions (user_id, token, device_info, ip_address, user_agent, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, token, deviceInfo, ipAddress, deviceInfo, expiresAt.toISOString()],
      function(err) {
        if (err) {
          console.error('Session creation error:', err);
        }

        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            balance: user.balance,
            role: user.role
          }
        });
      }
    );
  });
});

// Still load other routes normally
app.use('/api/matches', matchesRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/admin', adminRoutes);

console.log('All routes loaded successfully');

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Debug endpoint to check database status
app.get('/debug/users', (req, res) => {
  const { getDatabase } = require('./database/init');
  const db = getDatabase();
  db.all("SELECT id, name, email, role FROM users", [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json({ users: users || [], count: users?.length || 0 });
  });
});

// Manual admin creation endpoint
app.get('/debug/create-admin', (req, res) => {
  const { getDatabase } = require('./database/init');
  const bcrypt = require('bcryptjs');
  const db = getDatabase();
  
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  db.run("DELETE FROM users WHERE email = ?", ['admin@utkarsh.com'], (err) => {
    if (err) {
      console.error('Error deleting existing admin:', err);
    }
    
    db.run(
      "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)",
      ['Admin', 'admin@utkarsh.com', hashedPassword, 'admin', 999999999],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error creating admin', details: err.message });
        }
        res.json({ message: 'Admin created successfully' });
      }
    );
  });
});

// Initialize database (async for PostgreSQL)
initializeDatabase().then(() => {
  console.log('Database initialization completed');
}).catch(err => {
  console.error('Database initialization failed:', err);
});

const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// Increase timeout for Render
server.timeout = 120000;
server.keepAliveTimeout = 120000;

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}
