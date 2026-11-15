# 👑 Traditions By Tiya — Royal Handcrafted Indian Ethnic Wear E-Commerce Platform

> A production-ready, royal, warm, and heritage-inspired e-commerce platform dedicated to celebrating generational Indian handloom craftsmanship, pure Banarasi silks, temple jewellery, zardozi bridal couture, and artisanal Pashmina stoles.

---

## 🏛️ Brand & Design Identity

- **Brand Name**: **Traditions By Tiya**
- **Brand Palette**:
  - Deep Maroon: `#7B1E3A`
  - Royal Crimson Dark: `#521225`
  - Antique Gold: `#C9A24B`
  - Warm Cream: `#FFF8EE`
  - Charcoal Text: `#2B2B2B`
  - Subtle Accents: `#EADBCE`
- **Typography**: Playfair Display & Cormorant Garamond (Headings), Inter & Poppins (Body)
- **Motifs**: Subtle paisley and antique gold mandala dividers, soft royal shadows, rounded cards, live status pulses.

---

## ⚡ Tech Stack Architecture

### Frontend (`/client`)
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Custom Royal Heritage Theme
- **Icons**: Lucide React
- **Animations**: Framer Motion + Canvas Confetti
- **State & Context**: `AuthContext` (User session & addresses) + `CartContext` (Cart state & guest sync)
- **Real-Time Client**: Socket.io Client (storefront price/stock updates, live order tracking)
- **Notifications**: `react-hot-toast` with branded maroon & gold styling

### Backend (`/server`)
- **Runtime & Framework**: Node.js + Express + TypeScript (REST API)
- **Database**: MongoDB Atlas with Mongoose (schemas, indexes, validation)
- **Real-Time Engine**: Socket.io Server + MongoDB Change Streams watcher with dual event-driven real-time fallback
- **Authentication**: JWT stored in secure `httpOnly` cookies + Bearer token support, bcryptjs password hashing, Google Sign-In support
- **Security**: Helmet, CORS whitelist, Zod validation middleware, express-rate-limit
- **Payments**: Cash on Delivery (COD) + UPI (Razorpay UPI checkout with server-side HMAC signature verification & webhook listener)
- **Storage**: Cloudinary SDK (with local high-efficiency data fallback)
- **Email**: Nodemailer (Gmail SMTP / App password with non-blocking retry queue)

---

## 🗄️ Database Schemas & Data Models

1. **User**: `name`, `email` (unique, indexed), `passwordHash`, `googleId`, `phone`, `role` (`customer` | `admin`), `addresses[]`, `resetPasswordToken`, timestamps.
2. **Product**: `name`, `slug` (unique, indexed), `description`, `category` (indexed), `price`, `discountPrice`, `stock` (indexed), `images[{url, publicId}]`, `isActive`, `featured`, `isBestSeller`, `isNewArrival`, timestamps.
3. **Cart**: `userId` (unique, indexed), `items[{productId, qty}]`, timestamps.
4. **Order**: `userId`, `userEmail`, `items[{productId, name, image, price, qty}]`, `subtotal`, `shippingFee`, `total`, `address`, `paymentMethod` (`COD` | `UPI`), `paymentStatus` (`PENDING` | `PAID` | `COD_PENDING` | `FAILED`), `razorpayOrderId`, `razorpayPaymentId`, `status` (`Placed` | `Confirmed` | `Packed` | `Shipped` | `Out for Delivery` | `Delivered` | `Cancelled`), `statusHistory[]`, `courier`, `trackingId`, timestamps.

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or MongoDB Atlas connection string)

### 2. Install Dependencies
```bash
# Install Server packages
cd server
npm install

# Install Client packages
cd ../client
npm install
```

### 3. Environment Configuration

Copy the example environment files:
```bash
# Server Environment
cp server/.env.example server/.env

# Client Environment
cp client/.env.example client/.env.local
```

### 4. Seed the Database
Populate 12 authentic handcrafted products across 4 categories, plus default Admin and Customer accounts:
```bash
cd server
npm run seed
```

#### Pre-Configured Test Credentials:
- **Admin Portal**:
  - Email: `admin@traditionsbytiya.com`
  - Password: `Admin@Traditions2026!`
- **Sample Customer**:
  - Email: `customer@traditionsbytiya.com`
  - Password: `Customer@2026!`

