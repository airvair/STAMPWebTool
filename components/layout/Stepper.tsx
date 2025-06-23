import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import { StepDefinition } from '../../types';

interface StepperProps {
  steps: StepDefinition[];
  currentPath: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentPath }) => {
  const navigate = useNavigate();
  const { analysisSession } = useAnalysis();
  if (!analysisSession) return null;

  return (
      <nav aria-label="Progress" className="bg-[#171515]/80 backdrop-blur-sm shadow-sm sticky top-0 z-30 border-b border-black/10">        <ol role="list" className="container mx-auto flex items-center justify-center p-2 space-x-2 md:space-x-4 overflow-x-auto">
          {steps.map((step, stepIdx) => {
            const currentStepIndex = steps.findIndex(s => currentPath.startsWith(s.path));
            const isCurrent = currentStepIndex === stepIdx;
            const isCompleted = currentStepIndex > stepIdx;
            const isStart = step.path === '/start';

            // Determine button classes
            let buttonClass = 'group flex flex-col items-center py-2 px-1 md:px-3 border-b-4 focus:outline-none transition-colors duration-200 ';
            if (isCurrent) {
              buttonClass += 'border-sky-500 text-sky-600 dark:text-sky-400 font-semibold';
            } else if (isCompleted) {
              buttonClass += 'border-green-500 text-slate-700 dark:text-slate-300 hover:border-sky-400';
            } else {
              buttonClass += 'border-transparent text-slate-400 dark:text-slate-500 cursor-default';
            }
            if(isStart) buttonClass += ' cursor-default';


            return (
                <li key={step.shortTitle} className="flex-shrink-0">
                  <button
                      onClick={() => !isStart && navigate(step.path)}
                      disabled={isStart}
                      className={buttonClass}
                  >
                    <span className={`text-xs md:text-sm ${isCurrent ? 'font-bold' : 'font-medium'}`}>{step.shortTitle}</span>
                  </button>
                </li>
            );
          })}
        </ol>
      </nav>
  );
};

export default Stepper;