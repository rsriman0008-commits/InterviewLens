# Fixing Firebase Authentication Error

## Error Message
```
Firebase: Error (auth/api-key-not-valid-please-pass-a-valid-api-key).
```

## Root Causes & Solutions

### Solution 1: Verify Web App Config in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **hacka-b4cbd**
3. Click **Settings** ⚙️ icon → **Project Settings**
4. Click **"Your apps"** section
5. You should see **InterviewLens Web App**
6. Click on it to view Web SDK config
7. Copy the entire config and verify it matches `.env.local`:

```javascript
{
  apiKey: "AIzaSyCKD1SGy1i12GD3R311QFNwXNY91tH96JY",
  authDomain: "hacka-b4cbd.firebaseapp.com",
  projectId: "hacka-b4cbd",
  storageBucket: "hacka-b4cbd.firebasestorage.app",
  messagingSenderId: "720098218386",
  appId: "1:720098218386:web:9690ef78ac72036f2db14b"
}
```

### Solution 2: Verify Firebase Authentication is Enabled

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"** if not set up
3. Click **"Sign-in method"** tab
4. Enable:
   - ✅ Email/Password
   - ✅ Google OAuth
   - ✅ (Optional) Anonymous
5. Click **"Save"**

### Solution 3: Configure Firebase Security Rules

1. Go to **Firestore Database**
2. Click **"Rules"** tab
3. Replace with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own documents
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Allow users to create interview documents
    match /interviews/{intervewId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Default: deny all
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click **"Publish"**

### Solution 4: Configure Firebase Storage Rules

1. Go to **Storage**
2. Click **"Rules"** tab
3. Replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to upload their profile pictures
    match /profiles/{uid}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
    
    // Deny all other uploads
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click **"Publish"**

### Solution 5: Add Authorized Domains

1. Go to **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Add:
   - `localhost` (for development)
   - `127.0.0.1`
   - `interviewlens-frontend.vercel.app` (production)

---

## How to Test Locally

After applying fixes:

1. Clear browser cache:
   - Press `Ctrl + Shift + Delete`
   - Select "All time"
   - Click "Clear data"

2. Refresh app:
   ```
   http://localhost:3001
   ```

3. Try signing up again

4. Check browser console (F12) for any errors

---

## Deployment-Specific Fix

When deploying to Vercel, the API key is visible in the frontend code (browser). Add API key restrictions to prevent abuse:

### Restrict API Key

1. Go to Firebase Console → **Project Settings** → **API keys**
2. Click on the Web API key
3. Click **"API restrictions"**
4. Select:
   - ✅ Authentication API
   - ✅ Cloud Firestore API
   - ✅ Cloud Storage API
5. Scroll to **"HTTP referrers"**
6. Add:
   - `localhost:*`
   - `localhost:3001`
   - `interviewlens-frontend.vercel.app`
   - `localhost:5173`
7. Click **"Save"**

---

## Quick Checklist

- [ ] Firebase Web API key matches `.env.local`
- [ ] Authentication is enabled (Email + Google)
- [ ] Firestore security rules are set
- [ ] Firebase Storage rules are set
- [ ] Authorized domains include localhost
- [ ] Browser cache cleared
- [ ] App refreshed
- [ ] No console errors

If all steps complete but still getting error:

1. Check browser console (F12) for full error details
2. Check Firebase Console logs
3. Verify API key hasn't been revoked
4. Try creating a new Web App in Firebase Console
