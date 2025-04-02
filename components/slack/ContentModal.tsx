import React from 'react';

interface ContentModalProps {
  content: string;
  name: string;
  onClose: () => void;
}

export const ContentModal: React.FC<ContentModalProps> = ({ content, name, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800/90 rounded-lg shadow-lg max-w-lg w-full mx-4 p-3 border border-zinc-200 dark:border-zinc-700">
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <i className="fas fa-comment text-indigo-500"></i>
            {name}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/80 p-4 rounded-md max-h-96 overflow-y-auto border border-zinc-200 dark:border-zinc-700/80">
          <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap text-sm">{content}</p>
        </div>
        <div className="mt-3 text-right">
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 text-sm font-medium rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 