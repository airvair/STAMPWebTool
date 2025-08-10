import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import webLogo from '@/assets/weblogo.webp';
import { Button } from '@/components/shared';
import { FeedbackContainer } from '@/components/shared';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AnalysisType } from '@/types/types';
import { APP_TITLE, APP_VERSION, CAST_STEPS, STPA_STEPS } from '@/utils/constants';
import Stepper from './stepper';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisSession, setCurrentStep, resetAnalysis } = useAnalysis();
  const [showResetDialog, setShowResetDialog] = useState(false);

  React.useEffect(() => {
    if (!analysisSession || !analysisSession.analysisType) {
      navigate('/start', { replace: true });
    }
  }, [analysisSession, navigate]);

  if (!analysisSession || !analysisSession.analysisType) {
    return (
      <div className="p-8 text-center text-slate-700 dark:text-slate-300">
        Loading analysis session...
      </div>
    );
  }

  const steps = analysisSession.analysisType === AnalysisType.CAST ? CAST_STEPS : STPA_STEPS;
  const currentStepIndex = steps.findIndex(step => location.pathname.startsWith(step.path));

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextStepPath = steps[currentStepIndex + 1].path;
      setCurrentStep(nextStepPath);
      navigate(nextStepPath);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStepPath = steps[currentStepIndex - 1].path;
      setCurrentStep(prevStepPath);
      navigate(prevStepPath);
    }
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    resetAnalysis();
    navigate('/');
  };

  const currentStepDefinition = steps[currentStepIndex];

  return (
    <FeedbackContainer>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-white/10 bg-neutral-950/80 text-white shadow-md backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <img src={webLogo} alt="Logo" className="mr-3 h-8 w-auto" />
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold tracking-wide">
                  {APP_TITLE} {APP_VERSION} /{' '}
                  <span className="text-lg font-bold opacity-80">
                    {analysisSession.analysisType}
                  </span>
                </h1>
                <p className="text-xs opacity-75">
                  Enterprise Safety Analysis Platform by MalmquistSafety
                </p>
              </div>
            </div>
            <Button onClick={handleReset} variant="danger" size="sm">
              Reset Analysis
            </Button>
          </div>
        </header>

        <Stepper
          steps={steps}
          currentPath={location.pathname}
          onNext={handleNext}
          onPrevious={handlePrevious}
          currentStepIndex={currentStepIndex}
        />

        <main className="flex flex-grow flex-col">
          <div className="flex flex-grow flex-col">
            {currentStepDefinition && (
              <h2 className="px-4 py-4 text-3xl font-bold text-slate-800 md:px-6 lg:px-8 dark:text-slate-100">
                {currentStepDefinition.title}
              </h2>
            )}
            <div className="flex-grow overflow-auto [&>div]:h-full [&>div]:p-4 [&>div]:md:p-6 [&>div]:lg:p-8">
              <Outlet />
            </div>
          </div>
        </main>

        <ConfirmationDialog
          open={showResetDialog}
          onOpenChange={setShowResetDialog}
          title="Reset Analysis"
          description="Are you sure you want to reset all analysis data and start over? This action cannot be undone."
          confirmText="Reset"
          onConfirm={confirmReset}
          variant="destructive"
        />
      </div>
    </FeedbackContainer>
  );
};

export default MainLayout;
