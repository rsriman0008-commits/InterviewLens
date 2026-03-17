export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  college: string;
  branch: string;
  yearOfStudy: number | string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interview {
  id: string;
  userId: string;
  role: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  totalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  codeQualityScore: number;
  technicalKnowledgeScore: number;
  questions: CodeQuestion[];
  feedback: InterviewFeedback;
  status: 'ongoing' | 'completed' | 'abandoned';
}

export interface CodeQuestion {
  id: string;
  questionNumber: number;
  phase: 'icebreaker' | 'introduction' | 'coding' | 'wrapup';
  question: string;
  hints?: string[];
  expectedTopics?: string[];
  userCode?: string;
  userCodeLanguage?: string;
  codeScore?: {
    correctness: number; // 0-10
    timeComplexity: string;
    spaceComplexity: string;
    bugs?: string[];
    suggestions?: string[];
  };
  voiceTranscript?: string;
  followUpQuestions?: string[];
  followUpAnswers?: string[];
  feedback?: string;
}

export interface InterviewFeedback {
  totalScore: number;
  breakdown: {
    communication: number;
    problemSolving: number;
    codeQuality: number;
    technicalKnowledge: number;
  };
  strengths: string[];
  improvements: string[];
  overallFeedback: string;
  resources?: string[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
}

export type Language = 'python' | 'javascript' | 'java' | 'cpp';
