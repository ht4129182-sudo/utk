const { execSync } = require('child_process');
const path = require('path');

console.log('=== Starting Build Process ===');

try {
  console.log('Installing backend dependencies...');
  execSync('cd backend && npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('Backend dependencies installed');

  console.log('Installing frontend dependencies...');
  execSync('cd frontend && npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('Frontend dependencies installed');

  console.log('Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
  console.log('=== Build Complete ===');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
