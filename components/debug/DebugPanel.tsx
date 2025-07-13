import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DebugPanelProps {
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ onClose }) => {
  const [message, setMessage] = useState('');

  const clearAllLocalStorage = () => {
    try {
      localStorage.clear();
      setMessage('All localStorage data cleared. Page will reload...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage(`Error clearing localStorage: ${error}`);
    }
  };

  const clearSpecificKeys = () => {
    try {
      const keysToKeep = ['theme', 'user-preferences'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      setMessage('Project data cleared. Page will reload...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage(`Error clearing data: ${error}`);
    }
  };

  const exportDebugData = () => {
    try {
      const debugData = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
        cookies: document.cookie,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        darkMode: document.documentElement.classList.contains('dark'),
      };
      
      const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stamp-debug-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setMessage('Debug data exported successfully');
    } catch (error) {
      setMessage(`Error exporting debug data: ${error}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Debug Panel</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={clearSpecificKeys}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Clear Project Data Only
          </button>
          
          <button
            onClick={clearAllLocalStorage}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Clear All Browser Data
          </button>
          
          <button
            onClick={exportDebugData}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Export Debug Information
          </button>
        </div>
        
        {message && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-neutral-800 rounded text-sm">
            {message}
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>If you're seeing a black screen, try:</p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Clear Project Data Only (recommended)</li>
            <li>If that doesn't work, Clear All Browser Data</li>
            <li>Export Debug Information before clearing if you need to preserve data</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;