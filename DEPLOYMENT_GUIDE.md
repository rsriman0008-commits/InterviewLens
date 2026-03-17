# InterviewLens - Complete Deployment Guide

## Overview
InterviewLens is a full-stack application that will be deployed as:
- **Frontend**: Next.js on Vercel (https://yourapp.vercel.app)
- **Backend**: FastAPI on Render (https://yourapp.onrender.com)
- **Database**: Firebase Firestore (managed by Google)

---

## Part 1: Pre-Deployment Checklist

### 1. Verify Environment Variables

#### Frontend (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=<your-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hacka-b4cbd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hacka-b4cbd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hacka-b4cbd.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=720098218386
NEXT_PUBLIC_FIREBASE_APP_ID=1:720098218386:web:9690ef78ac72036f2db14b
NEXT_PUBLIC_API_URL=https://yourapp.onrender.com/api
```

#### Backend (.env)
```
GEMINI_API_KEY=AIzaSyAlAX_OEY8chvmXLkxJhAFnChUmDT7Dj4A
ELEVENLABS_API_KEY=sk_a6c7d0854d46763d97dba56b980c44c448d3b647674a2b2d
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-credentials.json
DEBUG=False
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=https://yourapp.vercel.app,http://localhost:3001
```

---

## Part 2: Frontend Deployment to Vercel

### Step 1: Push to GitHub
```bash
cd d:\vs hack2\frontend
git init
git add .
git commit -m "Initial commit: InterviewLens frontend"
git remote add origin https://github.com/yourusername/interviewlens-frontend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Paste: `https://github.com/yourusername/interviewlens-frontend.git`
5. Select "Next.js" as framework
6. Configure environment variables:
   - Add all `NEXT_PUBLIC_*` variables from .env.local
   - Add `NEXT_PUBLIC_API_URL=https://yourapp.onrender.com/api`
7. Click "Deploy"

### Step 3: Update Backend URL
After Render deployment, update Vercel environment:
- Go to Vercel Project Settings → Environment Variables
- Update `NEXT_PUBLIC_API_URL` to your Render URL

---

## Part 3: Backend Deployment to Render

### Step 1: Prepare Backend for Deployment

#### Create runtime.txt
```
python-3.10.14
```

#### Create Procfile
```
web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

#### Update requirements.txt
Add gunicorn if not present:
```bash
pip install gunicorn
pip freeze > requirements.txt
```

### Step 2: Update Backend for Production

Update `main.py`:
```python
import os

# Get allowed origins from environment
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3001').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 3: Push to GitHub
```bash
cd d:\vs hack2\backend
git init
git add .
git commit -m "Initial commit: InterviewLens backend"
git remote add origin https://github.com/yourusername/interviewlens-backend.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy on Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Select "Deploy an existing Git repository"
4. Paste: `https://github.com/yourusername/interviewlens-backend.git`
5. Configure:
   - **Name**: interviewlens-backend
   - **Runtime**: Python 3.10
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`
6. Add environment variables:
   - `GEMINI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `FIREBASE_CREDENTIALS_PATH` → paste entire firebase-credentials.json content
   - `ALLOWED_ORIGINS=https://yourapp.vercel.app`
   - `DEBUG=False`
   - `HOST=0.0.0.0`
   - `PORT=8000`
7. Click "Create Web Service"

### Step 5: Upload Firebase Credentials
1. In Render dashboard, go to your service
2. Go to "Environment" → Edit
3. In `FIREBASE_CREDENTIALS_PATH`, paste the entire JSON content from firebase-credentials.json
4. OR upload as a file if Render supports file uploads

---

## Part 4: Testing Production Deployment

### Frontend Tests
1. Visit `https://yourapp.vercel.app`
2. Try signing up with email
3. Try Google OAuth login
4. Complete profile setup
5. Start an interview

### Backend Tests
1. Visit `https://yourapp.onrender.com/api/health`
2. Should return: `{"status": "ok"}`
3. Check console logs in Render dashboard

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Firebase auth fails | Check API key in .env.local is public key, not private |
| CORS errors | Add frontend URL to ALLOWED_ORIGINS in backend |
| Slow startup | Render free tier takes 30-60s, consider upgrading |
| 503 errors | Backend may be sleeping, wait 60s and retry |

---

## Part 5: Monitoring & Maintenance

### Vercel
- Logs: Project Settings → Function Logs
- Analytics: Real-time analytics dashboard
- Deployments: Automatic on git push to main

### Render
- Logs: Service dashboard → Logs
- Monitoring: Infrastructure tab
- Manual redeploy: Deploy button

---

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Firebase credentials uploaded
- [ ] Backend health check responds
- [ ] Frontend can communicate with backend
- [ ] Authentication works (email + Google)
- [ ] Interview flow completes
- [ ] Scorecard generates correctly
- [ ] No console errors in browser
- [ ] No 4xx or 5xx errors in backend

---

## Cost Estimates

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel | 100GB bandwidth/month | Premium if needed |
| Render | 750 free hours/month | $7/month after |
| Firebase | Generous free tier | ~$0-5/month with this usage |
| **Total** | **Free for light usage** | **~$10-20/month production** |

