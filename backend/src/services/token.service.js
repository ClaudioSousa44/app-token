const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const refreshTokenRepository = require('../repositories/refresh-token.repository');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function ttlToMilliseconds(ttl) {
  const match = /^(\d+)([smhd])$/.exec(ttl);

  if (!match) {
    throw new Error(`Formato de TTL invalido: ${ttl}`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * multipliers[unit];
}

function createAccessToken(userId) {
  return jwt.sign(
    { type: 'access' },
    env.JWT_ACCESS_SECRET,
    {
      subject: userId,
      expiresIn: env.ACCESS_TOKEN_TTL
    }
  );
}

async function createRefreshToken(userId) {
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlToMilliseconds(env.REFRESH_TOKEN_TTL));
  const token = jwt.sign(
    { type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    {
      subject: userId,
      jwtid: tokenId,
      expiresIn: env.REFRESH_TOKEN_TTL
    }
  );

  await refreshTokenRepository.createRefreshToken({
    id: tokenId,
    userId,
    tokenHash: hashToken(token),
    expiresAt
  });

  return {
    token,
    expiresAt
  };
}

async function rotateRefreshToken(refreshToken) {
  const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

  if (payload.type !== 'refresh' || !payload.sub || !payload.jti) {
    throw new Error('Refresh token invalido.');
  }

  const storedToken = await refreshTokenRepository.findActiveRefreshToken({
    id: payload.jti,
    tokenHash: hashToken(refreshToken)
  });

  if (!storedToken) {
    throw new Error('Refresh token revogado ou expirado.');
  }

  await refreshTokenRepository.revokeRefreshToken(payload.jti);
  const nextRefreshToken = await createRefreshToken(payload.sub);

  return {
    userId: payload.sub,
    accessToken: createAccessToken(payload.sub),
    refreshToken: nextRefreshToken.token,
    refreshExpiresAt: nextRefreshToken.expiresAt
  };
}

function verifyAccessToken(accessToken) {
  const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET);

  if (payload.type !== 'access' || !payload.sub) {
    throw new Error('Access token invalido.');
  }

  return payload;
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  verifyAccessToken,
  hashToken,
  ttlToMilliseconds
};

