"""
Speech-to-Text (STT) Service for InterviewLens API.

Uses Google Gemini's multimodal capabilities to transcribe audio.
This approach is chosen because:
  1. The project already has a Gemini API key (no extra credentials needed)
  2. Gemini 1.5 Flash handles audio natively (no separate STT service billing)
  3. It provides contextual understanding (useful for technical interview jargon)

Supports: webm, wav, mp3, ogg, m4a, flac
Falls back to a basic transcription prompt if advanced features fail.
"""

import google.generativeai as genai
from config import config
from logger import app_logger, log_error
import io
import json
import re
import base64
import tempfile
import os
from typing import Optional

# ──────────────────────────────────────────────
# Audio format mapping
# ──────────────────────────────────────────────
MIME_TYPE_MAP = {
    "webm": "audio/webm",
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "mpeg": "audio/mpeg",
    "ogg": "audio/ogg",
    "m4a": "audio/mp4",
    "mp4": "audio/mp4",
    "flac": "audio/flac",
    "aac": "audio/aac",
}

# Max audio file size: 10 MB
MAX_AUDIO_SIZE = 10 * 1024 * 1024

# Supported content types for upload
SUPPORTED_CONTENT_TYPES = set(MIME_TYPE_MAP.values())


class STTService:
    """Speech-to-Text service powered by Google Gemini multimodal."""

    def __init__(self):
        self.model_name = "gemini-1.5-flash"
        self._initialized = False
        self._init()

    def _init(self):
        """Initialize the service (Gemini should already be configured)."""
        if config.GEMINI_API_KEY:
            try:
                genai.configure(api_key=config.GEMINI_API_KEY)
                self._initialized = True
                app_logger.info("✓ STT Service initialized (Gemini multimodal)")
            except Exception as e:
                log_error("Failed to initialize STT service", error=e)
        else:
            app_logger.warning("⚠ STT Service: No Gemini API key – transcription unavailable")

    def _detect_mime_type(self, filename: str, content_type: Optional[str] = None) -> str:
        """Detect MIME type from filename extension or content type header."""
        if content_type and content_type in SUPPORTED_CONTENT_TYPES:
            return content_type

        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        mime = MIME_TYPE_MAP.get(ext)

        if mime:
            return mime

        # Default to webm (most common from browser MediaRecorder)
        app_logger.warning(
            f"Unknown audio format: ext={ext}, content_type={content_type}. Defaulting to audio/webm"
        )
        return "audio/webm"

    async def transcribe(
        self,
        audio_data: bytes,
        filename: str = "audio.webm",
        content_type: Optional[str] = None,
        language: str = "en",
    ) -> dict:
        """
        Transcribe audio data to text using Gemini.

        Args:
            audio_data: Raw audio bytes
            filename: Original filename (used for MIME detection)
            content_type: MIME type from upload header
            language: Expected language code (default: en)

        Returns:
            {
                "transcript": str,
                "confidence": float (0.0 - 1.0),
                "language": str,
                "duration_estimate": str,
                "word_count": int,
            }
        """
        if not self._initialized:
            app_logger.error("STT Service not initialized – cannot transcribe")
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": language,
                "error": "STT service not initialized. Check Gemini API key.",
            }

        # Validate file size
        if len(audio_data) > MAX_AUDIO_SIZE:
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": language,
                "error": f"Audio file too large ({len(audio_data)} bytes). Max: {MAX_AUDIO_SIZE} bytes.",
            }

        if len(audio_data) < 100:
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": language,
                "error": "Audio file too small or empty.",
            }

        mime_type = self._detect_mime_type(filename, content_type)

        try:
            model = genai.GenerativeModel(self.model_name)

            # Write audio to a temp file for Gemini upload
            suffix = filename.rsplit(".", 1)[-1] if "." in filename else "webm"
            with tempfile.NamedTemporaryFile(
                suffix=f".{suffix}", delete=False
            ) as tmp_file:
                tmp_file.write(audio_data)
                tmp_path = tmp_file.name

            try:
                # Upload the audio file to Gemini
                audio_file = genai.upload_file(tmp_path, mime_type=mime_type)

                prompt = f"""You are a precise speech-to-text transcription engine.
Transcribe the audio exactly as spoken. The speaker is in a technical coding interview,
so expect programming terms, algorithm names, data structure names, and technical jargon.

Language: {language}

Rules:
1. Transcribe EXACTLY what is said – do not paraphrase or summarize.
2. Preserve filler words (um, uh, like) as they appear.
3. Use proper capitalization and punctuation.
4. If a word is unclear, use your best guess based on the technical interview context.
5. If the audio is completely silent or unintelligible, return an empty transcript.

Return a JSON object:
{{"transcript": "the transcribed text", "confidence": 0.95, "language": "{language}"}}

Return ONLY the JSON, no markdown fences, no explanation."""

                response = model.generate_content([prompt, audio_file])

                # Clean up uploaded file
                try:
                    genai.delete_file(audio_file.name)
                except Exception:
                    pass  # Non-critical cleanup

                # Parse response
                result = self._parse_response(response.text, language)

                app_logger.info(
                    f"✓ STT transcription complete: {result.get('word_count', 0)} words, "
                    f"confidence={result.get('confidence', 0):.2f}",
                    extra={
                        "endpoint": "/api/speech-to-text",
                        "extra_data": {
                            "word_count": result.get("word_count", 0),
                            "confidence": result.get("confidence", 0),
                            "audio_size_bytes": len(audio_data),
                            "mime_type": mime_type,
                        },
                    },
                )

                return result

            finally:
                # Clean up temp file
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

        except Exception as e:
            log_error(
                "STT transcription failed",
                error=e,
                endpoint="/api/speech-to-text",
                extra_data={"audio_size": len(audio_data), "mime_type": mime_type},
            )

            # Attempt inline fallback (base64 encoding)
            return await self._fallback_transcribe(audio_data, mime_type, language)

    async def _fallback_transcribe(
        self, audio_data: bytes, mime_type: str, language: str
    ) -> dict:
        """Fallback transcription using inline base64 audio."""
        try:
            model = genai.GenerativeModel(self.model_name)
            audio_b64 = base64.b64encode(audio_data).decode("utf-8")

            response = model.generate_content([
                {
                    "mime_type": mime_type,
                    "data": audio_b64,
                },
                "Transcribe this audio exactly as spoken. The speaker is in a technical "
                "coding interview. Return ONLY a JSON object: "
                '{"transcript": "...", "confidence": 0.8, "language": "' + language + '"}',
            ])

            return self._parse_response(response.text, language)

        except Exception as e:
            log_error("STT fallback transcription also failed", error=e)
            return {
                "transcript": "",
                "confidence": 0.0,
                "language": language,
                "error": f"Transcription failed: {str(e)}",
            }

    def _parse_response(self, text: str, default_language: str = "en") -> dict:
        """Parse Gemini response into structured transcription result."""
        text = text.strip()

        # Strip markdown fences
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?", "", text)
            text = re.sub(r"```$", "", text).strip()

        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON in the response
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group(0))
                except json.JSONDecodeError:
                    result = {"transcript": text, "confidence": 0.5}
            else:
                result = {"transcript": text, "confidence": 0.5}

        transcript = result.get("transcript", "").strip()
        confidence = float(result.get("confidence", 0.7))
        language = result.get("language", default_language)

        return {
            "transcript": transcript,
            "confidence": min(1.0, max(0.0, confidence)),
            "language": language,
            "word_count": len(transcript.split()) if transcript else 0,
        }


# Singleton instance
stt_service = STTService()
