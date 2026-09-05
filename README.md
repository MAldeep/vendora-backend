# ⚙️ Vendora — Backend API & Microservices Engine

The core RESTful API and backend processing engine for **Vendora**, a multi-tenant B2B2C Smart E-Commerce & Marketplace SaaS platform.

This service manages multi-tenant data isolation, Role-Based Access Control (RBAC), product catalog pipelines, instant search indexing, and multi-vendor sub-order fulfillment logic.

---

## 🛠️ Tech Stack & Architecture

- **Runtime & Framework:** Node.js, TypeScript, Express / NestJS
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Caching & Queues:** Redis, BullMQ
- **Authentication:** JWT (JSON Web Tokens) with Refresh Tokens & Cookie Sessioning
- **Search Engine:** Meilisearch
- **Media Uploads:** Cloudinary
- **Payment Processing:** Paymob

---

## 🏗️ Core Architecture & Features

### 1. Multi-Tenant Architecture

- Complete data segregation per store using scoped `tenant_id` queries.
- Flexible Role-Based Access Control (`SUPER_ADMIN`, `TENANT_OWNER`, `TENANT_STAFF`, `CONSUMER`).

### 2. Catalog & Inventory Management

- Dynamic variant attributes via PostgreSQL `JSONB`.
- Real-time stock tracking and low-inventory alerts.

### 3. Smart Order Engine (Master & Sub-Orders)

- Single checkout processing for multi-vendor carts.
- Automatic splitting of `Master_Order` into isolated `Tenant_Order` items for individual store fulfillment.

### 4. Background Job Processing

- BullMQ queue integration powered by Redis for asynchronous email dispatches, stock updates, and payment webhooks.

---

## 📁 Repository Structure

```text
src/
├── config/             # Environment variables & Database configs
├── modules/
│   ├── auth/           # Authentication & RBAC Middlewares
│   ├── tenants/        # Tenant onboarding & settings
│   ├── products/       # Products, categories & dynamic variants
│   ├── cart/           # Redis cart sync engine
│   ├── orders/         # Master & Sub-order management
│   └── payments/       # Gateway integrations (Paymob/Stripe)
├── jobs/               # BullMQ Background Queues & Processors
├── common/             # Interceptors, filters & global utilities
└── prisma/             # Schema definitions & Database migrations
```
