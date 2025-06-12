
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import { APP_TITLE, CAST_STEPS, STPA_STEPS } from '../../constants';
import { AnalysisType, StepDefinition } from '../../types';
import Button from '../shared/Button';

const Stepper: React.FC<{ steps: StepDefinition[]; currentPath: string; headerHeight: number }> = ({ steps, currentPath, headerHeight }) => {
  const navigate = useNavigate();
  const { analysisSession } = useAnalysis();
  if (!analysisSession) return null;

  return (
    <nav
      aria-label="Progress"
      className="bg-white shadow-sm sticky z-30"
      style={{ top: headerHeight }}
    >
      <ol
        role="list"
        className="flex items-center justify-center p-2 space-x-2 md:space-x-4 overflow-x-auto"
      >
        {steps.map((step, stepIdx) => {
          const isCurrent = currentPath === step.path || (currentPath.startsWith(step.path) && step.path !== '/'); // Handle nested routes better
          const isCompleted = steps.findIndex(s => s.path === currentPath) > stepIdx;

          return (
            <li key={step.shortTitle} className="flex-shrink-0">
              <button
                onClick={() => navigate(step.path)}
                className={`group flex flex-col items-center py-2 px-1 md:px-3 border-b-4 hover:border-sky-300 focus:outline-none 
                  ${isCurrent ? 'border-sky-500 text-sky-600' : isCompleted ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <span className={`text-xs md:text-sm font-medium ${isCurrent ? 'font-bold' : ''}`}>{step.shortTitle}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};


const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisSession, setCurrentStep, resetAnalysis } = useAnalysis();

  if (!analysisSession || !analysisSession.analysisType) {
     // This case should ideally be handled by App.tsx redirecting or showing StartupModal
    return <div className="p-8 text-center text-slate-700">Loading analysis session...</div>;
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

  const headerRef = React.useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    const updateHeight = () => setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header ref={headerRef} className="bg-sky-700 text-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{APP_TITLE} - {analysisSession.analysisType}</h1>
          <Button onClick={handleReset} variant="danger" size="sm">Reset Analysis</Button>
        </div>
      </header>

      <Stepper steps={steps} currentPath={location.pathname} headerHeight={headerHeight} />
      
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        {currentStepDefinition && (
             <h2 className="text-2xl font-semibold text-slate-700 mb-6">{currentStepDefinition.title}</h2>
        )}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-30 shadow-top">
        <div className="container mx-auto flex justify-between items-center">
          <Button onClick={handlePrevious} disabled={currentStepIndex <= 0} variant="secondary">
            Previous
          </Button>
          <div className="text-sm text-slate-500">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
          <Button onClick={handleNext} disabled={currentStepIndex >= steps.length - 1}>
            Next
          </Button>
        </div>
      </footer>
       <style>{`
        .shadow-top {
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
    