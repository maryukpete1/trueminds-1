# Trueminds Project: Chuks Kitchen API

This repository contains the backend implementation for **Chuks Kitchen**, a food ordering and customer management platform developed for Mr. Chukwudi Okorie. 

The backend is built with a modern, scalable Node.js stack using **NestJS**, **TypeScript**, and **MongoDB**.

## 🚀 Projects Included

- **`chuks-kitchen-api/`**: The complete backend API implementation.

## ✨ Key Features (Backend API)

- **Authentication System**: Secures endpoints with JWT. Supports local email/phone signup, OTP verification, and multiple OAuth providers (Google, Facebook).
- **Menu & Food Management**: Role-based access for Admins to add/edit menu items, and for Customers to browse, search, and filter available foods.
- **Cart Management**: Robust per-user shopping carts that dynamically check real-time availability and calculate pricing.
- **Order Lifecycle**: Processes checkouts, snapshots prices, and enforces strict state-machine controls (`Pending` → `Confirmed` → `Preparing` → `Out for Delivery` → `Completed` / `Cancelled`).

## 📖 Getting Started

To run the backend application locally:

1. Navigate into the backend directory:
   ```bash
   cd chuks-kitchen-api
   ```
2. Follow the detailed setup instructions found in the [Backend README](./chuks-kitchen-api/README.md).

## 📄 Documentation

The complete architectural documentation, data models, and flow diagrams are included within the `chuks-kitchen-api/docs` directory:
- [System Overview & API Guide](./chuks-kitchen-api/README.md)
- [Database Entity Relationship Diagrams (ERD)](./chuks-kitchen-api/docs/data-model.md)
- [System Flow & Sequence Diagrams](./chuks-kitchen-api/docs/flow-diagrams.md)