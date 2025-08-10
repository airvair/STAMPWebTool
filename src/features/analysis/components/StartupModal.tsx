import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AnalysisType } from '@/types/types';
import { CAST_STEPS, STPA_STEPS, APP_TITLE } from '@/utils/constants';

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
        navigateTo =
          analysisSession.analysisType === AnalysisType.CAST
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
          className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-50 via-white to-neutral-50 p-6 dark:from-black dark:via-neutral-950 dark:to-black"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mx-auto max-w-2xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-8 h-20 w-20 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 p-4"
            >
              <SparklesIcon className="h-full w-full text-white" />
            </motion.div>

            <h1 className="mb-6 bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-clip-text text-5xl font-bold text-transparent lg:text-6xl dark:from-white dark:via-neutral-200 dark:to-white">
              Welcome Back
            </h1>

            <p className="mb-12 text-lg text-neutral-600 lg:text-xl dark:text-neutral-400">
              You have an existing{' '}
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                {analysisSession.analysisType}
              </span>{' '}
              analysis in progress
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleContinueSession}
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 font-medium text-white shadow-lg transition-all duration-300 hover:from-sky-600 hover:to-blue-700 hover:shadow-xl"
                >
                  Continue Analysis
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleReset}
                  size="lg"
                  className="rounded-full border border-neutral-200 bg-white/80 px-8 py-4 font-medium text-neutral-700 backdrop-blur-sm transition-all duration-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-300 dark:hover:bg-neutral-900"
                  leftIcon={<ArrowPathIcon className="h-5 w-5" />}
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
      <div className="min-h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-black dark:via-neutral-950 dark:to-neutral-900">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 h-full w-full rounded-full bg-gradient-to-br from-sky-100/20 to-transparent blur-3xl dark:from-sky-900/10" />
          <div className="absolute -right-1/2 -bottom-1/2 h-full w-full rounded-full bg-gradient-to-tl from-purple-100/20 to-transparent blur-3xl dark:from-purple-900/10" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              className="mb-8"
            >
              <h1 className="bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 bg-clip-text text-6xl font-bold tracking-tight text-transparent lg:text-7xl dark:from-white dark:via-neutral-200 dark:to-white">
                {APP_TITLE}
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl font-light text-neutral-600 lg:text-2xl dark:text-neutral-400"
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
