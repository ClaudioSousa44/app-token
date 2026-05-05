function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateRegister(payload) {
  const name = String(payload.name || '').trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');
  const errors = [];

  if (name.length < 2 || name.length > 100) {
    errors.push('Nome deve ter entre 2 e 100 caracteres.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('E-mail invalido.');
  }

  if (password.length < 8 || password.length > 128) {
    errors.push('Senha deve ter entre 8 e 128 caracteres.');
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    errors.push('Senha precisa conter letra minuscula, letra maiuscula e numero.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: { name, email, password }
  };
}

function validateLogin(payload) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');
  const errors = [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('E-mail invalido.');
  }

  if (!password) {
    errors.push('Senha obrigatoria.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: { email, password }
  };
}

module.exports = {
  validateRegister,
  validateLogin
};

