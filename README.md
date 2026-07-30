# Utkarsh Toss Book

A cricket and football toss betting platform with user and admin interfaces.

## Features

### User Features
- Login/Register interface
- View upcoming cricket and football matches
- Place bets on toss outcomes
- 1.95x payout on winning bets
- Wallet management
- Transaction history
- My bets tracking
- Mobile-optimized responsive design

### Admin Features
- Add cricket/football matches worldwide
- Unlimited coins for admin
- Add/subtract coins from user accounts
- Manage match results
- View all bets and transactions
- Dashboard with analytics
- User management

## Tech Stack

- **Frontend**: React, TailwindCSS, Vite
- **Backend**: Node.js, Express
- **Database**: SQLite
- **Authentication**: JWT

## Setup

1. Install dependencies:
```bash
npm run install-all
```

2. Start development servers:
```bash
npm run dev
```

- Frontend runs on http://localhost:5173
- Backend runs on http://localhost:5000

## Public Hosting Deployment

### For Production Deployment:

1. **Backend Deployment** (Render, Railway, Heroku, etc.):
   - Upload all backend files including .env
   - Set environment variables:
     - PORT: Your chosen port (default 5000)
     - JWT_SECRET: Your secret key
     - NODE_ENV: production
   - Ensure database.sqlite is included or use a hosted database

2. **Frontend Deployment** (Vercel, Netlify, etc.):
   - Build the frontend:
```bash
cd frontend
npm run build
```
   - Upload the `dist` folder
   - Update API base URL in frontend code to point to your deployed backend

3. **Configuration Files**:
   - All files are accessible (no .gitignore restrictions)
   - .env file contains configuration
   - database.sqlite contains user data

### File Structure for Deployment:

```
UTKARSH TOSS BOOK/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── package.json
│   ├── database/
│   ├── middleware/
│   └── routes/
├── frontend/
│   ├── public/
│   │   ├── logo.jpg
│   │   └── background.jpg
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database.sqlite
├── package.json
└── README.md
```

## Default Admin

- Email: admin@utkarsh.com
- Password: admin123
