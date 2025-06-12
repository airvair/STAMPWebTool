
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import { AnalysisType } from '../../types';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { CAST_STEPS, STPA_STEPS, APP_TITLE } from '../../constants';
import { ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import Stepper from '../layout/Stepper';

const StartupModal: React.FC = () => {
  const { setAnalysisType, analysisSession, resetAnalysis } = useAnalysis();
  const navigate = useNavigate();

  const handleSelectType = (type: AnalysisType) => {
    const initialStep = type === AnalysisType.CAST ? CAST_STEPS[1].path : STPA_STEPS[1].path;
    setAnalysisType(type, initialStep);
    navigate(initialStep);
  };

  const isOpen = !analysisSession || !analysisSession.analysisType;

  if (!isOpen && analysisSession) {
    const continueTo =
      analysisSession.currentStep ||
      (analysisSession.analysisType === AnalysisType.CAST
        ? CAST_STEPS[1].path
        : STPA_STEPS[1].path);
    const steps =
      analysisSession.analysisType === AnalysisType.CAST ? CAST_STEPS : STPA_STEPS;

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
        <header
          ref={headerRef}
          className="bg-sky-700 text-white shadow-md sticky top-0 z-40"
        >
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-semibold">
              {APP_TITLE} - {analysisSession.analysisType}
            </h1>
            <Button
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to reset all analysis data and start over? This action cannot be undone.'
                  )
                ) {
                  resetAnalysis();
                  navigate('/');
                }
              }}
              variant="danger"
              size="sm"
            >
              Reset Analysis
            </Button>
          </div>
        </header>

        <Stepper steps={steps} currentPath="/start" headerHeight={headerHeight} />

        <main className="flex-grow container mx-auto flex flex-col justify-center items-center p-8 space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-slate-700">{APP_TITLE}</h2>
          <p className="text-slate-700">
            You already have a {analysisSession.analysisType} session in progress.
          </p>
          <Button onClick={() => navigate(continueTo)}>Continue Analysis</Button>
        </main>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} title={APP_TITLE} persistent={true} size="lg">
      <div className="mx-auto max-w-xl">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white border rounded-lg shadow p-6 flex flex-col items-center text-center space-y-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-sky-600" />
            <p className="text-slate-700">
              Are you investigating an incident or accident or something that has already occurred?
            </p>
            <Button
              onClick={() => handleSelectType(AnalysisType.CAST)}
              className="w-full"
              size="lg"
            >
              CAST Analysis
            </Button>
          </div>
          <div className="bg-white border rounded-lg shadow p-6 flex flex-col items-center text-center space-y-4">
            <LightBulbIcon className="h-8 w-8 text-sky-600" />
            <p className="text-slate-700">
              Are you designing something new (physical system, training, procedure, organization or other)?
            </p>
            <Button
              onClick={() => handleSelectType(AnalysisType.STPA)}
              className="w-full"
              size="lg"
            >
              STPA Analysis
            </Button>
            <p className="text-xs text-slate-500 italic">
              A system is a set of interdependent parts sharing a common purpose. The performance of the whole is affected by each and every one of its parts.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StartupModal;
