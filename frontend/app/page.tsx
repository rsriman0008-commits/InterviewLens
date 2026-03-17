'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/home');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gradient mb-4">InterviewLens</h1>
        <p className="text-xl text-gray-600 mb-8">AI-Powered Technical Interview Simulator</p>
        <p className="text-gray-500 mb-8">Loading your interview dashboard...</p>
      </div>
    </main>
  );
}
