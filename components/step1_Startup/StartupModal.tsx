import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import { AnalysisType } from '../../types';
import Button from '../shared/Button';
import Tooltip from '../shared/Tooltip';
import { CAST_STEPS, STPA_STEPS, APP_TITLE, GLOSSARY } from '../../constants';
import { ClipboardDocumentCheckIcon, CubeTransparentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// A dedicated component for the choice cards to keep the code clean.
const ChoiceCard: React.FC<{
    icon: React.ReactNode;
    question: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, question, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="group bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl hover:shadow-2xl dark:hover:border-sky-500 p-8 flex flex-col items-center text-center space-y-4 transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-sky-500"
    >
        <div className="w-16 h-16 text-sky-500 dark:text-sky-400 transition-colors duration-300">
            {icon}
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-medium text-lg">
            {question}
        </p>
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
      {title}
    </span>
        <p className="text-sm text-slate-500 dark:text-slate-400 opacity-80 pt-2">
            {description}
        </p>
    </button>
);


const StartupPage: React.FC = () => {
    const { analysisSession, setAnalysisType, resetAnalysis } = useAnalysis();
    const navigate = useNavigate();

    const handleSelectType = (type: AnalysisType) => {
        const initialStep = type === AnalysisType.CAST ? CAST_STEPS[1].path : STPA_STEPS[1].path;
        setAnalysisType(type, initialStep);
        navigate(initialStep);
    };

    const handleContinueSession = () => {
        if (analysisSession?.currentStep) {
            let navigateTo = analysisSession.currentStep;
            // If the saved step is the start page, navigate to the first actual analysis step.
            if (navigateTo === '/start') {
                navigateTo = analysisSession.analysisType === AnalysisType.CAST
                    ? CAST_STEPS[1].path
                    : STPA_STEPS[1].path;
            }
            navigate(navigateTo);
        }
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to discard your previous session and start a new one? This action cannot be undone.")) {
            resetAnalysis();
            // The component will re-render to show the choice cards
        }
    };

    // If a session exists, show the "Welcome Back" screen.
    if (analysisSession && analysisSession.analysisType) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-5xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">
                    You have an existing <span className="font-bold text-sky-500">{analysisSession.analysisType}</span> analysis in progress.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                    <Button onClick={handleContinueSession} size="lg" variant="primary">
                        Continue Analysis
                    </Button>
                    <Button onClick={handleReset} size="lg" variant="ghost" leftIcon={<ArrowPathIcon className="w-5 h-5"/>}>
                        Start New Analysis
                    </Button>
                </div>
            </div>
        );
    }

    // Otherwise, show the new analysis choice screen.
    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-slate-900 dark:text-white">{APP_TITLE}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Select an analysis method to begin.</p>
            </div>
            <div className="mx-auto max-w-4xl w-full">
                <div className="grid gap-8 md:grid-cols-2">

                    <ChoiceCard
                        onClick={() => handleSelectType(AnalysisType.CAST)}
                        icon={<ClipboardDocumentCheckIcon />}
                        question="Investigating an incident or accident that has already occurred?"
                        title="CAST Analysis"
                        description="Use Causal Analysis based on STAMP (CAST) to analyze past events and identify systemic causal factors."
                    />

                    <ChoiceCard
                        onClick={() => handleSelectType(AnalysisType.STPA)}
                        icon={<CubeTransparentIcon />}
                        question={<>Designing or analyzing a new or existing <Tooltip content={GLOSSARY['System']}>system</Tooltip>?</>}
                        title="STPA Analysis"
                        description="Use System-Theoretic Process Analysis (STPA) to proactively identify hazards and specify safety constraints."
                    />

                </div>
            </div>
        </div>
    );
};

export default StartupPage;