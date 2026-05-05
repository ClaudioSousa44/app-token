const db = require('../config/db');

function toUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at
  };
}

async function createUser({ name, email, passwordHash }) {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );

  return toUser(result.rows[0]);
}

async function findUserByEmail(email) {
  const result = await db.query(
    `SELECT id, name, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await db.query(
    `SELECT id, name, email, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return toUser(result.rows[0]);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  toUser
};

