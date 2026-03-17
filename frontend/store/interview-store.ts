import { create } from 'zustand';
import { Interview, CodeQuestion } from '@/types';

interface InterviewState {
  currentInterview: Interview | null;
  currentPhase: 'icebreaker' | 'introduction' | 'coding' | 'wrapup' | null;
  selectedRole: string | null;
  currentQuestionIndex: number;
  isRecording: boolean;
  aiIsSpeaking: boolean;

  // Actions
  setCurrentInterview: (interview: Interview | null) => void;
  setCurrentPhase: (phase: string) => void;
  setSelectedRole: (role: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setIsRecording: (recording: boolean) => void;
  setAiIsSpeaking: (speaking: boolean) => void;
  addQuestion: (question: CodeQuestion) => void;
  updateQuestion: (index: number, updates: Partial<CodeQuestion>) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewState>((set: any) => ({
  currentInterview: null,
  currentPhase: null,
  selectedRole: null,
  currentQuestionIndex: 0,
  isRecording: false,
  aiIsSpeaking: false,

  setCurrentInterview: (interview: Interview | null) => set({ currentInterview: interview }),
  setCurrentPhase: (phase: string) => set({ currentPhase: phase as any }),
  setSelectedRole: (role: string | null) => set({ selectedRole: role }),
  setCurrentQuestionIndex: (index: number) => set({ currentQuestionIndex: index }),
  setIsRecording: (recording: boolean) => set({ isRecording: recording }),
  setAiIsSpeaking: (speaking: boolean) => set({ aiIsSpeaking: speaking }),

  addQuestion: (question: CodeQuestion) =>
    set((state: InterviewState) => ({
      currentInterview: state.currentInterview
        ? {
            ...state.currentInterview,
            questions: [...state.currentInterview.questions, question],
          }
        : null,
    })),

  updateQuestion: (index: number, updates: Partial<CodeQuestion>) =>
    set((state: InterviewState) => ({
      currentInterview: state.currentInterview
        ? {
            ...state.currentInterview,
            questions: state.currentInterview.questions.map((q: CodeQuestion, i: number) =>
              i === index ? { ...q, ...updates } : q
            ),
          }
        : null,
    })),

  reset: () =>
    set({
      currentInterview: null,
      currentPhase: null,
      selectedRole: null,
      currentQuestionIndex: 0,
      isRecording: false,
      aiIsSpeaking: false,
    }),
}));
