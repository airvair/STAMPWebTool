import React, { useState, useMemo, useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Controller, ControlAction, UCCA, UCCAType } from '@/types';
import { 
  UCCAIdentificationAlgorithm, 
  AuthorityTuple, 
  PotentialUCCA, 
  UCCAAlgorithmType,
  AbstractionLevel 
} from '@/utils/uccaAlgorithms';
import Button from '../shared/Button';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Select from '../shared/Select';
import Modal from '../shared/Modal';
import { 
  BeakerIcon, 
  SparklesIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon 
} from '@heroicons/react/24/solid';

interface UCCAWorkflowState {
  currentPhase: 'setup' | 'generation' | 'review' | 'refinement' | 'complete';
  authorityTuple: AuthorityTuple;
  generatedUCCAs: PotentialUCCA[];
  currentReviewIndex: number;
  acceptedUCCAs: Set<number>;
  rejectedUCCAs: Set<number>;
  modifiedUCCAs: Map<number, Partial<PotentialUCCA>>;
}

interface UCCAGenerationSettings {
  maxCombinationSize: number;
  includeAbstraction2a: boolean;
  includeAbstraction2b: boolean;
  includeType1_2: boolean;
  includeType3_4: boolean;
  filterEquivalent: boolean;
}

interface GuidedUCCAWorkflowProps {
  workflowLevel: 'controller' | 'cross-level' | 'organizational';
  availableControllers: Controller[];
}

