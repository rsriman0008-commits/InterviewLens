'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/interview-store';
import { INTERVIEW_ROLES } from '@/lib/constants';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SelectRolePage() {
  const router = useRouter();
  const { setSelectedRole } = useInterviewStore();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
  };

  const handleBeginInterview = () => {
    if (selectedRoleId) {
      const role = INTERVIEW_ROLES.find((r) => r.id === selectedRoleId);
      if (role) {
        setSelectedRole(role.name);
        router.push('/interview/session');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
            <h1 className="text-2xl font-bold text-gray-900">Select Interview Role</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {INTERVIEW_ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role.id)}
              className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                selectedRoleId === role.id
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg ring-2 ring-offset-2 ring-indigo-600'
                  : 'bg-white text-gray-900 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="text-4xl mb-4">{role.icon}</div>
              <h3 className="text-lg font-bold mb-2">{role.name}</h3>
              <p
                className={`text-sm mb-4 ${
                  selectedRoleId === role.id
                    ? 'text-white/90'
                    : 'text-gray-600'
                }`}
              >
                {role.description}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    selectedRoleId === role.id
                      ? 'bg-white/20'
                      : role.difficulty === 'beginner'
                      ? 'bg-green-100 text-green-800'
                      : role.difficulty === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {role.difficulty.charAt(0).toUpperCase() + role.difficulty.slice(1)}
                </span>
                {selectedRoleId === role.id && (
                  <CheckCircle size={20} className="text-white" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Begin Interview Button */}
        <div className="flex justify-center">
          <button
            onClick={handleBeginInterview}
            disabled={!selectedRoleId}
            className={`px-12 py-4 rounded-lg font-bold text-lg transition-all ${
              selectedRoleId
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg disabled:opacity-50'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {selectedRoleId ? 'Begin Interview' : 'Select a Role to Continue'}
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
          <h3 className="font-bold text-blue-900 mb-2">💡 Interview Tips</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Speak clearly - your voice will be transcribed</li>
            <li>• Take your time to think through problems</li>
            <li>• Explain your thought process as you code</li>
            <li>• You'll get detailed feedback after the interview</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
