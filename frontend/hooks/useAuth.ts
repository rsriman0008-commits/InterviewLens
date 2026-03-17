'use client';

import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { firestoreService } from '@/lib/firestore-service';
import { UserProfile } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const userProfile = await firestoreService.getUserProfile(firebaseUser.uid);
          setProfile(userProfile);

          // Store token for API calls
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('firebaseToken', token);
        } else {
          setProfile(null);
          localStorage.removeItem('firebaseToken');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (
    email: string,
    password: string,
    userData: {
      fullName: string;
      college: string;
      branch: string;
      yearOfStudy: number | string;
    }
  ) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Create user profile in Firestore
      await firestoreService.createUserProfile(newUser.uid, {
        email,
        ...userData,
      });

      const userProfile = await firestoreService.getUserProfile(newUser.uid);
      setProfile(userProfile);

      return newUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const newUser = userCredential.user;

      // Check if user exists
      const existingProfile = await firestoreService.getUserProfile(newUser.uid);
      if (!existingProfile) {
        // Create new user profile on first Google sign-in
        await firestoreService.createUserProfile(newUser.uid, {
          email: newUser.email || '',
          fullName: newUser.displayName || '',
          college: '',
          branch: '',
          yearOfStudy: '',
        });
      }

      return newUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign in failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('firebaseToken');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logout,
    isAuthenticated: !!user,
  };
};