const GuidedUCCAWorkflow: React.FC<GuidedUCCAWorkflowProps> = ({ 
  workflowLevel, 
  availableControllers 
}) => {
  const { 
    controllers, 
    controlActions, 
    controlPaths,
    systemComponents,
    hazards,
    addUCCA,
    updateUCCA 
  } = useAnalysis();

  const [workflowState, setWorkflowState] = useState<UCCAWorkflowState>({
    currentPhase: 'setup',
    authorityTuple: {
      controllers: new Set(),
      controlActions: new Set(),
      authorities: new Map()
    },
    generatedUCCAs: [],
    currentReviewIndex: 0,
    acceptedUCCAs: new Set(),
    rejectedUCCAs: new Set(),
    modifiedUCCAs: new Map()
  });

  const [generationSettings, setGenerationSettings] = useState<UCCAGenerationSettings>({
    maxCombinationSize: 3,
    includeAbstraction2a: true,
    includeAbstraction2b: true,
    includeType1_2: true,
    includeType3_4: workflowLevel !== 'organizational', // Organizational analysis focuses on Type 1-2
    filterEquivalent: true
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedControllerIds, setSelectedControllerIds] = useState<Set<string>>(new Set());

  // Initialize authority tuple based on workflow level
  useEffect(() => {
    if (selectedControllerIds.size === 0) return;

    const selectedControllers = controllers.filter(c => selectedControllerIds.has(c.id));
    const relevantActions = controlActions.filter(ca => 
      selectedControllerIds.has(ca.controllerId) && !ca.isOutOfScope
    );

    const authorities = new Map<string, Set<string>>();
    selectedControllers.forEach(controller => {
      const controllerActions = relevantActions
        .filter(ca => ca.controllerId === controller.id)
        .map(ca => ca.id);
      authorities.set(controller.id, new Set(controllerActions));
    });

    setWorkflowState(prev => ({
      ...prev,
      authorityTuple: {
        controllers: new Set(selectedControllers),
        controlActions: new Set(relevantActions),
        authorities
      }
    }));
  }, [selectedControllerIds, controllers, controlActions]);

  const handleGenerateUCCAs = () => {
    if (workflowState.authorityTuple.controllers.size < 2) {
      alert('UCCA analysis requires at least 2 controllers. Please select more controllers.');
      return;
    }

    setWorkflowState(prev => ({ ...prev, currentPhase: 'generation' }));

    // Generate UCCAs using the thesis algorithms
    const generatedUCCAs = UCCAIdentificationAlgorithm.enumerateControlActionCombinations(
      workflowState.authorityTuple,
      generationSettings.maxCombinationSize
    );

    // Filter based on settings
    let filteredUCCAs = generatedUCCAs;

    if (!generationSettings.includeAbstraction2a) {
      filteredUCCAs = filteredUCCAs.filter(ucca => ucca.abstraction !== AbstractionLevel.Abstraction2a);
    }

    if (!generationSettings.includeAbstraction2b) {
      filteredUCCAs = filteredUCCAs.filter(ucca => ucca.abstraction !== AbstractionLevel.Abstraction2b);
    }

    if (!generationSettings.includeType1_2) {
      filteredUCCAs = filteredUCCAs.filter(ucca => ucca.type !== UCCAAlgorithmType.Type1_2);
    }

    if (!generationSettings.includeType3_4) {
      filteredUCCAs = filteredUCCAs.filter(ucca => ucca.type !== UCCAAlgorithmType.Type3_4);
    }

    // Sort by risk score
    const prioritizedUCCAs = UCCAIdentificationAlgorithm.prioritizeUCCAs(filteredUCCAs);

    setWorkflowState(prev => ({
      ...prev,
      generatedUCCAs: prioritizedUCCAs,
      currentPhase: 'review',
      currentReviewIndex: 0
    }));
  };

  const handleAcceptUCCA = (index: number) => {
    setWorkflowState(prev => ({
      ...prev,
      acceptedUCCAs: new Set([...prev.acceptedUCCAs, index]),
      rejectedUCCAs: new Set([...prev.rejectedUCCAs].filter(i => i !== index))
    }));
  };

  const handleRejectUCCA = (index: number) => {
    setWorkflowState(prev => ({
      ...prev,
      rejectedUCCAs: new Set([...prev.rejectedUCCAs, index]),
      acceptedUCCAs: new Set([...prev.acceptedUCCAs].filter(i => i !== index))
    }));
  };

  const handleModifyUCCA = (index: number, modifications: Partial<PotentialUCCA>) => {
    setWorkflowState(prev => ({
      ...prev,
      modifiedUCCAs: new Map(prev.modifiedUCCAs.set(index, modifications)),
      acceptedUCCAs: new Set([...prev.acceptedUCCAs, index])
    }));
  };

  const handleCompleteReview = () => {
    // Convert accepted UCCAs to actual UCCA records
    const acceptedIndices = Array.from(workflowState.acceptedUCCAs);
    
    acceptedIndices.forEach(index => {
      const potentialUCCA = workflowState.generatedUCCAs[index];
      const modifications = workflowState.modifiedUCCAs.get(index);
      
      const finalUCCA = modifications ? { ...potentialUCCA, ...modifications } : potentialUCCA;
      
      // Convert to UCCA format
      const ucca: Omit<UCCA, 'id' | 'code'> = {
        description: finalUCCA.description,
        context: finalUCCA.enumerationReason,
        hazardIds: [], // Will be set by user in next step
        uccaType: mapAlgorithmTypeToUCCAType(finalUCCA.type, finalUCCA.abstraction),
        involvedControllerIds: Array.from(new Set(finalUCCA.combinations.map(c => c.controllerId))),
        involvedRoleIds: [],
        temporalRelationship: finalUCCA.type === UCCAAlgorithmType.Type3_4 ? 'Sequential' : 'Simultaneous',
        operationalContextId: '',
        isSystematic: true
      };

      addUCCA(ucca);
    });

    setWorkflowState(prev => ({ ...prev, currentPhase: 'complete' }));
  };

  const mapAlgorithmTypeToUCCAType = (
    algorithmType: UCCAAlgorithmType, 
    abstraction: AbstractionLevel
  ): UCCAType => {
    if (abstraction === AbstractionLevel.Abstraction2a) {
      return UCCAType.Team;
    }
    
    switch (algorithmType) {
      case UCCAAlgorithmType.Type1_2:
        return workflowLevel === 'organizational' ? UCCAType.Organizational : UCCAType.Role;
      case UCCAAlgorithmType.Type3_4:
        return UCCAType.CrossController;
      default:
        return UCCAType.Team;
    }
  };

  const currentUCCA = workflowState.generatedUCCAs[workflowState.currentReviewIndex];
  const totalGenerated = workflowState.generatedUCCAs.length;

  const renderSetupPhase = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          {workflowLevel === 'controller' && 'Controller-Level UCCA Setup'}
          {workflowLevel === 'cross-level' && 'Cross-Level UCCA Setup'}
          {workflowLevel === 'organizational' && 'Organizational UCCA Setup'}
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {workflowLevel === 'controller' && 'Select controllers at the same hierarchy level to analyze coordination issues between peer controllers.'}
          {workflowLevel === 'cross-level' && 'Select controllers from different hierarchy levels to analyze supervision and coordination issues.'}
          {workflowLevel === 'organizational' && 'Select organizational controllers (departments/roles) to analyze policy and resource coordination issues.'}
        </p>
      </div>

      {/* Controller Selection */}
      <div className="space-y-4">
        <h5 className="font-medium text-slate-800 dark:text-slate-100">
          Select Controllers for UCCA Analysis
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableControllers.map(controller => (
            <div key={controller.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={`controller-${controller.id}`}
                label=""
                checked={selectedControllerIds.has(controller.id)}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedControllerIds(prev => new Set([...prev, controller.id]));
                  } else {
                    setSelectedControllerIds(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(controller.id);
                      return newSet;
                    });
                  }
                }}
              />
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-100">
                  {controller.name}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {controller.ctrlType} • {controlActions.filter(ca => ca.controllerId === controller.id && !ca.isOutOfScope).length} actions
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Settings */}
      <div className="flex justify-between items-center">
        <Button
          onClick={() => setShowSettingsModal(true)}
          variant="secondary"
          leftIcon={<BeakerIcon className="w-5 h-5" />}
        >
          Algorithm Settings
        </Button>
        
        <Button
          onClick={handleGenerateUCCAs}
          disabled={selectedControllerIds.size < 2}
          leftIcon={<SparklesIcon className="w-5 h-5" />}
        >
          Generate UCCAs
        </Button>
      </div>
    </div>
  );

  const renderReviewPhase = () => {
    if (!currentUCCA) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-300">
            No UCCAs generated. Please adjust your settings and try again.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Review Generated UCCAs
          </h4>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {workflowState.currentReviewIndex + 1} of {totalGenerated}
          </span>
        </div>

        {/* Current UCCA */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h5 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                {currentUCCA.description}
              </h5>
              <div className="flex gap-2 mb-2">
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded">
                  {currentUCCA.type}
                </span>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded">
                  {currentUCCA.abstraction}
                </span>
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 rounded">
                  Risk: {currentUCCA.riskScore}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Enumeration Reason:</label>
              <p className="text-sm text-slate-600 dark:text-slate-300">{currentUCCA.enumerationReason}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Controller Combinations:</label>
              <div className="mt-1 space-y-1">
                {currentUCCA.combinations.map((combo, index) => (
                  <div key={index} className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-2 rounded">
                    {controllers.find(c => c.id === combo.controllerId)?.name}: {' '}
                    {controlActions.find(a => a.id === combo.actionId)?.verb} {controlActions.find(a => a.id === combo.actionId)?.object} 
                    {combo.provided !== undefined && ` (${combo.provided ? 'Provided' : 'Not Provided'})`}
                    {combo.timing && ` (${combo.timing})`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Review Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <Button
              onClick={() => handleRejectUCCA(workflowState.currentReviewIndex)}
              variant="secondary"
              leftIcon={<XMarkIcon className="w-5 h-5" />}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Reject
            </Button>
            <Button
              onClick={() => handleAcceptUCCA(workflowState.currentReviewIndex)}
              leftIcon={<CheckCircleIcon className="w-5 h-5" />}
            >
              Accept
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setWorkflowState(prev => ({ 
                ...prev, 
                currentReviewIndex: Math.max(0, prev.currentReviewIndex - 1) 
              }))}
              variant="secondary"
              leftIcon={<ChevronLeftIcon className="w-5 h-5" />}
              disabled={workflowState.currentReviewIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                if (workflowState.currentReviewIndex === totalGenerated - 1) {
                  handleCompleteReview();
                } else {
                  setWorkflowState(prev => ({ 
                    ...prev, 
                    currentReviewIndex: Math.min(totalGenerated - 1, prev.currentReviewIndex + 1) 
                  }));
                }
              }}
              rightIcon={<ChevronRightIcon className="w-5 h-5" />}
            >
              {workflowState.currentReviewIndex === totalGenerated - 1 ? 'Complete Review' : 'Next'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">{workflowState.acceptedUCCAs.size}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Accepted</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">{workflowState.rejectedUCCAs.size}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Rejected</div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-600">
                {totalGenerated - workflowState.acceptedUCCAs.size - workflowState.rejectedUCCAs.size}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Pending</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompletePhase = () => (
    <div className="text-center py-12">
      <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        UCCA Analysis Complete!
      </h3>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Generated and reviewed {workflowState.acceptedUCCAs.size} UCCAs for {workflowLevel} analysis.
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{totalGenerated}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">Generated</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{workflowState.acceptedUCCAs.size}</div>
          <div className="text-sm text-slate-600 dark:text-slate-300">Accepted</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {workflowState.currentPhase === 'setup' && renderSetupPhase()}
      {workflowState.currentPhase === 'generation' && (
        <div className="text-center py-8">
          <SparklesIcon className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 dark:text-slate-300">Generating UCCAs using thesis algorithms...</p>
        </div>
      )}
      {workflowState.currentPhase === 'review' && renderReviewPhase()}
      {workflowState.currentPhase === 'complete' && renderCompletePhase()}

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="UCCA Generation Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Maximum Combination Size
            </label>
            <Select
              value={generationSettings.maxCombinationSize.toString()}
              onChange={e => setGenerationSettings(prev => ({ 
                ...prev, 
                maxCombinationSize: parseInt(e.target.value) 
              }))}
              options={[
                { value: '2', label: '2 controllers' },
                { value: '3', label: '3 controllers' },
                { value: '4', label: '4 controllers' },
                { value: '5', label: '5 controllers' }
              ]}
            />
          </div>

          <div className="space-y-3">
            <Checkbox
              id="abstraction2a"
              label="Include Abstraction 2a (Team-level analysis)"
              checked={generationSettings.includeAbstraction2a}
              onChange={e => setGenerationSettings(prev => ({ 
                ...prev, 
                includeAbstraction2a: e.target.checked 
              }))}
            />
            <Checkbox
              id="abstraction2b"
              label="Include Abstraction 2b (Controller-specific analysis)"
              checked={generationSettings.includeAbstraction2b}
              onChange={e => setGenerationSettings(prev => ({ 
                ...prev, 
                includeAbstraction2b: e.target.checked 
              }))}
            />
            <Checkbox
              id="type1_2"
              label="Include Type 1-2 UCCAs (Provide/Not Provide)"
              checked={generationSettings.includeType1_2}
              onChange={e => setGenerationSettings(prev => ({ 
                ...prev, 
                includeType1_2: e.target.checked 
              }))}
            />
            <Checkbox
              id="type3_4"
              label="Include Type 3-4 UCCAs (Temporal Relationships)"
              checked={generationSettings.includeType3_4}
              onChange={e => setGenerationSettings(prev => ({ 
                ...prev, 
                includeType3_4: e.target.checked 
              }))}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => setShowSettingsModal(false)}>
              Apply Settings
            </Button>
            <Button onClick={() => setShowSettingsModal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GuidedUCCAWorkflow;