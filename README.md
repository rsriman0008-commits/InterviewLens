# InterviewLens

**AI-Powered Real-Time Technical Interview Simulator**

A comprehensive full-stack application that provides realistic technical interview practice with AI-powered question generation, real-time code evaluation, and detailed performance feedback.

## 🎯 Project Overview

InterviewLens is designed to help computer science students and software engineers practice technical interviews in a realistic, interactive environment. The application uses AI (Google Gemini) to generate questions, evaluate code, and provide feedback, while ElevenLabs provides natural voice interaction.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                  │
│                         d:/vs hack2/frontend/               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Pages: Auth, Home, Role Selection, Interview Session  │ │
│  │  Scorecard, Profile                                    │ │
│  │  Components: AI Panel, Code Editor, UI Components      │ │
│  │  Services: Firebase Auth, Firestore, Voice, API Client │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
              ┌─────────────────────────────────┐
              │   CORS Proxy / Load Balancer    │
              └─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                      │
│                     d:/vs hack2/backend/                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Endpoints: Generate, Evaluate, Feedback, Voice        │ │
│  │  Services: Gemini AI, ElevenLabs, Firebase             │ │
│  │  Database: Firestore Integration                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
      ↓              ↓                  ↓
┌──────────┐  ┌─────────────┐  ┌──────────────────┐
│ Firebase │  │ Google API  │  │   ElevenLabs     │
│ (DB+Auth)│  │  (Gemini)   │  │  (Voice/TTS/STT) │
└──────────┘  └─────────────┘  └──────────────────┘
```

## 📁 Project Structure

```
d:/vs hack2/
├── frontend/               # Next.js React application
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks (useAuth)
│   ├── lib/               # Services & utilities
│   ├── store/             # Zustand state management
│   ├── types/             # TypeScript definitions
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── README.md
│
└── backend/               # FastAPI Python application
    ├── main.py           # FastAPI app & endpoints
    ├── config.py         # Configuration
    ├── firebase_init.py  # Firebase setup
    ├── gemini_service.py # Gemini AI integration
    ├── elevenlabs_service.py
    ├── requirements.txt
    └── README.md
```

## 🔑 Key Features

### 1. **Authentication**
- Email/Password signup & login
- Google OAuth integration
- User profile creation on signup
- Firebase Authentication

### 2. **Interview Workflow**
- **Role Selection:** Choose from 8+ developer roles
- **Icebreaker Phase:** 2-3 warm-up questions
- **Introduction Phase:** Role-specific information
- **Coding Phase:** 3 coding problems with live code editor
- **Wrap-up Phase:** Interview conclusion

### 3. **Real-Time Features**
- Live voice interaction with AI (text-to-speech & speech-to-text)
- Monaco code editor with syntax highlighting
- Real-time code execution simulation
- Live question transcript

### 4. **AI-Powered Evaluation**
- Question generation based on role
- Code evaluation with complexity analysis
- Automatic bug detection
- Performance-based scoring (0-100)

### 5. **Comprehensive Feedback**
- Breakdown by 4 scoring categories (0-25 each)
- Strength identification
- Areas for improvement
- Personalized study resources

### 6. **Analytics Dashboard**
- Interview history
- Score trends over time
- Role distribution charts
- Performance statistics

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React 18 + Tailwind CSS
- **Component Library:** shadcn/ui, Radix UI
- **State:** Zustand
- **Editor:** Monaco Editor
- **Charts:** Recharts
- **HTTP:** Axios
- **Auth/DB:** Firebase

### Backend
- **Framework:** FastAPI 0.109
- **Server:** Uvicorn
- **Language:** Python 3.10+
- **AI:** Google Generative AI (Gemini 1.5 Flash)
- **Voice:** ElevenLabs API
- **Database:** Firebase Firestore
- **Validation:** Pydantic

### External APIs
1. **Firebase** - Auth, Database, Storage
2. **Google Gemini** - Question generation, code evaluation, feedback
3. **ElevenLabs** - Text-to-speech, speech-to-text
4. **Web Speech API** - Browser-native speech recognition


## 🎮 Usage

1. **Sign Up** at `http://localhost:3000/auth`
   - Create account with email or Google
   - Fill in profile information

2. **Go to Home Dashboard** (`/home`)
   - View profile and stats
   - Click "Start Interview"

3. **Select Role** (`/interview/select-role`)
   - Choose from available roles
   - Click "Begin Interview"

4. **Interview Session** (`/interview/session`)
   - Answer icebreaker questions (voice or text)
   - Receive introduction to role
   - Solve 3 coding problems
   - Get real-time feedback

5. **View Scorecard** (`/scorecard/{id}`)
   - See detailed score breakdown
   - Read AI feedback
   - Download PDF
   - Start new interview

6. **Check Profile** (`/profile`)
   - View all interview history
   - See performance trends
   - Edit profile information

## 📊 Interview Scoring

Each interview generates a score out of 100, broken into 4 categories:

| Category | Scoring Criteria |
|----------|-----------------|
| **Communication** (0-25) | Clarity, articulation, response quality |
| **Problem Solving** (0-25) | Approach, logic, completeness |
| **Code Quality** (0-25) | Style, efficiency, readability |
| **Technical Knowledge** (0-25) | Concepts, complexity understanding |

**Score Badges:**
- 🟢 Green (70-100): Excellent
- 🟡 Yellow (40-69): Average
- 🔴 Red (0-39): Needs Improvement

## 🔐 Security Features

- JWT-based authentication via Firebase
- CORS protection on backend
- Environment variable-based secrets
- Firestore security rules (setup required)
- HTTPS support for production


## 🎯 Future Roadmap

- [ ] Video recording & playback
- [ ] Peer leaderboards
- [ ] Custom question library
- [ ] Interview scheduling
- [ ] Real-time collaboration
- [ ] Mobile app (React Native)
- [ ] Advanced code analysis tools
- [ ] Interview replay feature
- [ ] Multi-language support
- [ ] Real interviewer matching

## 📄 License

InterviewLens © 2026. All rights reserved.

## 💡 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

## 📧 Support

For issues, feature requests, or feedback:
- Create an issue on GitHub
- Email: support@interviewlens.com

## 🙏 Acknowledgments

- Google Generative AI (Gemini)
- ElevenLabs for voice API
- Firebase for backend services
- Open source community

---

**Happy Interviewing! 🎉**