To create or promote another admin at any time:
```bash
npm run create-admin "<email>" "<password>" "<name>"
```

### 5. Run the Application
Open two terminal windows:

**Terminal 1 (Backend API & Socket Server):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Next.js Frontend):**
```bash
cd client
npm run dev
# Running on http://localhost:3000
```

---

## 🧪 Automated End-to-End Test Verification

Run the automated test suite covering all 13 stages of the customer and admin lifecycle:
```bash
cd server
npm run test:e2e
```
**Test Coverage Includes:**
1. API Server Health Verification
2. Product Catalog Fetch & Stock Counts
3. Customer Login & Session Handling
4. Cart Operations
5. Cash on Delivery (COD) Checkout & Atomic Stock Reduction
6. UPI Checkout & Cryptographic Signature Verification
7. Customer Real-time Order Tracking
8. Admin Authentication & Role Protection
9. Admin Dashboard Metrics & Telemetry
10. Inline Inventory Stock & Price Adjustment with Socket.io Broadcast
11. Admin Courier & Tracking ID Dispatch (Automated Email Trigger)
12. Admin Marking COD Orders as Paid
13. Registered Customers Directory

---

## 🖥️ Walkthrough of the Admin Portal (`/admin`)

The admin portal is protected by backend auth middleware (`requireAdmin`) and frontend routing:

1. **Dashboard (`/admin`)**:
   - Real-time KPI counters: **Total Orders**, **Total Revenue (₹)**, **Pending Orders**, and **Registered Patrons**.
   - **Payment Method Split**: Live visual ratio of UPI (Razorpay) vs Cash on Delivery (COD).
   - **Low-Stock Alerts**: Instant warnings for products with 5 or fewer items remaining.
   - **Recent Orders Table**: Quick overview of the latest incoming purchases.

2. **Products Management (`/admin/products`)**:
   - View, search, and filter the full product catalog.
   - **Add New Product Modal**: Title, category, rich description, base price, discount price, and inventory stock.
   - **Cloudinary Image Upload**: Direct image file upload with immediate preview and thumbnail ordering.
   - **Active/Inactive Toggle**: Hide seasonal items with one click.

3. **Inline Inventory Editor (`/admin/inventory`)**:
   - Table displaying real-time stock counts and prices.
   - Edit stock, price, and discount price directly inside the table cells.
   - **Quick Adjust Buttons**: `+1`, `-1`, `+5` stock buttons.
   - Clicking **Save** immediately broadcasts the changes to all open customer browser sessions via Socket.io without refreshing!

4. **Orders & Shipments (`/admin/orders`)**:
   - Filter by status (`Placed`, `Confirmed`, `Packed`, `Shipped`, `Out for Delivery`, `Delivered`, `Cancelled`) and payment status (`PAID`, `COD_PENDING`).
   - Change delivery milestone from an inline dropdown.
   - **Dispatch Button**: Attach courier name (e.g. BlueDart, Delhivery) and AWB Tracking ID, which automatically dispatches an update email to the customer.
   - **Mark COD as Paid**: Collect cash on doorstep and mark the order as settled.

5. **Customer Directory (`/admin/customers`)**:
   - List of all registered patrons, joined dates, total order counts, and lifetime value in ₹.

---

## ☁️ Production Deployment Guide

### Deploying Backend to Render / Railway
1. Push the code to a GitHub repository.
2. In **Render** or **Railway**, create a new Web Service pointing to the root directory `/server`.
3. Set Build Command: `npm install && npm run build`
4. Set Start Command: `npm run start`
5. Configure Environment Variables:
   - `PORT`: `5000` (or platform default)
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-vercel-domain.vercel.app`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/traditions_by_tiya?retryWrites=true&w=majority`
   - `JWT_SECRET`: Strong secret key
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `SMTP_USER` & `SMTP_PASS`

> **Note on WebSockets**: Render and Railway support persistent WebSocket connections out of the box for Socket.io.

### Deploying Frontend to Vercel
1. In **Vercel**, import the repository and set the **Root Directory** to `client`.
2. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com/api`
   - `NEXT_PUBLIC_SOCKET_URL`: `https://your-backend.onrender.com`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay test Key ID
3. Deploy! Next.js will automatically build and optimize the application.

