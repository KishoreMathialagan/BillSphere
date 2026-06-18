# Bill Sphere - FastAPI Backend Blueprint

This document outlines the backend architecture blueprint for Bill Sphere using **FastAPI** and **Python**. It defines the structural layout, layering, and authentication flow to support a highly scalable, multi-tenant SaaS application.

## 1. Folder Structure

The application follows a clean architecture pattern, separating API routing, business logic, and database access.

```text
backend/
├── app/
│   ├── api/                 # API Routers (Controllers)
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── branches.py
│   │   │   ├── inventory.py
│   │   │   ├── billing.py
│   │   │   ├── ai_assistant.py
│   │   │   └── ...
│   │   └── dependencies.py  # FastAPI dependencies (get_db, get_current_user, tenant context)
│   ├── core/                # App-wide settings and configurations
│   │   ├── config.py        # Environment variables and settings
│   │   ├── security.py      # JWT encoding/decoding, Password Hashing (bcrypt)
│   │   └── exceptions.py    # Custom global exception handlers
│   ├── db/                  # Database session and setup
│   │   ├── session.py       # SQLAlchemy engine and session maker
│   │   ├── base.py          # SQLAlchemy declarative base
│   │   └── migrations/      # Alembic migration scripts
│   ├── models/              # SQLAlchemy ORM Models (Database representation)
│   │   ├── tenant.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── invoice.py
│   │   └── ...
│   ├── schemas/             # Pydantic Models (Data validation & API serialization)
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── invoice.py
│   │   └── ...
│   ├── repositories/        # Data Access Layer (CRUD operations & SQL queries)
│   │   ├── base.py          # Generic BaseRepository [T]
│   │   ├── user_repo.py
│   │   ├── inventory_repo.py
│   │   └── ...
│   ├── services/            # Business Logic Layer (Use cases)
│   │   ├── auth_service.py
│   │   ├── billing_service.py
│   │   ├── inventory_service.py
│   │   └── ...
│   ├── ai/                  # AI Integration Layer
│   │   ├── advisor.py       # Business Health & Forecasting logic
│   │   ├── nlp_engine.py    # Natural language query parser
│   │   └── ocr_parser.py    # Invoice scanning logic
│   └── main.py              # FastAPI application instance & entry point
├── tests/                   # Pytest test suite
├── requirements.txt         # Python dependencies
├── Dockerfile               # Containerization definition
└── alembic.ini              # Alembic configuration
```

## 2. Layering Architecture

The backend strictly enforces the following flow of execution:
**Request** ➔ **API Route** ➔ **Service** ➔ **Repository** ➔ **Database**

### 2.1 API Routes (Controllers)
- Resides in `app/api/v1/`.
- Responsible strictly for HTTP concerns: receiving requests, depending on Pydantic `schemas` for validation, calling the appropriate `Service`, and returning HTTP responses.
- No business logic resides here.

### 2.2 Services (Business Logic)
- Resides in `app/services/`.
- Contains the core application rules.
- Examples:
  - `BillingService`: Handles invoice generation, orchestrates tax calculations (CGST/SGST), and invokes `InventoryService` to deduct stock.
  - `AuthService`: Validates credentials, generates OTPs, and creates JWTs.
  - `SyncService`: Handles offline-to-online data synchronization, conflict resolution, and appending to audit logs.

### 2.3 Repositories (Data Access Layer)
- Resides in `app/repositories/`.
- Abstracts SQLAlchemy queries away from the business logic.
- Implements a `BaseRepository` that automatically applies the `tenant_id` filter to every query, ensuring multi-tenant data isolation at the ORM level.
- Examples: `get_by_id`, `create`, `update`, `delete`, `get_low_stock_items`.

### 2.4 Models & Schemas
- **Models (`app/models/`)**: SQLAlchemy declarative classes mapping exactly to PostgreSQL tables.
- **Schemas (`app/schemas/`)**: Pydantic `BaseModel` classes defining API Request (e.g., `InvoiceCreate`) and Response (e.g., `InvoiceResponse`) payloads.

## 3. API Routes Blueprint

A high-level view of standard routes to be exposed:

- **Auth**: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/verify-otp`
- **Tenants/Branches**: `GET /branches`, `POST /branches`
- **Inventory**: `GET /inventory`, `POST /inventory/adjust`, `GET /inventory/low-stock`
- **Billing**: `POST /invoices`, `GET /invoices/{id}`, `POST /quotations/{id}/convert`
- **Customers**: `GET /customers`, `GET /customers/{id}/ledger`
- **AI/Insights**: `POST /ai/query` (NLP Queries), `POST /ai/scan-invoice` (OCR), `GET /reports/forecasting`
- **Offline Sync**: `POST /sync/push`, `GET /sync/pull`

## 4. Authentication & Multi-Tenancy Architecture

### 4.1 JWT Authentication
- The system uses **Stateless JWT (JSON Web Tokens)**.
- Upon successful login via `/auth/login`, the user receives an `access_token` and `refresh_token`.
- **Token Payload**: The JWT payload securely embeds standard claims along with business context:
  ```json
  {
    "sub": "user_12345",
    "tenant_id": "tenant_9876",
    "branch_id": "branch_111",
    "role": "Manager",
    "exp": 1690000000
  }
  ```

### 4.2 FastAPI Dependency Injection for Multi-Tenancy
FastAPI's powerful `Depends` system guarantees data isolation dynamically per request.

- **`get_current_user` Dependency**: Intercepts the request, validates the JWT signature, and decodes the payload.
- **Tenant Context Injection**: The decoded `tenant_id` is automatically extracted and injected into the request context or passed directly to the Service layer.
- **Enforcement**: Any call to a Repository method requires the `tenant_id`.
  - *Example API signature:*
    ```python
    @router.get("/inventory")
    def get_inventory(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
    ):
        return inventory_service.get_all(db, tenant_id=current_user.tenant_id)
    ```
- **Role-Based Access Control (RBAC)**: Further dependencies (e.g., `RequireRole("Owner")`) check the `role` claim in the JWT before allowing the request to proceed to the route handler.

## 5. Offline Sync Mechanism (Backend View)
To support the Offline-First Architecture:
- The backend exposes a `/sync/push` endpoint that accepts a batch payload of offline transactions from the local SQLite database.
- The payload includes a `last_updated_at` timestamp.
- The `SyncService` processes these transactions sequentially in a single database transaction using SQLAlchemy.
- It relies on Last-Write-Wins (LWW) or version-based conflict resolution if multiple branches modify the same global entity simultaneously.
