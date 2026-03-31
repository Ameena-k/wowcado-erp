# Wowcado — Phase 1

A production-grade ERP platform built to replace core daily-use Zoho Books functions for Wowcado.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache/Queues | Redis (BullMQ) |
| Payments | Razorpay |
| Messaging | WhatsApp Cloud API |

## Monorepo Structure

```
wowcado-erp/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── api-client/   # Shared Axios API client
│   ├── config/       # Shared TypeScript configs
│   ├── database/     # Prisma schema + generated client
│   └── types/        # Shared TypeScript types and enums
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- Node.js >= 18
- pnpm >= 9.5.0 (`npm install -g pnpm`)
- Docker (for local Postgres + Redis)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
docker-compose up -d
```

### 3. Set up environment variables

```bash
# Root
cp .env.example .env

# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env

# Database
cp packages/database/.env.example packages/database/.env
```

### 4. Generate Prisma client & push schema

```bash
pnpm db:generate
pnpm --filter @wowcado/database db:push
```

### 5. Start all apps in development mode

```bash
pnpm dev
```

- **API**: [http://localhost:3001](http://localhost:3001)
- **Web**: [http://localhost:3000](http://localhost:3000)

## Phase 1 Modules

- [ ] Auth & Roles (JWT)
- [ ] Customers
- [ ] Vendors
- [ ] Products & Categories
- [ ] Orders
- [ ] Invoices
- [ ] Expenses
- [ ] Supplier Bills
- [ ] Customer Payments (Razorpay + Manual)
- [ ] Vendor Payments
- [ ] Accounting Engine (Double-Entry Journals)
- [ ] Reports
- [ ] WhatsApp Notifications
- [ ] Audit Logs
