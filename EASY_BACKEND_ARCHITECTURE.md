# Relooka – Simple & Visual Backend Architecture Guide

> **What is Relooka's Backend?**  
> Think of it as the **engine and control center** of an automated fashion rental house. It receives requests from mobile phones and web browsers, checks security, calculates prices and deposits, verifies garments with AI, and securely stores orders in the cloud.

---

## 🗺️ 1. The 30-Second Big Picture

```mermaid
flowchart TD
    classDef client fill:#FAF6F0,stroke:#B88E2F,stroke-width:2px,color:#1A1A1A;
    classDef cloud fill:#F1E9DF,stroke:#7A1424,stroke-width:2px,color:#1A1A1A;
    classDef backend fill:#1A1A1A,stroke:#F9B91E,stroke-width:2px,color:#FFFFFF;
    classDef db fill:#EFE8DA,stroke:#3FA34D,stroke-width:2px,color:#1A1A1A;
    classDef ai fill:#3B2E25,stroke:#F9B91E,stroke-width:2px,color:#FFFFFF;

    subgraph Step1["1. The Customer"]
        Browser["📱 Mobile / Web Browser<br/>(Customers & Wardrobe Lenders)"]:::client
    end

    subgraph Step2["2. Global Edge & Security Gate"]
        CF["🛡️ Cloudflare Edge<br/>(Free HTTPS SSL + DDoS Shield)"]:::cloud
    end

    subgraph Step3["3. The Brain: Express Monolith Server"]
        Gatekeeper["🚪 Guard / Middleware<br/>(Checks JWT login tokens, compresses pages, limits spam)"]:::backend
        
        subgraph Modules["⚡ Business Engines"]
            Auth["🔑 Auth & Identity<br/>(Mobile OTPs, User Profiles)"]:::backend
            Wardrobe["👗 Wardrobe Listings<br/>(4-angle photos, condition checks)"]:::backend
            Pricing["💰 Pricing & Deposits<br/>(Calculates daily rates & escrow)"]:::backend
            Orders["📦 14-Step Orders<br/>(Lender ➔ Laundry Hub ➔ Renter)"]:::backend
        end
    end

    subgraph Step4["4. External Helpers"]
        Agent["🤖 AI Agent Service<br/>(Face Verification & Fraud Scanner)"]:::ai
        DB[("🗄️ MongoDB Atlas Cloud<br/>(Permanent Free Database)")]:::db
    end

    Browser -->|Clicks or Browses| CF
    CF -->|Secure Encrypted Request| Gatekeeper
    Gatekeeper --> Modules
    Modules -->|Biometric checks| Agent
    Modules -->|Save / Read Records| DB
```

---

## 🧩 2. The 4 Main Layers Explained Simply

### 1. 📱 The Customer Layer (Frontend)
- **Built with**: Flutter Web & Responsive HTML5.
- **What it does**: What the user sees on their phone or laptop. Fast, smooth, and pre-renders instant loading screens with brand colors.

### 2. 🛡️ The Security Shield (Cloudflare & Middleware)
- **What it does**: 
  - Gives every visitor a green padlock (`https://` SSL certificate) for free.
  - Compresses heavy files using **Gzip** so pages load up to 70% faster.
  - Blocks hackers, bots, and brute-force password guesses with automatic rate-limiters.

### 3. 🧠 The Brain (Express.js Monolith)
Instead of having 20 different servers that cost money and break easily, Relooka uses a **clean Modular Monolith**:
- Everything runs inside **one unified, lightweight Node.js engine**.
- It is split into clean, organized rooms (modules):

| Room (Module) | What It Does In Plain English |
| :--- | :--- |
| **`auth`** | Welcomes users, sends OTP verification codes, and issues digital session keys (JWTs). |
| **`users`** | Protects identity, stores user names, and securely masks government ID numbers (`••••1234`). |
| **`listings`** | Manages catalog items (Sarees, Lehengas, Kurtas) and checks their 4 mandatory verification photos. |
| **`pricing`** | Automatically calculates the best rental price based on days rented + refundable security deposit. |
| **`orders`** | Orchestrates the order journey: Order placed ➔ Picked up ➔ Washed & Sanitized at Laundry Hub ➔ Delivered to Renter ➔ Returned. |
| **`tiers`** | Rewards active lenders and loyal renters with loyalty discounts. |

### 4. 🗄️ The Vault (MongoDB Atlas Cloud Database)
- **What it does**: Your permanent digital filing cabinet.
- **Where it lives**: In MongoDB Atlas's official cloud (Free Tier, 512 MB forever free).
- Even if the server restarts or updates, all user accounts, orders, and listed outfits stay safe.

---

## 🎬 3. Example Story: What Happens When a Customer Rents a Dress?

Let's follow **Priya** renting an embroidered Anarkali for a wedding:

```mermaid
sequenceDiagram
    autonumber
    actor Priya as 👩 Priya (Customer)
    participant Server as 🧠 Relooka Server
    participant Pricing as 💰 Pricing Engine
    participant DB as 🗄️ Cloud Database
    participant Agent as 🤖 AI Inspection Agent

    Priya->>Server: Clicks "Rent for 3 Days" on Anarkali Set
    Server->>Pricing: How much for 3 days + security deposit?
    Pricing-->>Server: Rent: ₹1,800 + Deposit: ₹1,500 (Refundable)
    Priya->>Server: Selects UPI Payment & taps "Place Order"
    Server->>DB: Save Order (Status: "CONFIRMED", Payment Captured)
    Server->>Agent: Check lender's garment photos for fabric quality
    Agent-->>Server: Quality Score: 98% (No stains, like-new)
    Server->>DB: Update Status: "READY_FOR_PICKUP"
    Server-->>Priya: Shows receipt: Order RLK-ORD-1001 placed!
```

---

## 💡 4. Why This Architecture is Perfect for a Startup

1. **Zero-Dollar Monthly Cost (\$0.00)**:
   - Cloudflare Tunnel = Free
   - Render / GitHub Pages = Free
   - MongoDB Atlas Cloud = Free
   - Zero upfront server bills while you validate your business idea!
2. **Resilient "Never-Crash" Design**:
   - If the database has a momentary delay, the server doesn't crash; it starts in resilient mode so the website never goes blank for customers.
3. **Easy to Scale When You Get Funding**:
   - Because the code is organized into modular folders (`auth/`, `orders/`, `listings/`), you can scale it to millions of users on AWS or Google Cloud without having to rewrite the application.
