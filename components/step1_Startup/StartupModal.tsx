
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import { AnalysisType } from '../../types';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { CAST_STEPS, STPA_STEPS, APP_TITLE } from '../../constants';
import { ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import Stepper from '../shared/Stepper';

const StartupModal: React.FC = () => {
  const { setAnalysisType, analysisSession } = useAnalysis();
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
    const steps = analysisSession.analysisType === AnalysisType.CAST ? CAST_STEPS : STPA_STEPS;
    return (
      <div className="min-h-screen flex flex-col">
        <Stepper steps={steps} currentPath={analysisSession.currentStep || continueTo} />
        <div className="flex-grow flex flex-col items-center justify-center p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-700">{APP_TITLE}</h2>
          <p className="text-slate-700 text-center">
            You already have a {analysisSession.analysisType} session in progress.
          </p>
          <Button onClick={() => navigate(continueTo)}>Continue Analysis</Button>
        </div>
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
