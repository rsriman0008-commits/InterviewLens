import time
import uuid

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from config import config
from gemini_service import generate_question, evaluate_code, generate_feedback, run_code
from elevenlabs_service import elevenlabs_service
from stt_service import stt_service
from rate_limiter import limiter, setup_rate_limiting, RATE_LIMITS
from logger import (
    app_logger,
    log_request,
    log_response,
    log_error,
    request_id_ctx,
    generate_request_id,
)
from slowapi import _rate_limit_exceeded_handler

# ==================== CREATE APP ====================

app = FastAPI(
    title="InterviewLens API",
    description="AI-powered technical interview simulator backend",
    version="2.0.0",
)

# ==================== CORS ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== RATE LIMITING ====================

setup_rate_limiting(app)

# ==================== REQUEST LOGGING MIDDLEWARE ====================

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Attach a unique request ID and log every request / response."""
    rid = request.headers.get("X-Request-ID") or generate_request_id()
    token = request_id_ctx.set(rid)

    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not client_ip:
        client_ip = request.client.host if request.client else "unknown"

    log_request(
        method=request.method,
        endpoint=request.url.path,
        client_ip=client_ip,
    )

    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        latency_ms = (time.perf_counter() - start) * 1000
        log_error(
            f"Unhandled exception on {request.method} {request.url.path}",
            error=exc,
            endpoint=request.url.path,
            latency_ms=latency_ms,
            client_ip=client_ip,
        )
        request_id_ctx.reset(token)
        raise

    latency_ms = (time.perf_counter() - start) * 1000
    log_response(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        latency_ms=latency_ms,
        client_ip=client_ip,
    )

    # Attach request ID to response for client-side tracing
    response.headers["X-Request-ID"] = rid
    request_id_ctx.reset(token)
    return response

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
@limiter.limit(RATE_LIMITS.get("/api/health", "60/minute"))
async def health_check(request: Request):
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "InterviewLens API is running",
        "version": "2.0.0",
        "features": {
            "rate_limiting": True,
            "structured_logging": True,
            "speech_to_text": stt_service._initialized,
        },
    }

# ==================== QUESTION GENERATION ====================

@app.post("/api/generate-question")
@limiter.limit(RATE_LIMITS.get("/api/generate-question", "12/minute"))
async def api_generate_question(request: Request, body: GenerateQuestionRequest):
    """Generate interview question using Gemini"""
    try:
        result = generate_question(
            role=body.role,
            phase=body.phase,
            question_number=body.questionNumber,
            user_profile=body.userProfile,
        )
        return result
    except Exception as e:
        log_error("Question generation failed", error=e, endpoint="/api/generate-question")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CODE EVALUATION ====================

@app.post("/api/evaluate-code")
@limiter.limit(RATE_LIMITS.get("/api/evaluate-code", "10/minute"))
async def api_evaluate_code(request: Request, body: CodeEvaluationRequest):
    """Evaluate submitted code using Gemini"""
    try:
        result = evaluate_code(
            code=body.code,
            question=body.question,
            language=body.language,
            role=body.role,
        )
        return result
    except Exception as e:
        log_error("Code evaluation failed", error=e, endpoint="/api/evaluate-code")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CODE EXECUTION ====================

@app.post("/api/run-code")
@limiter.limit(RATE_LIMITS.get("/api/run-code", "15/minute"))
async def api_run_code(request: Request, body: RunCodeRequest):
    """Analyze and predict code execution output using Gemini"""
    try:
        result = run_code(
            code=body.code,
            language=body.language,
            question=body.question,
        )
        return result
    except Exception as e:
        log_error("Code execution failed", error=e, endpoint="/api/run-code")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== FEEDBACK GENERATION ====================

@app.post("/api/generate-feedback")
@limiter.limit(RATE_LIMITS.get("/api/generate-feedback", "6/minute"))
async def api_generate_feedback(request: Request, body: GenerateFeedbackRequest):
    """Generate comprehensive interview feedback"""
    try:
        result = generate_feedback(
            all_answers=body.allAnswers,
            code_scores=body.codeScores,
            voice_transcripts=body.voiceTranscripts,
            role=body.role,
        )
        return result
    except Exception as e:
        log_error("Feedback generation failed", error=e, endpoint="/api/generate-feedback")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TEXT TO SPEECH ====================

@app.post("/api/text-to-speech")
@limiter.limit(RATE_LIMITS.get("/api/text-to-speech", "20/minute"))
def api_text_to_speech(request: Request, body: TextToSpeechRequest):
    """Convert text to speech using ElevenLabs"""
    try:
        audio_bytes = elevenlabs_service.text_to_speech(
            text=body.text,
            voice_id=body.voice_id,
        )
        return StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=audio.mp3"},
        )
    except Exception as e:
        log_error("Text-to-speech failed", error=e, endpoint="/api/text-to-speech")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SPEECH TO TEXT ====================

@app.post("/api/speech-to-text")
@limiter.limit(RATE_LIMITS.get("/api/speech-to-text", "20/minute"))
async def api_speech_to_text(request: Request, audio: UploadFile = File(...)):
    """
    Convert speech to text using Gemini multimodal.

    Accepts audio files (webm, wav, mp3, ogg, m4a, flac).
    Returns transcript with confidence score.
    """
    try:
        # Read the uploaded audio
        audio_data = await audio.read()

        if not audio_data or len(audio_data) < 100:
            raise HTTPException(
                status_code=400,
                detail="Audio file is empty or too small.",
            )

        app_logger.info(
            f"STT request: filename={audio.filename}, "
            f"content_type={audio.content_type}, "
            f"size={len(audio_data)} bytes",
            extra={"endpoint": "/api/speech-to-text"},
        )

        # Transcribe using the STT service
        result = await stt_service.transcribe(
            audio_data=audio_data,
            filename=audio.filename or "audio.webm",
            content_type=audio.content_type,
        )

        if result.get("error"):
            app_logger.warning(
                f"STT returned with error: {result['error']}",
                extra={"endpoint": "/api/speech-to-text"},
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        log_error("Speech-to-text failed", error=e, endpoint="/api/speech-to-text")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    log_error(
        f"HTTP {exc.status_code}: {exc.detail}",
        endpoint=request.url.path,
        status_code=exc.status_code,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
            "request_id": request_id_ctx.get("no-request"),
        },
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    log_error(
        "Unhandled server error",
        error=exc,
        endpoint=request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "status_code": 500,
            "request_id": request_id_ctx.get("no-request"),
        },
    )

# ==================== STARTUP / SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    app_logger.info("InterviewLens API Starting...", extra={
        "cors_origins": config.ALLOWED_ORIGINS,
        "features": ["rate_limiting", "structured_logging", "gemini_stt"],
    })

@app.on_event("shutdown")
async def shutdown_event():
    app_logger.info("🛑 InterviewLens API shutting down...")

# ==================== ENTRYPOINT ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
    )
