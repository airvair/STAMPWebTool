
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import { AnalysisType } from '../../types';
import Modal from '../shared/Modal';
import { CAST_STEPS, STPA_STEPS, APP_TITLE } from '../../constants';
import { ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const StartupModal: React.FC = () => {
  const { setAnalysisType, analysisSession } = useAnalysis();
  const navigate = useNavigate();

  const handleSelectType = (type: AnalysisType) => {
    const initialStep = type === AnalysisType.CAST ? CAST_STEPS[1].path : STPA_STEPS[1].path;
    setAnalysisType(type, initialStep);
    navigate(initialStep);
  };

  const isOpen = !analysisSession || !analysisSession.analysisType;

  return (
    <Modal isOpen={isOpen} title={APP_TITLE} persistent={true} size="lg">
      <div className="mx-auto max-w-xl">
        <div className="grid gap-6 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleSelectType(AnalysisType.CAST)}
            className="bg-white border rounded-lg shadow p-6 flex flex-col items-center text-center space-y-4 w-full cursor-pointer hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-transform"
          >
            <ExclamationTriangleIcon className="h-8 w-8 text-sky-600" />
            <p className="text-slate-700">
              Are you investigating an incident or accident or something that has already occurred?
            </p>
            <span className="text-sky-600 font-semibold">CAST Analysis</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectType(AnalysisType.STPA)}
            className="bg-white border rounded-lg shadow p-6 flex flex-col items-center text-center space-y-4 w-full cursor-pointer hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-transform"
          >
            <LightBulbIcon className="h-8 w-8 text-sky-600" />
            <p className="text-slate-700">
              Are you designing something new (physical system, training, procedure, organization or other)?
            </p>
            <span className="text-sky-600 font-semibold">STPA Analysis</span>
            <p className="text-xs text-slate-500 italic">
              A system is a set of interdependent parts sharing a common purpose. The performance of the whole is affected by each and every one of its parts.
            </p>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StartupModal;
