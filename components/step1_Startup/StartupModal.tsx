import { ClipboardDocumentCheckIcon, CubeTransparentIcon, ArrowPathIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CAST_STEPS, STPA_STEPS, APP_TITLE, GLOSSARY } from '@/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AnalysisType } from '@/types';
import Button from '../shared/Button';
import Tooltip from '../shared/Tooltip';
import { ShineBorder } from '@/src/components/magicui/shine-border';

// A dedicated component for the choice cards with Apple/Google-style design
const ChoiceCard: React.FC<{
    icon: React.ReactNode;
    question: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    delay?: number;
}> = ({ icon, question, title, description, onClick, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className="relative group"
    >
        <button
            onClick={onClick}
            className="relative w-full bg-white/80 dark:bg-neutral-900/30 backdrop-blur-xl border border-neutral-200/50 dark:border-white/5 rounded-3xl p-8 lg:p-10 flex flex-col items-start text-left space-y-6 transition-all duration-500 hover:scale-[1.02] hover:bg-white/90 dark:hover:bg-neutral-900/40 overflow-hidden"
        >
            <ShineBorder
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                borderWidth={2}
                duration={8}
                shineColor={["#3b82f6", "#8b5cf6", "#ec4899"]}
            />
            
            <div className="relative z-10 w-full">
                <div className="flex items-start justify-between">
                    <div className="flex-1 pr-12">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 dark:from-sky-500 dark:to-blue-700 p-3 mb-6 group-hover:scale-110 transition-transform duration-300">
                            <div className="w-full h-full text-white">
                                {icon}
                            </div>
                        </div>
                        
                        <h3 className="text-3xl lg:text-4xl font-semibold text-neutral-900 dark:text-white mb-3 tracking-tight">
                            {title}
                        </h3>
                        
                        <p className="text-base lg:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                            {question}
                        </p>
                        
                        <p className="text-sm text-neutral-500 dark:text-neutral-500 leading-relaxed">
                            {description}
                        </p>
                    </div>
                    
                    <div className="absolute top-1/2 right-8 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <ArrowRightIcon className="w-6 h-6 text-sky-500 dark:text-sky-400" />
                    </div>
                </div>
            </div>
        </button>
    </motion.div>
);


const StartupPage: React.FC = () => {
    const { analysisSession, setAnalysisType, resetAnalysis } = useAnalysis();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleSelectType = (type: AnalysisType) => {
        const initialStep = type === AnalysisType.CAST ? CAST_STEPS[1].path : STPA_STEPS[1].path;
        setAnalysisType(type);
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

    // If a session exists, show the "Welcome Back" screen with Apple-style design
    if (analysisSession && analysisSession.analysisType) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-neutral-50 dark:from-black dark:via-neutral-950 dark:to-black flex flex-col items-center justify-center p-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center max-w-2xl mx-auto"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-20 h-20 mx-auto mb-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 p-4"
                        >
                            <SparklesIcon className="w-full h-full text-white" />
                        </motion.div>
                        
                        <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent mb-6">
                            Welcome Back
                        </h1>
                        
                        <p className="text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 mb-12">
                            You have an existing <span className="font-semibold text-sky-600 dark:text-sky-400">{analysisSession.analysisType}</span> analysis in progress
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button 
                                    onClick={handleContinueSession} 
                                    size="lg" 
                                    className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    Continue Analysis
                                </Button>
                            </motion.div>
                            
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button 
                                    onClick={handleReset} 
                                    size="lg" 
                                    className="px-8 py-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-full hover:bg-white dark:hover:bg-neutral-900 transition-all duration-300"
                                    leftIcon={<ArrowPathIcon className="w-5 h-5"/>}
                                >
                                    Start New Analysis
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Show the new analysis choice screen with Apple/Google-style design
    return (
        <AnimatePresence mode="wait">
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-black dark:via-neutral-950 dark:to-neutral-900 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-sky-100/20 to-transparent dark:from-sky-900/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-100/20 to-transparent dark:from-purple-900/10 rounded-full blur-3xl" />
                </div>
                
                <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center mb-16 max-w-4xl mx-auto"
                    >
                        <motion.h1 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                            className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent mb-6 tracking-tight"
                        >
                            {APP_TITLE}
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-xl lg:text-2xl text-neutral-600 dark:text-neutral-400 font-light"
                        >
                            Choose your safety analysis approach
                        </motion.p>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isVisible ? 1 : 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mx-auto max-w-6xl w-full px-4"
                    >
                        <div className="grid gap-6 lg:gap-8 md:grid-cols-2">
                            <ChoiceCard
                                onClick={() => handleSelectType(AnalysisType.CAST)}
                                icon={<ClipboardDocumentCheckIcon className="w-full h-full" />}
                                question="Investigating an incident or accident that has already occurred?"
                                title="CAST Analysis"
                                description="Analyze past events to identify systemic causal factors and prevent future incidents."
                                delay={0.4}
                            />
                            
                            <ChoiceCard
                                onClick={() => handleSelectType(AnalysisType.STPA)}
                                icon={<CubeTransparentIcon className="w-full h-full" />}
                                question={<>Designing or analyzing a new or existing <Tooltip content={GLOSSARY['System']}>system</Tooltip>?</>}
                                title="STPA Analysis"
                                description="Proactively identify hazards and specify safety constraints for system design."
                                delay={0.5}
                            />
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-16 text-center"
                    >
                        <p className="text-sm text-neutral-500 dark:text-neutral-600">
                            Powered by STAMP methodology
                        </p>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default StartupPage;