# Step-by-Step Deployment Guide for InterviewLens

## PART 1: PREPARE FRONTEND FOR DEPLOYMENT

### 1.1 Update Frontend Environment Variables for Production

Open `d:\vs hack2\frontend\.env.local` and make sure it has:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCKD1SGy1i12GD3R311QFNwXNY91tH96JY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hacka-b4cbd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hacka-b4cbd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hacka-b4cbd.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=720098218386
NEXT_PUBLIC_FIREBASE_APP_ID=1:720098218386:web:9690ef78ac72036f2db14b
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**For Production (after Render deployment), update to:**
```
NEXT_PUBLIC_API_URL=https://YOUR_RENDER_URL.onrender.com/api
```

### 1.2 Update Frontend CORS Setup

The frontend is already configured. No changes needed.

---

## PART 2: PREPARE BACKEND FOR DEPLOYMENT

### 2.1 Update Backend Environment Variables

Open `d:\vs hack2\backend\.env` and update:

```env
GEMINI_API_KEY=AIzaSyAlAX_OEY8chvmXLkxJhAFnChUmDT7Dj4A
ELEVENLABS_API_KEY=sk_a6c7d0854d46763d97dba56b980c44c448d3b647674a2b2d
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
DEBUG=False
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3001
```

### 2.2 Verify Required Files Exist

Check these files exist in `d:\vs hack2\backend\`:
- ✅ `Procfile` (already created)
- ✅ `runtime.txt` (already created)
- ✅ `requirements.txt` (updated with gunicorn)
- ✅ `firebase-credentials.json` (already has credentials)
- ✅ `main.py`
- ✅ `config.py`
- ✅ `firebase_init.py` (updated)

---

## PART 3: DEPLOY TO GITHUB

### 3.1 Deploy Frontend to GitHub

```powershell
# Navigate to frontend
cd "d:\vs hack2\frontend"

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: InterviewLens frontend"

# Create repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/interviewlens-frontend.git
git branch -M main
git push -u origin main
```

### 3.2 Deploy Backend to GitHub

```powershell
# Navigate to backend
cd "d:\vs hack2\backend"

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: InterviewLens backend"

# Create repo on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/interviewlens-backend.git
git branch -M main
git push -u origin main
```

---

## PART 4: DEPLOY FRONTEND TO VERCEL

### 4.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Authorize Vercel access to your repos

### 4.2 Deploy Frontend

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Select **"Import Git Repository"**
3. Paste: `https://github.com/YOUR_USERNAME/interviewlens-frontend`
4. Click **"Import"**
5. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: ./
6. Click **"Environment Variables"** and add:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCKD1SGy1i12GD3R311QFNwXNY91tH96JY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hacka-b4cbd.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=hacka-b4cbd
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hacka-b4cbd.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=720098218386
   NEXT_PUBLIC_FIREBASE_APP_ID=1:720098218386:web:9690ef78ac72036f2db14b
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
7. Click **"Deploy"**
8. Wait for deployment to complete (2-3 minutes)
9. Your URL will be: `https://interviewlens-frontend.vercel.app`

---

## PART 5: DEPLOY BACKEND TO RENDER

### 5.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render access

### 5.2 Deploy Backend

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Select **"Deploy an existing Git repository"**
3. Paste: `https://github.com/YOUR_USERNAME/interviewlens-backend`
4. Click **"Connect"**
5. Configure service:
   - **Name**: `interviewlens-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT main:app`
6. Click **"Advanced"**
7. Under **"Environment Variables"**, add:
   ```
   GEMINI_API_KEY=AIzaSyAlAX_OEY8chvmXLkxJhAFnChUmDT7Dj4A
   ELEVENLABS_API_KEY=sk_a6c7d0854d46763d97dba56b980c44c448d3b647674a2b2d
   DEBUG=False
   HOST=0.0.0.0
   PORT=8000
   ALLOWED_ORIGINS=https://interviewlens-frontend.vercel.app
   FIREBASE_CREDENTIALS_JSON=<PASTE_ENTIRE_firebase-credentials.json_CONTENT>
   ```

8. Under **"Free plan"**, select if free or paid tier
9. Click **"Create Web Service"**
10. Wait 5-10 minutes for deployment
11. Your URL will be: `https://interviewlens-backend.onrender.com`

---

## PART 6: CONNECT FRONTEND TO BACKEND

### 6.1 Update Vercel Environment Variables

1. Go to Vercel dashboard → Select your frontend project
2. Go to **Settings** → **Environment Variables**
3. Edit `NEXT_PUBLIC_API_URL` and change to:
   ```
   https://interviewlens-backend.onrender.com/api
   ```
4. Click **"Save"**
5. Go to **Deployments** and click **"Redeploy"** on latest deployment

### 6.2 Update Render Environment Variables

1. Go to Render dashboard → Select your backend service
2. Go to **Environment** → Click edit icon
3. Update `ALLOWED_ORIGINS` to:
   ```
   https://interviewlens-frontend.vercel.app
   ```
4. Click **"Save Changes"**
5. Service will automatically redeploy

---

## PART 7: VERIFY DEPLOYMENT

### 7.1 Test Frontend
1. Visit: `https://interviewlens-frontend.vercel.app`
2. Verify main page loads
3. Try signing up with email
4. Try Google OAuth
5. Test interview flow

### 7.2 Test Backend
1. Visit: `https://interviewlens-backend.onrender.com/api/health`
2. Should see: `{"status":"ok"}`
3. Check Render logs for any errors

### 7.3 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Firebase: auth/api-key-not-valid** | Verify NEXT_PUBLIC_FIREBASE_API_KEY is correct |
| **CORS errors** | Update ALLOWED_ORIGINS on Render to match Vercel URL |
| **Backend 503** | First deploy takes time on Render free tier. Wait 60s |
| **Interview features fail** | Check Render logs for API key errors |
| **Can't upload avatar** | Verify Firebase Storage bucket name |

---

## PART 8: MONITORING & UPDATES

### Vercel Monitoring
- Logs: Go to Deployment → Logs
- Redeploy: Push to GitHub main branch (auto deploys)
- Errors: Check browser console (F12)

### Render Monitoring
- Logs: Service → Logs tab
- Restart: Service → Manual restart
- Environment: Service → Environment tab

### Git Workflow for Updates
```powershell
# Make changes
git add .
git commit -m "Fix: description"
git push origin main

# Auto deploys to both Vercel and Render!
```

---

## PART 9: COST BREAKDOWN

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Vercel** | 100GB/month bandwidth | Pay per use (~$20-50) |
| **Render** | 750 free hours/month | $7/month (always on) |
| **Firebase** | 50k reads/day | ~$0-10/month at scale |
| **GoogleAI (Gemini)** | Free tier | ~$1-3 per 1M tokens |
| **ElevenLabs (TTS)** | Free tier | ~$5+ per month |
| **Total** | **Free** | **~$15-30/month** |

---

## SUCCESS! 🎉

Your InterviewLens app is now deployed and accessible at:
- **Frontend**: https://interviewlens-frontend.vercel.app
- **Backend**: https://interviewlens-backend.onrender.com
- **API**: https://interviewlens-backend.onrender.com/api

Share the link and start conducting AI-powered technical interviews!
