#!/usr/bin/env node
/**
 * Generate a bcrypt hash for seeding / rotating the admin password.
 *
 * Usage:
 *   node scripts/hash-password.js "YourStrongPassword"
 *
 * Paste the printed hash into admin_users.password_hash (phpMyAdmin), e.g.:
 *   UPDATE admin_users SET password_hash = '<hash>' WHERE username = 'admin';
 */
const bcrypt = require('bcryptjs');

const pwd = process.argv[2];
if (!pwd) {
  console.error('Usage: node scripts/hash-password.js "<password>"');
  process.exit(1);
}

const hash = bcrypt.hashSync(pwd, 10);
console.log(hash);
