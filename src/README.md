# Hoa Minh Backend

Express.js API base with Prisma and MySQL.

## Setup

```bash
cd src
npm install
copy .env.example .env
npm run prisma:generate
npm run db:push
npm run dev
```

Update `DATABASE_URL` in `.env` before running database commands.

## Scripts

- `npm run dev`: start API with nodemon
- `npm start`: start API with Node
- `npm run prisma:generate`: generate Prisma Client
- `npm run prisma:validate`: validate Prisma schema
- `npm run db:push`: push schema to MySQL
- `npm run db:migrate`: create a migration
- `npm run db:studio`: open Prisma Studio
- `npm run db:seed`: seed demo data

## API

- `GET /api`: API metadata
- `GET /api/health`: app and database health
- `GET /api/products`: list products
- `GET /api/products/:idOrSlug`: product detail
- `POST /api/products`: create product
- `PATCH /api/products/:id`: update product
- `DELETE /api/products/:id`: soft delete product
