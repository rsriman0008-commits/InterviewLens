'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/interview-store';
import { apiService } from '@/lib/api-service';
import { voiceService } from '@/lib/voice-service';
import { Interview, CodeQuestion } from '@/types';
import { AIAgentPanel } from '@/components/interview/AIAgentPanel';
import { CodeEditor } from '@/components/interview/CodeEditor';
import { InterviewBottomBar } from '@/components/interview/InterviewBottomBar';
import toast from 'react-hot-toast';

type InterviewPhase = 'icebreaker' | 'introduction' | 'coding' | 'wrapup';

// Mock user for demo
const mockUserId = 'demo-user-' + Math.random().toString(36).substr(2, 9);

export default function InterviewSessionPage() {
  const router = useRouter();
  const userId = mockUserId;
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
  const [transcript, setTranscript] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interviewRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);
  const isLoadingQuestionRef = useRef(false);

  // Initialize interview
  useEffect(() => {
    if (!selectedRole) {
      router.push('/home');
      return;
    }

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
    if (currentPhase && interview) {
      loadQuestion();
    }
  }, [currentPhase, currentQuestionIndex, interview]);

  const initializeInterview = async () => {
    try {
      setLoading(true);

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
      setTranscript([welcomeText]);
      
      // Play welcome message
      try {
        const audioBlob = await apiService.textToSpeech(welcomeText);
        await voiceService.playAudio(audioBlob);
      } catch (error) {
        try {
          await voiceService.speakText(welcomeText);
        } catch {
          // ignore
        }
      }

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
        userProfile: {
          fullName: 'Student',
          college: 'University',
          branch: 'CSE',
          yearOfStudy: '3',
        },
      });

      const newQuestion: CodeQuestion = {
        id: `q-${Date.now()}`,
        questionNumber: currentQuestionIndex + 1,
        phase: currentPhase || 'icebreaker',
        question: response.question || response.introduction || 'Question...',
        hints: response.hints || [],
        expectedTopics: response.expectedTopics || [],
      };

      addQuestion(newQuestion);
      setCurrentQuestion(newQuestion);
      setCode('');
      setOutput('');

      // Read question aloud
      setAiIsSpeaking(true);
      try {
        const audioBlob = await apiService.textToSpeech(newQuestion.question);
        await voiceService.playAudio(audioBlob);
      } catch (error) {
        try {
          await voiceService.speakText(newQuestion.question);
        } catch {
          // ignore
        }
      }
      setAiIsSpeaking(false);

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

      addQuestion(fallbackQuestion);
      setCurrentQuestion(fallbackQuestion);

      setAiIsSpeaking(true);
      try {
        await voiceService.speakText(fallbackQuestion.question);
      } catch {
        // ignore
      }
      setAiIsSpeaking(false);

      toast.error('Failed to load question (using fallback)');
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
          setTranscript((prev) => [...prev, userSpeech]);
          
          // Add to current question
          updateQuestion(currentQuestionIndex, {
            voiceTranscript: userSpeech,
          });

          // AI responds
          setAiIsSpeaking(true);
          const response = `Thank you for that answer. ${
            currentPhase === 'coding'
              ? 'Now let\'s code this solution in ' + selectedLanguage
              : 'Great! Let\'s move to the next question.'
          }`;
          
          try {
            const audioBlob = await apiService.textToSpeech(response);
            await voiceService.playAudio(audioBlob);
            setTranscript((prev) => [...prev, response]);
          } catch (error) {
            try {
              await voiceService.speakText(response);
            } catch {
              // ignore
            }
            setTranscript((prev) => [...prev, response]);
          }
          setAiIsSpeaking(false);
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
    // Simulate code execution
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOutput('Code executed successfully!\nOutput: [1, 2, 3, 4, 5]');
      toast.success('Code executed');
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
        const evaluation = await apiService.evaluateCode({
          code,
          question: currentQuestion?.question || '',
          language: selectedLanguage,
          role: selectedRole || '',
        });

        updateQuestion(currentQuestionIndex, {
          userCode: code,
          userCodeLanguage: selectedLanguage,
          codeScore: {
            correctness: evaluation.correctness || 5,
            timeComplexity: evaluation.timeComplexity || 'O(n)',
            spaceComplexity: evaluation.spaceComplexity || 'O(1)',
            bugs: evaluation.bugs || [],
            suggestions: evaluation.suggestions || [],
          },
          followUpQuestions: evaluation.followupQuestions || [],
        });

        // Ask follow-up questions
        const followUpText = evaluation.followupQuestions?.[0] || 'Great! Ready for the next question?';
        setTranscript((prev) => [...prev, followUpText]);
        
        try {
          const audioBlob = await apiService.textToSpeech(followUpText);
          await voiceService.playAudio(audioBlob);
        } catch (error) {
          console.log('Voice not available');
        }
      }

      // Move to next question or phase
      if (currentPhase === 'icebreaker' && currentQuestionIndex < 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else if (currentPhase === 'icebreaker') {
        setCurrentPhase('introduction');
        setCurrentQuestionIndex(0);
      } else if (currentPhase === 'introduction') {
        setCurrentPhase('coding');
        setCurrentQuestionIndex(0);
      } else if (currentPhase === 'coding' && currentQuestionIndex < 2) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // End interview
        await completeInterview();
      }

      setLoading(false);
    } catch (error) {
      toast.error('Failed to submit answer');
      setLoading(false);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const completeInterview = async () => {
    try {
      // Generate comprehensive feedback
      const allAnswers = transcript.filter((_, i) => i % 2 === 1);
      const codeScores = interview?.questions
        .filter((q) => q.codeScore)
        .map((q) => q.codeScore) || [];

      const feedback = await apiService.generateFeedback({
        allAnswers,
        codeScores,
        voiceTranscripts: transcript,
        role: selectedRole || '',
      });

      // Update interview with final results
      const duration = Math.floor(elapsedTime / 60);

      if (interview && interviewRef.current) {
        setInterview({
          ...interview,
          endTime: new Date(),
          duration,
          totalScore: feedback.totalScore,
          communicationScore: feedback.breakdown?.communication || 0,
          problemSolvingScore: feedback.breakdown?.problemSolving || 0,
          codeQualityScore: feedback.breakdown?.codeQuality || 0,
          technicalKnowledgeScore: feedback.breakdown?.technicalKnowledge || 0,
          feedback,
          status: 'completed',
        });
      }

      // Navigate to scorecard (use a local scorecard since we're not using Firestore here)
      router.push(`/scorecard/${interviewRef.current}`);
    } catch (error) {
      toast.error('Failed to complete interview');
      console.error(error);
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
          <CodeEditor
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
                : 'Get ready for coding problems'}
            </p>
            <button
              onClick={handleSubmitAnswer}
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <InterviewBottomBar
        isRecording={isRecording}
        onMicToggle={handleMicToggle}
        elapsedTime={elapsedTime}
        isProcessing={loading}
      />
    </div>
  );
}
