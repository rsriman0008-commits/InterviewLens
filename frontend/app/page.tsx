'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/home');
      } else {
        router.push('/auth');
      }
    }
  }, [loading, isAuthenticated, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">InterviewLens</h1>
        <p className="text-xl text-white/90 mb-8">AI-Powered Technical Interview Simulator</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    </main>
  );
}
