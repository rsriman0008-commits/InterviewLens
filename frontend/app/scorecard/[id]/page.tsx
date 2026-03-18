'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Interview } from '@/types';
import { Download, Home, RefreshCw, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface ExpandedSections {
  [key: string]: boolean;
}

export default function ScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({});

  const interviewId = params.id as string;

  useEffect(() => {
    if (interviewId) loadInterview();
  }, [interviewId]);

  const loadInterview = async () => {
    try {
      setLoading(true);
      const raw =
        localStorage.getItem(`interviewlens:interview:${interviewId}`) || localStorage.getItem('interviewlens:lastInterview');
      if (!raw) {
        toast.error('Interview not found');
        router.push('/home');
        return;
      }

      const parsed = JSON.parse(raw) as Interview;
      if (parsed?.id !== interviewId) {
        toast.error('Interview not found');
        router.push('/home');
        return;
      }

      setInterview(parsed);
    } catch (error) {
      toast.error('Failed to load interview');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!interview) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Title
    doc.setFontSize(20);
    doc.text('Interview Scorecard', 10, yPosition);
    yPosition += 15;

    // Basic Info
    doc.setFontSize(12);
    doc.text(`Role: ${interview.role}`, 10, yPosition);
    yPosition += 8;
    doc.text(
      `Date: ${new Date(interview.startTime as any).toLocaleDateString()}`,
      10,
      yPosition
    );
    yPosition += 8;
    doc.text(`Duration: ${interview.duration || 0} minutes`, 10, yPosition);
    yPosition += 15;

    // Scores
    doc.setFontSize(14);
    doc.text('Score Breakdown', 10, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    const scores = [
      `Communication Score: ${interview.communicationScore}/25`,
      `Problem Solving Score: ${interview.problemSolvingScore}/25`,
      `Code Quality Score: ${interview.codeQualityScore}/25`,
      `Technical Knowledge: ${interview.technicalKnowledgeScore}/25`,
    ];

    scores.forEach((score) => {
      doc.text(score, 10, yPosition);
      yPosition += 8;
    });

    yPosition += 5;
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text(`Total Score: ${interview.totalScore}/100`, 10, yPosition);
    doc.setTextColor(0, 0, 0);

    doc.save(`scorecard-${interview.role}-${interviewId}.pdf`);
    toast.success('Scorecard downloaded');
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Interview not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Interview Scorecard</h1>
          <p className="text-white/90">{interview.role}</p>
          <p className="text-white/80 text-sm mt-2">
            {new Date(interview.startTime as any).toLocaleDateString()} •{' '}
            {interview.duration || 0} minutes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Total Score Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
          <p className="text-gray-600 text-lg mb-2">Your Score</p>
          <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text mb-2">
            {interview.totalScore}
          </div>
          <p className="text-gray-600">out of 100</p>

          {interview.totalScore >= 70 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">🎉 Excellent Performance!</p>
            </div>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            ['Communication', interview.communicationScore, 25],
            ['Problem Solving', interview.problemSolvingScore, 25],
            ['Code Quality', interview.codeQualityScore, 25],
            ['Technical Knowledge', interview.technicalKnowledgeScore, 25],
          ].map(([label, score, max]) => (
            <div key={label} className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600 text-sm mb-3">{label}</p>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-indigo-600">{score}</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
                      style={{ width: `${((score as number) / (max as number)) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">out of {max}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Sections */}
        <div className="space-y-4 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <button
              onClick={() => toggleSection('strengths')}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <h3 className="text-lg font-bold text-gray-900">✅ Strengths</h3>
              <ChevronDown
                size={24}
                className={`text-gray-600 transition-transform ${
                  expandedSections['strengths'] ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections['strengths'] && (
              <div className="px-6 pb-6 border-t border-gray-200">
                <ul className="space-y-2">
                  {interview.feedback.strengths.map((strength, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <button
              onClick={() => toggleSection('improvements')}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <h3 className="text-lg font-bold text-gray-900">📈 Areas to Improve</h3>
              <ChevronDown
                size={24}
                className={`text-gray-600 transition-transform ${
                  expandedSections['improvements'] ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections['improvements'] && (
              <div className="px-6 pb-6 border-t border-gray-200">
                <ul className="space-y-2">
                  {interview.feedback.improvements.map((improvement, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-orange-600 font-bold mt-1">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Overall Feedback */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">💬 Overall Feedback</h3>
            <p className="text-gray-700">{interview.feedback.overallFeedback}</p>
          </div>
        </div>

        {/* Questions Summary */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Questions Summary</h3>
          <div className="space-y-4">
            {interview.questions.map((q, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">
                  Q{i + 1}: {q.question.substring(0, 100)}...
                </p>
                {q.codeScore && (
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>✓ Correctness: {q.codeScore.correctness}/10</p>
                    <p>⏱ Time Complexity: {q.codeScore.timeComplexity}</p>
                    <p>💾 Space Complexity: {q.codeScore.spaceComplexity}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            <Download size={20} />
            Download PDF
          </button>
          <button
            onClick={() => router.push('/interview/select-role')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            <RefreshCw size={20} />
            Start New Interview
          </button>
          <button
            onClick={() => router.push('/home')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            <Home size={20} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
