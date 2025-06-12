import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StepDefinition } from '../../types';
import { useAnalysis } from '../../hooks/useAnalysis';

interface StepperProps {
  steps: StepDefinition[];
  currentPath: string;
  headerHeight?: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentPath, headerHeight = 0 }) => {
  const navigate = useNavigate();
  const { analysisSession } = useAnalysis();
  if (!analysisSession) return null;

  return (
    <nav aria-label="Progress" className="bg-white shadow-sm sticky z-30" style={{ top: headerHeight }}>
      <ol role="list" className="flex items-center justify-center p-2 space-x-2 md:space-x-4 overflow-x-auto">
        {steps.map((step, stepIdx) => {
          const isCurrent = currentPath === step.path || (currentPath.startsWith(step.path) && step.path !== '/');
          const isCompleted = steps.findIndex(s => s.path === currentPath) > stepIdx;
          const isStart = step.path === '/start';

          return (
            <li key={step.shortTitle} className="flex-shrink-0">
              <button
                onClick={() => !isStart && navigate(step.path)}
                disabled={isStart}
                className={`group flex flex-col items-center py-2 px-1 md:px-3 border-b-4 focus:outline-none
                  ${isCurrent ? 'border-sky-500 text-sky-600' : isCompleted ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500'}
                  ${isStart ? 'cursor-default' : 'hover:border-sky-300 hover:text-slate-700'}`}
              >
                <span className={`text-xs md:text-sm font-medium ${isCurrent ? 'font-bold' : ''}`}>{step.shortTitle}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
