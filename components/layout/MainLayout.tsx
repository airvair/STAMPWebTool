import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAnalysis } from '@/hooks/useAnalysis';
import { APP_TITLE, APP_VERSION, CAST_STEPS, STPA_STEPS } from '@/constants';
import { AnalysisType } from '@/types';
import Button from '../shared/Button';
import Stepper from './Stepper';
import webLogo from '/weblogo.webp';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisSession, setCurrentStep, resetAnalysis } = useAnalysis();

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
    if (window.confirm("Are you sure you want to reset all analysis data and start over? This action cannot be undone.")) {
      resetAnalysis();
      navigate('/');
    }
  };

  const currentStepDefinition = steps[currentStepIndex];

  return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-neutral-950/80 backdrop-blur-sm text-white shadow-md border-b border-white/10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <img src={webLogo} alt="Logo" className="h-8 w-auto mr-3" />
              <h1 className="text-lg font-semibold tracking-wide">{APP_TITLE} {APP_VERSION} / <span className="font-normal opacity-80">{analysisSession.analysisType}</span></h1>
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

        <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
          {currentStepDefinition && (
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">{currentStepDefinition.title}</h2>
          )}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800">
            <div className="p-6 md:p-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
  );
};

export default MainLayout;