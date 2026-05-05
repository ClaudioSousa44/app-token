const tokenService = require('../services/token.service');
const userRepository = require('../repositories/user.repository');

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Token ausente.' });
    }

    const payload = tokenService.verifyAccessToken(token);
    const user = await userRepository.findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'Usuario nao encontrado.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido ou expirado.' });
  }
}

module.exports = {
  requireAuth
};

