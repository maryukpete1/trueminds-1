# Backend Flow Diagrams

The following diagrams illustrate the sequence of operations for key use cases in the Chuks Kitchen API.

## 1. User Registration & Verification Flow

```mermaid
sequenceDiagram
    actor User
    participant App as Mobile/Web Client
    participant API as AuthController
    participant DB as MongoDB

    User->>App: Submits Signup Form (Email/Phone)
    App->>API: POST /auth/signup
    API->>DB: Check if user exists
    alt User Exists
        DB-->>API: User details
        API-->>App: 409 Conflict
    else New User
        API->>API: Hash Password & Generate OTP
        API->>DB: Save User (isVerified: false)
        API-->>App: 201 Created (Send simulated OTP)
        
        User->>App: Submits OTP
        App->>API: POST /auth/verify-otp
        API->>DB: Find User
        API->>API: Validate OTP & Expiry
        API->>DB: Update User (isVerified: true)
        API->>API: Generate JWT
        API-->>App: 200 OK (JWT Token + User Profile)
    end
```

## 2. Order Creation Flow

```mermaid
sequenceDiagram
    actor User
    participant App as Client
    participant OrderAPI as OrdersController
    participant CartAPI as CartService
    participant FoodAPI as FoodsService
    participant DB as MongoDB

    User->>App: Clicks "Checkout"
    App->>OrderAPI: POST /orders (Delivery Address)
    
    OrderAPI->>CartAPI: Get current user cart
    CartAPI->>DB: Fetch Cart + Populated Items
    DB-->>CartAPI: Cart details
    
    OrderAPI->>FoodAPI: Validate Item Availability
    alt Items Unavailable
        OrderAPI-->>App: 400 Bad Request (Remove unavailable items)
    else All Items Available
        OrderAPI->>OrderAPI: Generate Order Number (CK-YYYYMMDD-NNN)
        OrderAPI->>OrderAPI: Snapshot Names & Prices
        OrderAPI->>DB: Save Order (Status: Pending)
        OrderAPI->>CartAPI: Clear User Cart
        CartAPI->>DB: Delete/Empty Cart
        OrderAPI-->>App: 201 Created (Order Details)
    end
```

## 3. Order Status Lifecycle (Admin)

```mermaid
stateDiagram-v2
    [*] --> Pending: Customer places order
    
    Pending --> Confirmed: Admin confirms
    Pending --> Cancelled: Customer/Admin cancels
    
    Confirmed --> Preparing: Kitchen starts
    Confirmed --> Cancelled: Admin cancels
    
    Preparing --> OutForDelivery: Ready & dispatched
    
    OutForDelivery --> Completed: Delivered
    
    Completed --> [*]
    Cancelled --> [*]
```
