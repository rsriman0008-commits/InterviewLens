from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import json
from config import config
from gemini_service import generate_question, evaluate_code, generate_feedback, run_code
from elevenlabs_service import elevenlabs_service

# Create FastAPI app
app = FastAPI(
    title="InterviewLens API",
    description="AI-powered technical interview simulator backend",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== PYDANTIC MODELS ====================

class GenerateQuestionRequest(BaseModel):
    role: str
    phase: str = "coding"  # icebreaker, introduction, coding, wrapup
    questionNumber: int = 1
    userProfile: Optional[dict] = None

class CodeEvaluationRequest(BaseModel):
    code: str
    question: str
    language: str  # python, javascript, java, cpp
    role: str

class GenerateFeedbackRequest(BaseModel):
    allAnswers: List[str]
    codeScores: List[dict]
    voiceTranscripts: List[str]
    role: str

class RunCodeRequest(BaseModel):
    code: str
    language: str
    question: str = ""

class TextToSpeechRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "pNInz6obpgDQGcFmaJgB"

# ==================== HEALTH CHECK ====================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "InterviewLens API is running"
    }

# ==================== QUESTION GENERATION ====================

@app.post("/api/generate-question")
async def api_generate_question(request: GenerateQuestionRequest):
    """Generate interview question using Gemini"""
    try:
        result = generate_question(
            role=request.role,
            phase=request.phase,
            question_number=request.questionNumber,
            user_profile=request.userProfile
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CODE EVALUATION ====================

@app.post("/api/evaluate-code")
async def api_evaluate_code(request: CodeEvaluationRequest):
    """Evaluate submitted code using Gemini"""
    try:
        result = evaluate_code(
            code=request.code,
            question=request.question,
            language=request.language,
            role=request.role
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CODE EXECUTION ====================

@app.post("/api/run-code")
async def api_run_code(request: RunCodeRequest):
    """Analyze and predict code execution output using Gemini"""
    try:
        result = run_code(
            code=request.code,
            language=request.language,
            question=request.question
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FEEDBACK GENERATION ====================

@app.post("/api/generate-feedback")
async def api_generate_feedback(request: GenerateFeedbackRequest):
    """Generate comprehensive interview feedback"""
    try:
        result = generate_feedback(
            all_answers=request.allAnswers,
            code_scores=request.codeScores,
            voice_transcripts=request.voiceTranscripts,
            role=request.role
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TEXT TO SPEECH ====================

@app.post("/api/text-to-speech")
async def api_text_to_speech(request: TextToSpeechRequest):
    """Convert text to speech using ElevenLabs"""
    try:
        audio_bytes = elevenlabs_service.text_to_speech(
            text=request.text,
            voice_id=request.voice_id
        )
        return StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=audio.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SPEECH TO TEXT ====================

@app.post("/api/speech-to-text")
async def api_speech_to_text(audio: UploadFile = File(...)):
    """Convert speech to text (placeholder - integrate with Whisper or similar)"""
    try:
        # This is a placeholder implementation
        # In production, you would use Whisper API or ElevenLabs STT
        
        # For now, return a mock response
        return {
            "transcript": "Placeholder: Audio received. Implement STT service.",
            "confidence": 0.0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# ==================== STARTUP/SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    print("InterviewLens API Starting...")
    print(f"CORS allowed origins: {config.ALLOWED_ORIGINS}")
    print("API initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    print("InterviewLens API shutting down...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG
    )
