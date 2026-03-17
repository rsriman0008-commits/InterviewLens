# InterviewLens - Quick Deploy (No Auth)

## ✅ What's Ready

Your InterviewLens app is **fully functional** with mock authentication:
- ✅ No login/signup required
- ✅ Direct access to dashboard
- ✅ All interview features work
- ✅ Backend AI integration ready
- ✅ Code evaluation works
- ✅ Scoring works

---

## 🚀 Deploy in 10 Minutes

### Step 1: Push Frontend to GitHub

```powershell
cd "d:\vs hack2\frontend"
git init
git add .
git commit -m "InterviewLens frontend - no auth version"
git remote add origin https://github.com/YOUR_USERNAME/interviewlens.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Add New Project"** → **"Import Git Repository"**
3. Paste: `https://github.com/YOUR_USERNAME/interviewlens`
4. Click **"Import"**
5. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
6. Click **"Deploy"** (wait 2-3 minutes)
7. Your URL: `https://interviewlens.vercel.app` ✅

### Step 3: Push Backend to GitHub

```powershell
cd "d:\vs hack2\backend"
git init
git add .
git commit -m "InterviewLens backend - deployed"
git remote add origin https://github.com/YOUR_USERNAME/interviewlens-backend.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy Backend to Render

1. Go to **[render.com](https://render.com)**
2. Click **"New +"** → **"Web Service"**
3. Click **"Deploy an existing Git repository"**
4. Paste: `https://github.com/YOUR_USERNAME/interviewlens-backend`
5. **Configuration**:
   - **Name**: interviewlens-api
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT main:app`
6. **Environment Variables**:
   ```
   GEMINI_API_KEY=AIzaSyAlAX_OEY8chvmXLkxJhAFnChUmDT7Dj4A
   ELEVENLABS_API_KEY=sk_a6c7d0854d46763d97dba56b980c44c448d3b647674a2b2d
   ALLOWED_ORIGINS=https://interviewlens.vercel.app
   DEBUG=False
   ```
7. Click **"Create Web Service"** (wait 5-10 minutes)
8. Your URL: `https://interviewlens-api.onrender.com` ✅

### Step 5: Connect Frontend to Backend

**Update Vercel Environment:**
1. Go to Vercel Dashboard → Your Project → **Settings**
2. Click **"Environment Variables"**
3. Update `NEXT_PUBLIC_API_URL`:
   ```
   https://interviewlens-api.onrender.com/api
   ```
4. Click **"Save"**
5. Go to **"Deployments"** → Click **"Redeploy"** on latest

### Step 6: Test Live App

- Visit: `https://interviewlens.vercel.app`
- Should load immediately (no login needed)
- Try "Start Interview"
- Select a role
- Run an interview
- It works! 🎉

---

## 📝 What's Different from Production

| Feature | Demo (Now) | Production (Later) |
|---------|-----------|-------------------|
| User Auth | ❌ Skipped | ✅ Firebase Auth |
| Data Persistence | ❌ Session only | ✅ Firestore |
| User Profiles | ❌ Mock data | ✅ Custom profiles |
| Interview History | ❌ Mock data | ✅ Real data |
| Backend | ✅ Live | ✅ Live |
| AI Features | ✅ Live | ✅ Live |

---

## 🔧 How to Add Real Auth Later

When ready, just:
1. Re-enable Firebase Auth (uncomment code in pages)
2. Re-connect to Firestore
3. Update Vercel with Firebase config
4. Users can login/signup
5. Data saves permanently

---

## 🎯 Current Features (All Working)

✅ **Interview Simulation**
- 4 phases: Icebreaker → Intro → Coding → Wrap-up
- Real-time voice interaction
- AI-powered questions
- Code evaluation

✅ **Code Editor**
- 4 languages: Python, JavaScript, Java, C++
- Syntax highlighting
- Run button
- Output console

✅ **Scoring**
- Communication (25 pts)
- Problem Solving (25 pts)
- Code Quality (25 pts)
- Technical Knowledge (25 pts)

✅ **Feedback**
- Per-question analysis
- Strengths identified
- Areas to improve
- Suggestions

✅ **8 Interview Roles**
- Frontend, Backend, Full Stack
- Data Scientist, ML Engineer
- DevOps, Android, System Design

---

## 💰 Cost

| Service | Cost |
|---------|------|
| Vercel | Free (100GB/mo) |
| Render | Free (750 hrs/mo) |
| Gemini API | Free ($0.075/1M tokens) |
| ElevenLabs TTS | Free tier |
| **Total** | **Completely FREE** ✅ |

---

## ⚙️ Local Testing

Before deployment, test locally:

**Terminal 1 - Backend**:
```powershell
cd "d:\vs hack2\backend"
.\.venv\Scripts\python.exe main.py
# Should show: Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend**:
```powershell
cd "d:\vs hack2\frontend"
npm run dev
# Should show: ▲ Next.js 14.2.35 - Local: http://localhost:3001
```

**Browser**:
- Visit http://localhost:3001
- Should see dashboard immediately
- Try taking an interview
- Check AI responses work

---

## 🎬 Share Your App

After deployment, share the live link:
```
Try my AI interview simulator: https://interviewlens.vercel.app
```

---

## 📚 Adding Real Auth (Future)

To add real authentication later:

1. **Uncomment useAuth hooks** in pages
2. **Create auth page** with login/signup
3. **Connect to Firebase**
4. **Users can save profiles**
5. **Interview history persists**

We kept all auth code in the project, just disabled it for now.

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| App won't load | Wait 60s (cold start on free tier) |
| Backend 503 | Render free tier takes time, retry |
| No interview questions | Check Gemini API key in backend |
| Code won't run | Check backend /api/health endpoint |

---

## 🎉 You're Live!

Your AI interview simulator is now online and ready to use!

**Frontend**: https://interviewlens.vercel.app
**Backend**: https://interviewlens-api.onrender.com

Share it with friends and start practicing technical interviews! 🚀
