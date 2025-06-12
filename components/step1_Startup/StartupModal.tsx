
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../../hooks/useAnalysis';
import { AnalysisType } from '../../types';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { CAST_STEPS, STPA_STEPS, APP_TITLE } from '../../constants'; // APP_TITLE can be used if STAMP Tool is a prefix

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
    <Modal isOpen={isOpen} title={APP_TITLE} persistent={true} size="lg"> {/* Changed title and potentially size for more text */}
      <div className="text-center">
        <div className="space-y-6">
          <div>
            <p className="text-lg text-slate-700 mb-3">
              Are you investigating an incident or accident or something that has already occurred?
            </p>
            <Button 
              onClick={() => handleSelectType(AnalysisType.CAST)} 
              className="w-full md:w-auto"
              size="lg"
            >
              Yes (Proceed to CAST Analysis)
            </Button>
          </div>
          <hr className="my-4"/>
          <div>
            <p className="text-lg text-slate-700 mb-3">
              Are you designing something new (physical system, training, procedure, organization or other)?
            </p>
            <Button 
              onClick={() => handleSelectType(AnalysisType.STPA)} 
              className="w-full md:w-auto"
              size="lg"
            >
              Yes (Proceed to STPA Analysis)
            </Button>
          </div>
        </div>
        <p className="mt-8 text-sm text-slate-500">
          A system is a set of interdependent parts sharing a common purpose. The performance of the whole is affected by each and every one of its parts.
        </p>
      </div>
    </Modal>
  );
};

export default StartupModal;