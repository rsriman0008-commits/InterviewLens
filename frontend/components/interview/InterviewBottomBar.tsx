import React from 'react';
import { Mic, MicOff, MessageSquare, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface InterviewBottomBarProps {
  isRecording: boolean;
  onMicToggle: () => void;
  elapsedTime: number;
  onTextInput?: (text: string) => void;
  isProcessing?: boolean;
}

export const InterviewBottomBar: React.FC<InterviewBottomBarProps> = ({
  isRecording,
  onMicToggle,
  elapsedTime,
  isProcessing,
}) => {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Mic Button */}
        <button
          onClick={onMicToggle}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            isRecording
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff size={20} className="animate-pulse" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic size={20} />
              Start Speaking
            </>
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <MessageSquare size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Or type your answer here..."
            disabled={isProcessing}
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg">
          <Clock size={20} className="text-gray-600" />
          <span className="font-mono font-semibold text-gray-900">
            {formatDuration(elapsedTime)}
          </span>
        </div>
      </div>
    </div>
  );
};
