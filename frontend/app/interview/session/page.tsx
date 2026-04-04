'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useInterviewStore } from '@/store/interview-store';
import { useAuth } from '@/hooks/useAuth';
import { apiService } from '@/lib/api-service';
import { voiceService } from '@/lib/voice-service';
import { firestoreService } from '@/lib/firestore-service';
import { Interview, CodeQuestion } from '@/types';
import { AIAgentPanel, TranscriptItem } from '@/components/interview/AIAgentPanel';
import { InterviewBottomBar } from '@/components/interview/InterviewBottomBar';
import toast from 'react-hot-toast';

type InterviewPhase = 'icebreaker' | 'introduction' | 'coding' | 'wrapup';

const ICEBREAKER_QUESTIONS = 2;
const CODING_QUESTIONS = 3;

const LazyCodeEditor = dynamic(
  () => import('@/components/interview/CodeEditor').then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl shadow-md p-8 flex items-center justify-center h-full">
        <div className="text-gray-600">Loading editor...</div>
      </div>
    ),
  }
);

export default function InterviewSessionPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, isAuthenticated } = useAuth();
  const userId = user?.uid || 'anonymous';
  const {
    selectedRole,
    currentPhase,
    setCurrentPhase,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    addQuestion,
    updateQuestion,
    setAiIsSpeaking,
    setIsRecording,
    isRecording,
    aiIsSpeaking,
  } = useInterviewStore();

  // State
  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CodeQuestion | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [completedInterviewId, setCompletedInterviewId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interviewRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  const isLoadingQuestionRef = useRef(false);
  const lastFollowUpRef = useRef<string>('');
  const hasInitializedRef = useRef(false);

  const addTranscript = (item: TranscriptItem) => {
    setTranscript((prev) => [...prev, item]);
  };

  const sayAsAi = async (text: string) => {
    addTranscript({ speaker: 'ai', text });
    setAiIsSpeaking(true);
    try {
      const audioBlob = await apiService.textToSpeech(text);
      await voiceService.playAudio(audioBlob);
    } catch {
      try {
        await voiceService.speakText(text);
      } catch {
        // ignore
      }
    }
    setAiIsSpeaking(false);
  };

  const addQuestionLocal = (q: CodeQuestion) => {
    setInterview((prev) => (prev ? { ...prev, questions: [...prev.questions, q] } : prev));
  };

  const updateQuestionLocal = (index: number, updates: Partial<CodeQuestion>) => {
    setInterview((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q, i) => (i === index ? { ...q, ...updates } : q)),
          }
        : prev
    );
  };

  const makeFollowUp = (answer: string) => {
    const a = answer.trim();
    if (!a) return 'Can you tell me a bit more?';
    if (currentPhase === 'coding') {
      const options = [
        'Why did you choose this approach, and what are the time and space complexities?',
        'Walk me through a small example input step-by-step.',
        'What edge cases did you consider, and how does your solution handle them?',
      ];
      const next = options.find((q) => q !== lastFollowUpRef.current) || options[0];
      lastFollowUpRef.current = next;
      return next;
    }
    const options =
      a.length < 25
        ? [
            'Can you expand on that with one concrete example?',
            'What is one specific thing you did, and what was the result?',
            'What did you learn from that experience?',
          ]
        : [
            'What was the hardest part, and what would you improve if you did it again?',
            'What trade-offs did you make, and why?',
            'If you had more time, what would you change or optimize?',
          ];
    const next = options.find((q) => q !== lastFollowUpRef.current) || options[0];
    lastFollowUpRef.current = next;
    return next;
  };

  const handleUserAnswer = async (text: string) => {
    addTranscript({ speaker: 'user', text });
    updateQuestionLocal(currentQuestionIndex, { voiceTranscript: text });

    // AI follow-up about the answer
    const followUp = makeFollowUp(text);
    await sayAsAi(followUp);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  // Initialize interview
  useEffect(() => {
    if (!selectedRole) {
      router.push('/home');
      return;
    }

    // React StrictMode in dev can run effects twice; guard to avoid duplicate transcript/questions.
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    initializeInterview();
  }, [selectedRole, router]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Load first question when phase changes
  useEffect(() => {
    if (currentPhase && interviewRef.current) {
      loadQuestion();
    }
  }, [currentPhase, currentQuestionIndex]);

  const initializeInterview = async () => {
    try {
      setLoading(true);
      setTranscript([]);
      setCurrentQuestion(null);
      setCode('');
      setOutput('');
      lastFollowUpRef.current = '';

      const newInterview: Interview = {
        id: `interview-${Date.now()}`,
        userId: userId,
        role: selectedRole || 'Unknown',
        startTime: new Date(),
        duration: 0,
        totalScore: 0,
        communicationScore: 0,
        problemSolvingScore: 0,
        codeQualityScore: 0,
        technicalKnowledgeScore: 0,
        questions: [],
        feedback: {
          totalScore: 0,
          breakdown: {
            communication: 0,
            problemSolving: 0,
            codeQuality: 0,
            technicalKnowledge: 0,
          },
          strengths: [],
          improvements: [],
          overallFeedback: '',
        },
        status: 'ongoing',
      };

      interviewRef.current = newInterview.id;
      setInterview(newInterview);
      setCurrentPhase('icebreaker');

      // Welcome message
      const welcomeText = `Welcome to your ${selectedRole} technical interview! Let's begin with some warm-up questions to get to know you better.`;
      await sayAsAi(welcomeText);

      setLoading(false);
    } catch (error) {
      toast.error('Failed to initialize interview');
      router.push('/home');
    }
  };

  const loadQuestion = async () => {
    if (isLoadingQuestionRef.current) return;
    try {
      isLoadingQuestionRef.current = true;
      setLoading(true);

      const response = await apiService.generateQuestion({
        role: selectedRole || '',
        phase: currentPhase || 'icebreaker',
        questionNumber: currentQuestionIndex + 1,
        userProfile: profile ? {
          fullName: profile.fullName || 'Student',
          college: profile.college || 'University',
          branch: profile.branch || 'CSE',
          yearOfStudy: String(profile.yearOfStudy || '3'),
        } : undefined,
      });

      const newQuestion: CodeQuestion = {
        id: `q-${Date.now()}`,
        questionNumber: currentQuestionIndex + 1,
        phase: currentPhase || 'icebreaker',
        question: response.question || response.introduction || 'Question...',
        hints: response.hints || [],
        expectedTopics: response.expectedTopics || [],
      };

      addQuestionLocal(newQuestion);
      setCurrentQuestion(newQuestion);
      setCode('');
      setOutput('');

      await sayAsAi(newQuestion.question);

      setLoading(false);
    } catch (error) {
      // Frontend fallback so the interview keeps moving even if API/TTS flakes.
      const fallbackText =
        currentPhase === 'introduction'
          ? `Today’s interview is for a ${selectedRole || 'Software Engineer'} role. We'll do a couple of warm-up questions, then 3 coding problems.`
          : currentPhase === 'icebreaker'
          ? `Tell me about yourself and what attracted you to ${selectedRole || 'this role'}.`
          : 'Write a function to return the length of the longest substring without repeating characters.';

      const fallbackQuestion: CodeQuestion = {
        id: `q-${Date.now()}`,
        questionNumber: currentQuestionIndex + 1,
        phase: currentPhase || 'icebreaker',
        question: fallbackText,
        hints: [],
        expectedTopics: [],
      };

      addQuestionLocal(fallbackQuestion);
      setCurrentQuestion(fallbackQuestion);

      await sayAsAi(fallbackQuestion.question);

      // Don't spam the user with errors; fallback is an acceptable path for localhost/demo.
      setLoading(false);
    } finally {
      isLoadingQuestionRef.current = false;
    }
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsListening(false);
    } else {
      setIsRecording(true);
      setIsListening(true);

      try {
        const userSpeech = await voiceService.speechToText(
          () => setIsListening(true),
          () => setIsListening(false),
          (error) => toast.error(`Speech error: ${error}`)
        );

        if (userSpeech) {
          await handleUserAnswer(userSpeech);
        }
      } catch (error) {
        toast.error('Failed to capture speech');
      } finally {
        setIsRecording(false);
        setIsListening(false);
      }
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before running');
      return;
    }
    setLoading(true);
    try {
      const result = await apiService.runCode({
        code,
        language: selectedLanguage,
        question: currentQuestion?.question || '',
      });

      if (result.success) {
        setOutput(`✅ Output:\n${result.output}`);
        toast.success('Code executed successfully');
      } else {
        setOutput(`❌ Error: ${result.error || 'Unknown error'}\n\n${result.output}`);
        toast.error(result.error || 'Code has errors');
      }
    } catch (error) {
      setOutput('❌ Failed to analyze code. Please try again.');
      toast.error('Code execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      // Only require code when actually in the coding phase
      if (currentPhase === 'coding' && !code.trim()) {
        toast.error('Please enter code before submitting');
        return;
      }

      setLoading(true);
      // Evaluate code if in coding phase
      if (currentPhase === 'coding' && code.trim()) {
        let evaluation:
          | {
              correctness?: number;
              timeComplexity?: string;
              spaceComplexity?: string;
              bugs?: string[];
              suggestions?: string[];
              followupQuestions?: string[];
            }
          | undefined;

        try {
          evaluation = await apiService.evaluateCode({
            code,
            question: currentQuestion?.question || '',
            language: selectedLanguage,
            role: selectedRole || '',
          });
        } catch {
          // Local fallback so "Submit Answer" never breaks on localhost
          evaluation = {
            correctness: 0,
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(1)',
            bugs: [],
            suggestions: [
              'Evaluation service was unavailable, so correctness could not be verified.',
              'Add test cases, handle edge cases, and explain time/space complexity.',
            ],
            followupQuestions: [
              'Walk me through your solution step-by-step and analyze the time and space complexity.',
            ],
          };
        }

        const updates: Partial<CodeQuestion> = {
          userCode: code,
          userCodeLanguage: selectedLanguage,
          codeScore: {
            correctness: evaluation?.correctness ?? 0,
            timeComplexity: evaluation?.timeComplexity ?? 'O(n)',
            spaceComplexity: evaluation?.spaceComplexity ?? 'O(1)',
            bugs: evaluation?.bugs ?? [],
            suggestions: evaluation?.suggestions ?? [],
          },
          followUpQuestions: evaluation?.followupQuestions ?? [],
        };

        // Apply updates to in-memory interview immediately (avoid setState timing issues)
        const interviewSnapshot: Interview | null = interview
          ? {
              ...interview,
              questions: interview.questions.map((q, i) => (i === currentQuestionIndex ? { ...q, ...updates } : q)),
            }
          : null;

        updateQuestionLocal(currentQuestionIndex, updates);
        if (interviewSnapshot) setInterview(interviewSnapshot);

        // Ask a follow-up about the submitted solution (and speak it)
        const followUpText =
          evaluation?.followupQuestions?.[0] ||
          evaluation?.suggestions?.[0] ||
          'Explain your approach and analyze the time and space complexity.';
        await sayAsAi(followUpText);

        // After last coding question: interview over -> compute feedback -> show scorecard button
        if (currentQuestionIndex >= CODING_QUESTIONS - 1) {
          setCurrentPhase('wrapup');
          const id = await completeInterview({ interviewOverride: interviewSnapshot ?? undefined, navigate: false });
          setCompletedInterviewId(id);
          await sayAsAi('Interview over. Great job — you can view your scorecard and feedback now.');
          setLoading(false);
          return;
        }

        // Otherwise advance to next coding question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setLoading(false);
        return;
      }

      // Move to next question or phase
      if (currentPhase === 'icebreaker' && currentQuestionIndex < ICEBREAKER_QUESTIONS - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else if (currentPhase === 'icebreaker') {
        setCurrentPhase('introduction');
        setCurrentQuestionIndex(0);
      } else if (currentPhase === 'introduction') {
        setCurrentPhase('coding');
        setCurrentQuestionIndex(0);
      } else {
        // End interview
        const id = await completeInterview({ navigate: false });
        setCompletedInterviewId(id);
        setCurrentPhase('wrapup');
      }

      setLoading(false);
    } catch (error) {
      toast.error('Failed to submit answer');
      setLoading(false);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const completeInterview = async ({
    interviewOverride,
    navigate = true,
  }: {
    interviewOverride?: Interview;
    navigate?: boolean;
  } = {}) => {
    try {
      const transcriptSnapshot = transcript;
      const allAnswers = transcriptSnapshot.filter((t) => t.speaker === 'user').map((t) => t.text);
      const sourceInterview = interviewOverride ?? interview;
      const hasCode = (sourceInterview?.questions || []).some((q) => q.userCode?.trim());
      const communication = Math.min(25, Math.max(8, Math.round(allAnswers.join(' ').length / 40)));
      const problemSolving = hasCode ? 18 : 14;
      const codeQuality = hasCode ? 17 : 10;
      const technicalKnowledge = hasCode ? 16 : 12;
      const totalScore = communication + problemSolving + codeQuality + technicalKnowledge;

      const feedback = {
        totalScore,
        breakdown: { communication, problemSolving, codeQuality, technicalKnowledge },
        strengths: [
          'You stayed engaged and responded consistently.',
          hasCode ? 'You attempted the coding tasks.' : 'You communicated your thoughts.',
          'You moved through phases without blocking.',
        ],
        improvements: [
          'Add more concrete examples and measurable impact.',
          hasCode ? 'Explain complexity and edge cases more explicitly.' : 'Attempt the coding phase for full scoring.',
          'Structure answers: context -> action -> result.',
        ],
        overallFeedback:
          'Good progress. For the next run, focus on clarifying assumptions, walking through examples, and stating complexity.',
        resources: ['Practice: sliding window, hash maps, stacks', 'Behavioral: STAR method', 'Complexity analysis basics'],
      };

      // Update interview with final results
      const duration = Math.floor(elapsedTime / 60);

      if (sourceInterview && interviewRef.current) {
        const completed: Interview = {
          ...sourceInterview,
          endTime: new Date(),
          duration,
          totalScore: feedback.totalScore,
          communicationScore: feedback.breakdown.communication,
          problemSolvingScore: feedback.breakdown.problemSolving,
          codeQualityScore: feedback.breakdown.codeQuality,
          technicalKnowledgeScore: feedback.breakdown.technicalKnowledge,
          feedback,
          status: 'completed',
        };
        setInterview(completed);
        try {
          localStorage.setItem(`interviewlens:interview:${interviewRef.current}`, JSON.stringify(completed));
          localStorage.setItem('interviewlens:lastInterview', JSON.stringify(completed));
          // Also save to Firestore if user is authenticated
          if (user) {
            firestoreService.createInterview(user.uid, completed).catch(console.error);
          }
        } catch {
          // ignore
        }
      }

      // Navigate to scorecard (use a local scorecard since we're not using Firestore here)
      if (navigate) router.push(`/scorecard/${interviewRef.current}`);
      return interviewRef.current;
    } catch (error) {
      toast.error('Failed to complete interview');
      console.error(error);
      return null;
    }
  };

  if (loading && !interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - AI Agent */}
        <AIAgentPanel
          currentQuestion={currentQuestion?.question || ''}
          isPlaying={aiIsSpeaking}
          transcript={transcript}
          isListening={isListening}
          aiIsSpeaking={aiIsSpeaking}
        />

        {/* Right Panel - Code Editor */}
        {currentPhase === 'coding' ? (
          <LazyCodeEditor
            code={code}
            language={selectedLanguage}
            onCodeChange={setCode}
            onLanguageChange={setSelectedLanguage}
            onRun={handleRunCode}
            onSubmit={handleSubmitAnswer}
            isLoading={loading}
            output={output}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center">
            <div className="text-6xl mb-6">
              {currentPhase === 'icebreaker'
                ? '❄️'
                : currentPhase === 'introduction'
                ? '👋'
                : currentPhase === 'wrapup'
                ? '🏁'
                : '🎉'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 capitalize">
              {currentPhase} Phase
            </h2>
            <p className="text-gray-600 text-center mb-8">
              {currentPhase === 'icebreaker'
                ? 'Answer a few warm-up questions about yourself'
                : currentPhase === 'introduction'
                ? 'Learn about the role and what to expect'
                : currentPhase === 'wrapup'
                ? 'Interview is complete'
                : 'Get ready for coding problems'}
            </p>
            <button
              onClick={() => {
                if (currentPhase === 'wrapup' && completedInterviewId) {
                  router.push(`/scorecard/${completedInterviewId}`);
                  return;
                }
                handleSubmitAnswer();
              }}
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : currentPhase === 'wrapup' ? 'View Scorecard' : 'Continue'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <InterviewBottomBar
        isRecording={isRecording}
        onMicToggle={handleMicToggle}
        onTextInput={handleUserAnswer}
        elapsedTime={elapsedTime}
        isProcessing={loading}
      />
    </div>
  );
}
