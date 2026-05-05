const db = require('../config/db');

async function createRefreshToken({ id, userId, tokenHash, expiresAt }) {
  await db.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, userId, tokenHash, expiresAt]
  );
}

async function findActiveRefreshToken({ id, tokenHash }) {
  const result = await db.query(
    `SELECT id, user_id, token_hash, expires_at, revoked_at
     FROM refresh_tokens
     WHERE id = $1
       AND token_hash = $2
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [id, tokenHash]
  );

  return result.rows[0] || null;
}

async function revokeRefreshToken(id) {
  await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE id = $1 AND revoked_at IS NULL`,
    [id]
  );
}

async function revokeAllUserRefreshTokens(userId) {
  await db.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

module.exports = {
  createRefreshToken,
  findActiveRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens
};

