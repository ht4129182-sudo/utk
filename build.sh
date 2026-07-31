#!/bin/bash
set -e
echo "=== Starting Build Process ==="
echo "Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps
echo "Backend dependencies installed"
cd ..
echo "Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
echo "Frontend dependencies installed"
echo "Building frontend..."
npm run build
echo "=== Build Complete ==="
