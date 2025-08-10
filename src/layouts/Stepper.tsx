import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared';
import { useAnalysis } from '@/hooks/useAnalysis';
import { StepDefinition } from '@/types/types';

interface StepperProps {
  steps: StepDefinition[];
  currentPath: string;
  onPrevious: () => void;
  onNext: () => void;
  currentStepIndex: number;
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  currentPath: _currentPath,
  onPrevious,
  onNext,
  currentStepIndex,
}) => {
  const navigate = useNavigate();
  const { analysisSession } = useAnalysis();
  if (!analysisSession) return null;

  return (
    <nav
      aria-label="Progress"
      className="sticky top-0 z-30 border-b border-black/10 bg-[#171515]/80 shadow-sm backdrop-blur-sm"
    >
      <div className="container mx-auto flex items-center justify-between space-x-4 p-2">
        <Button onClick={onPrevious} disabled={currentStepIndex <= 0} variant="secondary" size="sm">
          Previous Step
        </Button>
        <ol
          role="list"
          className="flex flex-grow items-center justify-center space-x-2 overflow-x-auto md:space-x-4"
        >
          {steps.map((step, stepIdx) => {
            const isCurrent = currentStepIndex === stepIdx;
            const isCompleted = currentStepIndex > stepIdx;
            const isStart = step.path === '/start';

            let buttonClass =
              'group flex flex-col items-center py-2 px-1 md:px-3 border-b-4 focus:outline-none transition-colors duration-200 ';
            if (isCurrent) {
              buttonClass += 'border-sky-500 text-sky-600 dark:text-sky-400 font-semibold';
            } else if (isCompleted) {
              buttonClass +=
                'border-green-500 text-slate-700 dark:text-slate-300 hover:border-sky-400';
            } else {
              // isFuture
              buttonClass +=
                'border-transparent text-slate-400 dark:text-slate-500 hover:border-sky-400';
            }

            if (!isStart) {
              buttonClass += ' cursor-pointer';
            } else {
              buttonClass += ' cursor-default';
            }

            return (
              <li key={step.shortTitle} className="flex-shrink-0">
                <button
                  onClick={() => !isStart && navigate(step.path)}
                  disabled={isStart}
                  className={buttonClass}
                >
                  <span className={`text-xs md:text-sm ${isCurrent ? 'font-bold' : 'font-medium'}`}>
                    {step.shortTitle}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <Button onClick={onNext} disabled={currentStepIndex >= steps.length - 1} size="sm">
          Next Step
        </Button>
      </div>
    </nav>
  );
};

export default Stepper;
