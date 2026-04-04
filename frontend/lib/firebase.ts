import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Build-safe dummy config for SSR/prerendering (Next.js builds pages at build time)
const dummyConfig = {
  apiKey: 'dummy-key-for-build',
  authDomain: 'dummy.firebaseapp.com',
  projectId: 'dummy',
  storageBucket: 'dummy.appspot.com',
  messagingSenderId: '000000000',
  appId: '1:000000000:web:000000',
};

// Determine if we have real Firebase config
const hasRealConfig = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== '' &&
  !firebaseConfig.apiKey.includes('dummy')
);

// Use real config if available, otherwise use dummy for build
const activeConfig = hasRealConfig ? firebaseConfig : dummyConfig;

// Initialize Firebase App (singleton)
let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApp();
} else {
  app = initializeApp(activeConfig);
}

// Lazy-initialize Firebase services only on the client side
let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(app);
  }
  return _auth;
}

function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(app);
  }
  return _db;
}

function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(app);
  }
  return _storage;
}

// Export getters that lazily initialize - safe for SSR
// These will only actually connect when called from client-side code
export const auth = typeof window !== 'undefined' ? getFirebaseAuth() : (undefined as unknown as Auth);
export const db = typeof window !== 'undefined' ? getFirebaseDb() : (undefined as unknown as Firestore);
export const storage = typeof window !== 'undefined' ? getFirebaseStorage() : (undefined as unknown as FirebaseStorage);

export default app;
