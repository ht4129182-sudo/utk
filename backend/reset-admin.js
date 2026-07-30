const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

async function resetAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Delete existing admin if exists
  db.run("DELETE FROM users WHERE email = ?", ['admin@utkarsh.com'], (err) => {
    if (err) {
      console.error('Error deleting admin:', err);
    } else {
      console.log('Existing admin deleted');
      
      // Create new admin
      db.run(
        "INSERT INTO users (name, email, password, role, balance) VALUES (?, ?, ?, ?, ?)",
        ['Admin', 'admin@utkarsh.com', hashedPassword, 'admin', 999999999],
        (err) => {
          if (err) {
            console.error('Error creating admin:', err);
          } else {
            console.log('Admin reset successfully!');
            console.log('Email: admin@utkarsh.com');
            console.log('Password: admin123');
          }
          db.close();
        }
      );
    }
  });
}

resetAdmin();
