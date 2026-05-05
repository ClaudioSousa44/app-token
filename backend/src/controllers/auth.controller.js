const bcrypt = require('bcryptjs');
const env = require('../config/env');
const userRepository = require('../repositories/user.repository');
const refreshTokenRepository = require('../repositories/refresh-token.repository');
const tokenService = require('../services/token.service');
const { validateRegister, validateLogin } = require('../validators/auth.validator');

const refreshCookieName = 'refreshToken';

function setRefreshCookie(res, token, expiresAt) {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/api/auth',
    expires: expiresAt
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'strict',
    path: '/api/auth'
  });
}

function authResponse(user) {
  return {
    user,
    accessToken: tokenService.createAccessToken(user.id)
  };
}

async function register(req, res, next) {
  try {
    const validation = validateRegister(req.body);

    if (!validation.valid) {
      return res.status(400).json({ message: 'Dados invalidos.', errors: validation.errors });
    }

    const existingUser = await userRepository.findUserByEmail(validation.data.email);

    if (existingUser) {
      return res.status(409).json({ message: 'Este e-mail ja esta cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(validation.data.password, env.BCRYPT_SALT_ROUNDS);
    const user = await userRepository.createUser({
      name: validation.data.name,
      email: validation.data.email,
      passwordHash
    });
    const refreshToken = await tokenService.createRefreshToken(user.id);

    setRefreshCookie(res, refreshToken.token, refreshToken.expiresAt);

    return res.status(201).json(authResponse(user));
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const validation = validateLogin(req.body);

    if (!validation.valid) {
      return res.status(400).json({ message: 'Dados invalidos.', errors: validation.errors });
    }

    const userWithPassword = await userRepository.findUserByEmail(validation.data.email);

    if (!userWithPassword) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const validPassword = await bcrypt.compare(validation.data.password, userWithPassword.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    await refreshTokenRepository.revokeAllUserRefreshTokens(userWithPassword.id);

    const user = userRepository.toUser(userWithPassword);
    const refreshToken = await tokenService.createRefreshToken(user.id);

    setRefreshCookie(res, refreshToken.token, refreshToken.expiresAt);

    return res.json(authResponse(user));
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies[refreshCookieName];

    if (!refreshToken) {
      return res.status(401).json({ message: 'Sessao expirada.' });
    }

    const rotatedToken = await tokenService.rotateRefreshToken(refreshToken);
    const user = await userRepository.findUserById(rotatedToken.userId);

    if (!user) {
      return res.status(401).json({ message: 'Usuario nao encontrado.' });
    }

    setRefreshCookie(res, rotatedToken.refreshToken, rotatedToken.refreshExpiresAt);

    return res.json({
      user,
      accessToken: rotatedToken.accessToken
    });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Sessao expirada.' });
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies[refreshCookieName];

    if (refreshToken) {
      try {
        const payload = require('jsonwebtoken').verify(refreshToken, env.JWT_REFRESH_SECRET);
        if (payload.jti) {
          await refreshTokenRepository.revokeRefreshToken(payload.jti);
        }
      } catch (error) {
        // Token ja invalido; ainda assim limpamos o cookie no cliente.
      }
    }

    clearRefreshCookie(res);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};

