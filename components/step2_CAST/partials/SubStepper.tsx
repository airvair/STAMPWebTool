import React from 'react';

interface SubStepperProps {
    steps: string[];
    currentStep: number;
    maxReachedStep: number;
    setStep: (step: number) => void;
    validationStatus: boolean[];
}

const CheckIcon = () => (
    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
);

const ExclamationIcon = () => (
    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
);

const SubStepper: React.FC<SubStepperProps> = ({ steps, currentStep, maxReachedStep, setStep, validationStatus }) => {
    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => {
                    const isCurrent = stepIdx === currentStep;
                    const hasBeenReached = stepIdx <= maxReachedStep;
                    const isValid = validationStatus[stepIdx];

                    let ComponentToRender;

                    if (isCurrent) {
                        ComponentToRender = (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700" />
                                </div>
                                <button
                                    onClick={() => setStep(stepIdx)}
                                    className="relative w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-sky-600 rounded-full"
                                    aria-current="step"
                                >
                                    <span className="h-2.5 w-2.5 bg-sky-600 rounded-full" aria-hidden="true" />
                                    <span className="sr-only">{step}</span>
                                </button>
                            </>
                        );
                    } else if (hasBeenReached) {
                        ComponentToRender = (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className={`h-0.5 w-full ${isValid ? 'bg-sky-600' : 'bg-red-600'}`} />
                                </div>
                                <button
                                    onClick={() => setStep(stepIdx)}
                                    className={`relative w-8 h-8 flex items-center justify-center rounded-full ${isValid ? 'bg-sky-600 hover:bg-sky-900' : 'bg-red-600 hover:bg-red-900'}`}
                                >
                                    {isValid ? <CheckIcon /> : <ExclamationIcon />}
                                    <span className="sr-only">{step}</span>
                                </button>
                            </>
                        );
                    } else {
                        ComponentToRender = (
                            <>
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700" />
                                </div>
                                <button
                                    onClick={() => setStep(stepIdx)}
                                    className="group relative w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full hover:border-slate-400"
                                >
                                    <span className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-slate-300" aria-hidden="true" />
                                    <span className="sr-only">{step}</span>
                                </button>
                            </>
                        );
                    }

                    return (
                        <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                            {ComponentToRender}
                            <span className="absolute top-10 -left-2 w-12 text-center text-xs text-slate-500 dark:text-slate-400">{step}</span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default SubStepper;