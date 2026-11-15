# 📋 Complete API Keys & Cloud Database Setup Plan
### Traditions By Tiya — Production Credential Configuration

This document provides exact, step-by-step instructions to obtain each free API key and the cloud MongoDB Atlas URL required to store your store's data permanently and enable live payments, cloud image storage, and automated customer emails.

---

## 📑 Summary of Environment Files & Keys

| Service | Environment Variable | Where to Put It | Free Tier Limits |
|---|---|---|---|
| **MongoDB Atlas** | `MONGODB_URI` | `server/.env` | 512 MB Free Forever (Shared M0) |
| **Razorpay Payments** | `RAZORPAY_KEY_ID`<br>`RAZORPAY_KEY_SECRET`<br>`RAZORPAY_WEBHOOK_SECRET` | `server/.env`<br>`client/.env.local` (`NEXT_PUBLIC_RAZORPAY_KEY_ID`) | Free Test Mode & Instant Sandbox |
| **Cloudinary Images** | `CLOUDINARY_CLOUD_NAME`<br>`CLOUDINARY_API_KEY`<br>`CLOUDINARY_API_SECRET` | `server/.env` | 25 GB Free Storage & Bandwidth / mo |
| **Email (Gmail SMTP)** | `SMTP_HOST`<br>`SMTP_PORT`<br>`SMTP_USER`<br>`SMTP_PASS`<br>`EMAIL_FROM` | `server/.env` | Free (500 emails/day via Gmail App Password) |
| **Google Sign-In** | `GOOGLE_CLIENT_ID` | `server/.env`<br>`client/.env.local` (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`) | Free Forever via Google Cloud Console |

---

## 1. 🍃 MongoDB Atlas (Permanent Cloud Database & Change Streams)

By default, the project runs on local MongoDB. Connecting MongoDB Atlas stores all products, customers, and orders securely in the cloud and automatically activates native **MongoDB Change Streams**.

### Step-by-Step Setup:
1. Go to **[mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)** and sign in (or create a free account).
2. Click **Create a Database** -> select the **M0 Free (Shared)** cluster.
3. Choose the closest cloud region (e.g. AWS **Mumbai `ap-south-1`** for lowest latency in India).
4. **Set Up Authentication**:
   - Choose **Username and Password**.
   - Example Username: `tiya_admin`
   - Set a strong password (e.g. `TraditionsTiya2026!`). Keep note of this password.
5. **Configure Network Access**:
   - Go to **Network Access** in the left sidebar.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere (`0.0.0.0/0`)** so your local app and deployment servers (Render/Vercel) can connect seamlessly.
6. **Get Connection String**:
   - Go to **Database** in the sidebar -> Click **Connect**.
   - Choose **Drivers (Node.js)**.
   - Copy the connection URI:
     ```
     mongodb+srv://tiya_admin:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Replace `<password>` with your database user password and specify the database name `traditions_by_tiya`:
     ```
     mongodb+srv://tiya_admin:TraditionsTiya2026!@cluster0.xxxx.mongodb.net/traditions_by_tiya?retryWrites=true&w=majority
     ```
7. **Paste into `server/.env`**:
   ```env
   MONGODB_URI=mongodb+srv://tiya_admin:TraditionsTiya2026!@cluster0.xxxx.mongodb.net/traditions_by_tiya?retryWrites=true&w=majority
   ```
8. **Seed your cloud database**:
   Run this one-time command from the `server` folder to populate the 12 handcrafted products and default admin account in your cloud database:
   ```bash
   npm run seed
   ```

---

## 2. 💳 Razorpay (UPI, GPay, PhonePe, Paytm & QR Code Checkout)

The platform supports Cash on Delivery and instant UPI via Razorpay with cryptographic HMAC signature verification and webhooks.

### Step-by-Step Setup:
1. Go to **[dashboard.razorpay.com](https://dashboard.razorpay.com)** and sign up.
2. Toggle the switch at the top to **Test Mode** (you can switch to Live Mode once your business documents are verified).
3. In the left menu, navigate to **Account & Settings** -> **API Keys** (under *Developer Controls*).
4. Click **Generate Key**. You will receive:
   - **Key ID**: Starts with `rzp_test_...`
   - **Key Secret**: A secret alphanumeric string.
5. **Paste into `server/.env`**:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
   RAZORPAY_WEBHOOK_SECRET=your_custom_webhook_secret_here
   ```
6. **Paste into `client/.env.local`**:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
   ```
7. *(Optional) Configure Webhooks*:
   - In Razorpay Dashboard -> **Webhooks** -> Click **Add New Webhook**.
   - Webhook URL: `https://your-backend-domain.com/api/payments/webhook` (or your Ngrok URL during local testing).
   - Secret: The same string you placed in `RAZORPAY_WEBHOOK_SECRET`.
   - Active Events: check `payment.captured` and `order.paid`.

---

## 3. ☁️ Cloudinary (High-Res Product Image Uploads & Optimization)

Enables admin image uploads with auto-resizing, thumbnail generation, and global CDN delivery.

### Step-by-Step Setup:
1. Sign up for a free account at **[cloudinary.com](https://cloudinary.com)**.
2. Go to your **Dashboard** / **Console Home**.
3. Under **Product Environment Credentials**, copy:
   - **Cloud Name** (e.g. `dxyza871b`)
   - **API Key** (e.g. `982736451829471`)
   - **API Secret** (e.g. `A_8f_jK29sd8fl10slK39a`)
4. **Paste into `server/.env`**:
   ```env
   CLOUDINARY_CLOUD_NAME=dxyza871b
   CLOUDINARY_API_KEY=982736451829471
   CLOUDINARY_API_SECRET=A_8f_jK29sd8fl10slK39a
   ```

---

## 4. ✉️ Email Notifications (Gmail SMTP / Google App Password)

Dispatches branded HTML order confirmation, courier dispatch with tracking ID, and delivery celebration emails.

### Step-by-Step Setup using Gmail:
1. Open your Google Account at **[myaccount.google.com](https://myaccount.google.com)**.
2. In the left navigation, click **Security**.
3. Under *How you sign in to Google*, ensure **2-Step Verification** is turned **ON**.
4. In the search bar at the top, type **App passwords** and click on it.
5. Under *App name*, type: `Traditions By Tiya` -> Click **Create**.
6. Google will generate a **16-letter App Password** (e.g. `abcd efgh ijkl mnop`).
7. **Paste into `server/.env`**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   EMAIL_FROM="Traditions By Tiya" <your_email@gmail.com>
   ```

*(Alternative: You can also use Resend SMTP by setting `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=587`, `SMTP_USER=resend`, `SMTP_PASS=re_xxxxxx`)*.

---

## 5. 🔑 Google OAuth 2.0 (One-Click "Continue with Google" Sign-In)

Allows customers to sign in instantly with their Google account.

### Step-by-Step Setup:
1. Go to the **[Google Cloud Console](https://console.cloud.google.com)**.
2. Create a new project (e.g. `Traditions By Tiya`).
3. In the left navigation, go to **APIs & Services** -> **OAuth consent screen**:
   - Choose **External** -> Click **Create**.
   - Enter App name: `Traditions By Tiya`.
   - Enter User support email & Developer contact email.
   - Click **Save and Continue** through the remaining screens.
4. In the left navigation, click **Credentials** -> **Create Credentials** -> select **OAuth client ID**.
5. Application type: **Web application**.
6. Name: `Traditions By Tiya Web Client`.
7. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - Your production domain (e.g. `https://traditionsbytiya.vercel.app`)
8. Click **Create**. Copy the generated **Client ID** (e.g. `1082736451-xxxxxxxx.apps.googleusercontent.com`).
9. **Paste into `server/.env`**:
   ```env
   GOOGLE_CLIENT_ID=1082736451-xxxxxxxx.apps.googleusercontent.com
   ```
10. **Paste into `client/.env.local`**:
    ```env
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=1082736451-xxxxxxxx.apps.googleusercontent.com
    ```

---

## 🔄 Verification Checklist

Once you have added your credentials:
1. Restart your backend server (`cd server && npm run dev`).
2. Watch the console output:
   - `[Database] MongoDB Connected: cluster0.xxxx.mongodb.net/traditions_by_tiya`
   - `[Database] MongoDB Replica Set detected: Change Streams enabled.`
   - `[Email] Nodemailer configured with SMTP user: ...`
   - `[Storage] Cloudinary initialized successfully.`
   - `[Payments] Razorpay initialized with Key ID: ...`
3. Any order placed on the storefront will now:
   - Instantly write to your cloud MongoDB Atlas database.
   - Send an actual HTML confirmation email to the buyer's inbox.
   - Reflect immediately in the Admin portal across all devices via Socket.io.

