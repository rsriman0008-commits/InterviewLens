import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Interview } from '@/types';

export const firestoreService = {
  // User operations
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  createUserProfile: async (
    uid: string,
    data: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>
  ): Promise<void> => {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...data,
        uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (
    uid: string,
    data: Partial<UserProfile>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Interview operations
  createInterview: async (
    uid: string,
    interview: Omit<Interview, 'id'>
  ): Promise<string> => {
    try {
      const interviewRef = doc(collection(db, 'users', uid, 'interviews'));
      const interviewData = {
        ...interview,
        id: interviewRef.id,
        startTime: Timestamp.now(),
      };
      await setDoc(interviewRef, interviewData);
      return interviewRef.id;
    } catch (error) {
      console.error('Error creating interview:', error);
      throw error;
    }
  },

  updateInterview: async (
    uid: string,
    interviewId: string,
    data: Partial<Interview>
  ): Promise<void> => {
    try {
      const updateData = {
        ...data,
      };

      if (!data.startTime) {
        delete (updateData as any).startTime;
      }

      await updateDoc(
        doc(db, 'users', uid, 'interviews', interviewId),
        updateData
      );
    } catch (error) {
      console.error('Error updating interview:', error);
      throw error;
    }
  },

  getInterview: async (uid: string, interviewId: string): Promise<Interview | null> => {
    try {
      const docRef = doc(db, 'users', uid, 'interviews', interviewId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Interview;
      }
      return null;
    } catch (error) {
      console.error('Error getting interview:', error);
      throw error;
    }
  },

  getRecentInterviews: async (uid: string, count = 5): Promise<Interview[]> => {
    try {
      const interviewsRef = collection(db, 'users', uid, 'interviews');
      const q = query(
        interviewsRef,
        where('status', '==', 'completed'),
        orderBy('startTime', 'desc'),
        limit(count)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: any) => doc.data() as Interview);
    } catch (error) {
      console.error('Error getting recent interviews:', error);
      throw error;
    }
  },

  getAllInterviews: async (uid: string): Promise<Interview[]> => {
    try {
      const interviewsRef = collection(db, 'users', uid, 'interviews');
      const q = query(interviewsRef, orderBy('startTime', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc: any) => doc.data() as Interview);
    } catch (error) {
      console.error('Error getting all interviews:', error);
      throw error;
    }
  },
};
