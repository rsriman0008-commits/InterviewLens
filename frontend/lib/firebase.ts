import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase only if it hasn't been initialized already (helps with Next.js HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize services immediately (Firebase SDK handles lazy execution internally)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
