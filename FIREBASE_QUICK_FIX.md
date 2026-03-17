# Firebase Fix - Step by Step

## 🔴 Your Error
```
Firebase: Error (auth/api-key-not-valid-please-pass-a-valid-api-key).
```

---

## ✅ SOLUTION - 5 Steps (10 minutes)

### STEP 1: Verify Your Web App Exists in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click on your project: **hacka-b4cbd**
3. Click **Settings** ⚙️ (bottom left)
4. Click **Project settings**
5. Look for **"Your apps"** section at the bottom
6. You should see:
   - ✅ **Web App** with a blue `</>` icon
   - Name: "InterviewLens" or similar

**If Web App doesn't exist:**
- Click **"Add app"** → Select **Web** (`</>`)
- Register app
- Copy the entire config

---

### STEP 2: Get the Correct API Key

1. In **Project settings** → **Your apps** section
2. Click on your **Web App**
3. Copy the config that looks like:
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

**IMPORTANT:** The `apiKey` value is your **PUBLIC** key (safe to share)

---

### STEP 3: Update Your .env.local

Open `d:\vs hack2\frontend\.env.local` and verify it has:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCKD1SGy1i12GD3R311QFNwXNY91tH96JY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hacka-b4cbd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hacka-b4cbd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hacka-b4cbd.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=720098218386
NEXT_PUBLIC_FIREBASE_APP_ID=1:720098218386:web:9690ef78ac72036f2db14b
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**What each line means:**
- `NEXT_PUBLIC_*` = visible to frontend (safe)
- `API_KEY` = Public authentication key
- `AUTH_DOMAIN` = Firebase domain
- `PROJECT_ID` = Your Firebase project ID
- `STORAGE_BUCKET` = Cloud storage location
- `MESSAGING_SENDER_ID` = Unique identifier
- `APP_ID` = Web app identifier
- `API_URL` = Backend server location

---

### STEP 4: Enable Authentication in Firebase Console

1. Go back to [Firebase Console](https://console.firebase.google.com)
2. Select project: **hacka-b4cbd**
3. Left sidebar → Click **Authentication**
4. Click **"Get started"** (if you haven't yet)
5. Click **"Sign-in method"** tab
6. Enable these providers:
   - ✅ **Email/Password**
   - ✅ **Google**
7. Click **"Save"**

---

### STEP 5: Clear Cache & Test

1. **Close the app** - Stop npm dev server (Ctrl+C)
2. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Select **"All time"**
   - Check: ✅ Cookies and other site data
   - Click **"Clear data"**
3. **Restart frontend:**
   ```powershell
   cd "d:\vs hack2\frontend"
   npm run dev
   ```
4. **Visit:** http://localhost:3001
5. **Try signing up** - Should work now! ✅

---

## 🔍 If Still Getting Error...

### Check 1: Verify API Key Configuration

1. Go to Firebase Console → **Project settings** → **API keys**
2. Click on the Web API key
3. Look for **"API restrictions"**:
   - Should show checked:
     - ✅ Cloud Authentication API
     - ✅ Cloud Firestore API  
     - ✅ Cloud Storage API
   - Click **"HTTP referrers (web sites)"**
   - Add:
     ```
     localhost:*
     localhost:3000
     localhost:3001
     localhost:5173
     ```
4. Click **"Save"**

### Check 2: Verify Firestore is Set Up

1. Go to Firebase Console → **Firestore Database**
2. If not created, click **"Create database"**
3. Start in **Test mode** (for development)
4. Choose region: **us-central1**
5. Click **"Create"**

### Check 3: Verify Storage is Set Up

1. Go to Firebase Console → **Storage**
2. If not created, click **"Get started"**
3. Start in **Test mode**
4. Choose location: **us-central1**
5. Click **"Done"**

### Check 4: Check Browser Console for Details

1. Open app: http://localhost:3001
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Look for any red error messages
5. Screenshot and note the full error
6. This will help diagnose the issue

---

## 🧪 Test Endpoints

After fixes, test these:

```bash
# Check backend is running
http://localhost:8000/api/health

# Check Firebase connection
http://localhost:3001/auth
# Try to sign up with any email

# Check frontend is connecting to backend
# Open DevTools (F12) → Network tab
# Try any action and check if requests go to localhost:8000
```

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using **private** API key in frontend | Must use **public** key (starts with AIzaSy...) |
| `.env.local` not saved | Press Ctrl+S to save |
| Old values cached | Clear browser cache (Ctrl+Shift+Delete) |
| Frontend not restarted | Stop & restart `npm run dev` |
| API key has spaces/quotes | Check `.env.local` for extra characters |
| Firebase project not created | Go to console.firebase.google.com and create |
| Auth not enabled | Must enable Email/Password in Firebase Console |

---

## ✅ After Fixes - You Should See:

**At http://localhost:3001 :**
- ✅ Loading page briefly
- ✅ Auto-redirect to `/auth`
- ✅ Login/Signup form appears
- ✅ Purple left panel + White right panel
- ✅ No red error messages

**Try signing up:**
- ✅ Email input works
- ✅ Password input works
- ✅ "Sign In" button clickable
- ✅ "Continue with Google" works
- ✅ Redirects to profile page after signup

---

## 📋 Fix Checklist

- [ ] Web App exists in Firebase Console
- [ ] API key copied correctly to `.env.local`
- [ ] All 6 Firebase config values in `.env.local`
- [ ] Email/Password auth enabled
- [ ] Google auth enabled
- [ ] Firestore Database created
- [ ] Storage bucket created
- [ ] Browser cache cleared
- [ ] `npm run dev` restarted
- [ ] No error message at http://localhost:3001

---

## 🆘 Still Not Working?

1. **Take screenshot** of error in browser console (F12)
2. **Share** Firebase Console → Project Settings showing your Web App config
3. **Check** that all values match between Firebase Console and `.env.local`
4. **Restart** everything: kill `npm run dev`, clear cache, start again

Most common: The `.env.local` has OLD values. Copy directly from Firebase Console again!
