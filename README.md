# 🛍️ LUXE Store — Premium E-Commerce Application

LUXE Store is a state-of-the-art, premium full-stack e-commerce web application built on **Next.js** (React 19) and **TypeScript**. It features a modern, responsive user interface styled with vanilla CSS (complete with HSL color systems, glassmorphism, and micro-animations) and is integrated with a cloud-hosted **PostgreSQL** database on **Supabase**.

## 🌟 Key Features

* **📦 Premium Storefront**: Interactive product grids, responsive navigation with unified searching, category groupings (Electronics, Accessories, Fashion), and dynamic item detail pages.
* **🛒 Persistent Shopping Cart**: Intelligent client-server cart synchronization. Guest carts are stored locally in the browser (`localStorage`) and seamlessly merged into the cloud database upon registration or login.
* **🔒 User Authentication**: Secure session management using HTTP-only JWT cookies, encrypted passwords (via `bcryptjs`), and protected routes for checkout and order history tracking.
* **💳 Multi-Step Checkout Workflow**: Interactive multi-step billing, shipping logging, mock payment processing, and final order confirmation.
* **🗃️ Dual Database Support**:
  * Connected to **PostgreSQL** (hosted on Supabase) via connection pooling (`pg` client) for scalable production usage.
  * Local fallback migration scripts for **SQLite** (`better-sqlite3`).
* **🌱 Auto-Initialization & Seeding**: The application automatically checks database schemas on startup, creates necessary tables, and pre-seeds the store catalog with products, categories, and a demo user.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript
* **Styling**: Vanilla CSS (Global Design System, CSS Modules)
* **State Management**: Zustand (with Persist Middleware)
* **Backend**: Next.js Server Actions & API Routes
* **Database**: PostgreSQL (via Supabase) and SQLite fallback
* **Authentication**: JSON Web Tokens (via `jose` and `jsonwebtoken`), HTTP-only Cookies, Bcrypt

---

## ⚙️ Installation & Setup

Follow these steps to set up and run the project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/JoyalJohny509/E-Commerce-Fullstack-Development.git
cd E-Commerce-Fullstack-Development/e-shop
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root of the `e-shop` folder and add your Supabase PostgreSQL connection string:
```env
# Get this from your Supabase Dashboard: Project Settings > Database > Connection string (URI)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:6543/postgres?pgbouncer=true"
```
> ⚠️ **Note**: Make sure to replace `[YOUR-PASSWORD]` with the database password you chose when creating the Supabase project.

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will connect to Supabase, automatically create all tables, seed them with initial product data, and start running.

---

## 🔐 Demo Credentials
You can log in to test the full checkout and order history flow using the pre-seeded account:
* **Email**: `demo@luxestore.com`
* **Password**: `demo123`

---

## 📂 Project Structure

```text
e-shop/
├── app/                  # Next.js App Router Pages
│   ├── api/              # API routes (Auth, Cart, Orders, Products)
│   ├── auth/             # Login & Registration Pages
│   ├── cart/             # Shopping Cart Page
│   ├── checkout/         # Billing & Checkout Flows
│   ├── orders/           # Customer Order History Pages
│   ├── product/[id]/     # Dynamic Product Detail Views
│   └── shop/             # Filterable Product Catalog
├── components/           # Reusable UI Components (Header, ProductCard, Toast, etc.)
├── data/                 # Database file storage (SQLite fallback)
├── lib/                  # Backend utilities (Auth helpers, DB initialization, state stores)
└── public/               # Static images & product assets
```

---

## 📝 License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
