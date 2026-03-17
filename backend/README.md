# InterviewLens - Backend

FastAPI backend for AI-powered technical interview simulator with Gemini and ElevenLabs integration.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip or conda
- Virtual environment (recommended)

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your configuration
cp .env.example .env
```

### Environment Variables

Create a `.env` file:

```env
# API Keys
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Firebase
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json

# Server Config
DEBUG=False
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Development

```bash
# Start development server (with auto-reload)
python main.py

# Server will run on http://localhost:8000
# Docs available at http://localhost:8000/docs
```

## 📁 Project Structure

```
backend/
├── main.py                      # FastAPI application & endpoints
├── config.py                    # Configuration management
├── firebase_init.py             # Firebase Admin SDK initialization
├── gemini_service.py            # Google Gemini API integration
├── elevenlabs_service.py        # ElevenLabs API integration
├── requirements.txt             # Python dependencies
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignore file
└── README.md                    # This file
```

## 🔌 API Endpoints

### Health Check
```
GET /api/health
Returns: { "status": "ok", "message": "..." }
```

### Generate Question
```
POST /api/generate-question

Request:
{
  "role": "Backend Developer",
  "phase": "coding",           // icebreaker, introduction, coding, wrapup
  "questionNumber": 1,
  "userProfile": {
    "fullName": "John Doe",
    "college": "MIT",
    "branch": "CSE",
    "yearOfStudy": "3"
  }
}

Response:
{
  "question": "Write a function to reverse a linked list",
  "hints": ["Consider using a pointer...", "..."],
  "expectedTopics": ["linked_lists", "recursion"]
}
```

### Evaluate Code
```
POST /api/evaluate-code

Request:
{
  "code": "def reverse(head):\n...",
  "question": "Write a function to reverse a linked list",
  "language": "python",         // python, javascript, java, cpp
  "role": "Backend Developer"
}

Response:
{
  "correctness": 9,             // 0-10
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "bugs": [],
  "suggestions": ["Consider edge case...", "..."],
  "followupQuestions": ["Why did you choose...?", "..."]
}
```

### Generate Feedback
```
POST /api/generate-feedback

Request:
{
  "allAnswers": ["answer1", "answer2", ...],
  "codeScores": [{...}, {...}, ...],
  "voiceTranscripts": ["transcript1", ...],
  "role": "Backend Developer"
}

Response:
{
  "totalScore": 82,
  "breakdown": {
    "communication": 20,        // out of 25
    "problemSolving": 22,       // out of 25
    "codeQuality": 18,          // out of 25
    "technicalKnowledge": 22    // out of 25
  },
  "strengths": [
    "Clear problem solving approach",
    "Good code structure",
    "..."
  ],
  "improvements": [
    "Consider edge cases",
    "Add error handling",
    "..."
  ],
  "overallFeedback": "Great interview...",
  "resources": ["Link1", "Link2", ...]
}
```

### Text to Speech
```
POST /api/text-to-speech

Request:
{
  "text": "Hello, let's start your interview",
  "voice_id": "pNInz6obpgDQGcFmaJgB"  // optional
}

Response: Audio file (MP3)
```

### Speech to Text
```
POST /api/speech-to-text

Request: multipart/form-data with audio file
Response:
{
  "transcript": "Hello, I am John",
  "confidence": 0.95
}
```

## 🔧 Configuration

### Gemini Setup

1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

### ElevenLabs Setup

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Get API key from dashboard
3. Add to `.env`:
   ```env
   ELEVENLABS_API_KEY=your_key_here
   ```

### Firebase Setup

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Generate service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
3. Save as `firebase-credentials.json`
4. Add path to `.env`:
   ```env
   FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
   ```

## 🛠️ Technologies

- **Framework:** FastAPI 0.109
- **Server:** Uvicorn 0.27+
- **Language:** Python 3.10+
- **AI:** Google Generative AI (Gemini)
- **Voice:** ElevenLabs API
- **Database:** Firebase Firestore
- **Validation:** Pydantic 2.5+

## 📦 Dependencies

```
fastapi              # Web framework
uvicorn              # ASGI server
python-multipart     # File upload handling
python-dotenv        # Environment variables
google-generativeai   # Gemini API
elevenlabs           # Text-to-speech
firebase-admin       # Firebase integration
requests             # HTTP requests
pydantic             # Data validation
aiofiles             # Async file operations
```

## 🚀 Deployment

### Railway.sh (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up

# Set environment variables in Railway dashboard
```

### Render.com

```bash
# Create new Web Service
# Connect GitHub repository
# Set build command: pip install -r requirements.txt
# Set start command: uvicorn main:app --host 0.0.0.0 --port 8000
# Add environment variables
```

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build image
docker build -t interviewlens-backend .

# Run container
docker run -p 8000:8000 --env-file .env interviewlens-backend
```

## 📊 Request/Response Examples

### Example 1: Generate Icebreaker Question

**Request:**
```bash
curl -X POST "http://localhost:8000/api/generate-question" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Frontend Developer",
    "phase": "icebreaker",
    "questionNumber": 1,
    "userProfile": {
      "fullName": "Alice Johnson",
      "college": "Stanford",
      "branch": "CSE",
      "yearOfStudy": "3"
    }
  }'
```

**Response:**
```json
{
  "question": "Tell me about yourself and your experience with web development",
  "hints": [
    "Start with your background",
    "Highlight key projects or technologies",
    "Mention 2-3 main skills"
  ],
  "expectedTopics": ["background", "projects", "skills", "experience"]
}
```

### Example 2: Evaluate Code

**Request:**
```bash
curl -X POST "http://localhost:8000/api/evaluate-code" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
    "question": "Write a function to generate Fibonacci sequence",
    "language": "python",
    "role": "Backend Developer"
  }'
```

**Response:**
```json
{
  "correctness": 7,
  "timeComplexity": "O(2^n)",
  "spaceComplexity": "O(n)",
  "bugs": ["Exponential time complexity", "Inefficient for large n"],
  "suggestions": [
    "Consider using dynamic programming",
    "Use memoization to cache results",
    "Iterative approach would be better"
  ],
  "followupQuestions": [
    "Why does your solution have exponential time complexity?",
    "Can you optimize this using memoization?"
  ]
}
```

## 🐛 Troubleshooting

### Import Errors
```
ModuleNotFoundError: No module named 'google.generativeai'
```
**Solution:**
```bash
pip install -r requirements.txt
```

### Firebase Connection Error
```
firebase_admin.exceptions.InvalidCredential
```
**Solution:**
- Verify `firebase-credentials.json` path in `.env`
- Check file is valid JSON
- Ensure service account has Firestore permissions

### CORS Errors
```
CORSError: Request not allowed
```
**Solution:**
- Add frontend URL to `ALLOWED_ORIGINS` in `.env`
- Restart server after changing config

### API Rate Limit
```
429 Too Many Requests
```
**Solution:**
- Check Gemini and ElevenLabs rate limits
- Implement request throttling
- Upgrade API plan

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google Generative AI](https://ai.google.dev/)
- [ElevenLabs API Docs](https://elevenlabs.io/docs/api-reference)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)

## 📄 License

This project is part of InterviewLens.

## 🔮 Future Enhancements

- [ ] Caching with Redis
- [ ] Request rate limiting
- [ ] Advanced logging
- [ ] Custom prompt templates
- [ ] Multi-language support
- [ ] Advanced code analysis
- [ ] Interview recording
- [ ] Real-time WebSocket updates
- [ ] Advanced metrics and analytics
