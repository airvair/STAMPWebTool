import React from 'react';

const UCCAs: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          UCCAs (Use Case Control Actions)
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          This feature is under development. UCCAs will help identify control actions at the use case level.
        </p>
        <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Coming soon: Analysis of use case control actions to complement the traditional UCA analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UCCAs;