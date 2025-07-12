import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CAST_STEPS, STPA_STEPS, APP_TITLE } from '@/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AnalysisType } from '@/types';
import Button from '../shared/Button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';



const StartupPage: React.FC = () => {
    const { analysisSession, resetAnalysis } = useAnalysis();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    
    useEffect(() => {
        setIsVisible(true);
    }, []);


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
        setShowResetDialog(true);
    };

    const confirmReset = () => {
        resetAnalysis();
        // The component will re-render to show the choice cards
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
                    
                    <ConfirmationDialog
                        open={showResetDialog}
                        onOpenChange={setShowResetDialog}
                        title="Start New Analysis"
                        description="Are you sure you want to discard your previous session and start a new one? This action cannot be undone."
                        confirmText="Start New"
                        onConfirm={confirmReset}
                        variant="destructive"
                    />
                </motion.div>
            </AnimatePresence>
        );
    }

    // Show the "No project selected" screen
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
                        className="text-center max-w-4xl mx-auto"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                            className="mb-8"
                        >
                            <h1 className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent tracking-tight">
                                {APP_TITLE}
                            </h1>
                        </motion.div>
                        
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-xl lg:text-2xl text-neutral-600 dark:text-neutral-400 font-light"
                        >
                            No project selected
                        </motion.p>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default StartupPage;