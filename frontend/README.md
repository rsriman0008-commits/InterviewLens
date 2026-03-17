# InterviewLens - Frontend

AI-powered real-time technical interview simulator built with Next.js 14, React, and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Create .env.local file with your configuration
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Development

```bash
# Start dev server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── auth/                     # Authentication page
│   ├── home/                     # Home dashboard
│   ├── interview/
│   │   ├── select-role/          # Role selection
│   │   └── session/              # Interview session (main)
│   ├── scorecard/                # Interview scorecard
│   ├── profile/                  # User profile
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── interview/                # Interview-specific components
│   │   ├── AIAgentPanel.tsx      # AI agent UI
│   │   ├── CodeEditor.tsx        # Monaco editor wrapper
│   │   └── InterviewBottomBar.tsx # Bottom control bar
│   ├── shared/                   # Shared components
│   └── auth/                     # Auth components
├── hooks/                        # Custom React hooks
│   └── useAuth.ts                # Authentication hook
├── lib/                          # Utility functions
│   ├── api-client.ts             # Axios client setup
│   ├── api-service.ts            # API endpoints
│   ├── config.ts                 # Configuration
│   ├── constants.ts              # Constants & enums
│   ├── firebase.ts               # Firebase init
│   ├── firestore-service.ts      # Firestore queries
│   ├── utils.ts                  # Helper functions
│   └── voice-service.ts          # Voice/audio utilities
├── store/                        # Zustand state management
│   └── interview-store.ts        # Interview state
├── types/                        # TypeScript types
│   └── index.ts                  # Type definitions
├── .env.example                  # Example environment variables
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🔑 Key Features

### 1. Authentication (`/auth`)
- Email/Password sign-up and login
- Google OAuth integration
- User profile collection on first sign-up
- Firebase authentication

### 2. Home Dashboard (`/home`)
- User profile card with stats
- Recent interviews list
- Quick access to start new interview
- Average score tracking

### 3. Role Selection (`/interview/select-role`)
- 8 different interview roles
- Role-specific descriptions and difficulty levels
- Visual selection with confirmation

### 4. Interview Session (`/interview/session`)
- **Multi-phase interview flow:**
  - Icebreaker (2-3 warm-up questions)
  - Introduction (role explanation)
  - Coding questions (3 problems)
  - Wrap-up (conclusion)

- **Left Panel (AI Agent):**
  - AI avatar with speaking indicator
  - Live question transcript
  - Conversation history
  - Waveform animation

- **Right Panel (Code Editor):**
  - Monaco Editor with syntax highlighting
  - Language selection (Python, JavaScript, Java, C++)
  - Real-time code execution simulation
  - Submit answer button

- **Bottom Bar:**
  - Push-to-talk microphone
  - Voice transcription
  - Interview timer
  - Text input fallback

### 5. Scorecard (`/scorecard/{id}`)
- Overall score (0-100)
- Score breakdown by category
- Strengths and areas to improve
- Per-question summary with feedback
- PDF download
- Navigation to new interview or home

### 6. User Profile (`/profile`)
- Editable profile information
- Statistics dashboard
- Score trend chart (Recharts)
- Role distribution pie chart
- Interview history table
- Sort and filter options

## 🔌 API Integration

### Endpoints Used

The frontend communicates with the FastAPI backend at `NEXT_PUBLIC_API_BASE_URL`:

```
POST /api/generate-question           - Generate interview questions
POST /api/evaluate-code               - Evaluate submitted code
POST /api/generate-feedback           - Generate interview feedback
POST /api/text-to-speech              - Convert text to audio
POST /api/speech-to-text              - Convert speech to text
GET  /api/health                      - Health check
```

### External APIs

1. **Firebase**
   - Authentication (Google OAuth, Email/Password)
   - Firestore (Database)
   - Storage (Profile pictures)

2. **ElevenLabs**
   - Text-to-speech for AI voice
   - Speech-to-text for user transcription

3. **Google Gemini**
   - Question generation
   - Code evaluation
   - Feedback generation

## 🛠️ Technologies

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui, Radix UI
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Code Editor:** Monaco Editor
- **Charts:** Recharts
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth
- **Voice:** ElevenLabs API, Web Speech API
- **Document Export:** jsPDF

## 📝 State Management

Uses **Zustand** for centralized state:

```typescript
// Store location: store/interview-store.ts
useInterviewStore:
  - currentInterview
  - currentPhase
  - selectedRole
  - currentQuestionIndex
  - isRecording
  - aiIsSpeaking
```

## 🔒 Authentication Flow

1. User visits `/auth`
2. Sign up or login with email/Google
3. First-time signup: collect profile info
4. Store auth token in localStorage
5. Auto-redirect to `/home` on success
6. Protected routes check `useAuth()` hook

## 💾 Data Models

### Interview
```typescript
{
  id: string
  userId: string
  role: string
  startTime: Date
  endTime?: Date
  duration?: number
  totalScore: number
  communicationScore: number
  problemSolvingScore: number
  codeQualityScore: number
  technicalKnowledgeScore: number
  questions: CodeQuestion[]
  feedback: InterviewFeedback
  status: 'ongoing' | 'completed' | 'abandoned'
}
```

### CodeQuestion
```typescript
{
  id: string
  questionNumber: number
  phase: 'icebreaker' | 'introduction' | 'coding' | 'wrapup'
  question: string
  hints?: string[]
  expectedTopics?: string[]
  userCode?: string
  userCodeLanguage?: string
  codeScore?: {
    correctness: number
    timeComplexity: string
    spaceComplexity: string
    bugs?: string[]
    suggestions?: string[]
  }
  voiceTranscript?: string
  followUpQuestions?: string[]
  followUpAnswers?: string[]
}
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel deploy

# Set environment variables in Vercel dashboard
```

### Manual Deployment

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Module Resolution Errors
If you see "Cannot find module" errors:
```bash
npm install --legacy-peer-deps
```

### Firebase Connection Issues
- Verify Firebase credentials in `.env.local`
- Check Firestore rules allow read/write for authenticated users
- Test with: `firebase-admin` for backend

### Voice API Issues
- Ensure browser allows microphone access
- Test with HTTPS (required for Speech API)
- Check ElevenLabs API key validity

### Monaco Editor Issues
- Clear node_modules and reinstall
- Ensure `@monaco-editor/react` is installed

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 License

This project is part of InterviewLens.

## 💡 Future Enhancements

- [ ] Video recording of interviews
- [ ] Peer comparison analytics
- [ ] Custom questions library
- [ ] Interview scheduling
- [ ] Real-time collaboration
- [ ] Mobile app version
- [ ] Advanced code analysis
- [ ] Interview replay feature
