# Chuks Kitchen Data Model (ERD)

The database schema is optimized for a modular monolith reading from a NoSQL document database (MongoDB).

```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string firstName
        string lastName
        string email UK "Optional if phone exists"
        string phoneNumber UK "Optional if email exists"
        string password "Hashed"
        string role "customer | admin"
        boolean isVerified
        string otp
        date otpExpiresAt
        string googleId UK
        string facebookId UK
        string referralCode
        string referredBy
    }

    FOOD_ITEMS {
        ObjectId _id PK
        string name
        string description
        number price
        string category "Indexed"
        string image URL
        boolean isAvailable
        number preparationTime
        string[] tags
    }

    CARTS {
        ObjectId _id PK
        ObjectId userId FK
        object[] items "Embedded array"
        number totalAmount
    }

    ORDERS {
        ObjectId _id PK
        ObjectId userId FK
        string orderNumber "e.g., CK-20260221-001"
        object[] items "Snapshots of food items"
        number totalAmount
        string status "enum"
        object deliveryAddress
        string cancellationReason
        object[] statusHistory "Embedded array"
    }

    RATINGS {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId orderId FK
        ObjectId foodItemId FK "Optional"
        number rating "1-5"
        string comment
    }

    %% Relationships
    USERS ||--o| CARTS : has_one
    USERS ||--o{ ORDERS : places
    USERS ||--o{ RATINGS : makes
    ORDERS ||--o{ RATINGS : receives
    FOOD_ITEMS ||--o{ RATINGS : receives

    %% Note: Carts and Orders store references/snapshots of Food Items, but avoid strict foreign key constraints typical of SQL
```

## Key Schema Decisions

1. **Embedded vs. Referenced Data:**
   - **Cart Items:** Stored as an embedded array within the `Cart` document. This optimizes for the fast read/write cycle of a shopping cart since a cart is intimately tied to a single user and bounded in size.
   - **Order Items:** Stored as an embedded array of *snapshots* (copy of name/price). This protects historical order data if the `FoodItem` is updated or deleted later.
   - **Status History:** Stored as an embedded array within the `Order` to track the exact timestamps of lifecycle changes (Pending -> Confirmed -> Preparing) without needing a separate table.

2. **Indexes:**
   - `Users`: Unique sparse indexes on `email`, `phoneNumber`, `googleId`, and `facebookId`.
   - `FoodItems`: Standard index on `category`. Text index on `name` and `description` to support fast searching.
   - `Orders`: Compound index on `userId` and `createdAt` for fast fetching of order history. Index on `status` for admin dashboards.

3. **Referral Codes:**
   - Implemented as simple string fields on the `User` schema. If the referral system requires deep analytics in the future, it would be migrated to its own `Referrals` collection linking `referrerUserId` and `referredUserId`.
