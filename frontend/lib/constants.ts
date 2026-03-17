import { Role } from '@/types';

export const INTERVIEW_ROLES: Role[] = [
  {
    id: 'frontend',
    name: 'Frontend Developer',
    description: 'React, Vue, Angular, JavaScript, CSS',
    difficulty: 'intermediate',
    icon: '🎨',
  },
  {
    id: 'backend',
    name: 'Backend Developer',
    description: 'Node.js, Python, Java, API Design',
    difficulty: 'intermediate',
    icon: '⚙️',
  },
  {
    id: 'fullstack',
    name: 'Full Stack Developer',
    description: 'Frontend + Backend + Databases',
    difficulty: 'advanced',
    icon: '🌐',
  },
  {
    id: 'data-scientist',
    name: 'Data Scientist',
    description: 'ML, Statistics, Data Analysis',
    difficulty: 'advanced',
    icon: '📊',
  },
  {
    id: 'ml-engineer',
    name: 'ML Engineer',
    description: 'Deep Learning, PyTorch, TensorFlow',
    difficulty: 'advanced',
    icon: '🤖',
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    description: 'Docker, Kubernetes, CI/CD, Cloud',
    difficulty: 'intermediate',
    icon: '🐳',
  },
  {
    id: 'android',
    name: 'Android Developer',
    description: 'Kotlin, Java, Android SDK',
    difficulty: 'intermediate',
    icon: '📱',
  },
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Architecture, Scalability, Design Patterns',
    difficulty: 'advanced',
    icon: '🏗️',
  },
];

export const PROGRAMMING_LANGUAGES = [
  { id: 'python', name: 'Python', ext: '.py' },
  { id: 'javascript', name: 'JavaScript', ext: '.js' },
  { id: 'java', name: 'Java', ext: '.java' },
  { id: 'cpp', name: 'C++', ext: '.cpp' },
];
