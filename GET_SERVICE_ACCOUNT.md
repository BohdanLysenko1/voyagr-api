# Get Firebase Service Account Key

Your backend needs a Firebase Admin SDK service account key to verify authentication tokens.

## Steps to Download Service Account Key

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **voyagr-4bf8d**

2. **Navigate to Service Accounts**
   - Click the **⚙️ gear icon** (Project Settings)
   - Go to **Service accounts** tab

3. **Generate Private Key**
   - Scroll down to **Firebase Admin SDK** section
   - Click **Generate new private key**
   - Confirm by clicking **Generate key**
   - A JSON file will download

4. **Save the File**
   - Rename the downloaded file to: `firebase-service-account.json`
   - Move it to: `/Users/bohdanlysenko/Desktop/Voyagr/voyagr-api/`

   ```bash
   # From your Downloads folder:
   mv ~/Downloads/voyagr-4bf8d-*.json ~/Desktop/Voyagr/voyagr-api/firebase-service-account.json
   ```

5. **Verify File Location**
   ```bash
   cd ~/Desktop/Voyagr/voyagr-api
   ls firebase-service-account.json
   ```

   You should see the file listed.

## ⚠️ Security Warning

**IMPORTANT:** This file contains sensitive credentials!

- ✅ It's already in `.gitignore` (won't be committed to git)
- ❌ Never share this file
- ❌ Never commit it to GitHub
- ❌ Never expose it publicly

## Verify Setup

After placing the file, you can test your backend:

```bash
cd ~/Desktop/Voyagr/voyagr-api
npm run dev
```

You should see:
```
✅ Firebase Admin SDK initialized successfully
🚀 Server running on http://localhost:4000
```

## What's in the File?

The service account JSON contains:
- Project ID
- Private key
- Client email
- Token URIs

This allows your backend to:
- Verify Firebase authentication tokens
- Access Firestore database
- Perform admin operations

## Troubleshooting

**File not found error?**
- Make sure the file is named exactly: `firebase-service-account.json`
- Make sure it's in the `voyagr-api` folder (not in a subfolder)
- Check the path in `.env` file

**Permission denied?**
- The file should have read permissions
- Try: `chmod 644 firebase-service-account.json`

**Invalid credentials?**
- Re-download the file from Firebase Console
- Make sure you downloaded from the correct project (voyagr-4bf8d)

---

Once this is done, your backend will be able to verify authentication tokens from your frontend!