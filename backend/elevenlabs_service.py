import requests
from config import config
from io import BytesIO
from logger import app_logger

class ElevenLabsService:
    """ElevenLabs API service for text-to-speech and speech-to-text"""
    
    BASE_URL = "https://api.elevenlabs.io/v1"
    
    def __init__(self):
        self.api_key = config.ELEVENLABS_API_KEY
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    def text_to_speech(self, text: str, voice_id: str = "pNInz6obpgDQGcFmaJgB") -> bytes:
        """Convert text to speech using ElevenLabs
        
        Args:
            text: The text to convert to speech
            voice_id: The voice ID to use (default is a professional voice)
        
        Returns:
            Audio bytes in MP3 format
        """
        try:
            url = f"{self.BASE_URL}/text-to-speech/{voice_id}"
            
            payload = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }
            
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            return response.content
        except Exception as e:
            app_logger.error(f"Error in text_to_speech: {e}")
            raise
    
    def get_voices(self) -> list:
        """Get list of available voices"""
        try:
            url = f"{self.BASE_URL}/voices"
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json().get("voices", [])
        except Exception as e:
            app_logger.error(f"Error getting voices: {e}")
            return []

elevenlabs_service = ElevenLabsService()
