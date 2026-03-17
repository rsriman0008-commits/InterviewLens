# InterviewLens - Quick Reference Card

## What is InterviewLens? 🎯
AI-powered mock interview simulator with real-time feedback, code evaluation, and voice interaction. Practice technical interviews with an AI interviewer powered by Google Gemini.

---

## Tech Stack 🛠️

```
Frontend: Next.js 14 (React 18, TypeScript, Tailwind)
Backend: FastAPI (Python 3.10)
Database: Firebase (Auth + Firestore + Storage)
AI: Google Gemini 1.5 Flash
Voice: ElevenLabs TTS + Web Speech API
Deployment: Vercel (Frontend) + Render (Backend)
```

---

## Interview Phases ⏱️

| Phase | Time | Focus |
|-------|------|-------|
| Icebreaker | 2-3 min | Warm-up, communication |
| Introduction | 1-2 min | Role explanation |
| **Coding** | 15-20 min | 3 coding problems |
| Wrap-up | 1-2 min | Summary + feedback |

---

## Scoring (0-100) 📊

- 🗣️ **Communication**: 25 pts
- 💡 **Problem Solving**: 25 pts  
- 💻 **Code Quality**: 25 pts
- 📚 **Technical Knowledge**: 25 pts

*Color-coded: 🟢 80-100 | 🟡 60-80 | 🔴 <60*

---

## Key Files & Locations 📁

| File | Path | Purpose |
|------|------|---------|
| Frontend Code | `d:\vs hack2\frontend\app\` | React pages & components |
| Backend Code | `d:\vs hack2\backend\main.py` | FastAPI endpoints |
| Configs | `.env.local` & `.env` | Environment variables |
| Firebase Creds | `backend\firebase-credentials.json` | Auth credentials |
| Deployment | `DEPLOYMENT_STEPS.md` | How to deploy |

---

## Environment Variables 🔑

**Frontend (.env.local)**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCKD...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hacka-b4cbd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hacka-b4cbd
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Backend (.env)**
```
GEMINI_API_KEY=AIzaSyAlAX...
ELEVENLABS_API_KEY=sk_a6c...
ALLOWED_ORIGINS=http://localhost:3001
```

---

## Local Development 💻

### Start Backend
```powershell
cd d:\vs hack2\backend
.\.venv\Scripts\python.exe main.py
# Runs on http://localhost:8000
```

### Start Frontend
```powershell
cd d:\vs hack2\frontend
npm run dev
# Runs on http://localhost:3001
```

### Test
- Frontend: http://localhost:3001
- Backend: http://localhost:8000/api/health
- Swagger Docs: http://localhost:8000/docs

---

## Deployment (30 minutes) 🚀

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "init" && git push
```

### 2. Deploy Frontend to Vercel
- Go to vercel.com → Import GitHub repo → Deploy
- Add environment variables
- Your URL: `https://your-app.vercel.app`

### 3. Deploy Backend to Render
- Go to render.com → New Web Service → Connect GitHub
- Set Start Command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`
- Add environment variables
- Your URL: `https://your-app.onrender.com`

### 4. Connect Frontend & Backend
- Update Vercel: `NEXT_PUBLIC_API_URL=https://your-app.onrender.com/api`
- Update Render: `ALLOWED_ORIGINS=https://your-app.vercel.app`

---

## Features by Page 🖥️

| Page | URL | What It Does |
|------|-----|-------------|
| **Auth** | `/auth` | Sign up / Login (Email + Google) |
| **Home** | `/home` | Dashboard with recent interviews |
| **Role Select** | `/interview/select-role` | Choose interview role |
| **Interview** | `/interview/session` | Run the AI mock interview |
| **Scorecard** | `/scorecard/{id}` | View interview results & feedback |
| **Profile** | `/profile` | View stats & interview history |

---

## API Endpoints 🔌

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/generate-question` | POST | Get interview question |
| `/api/evaluate-code` | POST | Evaluate code solution |
| `/api/generate-feedback` | POST | Generate scorecard |
| `/api/text-to-speech` | POST | Convert text to voice |
| `/api/speech-to-text` | POST | Convert voice to text |

---

## Roles Available 🎭

Frontend, Backend, Full Stack, Data Scientist, ML Engineer, DevOps, Android, System Design

---

## Costs 💰

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel | 100GB/mo | $0.15/GB overage |
| Render | 750 hrs/mo | $7/mo (always on) |
| Firebase | Generous | ~$10-15/mo at scale |
| Gemini | $0.075/1M tokens | (not per-call) |
| **Total** | **Free!** | **~$20/mo** |

---

## Common Issues & Fixes 🔧

| Error | Fix |
|-------|-----|
| Firebase auth error | Check `NEXT_PUBLIC_FIREBASE_API_KEY` in `.env.local` |
| CORS error | Update `NEXT_PUBLIC_API_URL` to backend URL |
| API key invalid | Regenerate key in Firebase/Gemini/ElevenLabs |
| 503 errors | Render free tier sleeps, wait 60s & retry |
| Features fail | Check backend logs on Render dashboard |

---

## Testing Checklist ✅

- [ ] Sign up works (email + Google)
- [ ] Profile page saves data
- [ ] Can start interview
- [ ] Code editor works
- [ ] Interview completes
- [ ] Scorecard displays
- [ ] Can download PDF
- [ ] No console errors (F12)
- [ ] Backend responding (health check passes)

---

## Commands Cheat Sheet

```bash
# Local dev
npm run dev          # Frontend dev server
python main.py       # Backend server

# Git
git init
git add .
git commit -m "msg"
git push origin main

# Install deps
npm install --legacy-peer-deps  # Frontend
pip install -r requirements.txt # Backend

# Check errors
npm run build        # Build Next.js
python -m pytest     # Run backend tests
```

---

## Next Steps 🎯

1. **Fix Firebase error** → Read `FIX_FIREBASE_ERROR.md`
2. **Deploy everything** → Follow `DEPLOYMENT_STEPS.md`
3. **Share your link** → Get interviews started!
4. **Iterate & improve** → Add features based on feedback

---

## Documentation 📖

- **`PROJECT_OVERVIEW.md`** - Complete architecture & features
- **`DEPLOYMENT_STEPS.md`** - Step-by-step deployment
- **`DEPLOYMENT_GUIDE.md`** - Deployment concepts
- **`FIX_FIREBASE_ERROR.md`** - Troubleshoot Firebase
- **`frontend/README.md`** - Frontend details
- **`backend/README.md`** - Backend details

---

## Live Demo URLs 🌐

After deployment:
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.onrender.com
- **API Docs**: https://your-app.onrender.com/docs

---

## Contact & Support 💬

Stuck? Check documentation or backend/frontend logs for detailed error messages.

**You're ready to deploy! 🚀**
