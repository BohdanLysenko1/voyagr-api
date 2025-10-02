# Quick Setup Guide

Follow these steps to get your Voyagr API up and running quickly.

## Step 1: Install Dependencies

```bash
cd voyagr-api
npm install
```

## Step 2: Firebase Setup

### Get Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the **gear icon** ⚙️ → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file as `firebase-service-account.json` in the `voyagr-api` folder

### Enable Firestore

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (for development)
4. Select a location close to your users
5. Click **Enable**

### Set Firestore Security Rules (Important!)

1. In Firestore Database, go to **Rules** tab
2. Replace the content with the rules from README.md
3. Click **Publish**

## Step 3: Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file:
   ```env
   PORT=4000
   NODE_ENV=development
   WEB_ORIGIN=http://localhost:3000
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

   **Note:** If your frontend runs on a different port, update `WEB_ORIGIN`

## Step 4: Verify Setup

Check that you have these files:
```
voyagr-api/
├── firebase-service-account.json  ✅ (should exist)
├── .env                           ✅ (should exist)
└── node_modules/                  ✅ (should exist)
```

## Step 5: Start the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

You should see:
```
🚀 ========================================
🚀 Voyagr API Server
🚀 Environment: development
🚀 Port: 4000
🚀 ========================================
✅ Firebase Admin SDK initialized successfully
🚀 Server running on http://localhost:4000
```

### Test the Server

Open your browser or use curl:
```bash
curl http://localhost:4000/api/health
```

You should see:
```json
{
  "success": true,
  "message": "Voyagr API is running",
  "timestamp": "2025-09-30T...",
  "environment": "development"
}
```

## Step 6: Connect to Frontend

Update your frontend's `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Restart your frontend server for changes to take effect.

## Common Issues

### Error: "Firebase service account file not found"
**Solution:** Make sure `firebase-service-account.json` is in the `voyagr-api` folder

### Error: "Port 4000 is already in use"
**Solution:**
- Option 1: Kill the process using port 4000:
  ```bash
  lsof -ti:4000 | xargs kill -9
  ```
- Option 2: Change the port in `.env`:
  ```env
  PORT=5000
  ```
  And update frontend `.env.local`:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:5000
  ```

### Error: "CORS policy" in browser
**Solution:** Verify `WEB_ORIGIN` in `.env` matches your frontend URL exactly

### TypeScript errors during build
**Solution:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

## Next Steps

1. ✅ API is running
2. ✅ Firebase is connected
3. ✅ Frontend can connect to API
4. 📚 Read README.md for API documentation
5. 🚀 Start building!

## Folder Structure Reference

```
voyagr-api/
├── src/
│   ├── config/              # Firebase & app configuration
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth, validation, error handling
│   ├── models/              # TypeScript types/interfaces
│   ├── routes/              # API endpoints
│   ├── validators/          # Request validation rules
│   └── index.ts             # Server entry point
├── .env                     # Your environment variables
├── firebase-service-account.json  # Firebase credentials
├── package.json
├── tsconfig.json
├── README.md               # Full documentation
└── SETUP.md                # This file
```

## Development Workflow

```bash
# Start development server
npm run dev

# In another terminal, test endpoints
curl http://localhost:4000/api/health

# Make changes to code - server auto-restarts

# Format code before committing
npm run format

# Check for linting issues
npm run lint
```

## Production Deployment

When ready to deploy:

1. Build the project:
   ```bash
   npm run build
   ```

2. Set environment variables on your hosting platform:
   - `NODE_ENV=production`
   - `PORT=4000` (or as required)
   - `WEB_ORIGIN=https://your-frontend-domain.com`

3. Upload `firebase-service-account.json` securely

4. Start the server:
   ```bash
   npm start
   ```

## Need Help?

- 📖 Read the full [README.md](./README.md)
- 🔥 Check [Firebase Documentation](https://firebase.google.com/docs)
- 🐛 Check server logs for detailed errors

---

**You're all set! Happy coding! 🚀**