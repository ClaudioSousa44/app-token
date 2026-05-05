const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

async function start() {
  await testConnection();

  app.listen(env.PORT, () => {
    console.log(`API rodando em http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error('Falha ao iniciar a API:', error);
  process.exit(1);
});

