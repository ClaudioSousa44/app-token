# App Token

Sistema basico com Angular, Node.js e PostgreSQL para cadastro, login e area protegida por guard.

## Estrutura

- `backend/`: API Node.js com Express, PostgreSQL, bcrypt, JWT, refresh token com cookie `httpOnly`, rate limit e Helmet.
- `frontend/`: app Angular standalone com formularios reativos, guards e interceptor HTTP.
- `docker-compose.yml`: PostgreSQL local com inicializacao do schema.

## Requisitos

- Node.js 20+
- npm
- Docker e Docker Compose

## Banco de Dados

Suba o PostgreSQL:

```bash
docker compose up -d postgres
```

O schema e criado automaticamente a partir de `backend/sql/schema.sql` na primeira inicializacao do volume.

## Backend

Entre na pasta da API:

```bash
cd backend
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Troque `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` por valores longos e aleatorios.

Instale e execute:

```bash
npm install
npm run dev
```

A API fica em:

```text
http://localhost:3000/api
```

Rotas principais:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

O app fica em:

```text
http://localhost:4200
```

## Fluxo de Seguranca

- Senhas sao salvas com hash `bcrypt`.
- O access token tem duracao curta e vai no header `Authorization: Bearer`.
- O refresh token fica em cookie `httpOnly`, com `sameSite=strict`.
- O refresh token e salvo no banco apenas como hash SHA-256.
- Cada renovacao revoga o refresh token anterior e emite um novo.
- O Angular usa `authGuard` para proteger `/dashboard`.
- O Angular usa `guestGuard` para impedir usuario logado de acessar login/cadastro.
- O interceptor tenta renovar a sessao automaticamente quando recebe `401`.

## Producao

Antes de publicar:

- Use HTTPS e configure `COOKIE_SECURE=true`.
- Restrinja `FRONTEND_URL` ao dominio real do frontend.
- Use secrets fortes fora do repositorio.
- Use migrations versionadas para evoluir o schema.
- Configure backup e monitoramento do PostgreSQL.

# app-token
