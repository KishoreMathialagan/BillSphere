# Bill Sphere - Software Architecture

This document outlines the software architecture of Bill Sphere, an AI-powered, mobile-first, offline-first retail operating system.

## 1. High-Level Architecture Overview
Bill Sphere is designed as a cloud-based SaaS platform with strong offline capabilities, emphasizing mobile accessibility and AI integration. 

### Technology Stack
- **Frontend**: React, TypeScript
- **Mobile**: React Native
- **Backend**: FastAPI (Python)
- **Primary Database**: PostgreSQL
- **Offline Database**: SQLite
- **Cache**: Redis
- **Storage**: S3 Compatible Storage
- **AI Layer**: OpenAI, Claude, Local LLM Support, Tesseract OCR, Vision APIs
- **Deployment**: Docker, Nginx, Linux Servers

## 2. SaaS Architecture
Bill Sphere follows a modern Cloud-Native SaaS model.
- **Backend Services**: Built using FastAPI, stateless and scalable to meet performance requirements (Billing Response < 2s, Search < 1s).
- **Data Persistence**: PostgreSQL handles the central source of truth. Redis is used for caching and session management. S3 is used for object storage (images, documents).
- **Scalability**: Dockerized containers deployed behind Nginx load balancers to support Single Store, Multi-Branch, and Enterprise Chains seamlessly, targeting 99.9% uptime.
- **Security & Compliance**: RBAC (Role-Based Access Control), JWT Authentication, 2FA, Device Verification, and Data Encryption ensure strict security. Comprehensive audit trails are maintained for all actions.

## 3. Multi-Tenant Architecture
The platform is designed to securely host multiple retail businesses.
- **Data Isolation**: The PostgreSQL database will utilize multi-tenancy (either schema-per-tenant or row-level security) to ensure complete data isolation between different businesses.
- **Branch Management**: Within each tenant, the system supports Multi-Branch Management, including Branch Creation, Inventory, Employees, Sales, and Inter-Branch Operations (Stock Transfer).
- **Access Control**: Role-based permissions (Owner, Manager, Accountant, Cashier, Store Keeper) enforce security within a tenant's organization across all branches.

## 4. Offline-First Architecture
A core requirement is that billing must never stop due to internet outages.
- **Local Storage**: Each device (mobile, tablet, desktop) maintains a local SQLite database containing Products, Inventory, Customers, Vendors, Sales, Purchases, and Settings.
- **Offline Operations**: Core operations like Billing, Inventory lookup, Printing, Customer Lookup, and GST Calculation are fully supported offline and read/write to the local database.
- **Synchronization Engine**: When internet connectivity is restored, a background synchronization engine automatically syncs local transactions, inventory changes, and accounting entries with the central PostgreSQL database. It handles conflict resolution and generates audit logs for all synced data.

## 5. Mobile-First Architecture
The platform ensures every feature works completely on mobile devices.
- **Mobile App**: Built with React Native to provide native performance, offline database capabilities, and hardware access (camera for barcode scanning).
- **Responsive Web**: The React frontend is designed with a mobile-first approach, ensuring the web application is fully usable on smartphone browsers if the app is not installed.
- **Hybrid POS Modes**: Supports Smartphone Only Billing (Mode 1), where the smartphone camera acts as a scanner and the entire billing process happens on the phone without any extra hardware.

## 6. AI Integration Architecture
Artificial intelligence is natively integrated into the operational workflows, not just as a separate feature.
- **AI Business Intelligence Layer**:
  - **AI Business Advisor**: Calculates Business Health Score, Revenue/Profit Insights, and Growth Recommendations.
  - **Forecasting Engines**: Predicts sales (Daily/Weekly/Monthly) and demand (Product/Category/Seasonal), as well as inventory needs (Stock Outs, Reorder Dates/Quantities).
  - **Profit Optimization**: Analyzes margins, supplier costs, and product performance to generate optimization recommendations.
- **AI Assistant**: A conversational interface supporting English and Tamil for Natural Language Queries (e.g., "What was my profit last month?", "Which products are not selling?"). Converts business questions into data insights.
- **Computer Vision Module**: 
  - Uses smartphone cameras for Barcode Recognition.
  - **Invoice OCR** (using Tesseract/Vision APIs) to extract Product Name, Quantity, Price, and GST from vendor bills to automatically create purchase entries.
  - Future expansion planned for direct Product Recognition without barcodes.

## 7. Hardware Integration Architecture
Bill Sphere supports a wide range of retail hardware configurations.
- **Supported Hardware**: Barcode Scanners (USB, Bluetooth, Wireless), Thermal Printers (58mm, 80mm), Cash Drawers, Customer Displays, Weighing Scales, and traditional POS Terminals.
- **Hybrid Modes**:
  - **Mode 1**: Smartphone Only Billing (uses camera).
  - **Mode 2**: Desktop POS + Smartphone Scanner (Phone camera acts as barcode scanner, billing occurs on desktop).
  - **Mode 3**: Traditional POS (Barcode scanner and printer based billing).
  - **Mode 4**: Hybrid Enterprise Mode (Combines Desktop POS, Barcode Scanner, Mobile Scanner, Thermal Printer, and Manager Dashboard).
- **Communication Layer**: The mobile app and frontend utilize modern web APIs (WebUSB, WebBluetooth) or native mobile bridges to communicate with local hardware peripherals smoothly.
