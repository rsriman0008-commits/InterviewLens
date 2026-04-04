'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { firestoreService } from '@/lib/firestore-service';
import { Interview } from '@/types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, logout, isAuthenticated } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    college: '',
    branch: '',
    yearOfStudy: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load data
  useEffect(() => {
    if (user && profile) {
      setFormData({
        fullName: profile.fullName,
        college: profile.college,
        branch: profile.branch,
        yearOfStudy: profile.yearOfStudy?.toString() || '',
      });
      loadInterviews();
    }
  }, [user, profile]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      if (user) {
        const data = await firestoreService.getAllInterviews(user.uid);
        setInterviews(data);
      }
    } catch (error) {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (user) {
        await firestoreService.updateUserProfile(user.uid, formData);
        toast.success('Profile updated successfully');
        setEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // Analytics data
  const scoreData = interviews
    .filter((i) => i.status === 'completed')
    .map((i) => ({
      date: new Date(i.startTime as any).toLocaleDateString(),
      score: i.totalScore,
      role: i.role.substring(0, 3),
    }))
    .slice(0, 10);

  const roleData = interviews
    .filter((i) => i.status === 'completed')
    .reduce(
      (acc, interview) => {
        const existing = acc.find((item) => item.name === interview.role);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: interview.role, value: 1 });
        }
        return acc;
      },
      [] as Array<{ name: string; value: number }>
    );

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const stats = {
    totalInterviews: interviews.filter((i) => i.status === 'completed').length,
    averageScore:
      interviews.length > 0
        ? Math.round(
            interviews.reduce((sum, i) => sum + i.totalScore, 0) / interviews.length
          )
        : 0,
    bestScore: interviews.length > 0 ? Math.max(...interviews.map((i) => i.totalScore)) : 0,
    bestRole:
      interviews.length > 0
        ? interviews.reduce((best, current) =>
            current.totalScore > best.totalScore ? current : best
          ).role
        : 'N/A',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/home"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{profile?.fullName}</h2>
                <p className="text-gray-600 text-sm">{profile?.email}</p>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Total Interviews</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.totalInterviews}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Average Score</p>
              <p className="text-3xl font-bold text-purple-600">{stats.averageScore}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Best Score</p>
              <p className="text-3xl font-bold text-green-600">{stats.bestScore}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600 text-sm mb-2">Best Role</p>
              <p className="text-lg font-bold text-orange-600 capitalize">{stats.bestRole}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Profile</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveProfile();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College
                </label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) =>
                    setFormData({ ...formData, college: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Study
                  </label>
                  <select
                    value={formData.yearOfStudy}
                    onChange={(e) =>
                      setFormData({ ...formData, yearOfStudy: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option>Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                <Save size={18} />
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* Analytics */}
        {scoreData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Score Trend */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Score Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Role Distribution */}
            {roleData.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Role Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Interview History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">📋 Interview History</h3>
          {interviews.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No interviews yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">#</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Score</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview, index) => (
                    <tr key={interview.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize">{interview.role}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(interview.startTime as any).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {interview.duration || 0} min
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full font-semibold bg-indigo-100 text-indigo-800">
                          {interview.totalScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full capitalize font-semibold ${
                            interview.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {interview.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/scorecard/${interview.id}`}
                          className="text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
