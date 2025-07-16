import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { APP_TITLE, APP_VERSION, CAST_STEPS, STPA_STEPS } from '@/utils/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AnalysisType } from '@/types/types';
import Button from '@/components/shared/Button';
import Stepper from './Stepper';
import { FeedbackContainer } from '@/components/shared/FeedbackNotification';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import webLogo from '@/assets/weblogo.webp';

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
    return <div className="p-8 text-center text-slate-700 dark:text-slate-300">Loading analysis session...</div>;
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
      <div className="min-h-screen flex flex-col">
        <header className="bg-neutral-950/80 backdrop-blur-sm text-white shadow-md border-b border-white/10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <img src={webLogo} alt="Logo" className="h-8 w-auto mr-3" />
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold tracking-wide">{APP_TITLE} {APP_VERSION} / <span className="text-lg font-bold opacity-80">{analysisSession.analysisType}</span></h1>
                <p className="text-xs opacity-75">Enterprise Safety Analysis Platform by MalmquistSafety</p>
              </div>
            </div>
            <Button onClick={handleReset} variant="danger" size="sm">Reset Analysis</Button>
          </div>
        </header>

        <Stepper
            steps={steps}
            currentPath={location.pathname}
            onNext={handleNext}
            onPrevious={handlePrevious}
            currentStepIndex={currentStepIndex}
        />

        <main className="flex-grow flex flex-col">
          <div className="flex-grow flex flex-col">
            {currentStepDefinition && (
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 px-4 md:px-6 lg:px-8 py-4">{currentStepDefinition.title}</h2>
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