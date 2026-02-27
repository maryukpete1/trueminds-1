# Chuks Kitchen — Backend API

Backend API for **Chuks Kitchen**, a food ordering and customer management platform designed for Mr. Chukwudi Okorie.

## Tech Stack
- **Framework:** NestJS (Node.js) + TypeScript
- **Database:** MongoDB (via Mongoose ORM)
- **Authentication:** Passport.js (JWT, Facebook OAuth), Google Auth Library (Direct Google OAuth)
- **Validation:** class-validator & class-transformer
- **Documentation:** Swagger/OpenAPI

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas connection string
- Facebook App credentials (for OAuth)
- Google Cloud Project credentials (for OAuth)

### 2. Installation
```bash
# Clone or navigate to the repository
cd chuks-kitchen-api

# Install dependencies
npm install
```

### 3. Configuration
Duplicate the `.env.example` file to create a `.env` file and populate it:
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chuks-kitchen
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
GOOGLE_CLIENT_ID=your-google-client-id
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback
```

### 4. Running the App
```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 5. API Documentation
Once the server is running, visit **[http://localhost:3000/api](http://localhost:3000/api)** for the interactive Swagger documentation.

---

## 🏗️ System Architecture & Modules

The backend follows a modular monolith architecture, broken into 6 primary feature modules:
1. **AuthModule:** Handles phone/email signup, OTP verification, login, Google OAuth, and Facebook OAuth.
2. **UsersModule:** Manages user profiles, role assignments (customer vs. admin), and address storage.
3. **FoodsModule:** Manages the menu. Admins handle CRUD; customers browse with pagination, search, and category filters.
4. **CartModule:** Manages per-user shopping carts. Real-time total calculation and availability validation.
5. **OrdersModule:** Converts a cart into an order, handles status lifecycle transitions, and order history.
6. **RatingsModule:** (Optional) Allows users to rate completed orders and specific food items.

---

## 🛡️ Edge Case Handling

1. **Duplicate Registrations:** The `signup` endpoint returns a `409 Conflict` if an email or phone number is already registered.
2. **Expired/Invalid OTPs:** OTPs are set to expire in 10 minutes. Verifications fail with a clear `400` message if expired or globally invalid.
3. **Abandoned Signups:** If a user registers but never verifies their OTP, their account remains `isVerified: false`. They cannot log in, but they can request a new OTP via `/auth/resend-otp`.
4. **Social Account Linking:** If a user signs up via Google/Facebook with an email that already exists in the database, the accounts are intelligently linked instead of throwing a duplicate error.
5. **Item Unavailability in Cart:** If an admin marks an item as out-of-stock (`isAvailable: false`) *after* a user adds it to their cart, attempting to checkout (`POST /orders`) will throw a `400 Bad Request` explicitly citing which items must be removed before proceeding.
6. **Invalid Order Transitions:** Order statuses are strictly enforced (`Pending` → `Confirmed` → `Preparing` → `Out for Delivery` → `Completed`). An admin cannot transition a `Completed` order back to `Preparing`.

---

## 📝 Assumptions Made

Due to some missing components in the initial BRD or Figma descriptions, the following technical assumptions were made:
- **Authentication:** The BRD stated "no auth required," but the scenario explicitly walked through signups, OTPs, and social logins. Full JWT and OAuth authentication was implemented.
- **Payment Processing:** The BRD stated to "assume logic only." Therefore, the backend does not integrate Paystack/Flutterwave. Instead, orders are created with a `Pending` status, assuming a front-end or webhook would trigger the successful payment and move it to `Confirmed`.
- **OTP Delivery:** Actual SMS (Twilio/Termii) or Email (SendGrid) integrations are simulated. OTPs are logged to the console during development.
- **Admin Access:** Since there were no Admin UI designs, administrative functions (adding foods, moving order statuses) are built strictly as REST APIs utilizing a Role-Based Access Control (`@Roles('admin')`) guard.

---

## 📈 Scalability Considerations

As the Chuks Kitchen user base grows from 100 to 10,000+ users, the backend is designed to scale:
- **Database Indexes:** MongoDB schemas heavily utilize indexing on frequently queried fields like `email`, `phoneNumber`, `category`, and `status`. It also includes text indexing on `name` and `description` to optimize the search features.
- **Stateless Authentication:** Using JWTs (`@nestjs/jwt`) ensures the API remains fully stateless. This allows horizontal scaling across multiple Node.js instances behind a load balancer without configuring server stickiness or distributed session caches.
- **Data Snapshotting:** Order items take a snapshot of the `name` and `price` fields at the time of purchase. This ensures that historical order totals do not artificially inflate if the menu prices increase later.

---

## 📁 Additional Documentation

- **[Data Models (ERD)](./docs/data-model.md)**: Details on the MongoDB schema relationships.
- **[Flow Diagrams](./docs/flow-diagrams.md)**: Mermaid sequence and state diagrams for the platform's core flows.
