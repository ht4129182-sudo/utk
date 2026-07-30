const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('../backend/database/init');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', require('../backend/routes/auth'));
app.use('/api/matches', require('../backend/routes/matches'));
app.use('/api/bets', require('../backend/routes/bets'));
app.use('/api/users', require('../backend/routes/users'));
app.use('/api/transactions', require('../backend/routes/transactions'));
app.use('/api/admin', require('../backend/routes/admin'));

const PORT = process.env.PORT || 5000;

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}