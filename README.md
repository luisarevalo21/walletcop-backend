# WalletCop – Backend

This is the backend for [Wallet Cop](https://github.com/luisarevalo21/walletcop), a tool to help users choose the best credit card for specific spending categories based on the cards they own.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/luisarevalo21/walletcop-backend.git
cd walletcop-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

> If you don’t have credentials for MongoDB, Supabase, or Google Auth yet, reach out — they can be provided for testing or development use.

### 4. Run the Server

```bash
npm run start
```

The server should now be running at `http://localhost:5000` by default.

---

## 🧩 Features

- Google OAuth login
- Supabase integration for user/session handling
- MongoDB for storing card and wallet data
- RESTful API endpoints to support the Wallet Cop frontend

---

## 🔗 Related Repositories

- **Frontend Repo**: [walletcop](https://github.com/luisarevalo21/walletcop)
