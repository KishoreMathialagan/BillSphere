# Bill Sphere - React Frontend Architecture

This document outlines the frontend routing structure, page hierarchy, and structural blueprint for the Bill Sphere React application.

## 1. Page Hierarchy & Routing Structure

The application utilizes a hierarchical routing structure (typically managed by React Router v6+) to separate public authentication flows from protected, tenant-aware business dashboards.

### Public Routes
Routes accessible without authentication, primarily for onboarding and recovery.

- `/login` - User Login (Password / OTP)
- `/register` - Business Registration & Onboarding
- `/forgot-password` - Password Reset flow

### Protected Routes (App Layout)
All routes under `/app` require active authentication. They are wrapped within a main Application Layout containing a responsive Sidebar, Header, and main Content Area.

#### Dashboard
- `/app/dashboard` - Main overview, key performance metrics, and AI Business Health Score.

#### Products
- `/app/products` - Directory of all products.
- `/app/products/new` - Create a new product.
- `/app/products/:id` - View/Edit product details and pricing.
- `/app/products/categories` - Manage product categories.

#### Inventory
- `/app/inventory` - Current stock levels across selected branches.
- `/app/inventory/adjust` - Manual stock adjustments (Stock In/Out/Wastage).
- `/app/inventory/transfers` - Inter-branch stock transfers.
- `/app/inventory/alerts` - Dashboard for low stock and expiry warnings.

#### Billing & POS
*Designed for extreme performance and offline capability.*
- `/app/billing` - Main POS interface (Supports barcode scanning, camera billing, cart management, and payment processing).
- `/app/billing/invoices` - View past invoices and receipts.
- `/app/billing/invoices/:id` - Detailed view of a specific invoice.
- `/app/billing/quotations` - Create and manage quotations.

#### Purchases
- `/app/purchases` - List of purchase orders and vendor bills.
- `/app/purchases/new` - Enter new vendor bills (incorporates the AI OCR scanning option).
- `/app/purchases/:id` - View specific purchase details.
- `/app/purchases/returns` - Manage purchase returns.

#### Customers
- `/app/customers` - Customer directory.
- `/app/customers/:id` - Customer profile, lifetime value, purchase history, outstanding dues.
- `/app/customers/loyalty` - Reward points and membership program management.

#### Vendors
- `/app/vendors` - Vendor directory.
- `/app/vendors/:id` - Vendor profile, vendor statements, and outstanding payments.

#### Accounting
- `/app/accounting/ledgers` - View specific ledgers (Sales, Purchase, Customer, Vendor, Cash, Bank).
- `/app/accounting/statements` - Financial statements (P&L, Balance Sheet, Trial Balance, Cash Flow).
- `/app/accounting/banking` - Bank transactions and reconciliation.
- `/app/accounting/gst` - GST summaries, GSTR-1, GSTR-3B compliance exports, and E-Way bill generation.

#### Reports & Analytics
- `/app/reports/sales` - Sales analytics (Daily/Weekly/Monthly charts).
- `/app/reports/inventory` - Inventory analytics (Fast/Slow moving, Dead stock).
- `/app/reports/financial` - Revenue, expenses, and profitability analysis.

#### AI Assistant
- `/app/ai` - Full-page conversational interface for the AI Business Assistant.
- *(Note: A miniaturized AI Assistant widget will also be globally available as a persistent floating action button across all `/app` routes).*

#### Settings (Implicitly required)
- `/app/settings/business` - Business profile, GST configuration, and invoice settings.
- `/app/settings/branches` - Multi-branch management.
- `/app/settings/employees` - User profiles, roles, and access management.

## 2. Directory Structure Blueprint

```text
frontend/
├── src/
│   ├── assets/              # Static assets (images, icons, global CSS/SCSS)
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Base UI (Buttons, Inputs, Modals, Tables, Cards)
│   │   ├── layout/          # Sidebar, Header, AppLayout wrapper
│   │   └── pos/             # Complex POS specific components (Cart, Scanner View)
│   ├── context/             # React Contexts (AuthContext, OfflineContext, TenantContext)
│   ├── hooks/               # Custom hooks (useAuth, useOfflineDb, useAI)
│   ├── pages/               # Route-level components mapping directly to the structure above
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── billing/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── purchases/
│   │   ├── customers/
│   │   ├── vendors/
│   │   ├── accounting/
│   │   ├── reports/
│   │   └── ai/
│   ├── services/            # API clients and offline synchronization logic
│   │   ├── api.ts           # Axios configuration with JWT interceptors
│   │   ├── syncService.ts   # Logic for pushing/pulling offline queue to backend
│   │   └── offlineDb.ts     # Wrapper for Local Storage (IndexedDB/WASM SQLite)
│   ├── store/               # Global state management (e.g., Zustand or Redux Toolkit)
│   ├── utils/               # Formatting, constants, calculations, and helpers
│   ├── App.tsx              # Main routing configuration
│   └── index.tsx            # Application entry point
```

## 3. Structural Concepts

- **Offline-First Synchronization**: The `offlineDb.ts` module will cache data locally using IndexedDB or a browser-based SQLite implementation. The POS interface (`/app/billing`) will read/write primarily to this local store. `syncService.ts` will monitor the network state and automatically flush local changes to the FastAPI backend in the background.
- **Mobile Responsiveness**: Following the "Mobile First" principle, all UI components will be designed for small screens first. The `/app/billing` page will dynamically adapt: providing a unified camera-scanner interface on mobile, while displaying a multi-pane POS layout (item list + cart side-by-side) on tablets and desktops.
- **State Management**: Global application state (Current User, Active Branch, Network Status) will be handled via React Context or a lightweight library like Zustand to prevent prop-drilling. Local, highly-interactive state (like the active items in the billing cart) will remain tightly coupled to the specific page component to maximize rendering performance.
