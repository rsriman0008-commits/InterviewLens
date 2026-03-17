import apiClient from './api-client';

interface GenerateQuestionPayload {
  role: string;
  phase: 'icebreaker' | 'introduction' | 'coding' | 'wrapup';
  questionNumber: number;
  userProfile?: {
    fullName: string;
    college: string;
    branch: string;
    yearOfStudy: string | number;
  };
}

interface EvaluateCodePayload {
  code: string;
  question: string;
  language: string;
  role: string;
}

interface GenerateFeedbackPayload {
  allAnswers: string[];
  codeScores: any[];
  voiceTranscripts: string[];
  role: string;
}

export const apiService = {
  // Question generation
  generateQuestion: async (payload: GenerateQuestionPayload) => {
    const response = await apiClient.post('/api/generate-question', payload);
    return response.data;
  },

  // Code evaluation
  evaluateCode: async (payload: EvaluateCodePayload) => {
    const response = await apiClient.post('/api/evaluate-code', payload);
    return response.data;
  },

  // Feedback generation
  generateFeedback: async (payload: GenerateFeedbackPayload) => {
    const response = await apiClient.post('/api/generate-feedback', payload);
    return response.data;
  },

  // Text to speech
  textToSpeech: async (text: string) => {
    const response = await apiClient.post(
      '/api/text-to-speech',
      { text },
      { responseType: 'blob' }
    );
    return response.data;
  },

  // Speech to text
  speechToText: async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    const response = await apiClient.post('/api/speech-to-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },
};
