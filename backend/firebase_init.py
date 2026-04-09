import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, auth
from config import config
from logger import app_logger

# Initialize Firebase Admin SDK
def init_firebase():
    """Initialize Firebase connection"""
    try:
        if not firebase_admin._apps:
            cred = None
            
            # Priority 1: Try environment variable with JSON credentials
            firebase_credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON", "")
            if firebase_credentials_json:
                try:
                    cred_dict = json.loads(firebase_credentials_json)
                    cred = credentials.Certificate(cred_dict)
                    app_logger.info("✓ Firebase initialized from FIREBASE_CREDENTIALS_JSON")
                except Exception as e:
                    app_logger.error(f"Error parsing FIREBASE_CREDENTIALS_JSON: {e}")
            
            # Priority 2: Try credentials file path
            if not cred and os.path.exists(config.FIREBASE_CREDENTIALS):
                try:
                    cred = credentials.Certificate(config.FIREBASE_CREDENTIALS)
                    app_logger.info("✓ Firebase initialized from file path")
                except Exception as e:
                    app_logger.error(f"Error reading credentials file: {e}")
            
            # Priority 3: Try FIREBASE_CREDENTIALS env var (backward compatibility)
            if not cred:
                try:
                    cred_dict = json.loads(os.getenv("FIREBASE_CREDENTIALS", "{}"))
                    if cred_dict:
                        cred = credentials.Certificate(cred_dict)
                        app_logger.info("✓ Firebase initialized from FIREBASE_CREDENTIALS")
                except Exception as e:
                    app_logger.error(f"Error parsing FIREBASE_CREDENTIALS: {e}")
            
            if cred:
                firebase_admin.initialize_app(cred)
                app_logger.info("Firebase Admin SDK initialized successfully")
            else:
                app_logger.warning("No Firebase credentials found. Some features may not work.")
    except Exception as e:
        app_logger.error(f"Firebase initialization error: {e}")
        raise

def get_db():
    """Get Firestore database instance"""
    try:
        return firestore.client()
    except Exception as e:
        app_logger.error(f"Error getting Firestore client: {e}")
        return None

# Initialize on module load
init_firebase()

