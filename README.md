# ⚙️ Vendora — Backend API & Microservices Engine

The core RESTful API and backend processing engine for **Vendora**, a multi-tenant B2B2C Smart E-Commerce & Marketplace SaaS platform.

This service manages multi-tenant data isolation, Role-Based Access Control (RBAC), product catalog pipelines, instant search indexing, and multi-vendor sub-order fulfillment logic.

---

## 🛠️ Tech Stack & Architecture

- **Runtime & Framework:** Node.js, TypeScript, Express
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Caching & Queues:** Redis, BullMQ (Still In Progress)
- **Authentication:** JWT (JSON Web Tokens) with Refresh Tokens & Cookie Sessioning
- **Search Engine:** Meilisearch (Still IN Progress)
- **Media Uploads:** Cloudinary
- **Payment Processing:** Paymob && Stripe

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
├── config/          # Stripe & Paymob configurations
├── context/         # Request context & AsyncLocalStorage / Tenant context
├── middleware/      # Auth, Error handling & Raw-body middlewares
├── services/        # Core business logic (Checkout, Webhook, Onboarding, etc.)
├── controllers/     # Request handlers & HTTP response wrappers
├── routes/          # API Route definitions (Payment, Webhook, Tenant, etc.)
├── types/           # Custom TypeScript definitions & Interfaces
├── validation/      # Request payload validation schemas
├── utils/           # Helper functions, AppError & catchAsync wrappers
├── app.ts           # Express application setup & middleware mounting
└── server.ts        # Server entry point & database initialization
```

## 📚 API Documentation & Testing

### 🟢 Interactive Swagger UI

When the server is running locally, access the live interactive API documentation at:

- **Swagger Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **OpenAPI JSON Spec**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)

### 🟧 Postman Collection

You can easily test all endpoints using the pre-configured Postman Collection:

1. Download or locate the [`docs/vendora-postman-collection.json`](vendora-postman-collection.json) file in this repository.
2. Open Postman and click **Import**.
3. Drag & drop the JSON file.
4. Set up your local Environment Variables (`baseUrl`, `tenantId`, `token`).
