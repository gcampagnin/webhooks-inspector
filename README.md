# Webhook Inspector

Aplicação full stack para capturar e inspecionar webhooks. O projeto é dividido em dois pacotes:

- `api`: servidor Fastify com TypeScript, Drizzle ORM e PostgreSQL.
- `web`: interface React criada com Vite.

## Pré-requisitos

- Node.js 18 ou superior
- pnpm (o projeto usa workspaces)
- Docker + Docker Compose (opcional, recomendado para subir o PostgreSQL localmente)

## Instalação

1. Instale as dependências em todos os pacotes:
   ```bash
   pnpm install
   ```
2. Configure as variáveis de ambiente da API:
   - Duplique `api/.env` (ou crie um novo arquivo `.env`) e ajuste `DATABASE_URL` conforme seu ambiente.
3. Se quiser usar o banco local via Docker:
   ```bash
   docker compose -f api/docker-compose.yml up -d
   ```

## Uso

### API

1. Garanta que o banco PostgreSQL esteja acessível.
2. Rode as migrações se necessário:
   ```bash
   pnpm --filter api run db:migrate
   ```
3. Inicie o servidor em modo desenvolvimento:
   ```bash
   pnpm --filter api run dev
   ```
4. A API ficará disponível em `http://localhost:3333` e a documentação interativa em `http://localhost:3333/docs`.

### Web

1. Inicie a aplicação web:
   ```bash
   pnpm --filter web run dev
   ```
2. A interface estará em `http://localhost:5173`.

## Scripts úteis

- `pnpm --filter api run db:generate`: gera arquivos do Drizzle a partir do schema.
- `pnpm --filter api run db:migrate`: aplica migrações no banco configurado.
- `pnpm --filter api run format`: formata o código com Biome.
- `pnpm --filter web run build`: cria a versão de produção da interface.

## Tecnologias

- Fastify, Zod e Swagger para a API.
- Drizzle ORM e PostgreSQL para persistência de dados.
- React 19 com Vite e TypeScript para o front-end.
