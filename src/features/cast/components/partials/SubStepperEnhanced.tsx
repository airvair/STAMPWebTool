import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Enhanced TypeScript interfaces
interface SubStepperProps {
  // Core functionality (backward compatible)
  steps: string[];
  currentStep: number;
  maxReachedStep: number;
  setStep: (step: number) => void;
  validationStatus: boolean[];
  
  // Enhanced UX features
  variant?: 'horizontal' | 'vertical' | 'hybrid';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showProgress?: boolean;
  enableAnimations?: boolean;
  
  // Accessibility enhancements
  stepDescriptions?: string[];
  ariaLabel?: string;
  
  // Visual customization
  theme?: 'default' | 'compact' | 'elevated' | 'minimal';
  colorScheme?: 'blue' | 'green' | 'amber' | 'slate';
}

interface StepState {
  index: number;
  label: string;
  status: 'completed' | 'current' | 'incomplete' | 'error';
  isValid: boolean;
  isClickable: boolean;
}

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

// Custom hooks
const useResponsive = (variant: 'horizontal' | 'vertical' | 'hybrid') => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  const isMobile = windowWidth < BREAKPOINTS.mobile;
  const isTablet = windowWidth >= BREAKPOINTS.mobile && windowWidth < BREAKPOINTS.tablet;
  
  const orientation = useMemo(() => {
    if (variant === 'hybrid') {
      return isMobile ? 'vertical' : 'horizontal';
    }
    return variant;
  }, [variant, isMobile]);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return { orientation, isMobile, isTablet };
};

const useStepState = (
  steps: string[],
  currentStep: number,
  maxReachedStep: number,
  validationStatus: boolean[]
) => {
  return useMemo(() => {
    return steps.map((label, index) => ({
      index,
      label,
      status: getStepStatus(index, currentStep, maxReachedStep, validationStatus[index]),
      isValid: validationStatus[index] ?? false,
      isClickable: index <= maxReachedStep,
    }));
  }, [steps, currentStep, maxReachedStep, validationStatus]);
};

const getStepStatus = (
  index: number,
  currentStep: number,
  maxReachedStep: number,
  isValid: boolean
): 'completed' | 'current' | 'incomplete' | 'error' => {
  if (index === currentStep) return 'current';
  if (index < currentStep) return isValid ? 'completed' : 'error';
  if (index <= maxReachedStep) return 'incomplete';
  return 'incomplete';
};

// Icons
const CheckIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
  </svg>
);

// Step component
interface StepItemProps {
  step: StepState;
  orientation: 'horizontal' | 'vertical';
  size: 'sm' | 'md' | 'lg';
  theme: string;
  colorScheme: string;
  onClick: () => void;
  isLast: boolean;
  enableAnimations: boolean;
}

const StepItem: React.FC<StepItemProps> = ({
  step,
  orientation,
  size,
  onClick,
  enableAnimations,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };
  
  const colorClasses = {
    completed: 'bg-green-600 hover:bg-green-700 text-white',
    current: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-200',
    incomplete: 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-300',
    error: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  const baseClasses = `
    relative flex items-center justify-center rounded-full
    font-medium cursor-pointer transition-all duration-200
    ${enableAnimations ? 'transform hover:scale-105' : ''}
    ${step.isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
    ${sizeClasses[size]}
    ${colorClasses[step.status]}
  `;
  
  const containerClasses = orientation === 'vertical' 
    ? 'flex items-center w-full mb-4 last:mb-0'
    : 'flex flex-col items-center relative';
  
  const renderStepIcon = () => {
    if (step.status === 'completed') return <CheckIcon />;
    if (step.status === 'error') return <ExclamationIcon />;
    if (step.status === 'current') return <span className="w-2 h-2 bg-white rounded-full" />;
    return <span className="text-xs font-bold">{step.index + 1}</span>;
  };
  
  const renderConnector = () => {
    // Connectors removed as requested by user
    return null;
  };
  
  return (
    <li className={containerClasses}>
      <button
        onClick={step.isClickable ? onClick : undefined}
        className={baseClasses}
        aria-current={step.status === 'current' ? 'step' : undefined}
        aria-disabled={!step.isClickable}
        title={step.label}
      >
        {renderStepIcon()}
      </button>
      
      {orientation === 'vertical' && (
        <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          {step.label}
        </span>
      )}
      
      {orientation === 'horizontal' && (
        <span className="mt-2 text-xs text-center text-slate-600 dark:text-slate-400 max-w-16 leading-tight">
          {step.label}
        </span>
      )}
      
      {renderConnector()}
    </li>
  );
};

// Progress bar component
interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  orientation: 'horizontal' | 'vertical';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, orientation }) => {
  // Calculate progress to align with step positions
  // Progress should be 0% at step 0, and reach each step center
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;
  
  if (orientation === 'vertical') {
    return (
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700">
        <div 
          className="w-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ height: `${progress}%` }}
        />
      </div>
    );
  }
  
  return (
    <div className="mb-6 w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-600 transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// Main SubStepper component
const SubStepperEnhanced: React.FC<SubStepperProps> = ({
  steps,
  currentStep,
  maxReachedStep,
  setStep,
  validationStatus,
  variant = 'hybrid',
  size = 'md',
  showProgress = true,
  enableAnimations = true,
  stepDescriptions = [],
  ariaLabel = 'Progress steps',
  theme = 'default',
  colorScheme = 'blue',
}) => {
  const { orientation } = useResponsive(variant);
  const stepStates = useStepState(steps, currentStep, maxReachedStep, validationStatus);
  
  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepStates[stepIndex].isClickable) {
      setStep(stepIndex);
    }
  }, [stepStates, setStep]);
  
  const containerClasses = `
    relative w-full
    ${theme === 'compact' ? 'bg-slate-50 dark:bg-slate-800/30 rounded-lg p-4' : ''}
    ${theme === 'elevated' ? 'bg-slate-50 dark:bg-slate-800/50 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700/50' : ''}
    ${theme === 'minimal' ? 'py-4' : ''}
  `;
  
  const stepListClasses = orientation === 'vertical'
    ? 'flex flex-col space-y-0 relative pl-8'
    : 'flex items-start justify-between w-full space-x-2 md:space-x-4';
  
  return (
    <nav aria-label={ariaLabel} className={containerClasses}>
      {showProgress && (
        <ProgressBar 
          currentStep={currentStep}
          totalSteps={steps.length}
          orientation={orientation}
        />
      )}
      
      <ol role="list" className={stepListClasses}>
        {stepStates.map((step, index) => (
          <StepItem
            key={`${step.label}-${index}`}
            step={step}
            orientation={orientation}
            size={size}
            theme={theme}
            colorScheme={colorScheme}
            onClick={() => handleStepClick(index)}
            isLast={index === stepStates.length - 1}
            enableAnimations={enableAnimations}
          />
        ))}
      </ol>
      
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        {stepDescriptions[currentStep] && `, ${stepDescriptions[currentStep]}`}
      </div>
    </nav>
  );
};

export default SubStepperEnhanced;