import React from 'react';
import { Volume2, Loader } from 'lucide-react';

interface AIAgentPanelProps {
  currentQuestion: string;
  isPlaying: boolean;
  transcript: string[];
  isListening: boolean;
  aiIsSpeaking: boolean;
}

export const AIAgentPanel: React.FC<AIAgentPanelProps> = ({
  currentQuestion,
  isPlaying,
  transcript,
  isListening,
  aiIsSpeaking,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
      {/* AI Avatar */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-white flex flex-col items-center justify-center min-h-48">
        <div
          className={`w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 ${
            aiIsSpeaking ? 'animate-pulse' : ''
          }`}
        >
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </div>
        <p className="text-sm text-white/80">
          {aiIsSpeaking ? 'AI is speaking...' : 'Listening...'}
        </p>
      </div>

      {/* Current Question */}
      <div className="p-6 border-b border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Current Question</p>
        <p className="text-lg font-semibold text-gray-900 line-clamp-4">
          {currentQuestion || 'Waiting for question...'}
        </p>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-sm text-gray-600 mb-4">Conversation Transcript</p>
        <div className="space-y-3">
          {transcript.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Interview will start shortly...</p>
          ) : (
            transcript.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  index % 2 === 0
                    ? 'bg-indigo-50 border-l-4 border-indigo-600'
                    : 'bg-gray-50 border-l-4 border-gray-300'
                }`}
              >
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  {index % 2 === 0 ? 'AI' : 'You'}
                </p>
                <p className="text-sm text-gray-900">{item}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Waveform Animation */}
      {(isListening || aiIsSpeaking) && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-1 h-8">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-indigo-600 rounded-full animate-bounce"
                style={{
                  height: `${20 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
