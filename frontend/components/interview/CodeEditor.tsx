import React from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send } from 'lucide-react';
import { PROGRAMMING_LANGUAGES } from '@/lib/constants';

interface CodeEditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  output?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onRun,
  onSubmit,
  isLoading,
  output,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label htmlFor="language" className="text-sm font-medium text-gray-700">
            Language:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {PROGRAMMING_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onRun}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          <Play size={18} />
          Run Code
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value: string | undefined) => onCodeChange(value || '')}
          theme="light"
          loading={
            <div className="h-full w-full flex items-center justify-center text-gray-600">
              Loading editor...
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>

      {/* Output Console */}
      {output && (
        <div className="bg-gray-900 text-green-400 p-4 max-h-32 overflow-y-auto border-t border-gray-300">
          <p className="text-xs font-mono mb-2 text-gray-500">Output:</p>
          <pre className="text-xs font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}

      {/* Submit Button */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <button
          onClick={onSubmit}
          disabled={isLoading || !code.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
        >
          <Send size={18} />
          Submit Answer
        </button>
      </div>
    </div>
  );
};
