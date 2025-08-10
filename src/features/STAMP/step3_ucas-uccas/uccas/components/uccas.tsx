import React from 'react';

const UCCAs: React.FC = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="max-w-2xl space-y-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          UCCAs (Unsafe Combinations of Control Actions)
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          This feature is under development. UCCAs will help identify unsafe combinations of control
          actions.
        </p>
        <div className="mt-8 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Coming soon: Analysis of unsafe control action combinations to complement the
            traditional UCA analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UCCAs;
