function notFound(req, res) {
  res.status(404).json({ message: 'Rota nao encontrada.' });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  return res.status(error.status || 500).json({
    message: error.message || 'Erro interno do servidor.'
  });
}

module.exports = {
  notFound,
  errorHandler
};

