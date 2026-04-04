'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { firestoreService } from '@/lib/firestore-service';
import { Interview } from '@/types';
import { Play, TrendingUp, LogOut } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading, logout, isAuthenticated } = useAuth();
  const [recentInterviews, setRecentInterviews] = useState<Interview[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [loading, isAuthenticated, router]);

  // Load interviews from Firestore
  useEffect(() => {
    if (user) {
      loadInterviews();
    }
  }, [user]);

  const loadInterviews = async () => {
    if (!user) return;
    try {
      setLoadingInterviews(true);
      const interviews = await firestoreService.getRecentInterviews(user.uid, 5);
      setRecentInterviews(interviews);
      const avg =
        interviews.length === 0
          ? 0
          : Math.round(
              interviews.reduce((sum, i) => sum + (i.totalScore ?? 0), 0) / interviews.length
            );
      setAverageScore(avg);
    } catch (error) {
      console.error('Error loading interviews:', error);
      // If Firestore index not ready or no data, just show empty
      setRecentInterviews([]);
      setAverageScore(0);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/auth');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect happening)
  if (!isAuthenticated) {
    return null;
  }

  const displayName = profile?.fullName || user?.displayName || user?.email || 'User';
  const displayEmail = profile?.email || user?.email || '';
  const displayCollege = profile?.college || 'Not set';
  const displayBranch = profile?.branch || 'Not set';
  const displayYear = profile?.yearOfStudy || 'Not set';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-2 text-white font-bold">
              IL
            </div>
            <h1 className="text-2xl font-bold text-gray-900">InterviewLens</h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium hidden sm:inline">{displayName}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
              title="Logout"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                <p className="text-gray-600 text-sm">{displayEmail}</p>
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-6">
                <div>
                  <p className="text-gray-600 text-sm">College</p>
                  <p className="text-gray-900 font-medium">{displayCollege}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Branch</p>
                  <p className="text-gray-900 font-medium">{displayBranch}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Year of Study</p>
                  <p className="text-gray-900 font-medium">{displayYear}</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                <p className="text-gray-600 text-sm mb-2">Average Score</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-indigo-600">{averageScore}</span>
                  <span className="text-gray-600">/100</span>
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Total Interviews: {recentInterviews.length}
                </p>
              </div>

              <Link
                href="/profile"
                className="block w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-center"
              >
                View Full Profile
              </Link>
            </div>
          </div>

          {/* Center Panel - Start Interview */}
          <div className="lg:col-span-1 flex flex-col justify-center">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white text-center">
              <div className="mb-6">
                <Play size={48} className="mx-auto mb-4 fill-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Ready to Practice?</h2>
              <p className="text-white/90 mb-8">
                Start a new technical interview with your AI interviewer
              </p>
              <Link
                href="/interview/select-role"
                className="inline-block w-full px-8 py-3 bg-white text-indigo-600 rounded-lg font-bold hover:bg-gray-50 transition"
              >
                Start Interview
              </Link>
            </div>
          </div>

          {/* Right Panel - Recent Interviews */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={24} className="text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Recent Interviews</h3>
              </div>

              {loadingInterviews ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
              ) : recentInterviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No interviews yet.</p>
                  <p className="text-gray-500 text-sm">Start one to get feedback!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInterviews.map((interview) => (
                    <Link
                      key={interview.id}
                      href={`/scorecard/${interview.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {interview.role}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBadgeColor(
                            interview.totalScore
                          )}`}
                        >
                          {interview.totalScore}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {interview.startTime ? new Date(interview.startTime as any).toLocaleDateString() : 'N/A'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
