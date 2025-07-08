import { ChevronLeftIcon, ChevronRightIcon, CheckIcon, XMarkIcon, LightBulbIcon } from '@heroicons/react/24/solid';
import React, { useState, useEffect, useMemo } from 'react';
import { UCA_QUESTIONS_MAP, CONTROLLER_TYPE_COLORS } from '@/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { getControllersBottomUp, getNextController, getNextControllerAdvanced, getControllerLevel } from '@/utils/controlStructureHierarchy';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import Textarea from '../shared/Textarea';
import { validateUCA } from '@/utils/ucaValidation';
import { useErrorHandler } from '@/utils/errorHandling';
import CompletenessProgressBar from './CompletenessProgressBar';

interface GuidedWorkflowState {
  currentControllerId: string | null;
  currentControlActionId: string | null;
  currentUcaTypeIndex: number;
  currentUcaInstanceIndex: number; // For multiple UCAs of the same type
  completedCombinations: Set<string>; // controller-action-ucatype-instance combinations
  skippedCombinations: Set<string>;
  lastMovement: 'lateral' | 'upward' | 'initial' | null;
}

interface UCAFormData {
  context: string;
  hazardIds: string[];
}

interface GuidedUCAWorkflowProps {
  hardwareMappings?: Array<{
    controllerId: string;
    relatedHardwareComponents: any[];
    criticalFailureModes: any[];
    recommendedUCAs: any[];
  }>;
}

const GuidedUCAWorkflow: React.FC<GuidedUCAWorkflowProps> = ({ hardwareMappings = [] }) => {
  const { 
    controllers, 
    controlActions, 
    controlPaths, 
    systemComponents, 
    hazards, 
    ucas, 
    addUCA, 
    updateUCA 
  } = useAnalysis();
  const { validateAndHandle, showSuccess } = useErrorHandler();

  const [workflowState, setWorkflowState] = useState<GuidedWorkflowState>({
    currentControllerId: null,
    currentControlActionId: null,
    currentUcaTypeIndex: 0,
    currentUcaInstanceIndex: 0,
    completedCombinations: new Set(),
    skippedCombinations: new Set(),
    lastMovement: null
  });

  const [formData, setFormData] = useState<UCAFormData>({
    context: '',
    hazardIds: []
  });

  // Get ordered controllers following the requirements (bottom to top, left to right)
  const orderedControllers = useMemo(() => 
    getControllersBottomUp(controllers, controlPaths, systemComponents),
    [controllers, controlPaths, systemComponents]
  );

  // Get current objects
  const currentController = controllers.find(c => c.id === workflowState.currentControllerId);
  const currentControlAction = controlActions.find(ca => ca.id === workflowState.currentControlActionId);
  const currentUcaType = UCA_QUESTIONS_MAP[workflowState.currentUcaTypeIndex];
  
  // Get hierarchy information
  const currentHierarchyLevel = currentController ? 
    getControllerLevel(currentController.id, controllers, controlPaths, systemComponents) : null;

  // Get available control actions for current controller (excluding out of scope)
  const availableControlActions = useMemo(() => 
    controlActions.filter(ca => 
      ca.controllerId === workflowState.currentControllerId && !ca.isOutOfScope
    ),
    [controlActions, workflowState.currentControllerId]
  );

  // Initialize workflow with first controller
  useEffect(() => {
    if (orderedControllers.length > 0 && !workflowState.currentControllerId) {
      const firstController = orderedControllers[0];
      const firstAction = controlActions.find(ca => 
        ca.controllerId === firstController.id && !ca.isOutOfScope
      );
      
      setWorkflowState(prev => ({
        ...prev,
        currentControllerId: firstController.id,
        currentControlActionId: firstAction?.id || null
      }));
    }
  }, [orderedControllers, controlActions, workflowState.currentControllerId]);

  // Load existing UCA if it exists for this specific instance
  useEffect(() => {
    if (currentControlAction && currentUcaType) {
      const existingUcas = ucas.filter(u => 
        u.controlActionId === currentControlAction.id && 
        u.ucaType === currentUcaType.type
      );
      
      // Get the UCA for this specific instance (if it exists)
      const ucaForInstance = existingUcas[workflowState.currentUcaInstanceIndex];
      
      if (ucaForInstance) {
        setFormData({
          context: ucaForInstance.context,
          hazardIds: ucaForInstance.hazardIds
        });
      } else {
        setFormData({ context: '', hazardIds: [] });
      }
    }
  }, [currentControlAction, currentUcaType, workflowState.currentUcaInstanceIndex, ucas]);

  const getCurrentCombinationKey = () => {
    if (!currentController || !currentControlAction || !currentUcaType) return '';
    return `${currentController.id}-${currentControlAction.id}-${currentUcaType.type}-${workflowState.currentUcaInstanceIndex}`;
  };

  // Check if there are existing UCAs for the current type to determine if we should allow another instance
  const getExistingUcasForCurrentType = () => {
    if (!currentControlAction || !currentUcaType) return [];
    return ucas.filter(u => 
      u.controlActionId === currentControlAction.id && 
      u.ucaType === currentUcaType.type
    );
  };


  // Get hardware-based suggestions for the current combination
  const getHardwareSuggestions = () => {
    if (!currentController || !currentControlAction || !currentUcaType) return [];
    
    const mapping = hardwareMappings.find(m => m.controllerId === currentController.id);
    if (!mapping) return [];
    
    return mapping.recommendedUCAs.filter(uca => 
      uca.controlActionId === currentControlAction.id && 
      uca.ucaType === currentUcaType.type
    );
  };

  const applySuggestion = (suggestion: any) => {
    setFormData({
      context: suggestion.contextTemplate,
      hazardIds: formData.hazardIds // Keep existing hazard links
    });
  };

  const moveToNextCombination = () => {
    const nextUcaIndex = workflowState.currentUcaTypeIndex + 1;
    
    if (nextUcaIndex < UCA_QUESTIONS_MAP.length) {
      // Next UCA type for same control action
      setWorkflowState(prev => ({
        ...prev,
        currentUcaTypeIndex: nextUcaIndex,
        currentUcaInstanceIndex: 0 // Reset instance index for new UCA type
      }));
    } else {
      // Next control action
      const currentActionIndex = availableControlActions.findIndex(ca => 
        ca.id === workflowState.currentControlActionId
      );
      
      if (currentActionIndex < availableControlActions.length - 1) {
        // Next action for same controller
        const nextAction = availableControlActions[currentActionIndex + 1];
        setWorkflowState(prev => ({
          ...prev,
          currentControlActionId: nextAction.id,
          currentUcaTypeIndex: 0,
          currentUcaInstanceIndex: 0
        }));
      } else {
        // Next controller using advanced navigation
        const { controller: nextController, movement } = getNextControllerAdvanced(
          workflowState.currentControllerId,
          controllers,
          controlPaths,
          systemComponents
        );
        
        if (nextController) {
          const nextControllerActions = controlActions.filter(ca => 
            ca.controllerId === nextController.id && !ca.isOutOfScope
          );
          
          setWorkflowState(prev => ({
            ...prev,
            currentControllerId: nextController.id,
            currentControlActionId: nextControllerActions[0]?.id || null,
            currentUcaTypeIndex: 0,
            currentUcaInstanceIndex: 0,
            lastMovement: movement === 'complete' ? null : movement
          }));
        } else {
          // All controllers have been processed - workflow is complete
          showSuccess('🎉 Guided UCA analysis complete! You have reviewed all control actions across all controllers.', 'Analysis Complete');
        }
      }
    }
  };

  const addAnotherUCAInstance = () => {
    if (!currentController || !currentControlAction || !currentUcaType) return;
    
    // Create UCA data for validation
    const ucaData = {
      controllerId: currentController.id,
      controlActionId: currentControlAction.id,
      ucaType: currentUcaType.type,
      context: formData.context,
      hazardIds: formData.hazardIds
    };

    // Validate UCA using MIT STPA compliance framework
    const validationResult = validateUCA(
      ucaData,
      controllers,
      controlActions,
      hazards
    );

    // Handle validation result with professional feedback
    if (!validateAndHandle(validationResult, 'GuidedUCAWorkflow', 'addAnotherUCAInstance')) {
      return;
    }

    // Save the current UCA first
    const existingUcas = ucas.filter(u => 
      u.controlActionId === currentControlAction.id && 
      u.ucaType === currentUcaType.type
    );
    
    const ucaForInstance = existingUcas[workflowState.currentUcaInstanceIndex];

    if (ucaForInstance) {
      updateUCA(ucaForInstance.id, ucaData);
      showSuccess('UCA updated successfully');
    } else {
      addUCA(ucaData);
      showSuccess('UCA added successfully');
    }

    // Mark current instance as completed
    setWorkflowState(prev => ({
      ...prev,
      currentUcaInstanceIndex: prev.currentUcaInstanceIndex + 1,
      completedCombinations: new Set([...prev.completedCombinations, getCurrentCombinationKey()])
    }));
    
    // Clear the form for the new instance
    setFormData({ context: '', hazardIds: [] });
  };

  const moveToPreviousCombination = () => {
    if (workflowState.currentUcaInstanceIndex > 0) {
      // Previous instance of the same UCA type
      setWorkflowState(prev => ({
        ...prev,
        currentUcaInstanceIndex: prev.currentUcaInstanceIndex - 1
      }));
    } else {
      // Previous UCA type for same control action
      const prevUcaIndex = workflowState.currentUcaTypeIndex - 1;
      
      if (prevUcaIndex >= 0) {
        setWorkflowState(prev => ({
          ...prev,
          currentUcaTypeIndex: prevUcaIndex,
          currentUcaInstanceIndex: 0 // Reset to first instance of previous UCA type
        }));
      } else {
        // Previous control action
        const currentActionIndex = availableControlActions.findIndex(ca => 
          ca.id === workflowState.currentControlActionId
        );
        
        if (currentActionIndex > 0) {
          // Previous action for same controller
          const prevAction = availableControlActions[currentActionIndex - 1];
          setWorkflowState(prev => ({
            ...prev,
            currentControlActionId: prevAction.id,
            currentUcaTypeIndex: UCA_QUESTIONS_MAP.length - 1,
            currentUcaInstanceIndex: 0
          }));
        } else {
          // Previous controller (would need more complex logic to go backwards)
          // For now, we&apos;ll just reset to first UCA type
          setWorkflowState(prev => ({
            ...prev,
            currentUcaTypeIndex: 0,
            currentUcaInstanceIndex: 0
          }));
        }
      }
    }
  };

  const handleSaveUCA = () => {
    if (!currentController || !currentControlAction || !currentUcaType) return;
    
    // Create UCA data for validation
    const ucaData = {
      controllerId: currentController.id,
      controlActionId: currentControlAction.id,
      ucaType: currentUcaType.type,
      context: formData.context,
      hazardIds: formData.hazardIds
    };

    // Validate UCA using MIT STPA compliance framework
    const validationResult = validateUCA(
      ucaData,
      controllers,
      controlActions,
      hazards
    );

    // Handle validation result with professional feedback
    if (!validateAndHandle(validationResult, 'GuidedUCAWorkflow', 'handleSaveUCA')) {
      return;
    }

    // Get existing UCAs for this type to find the specific instance
    const existingUcas = ucas.filter(u => 
      u.controlActionId === currentControlAction.id && 
      u.ucaType === currentUcaType.type
    );
    
    const ucaForInstance = existingUcas[workflowState.currentUcaInstanceIndex];

    if (ucaForInstance) {
      updateUCA(ucaForInstance.id, ucaData);
      showSuccess('UCA updated successfully');
    } else {
      addUCA(ucaData);
      showSuccess('UCA added successfully');
    }

    // Mark as completed and move to next
    setWorkflowState(prev => ({
      ...prev,
      completedCombinations: new Set([...prev.completedCombinations, getCurrentCombinationKey()])
    }));
    
    moveToNextCombination();
  };

  const handleSkip = () => {
    const key = getCurrentCombinationKey();
    setWorkflowState(prev => ({
      ...prev,
      skippedCombinations: new Set([...prev.skippedCombinations, key])
    }));
    moveToNextCombination();
  };

  const handleHazardChange = (hazardId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      hazardIds: checked 
        ? [...prev.hazardIds, hazardId]
        : prev.hazardIds.filter(id => id !== hazardId)
    }));
  };

  const getProgressInfo = () => {
    const totalCombinations = controllers.reduce((total, controller) => {
      const actions = controlActions.filter(ca => 
        ca.controllerId === controller.id && !ca.isOutOfScope
      );
      return total + (actions.length * UCA_QUESTIONS_MAP.length);
    }, 0);
    
    const completedCount = workflowState.completedCombinations.size;
    const skippedCount = workflowState.skippedCombinations.size;
    
    return { totalCombinations, completedCount, skippedCount };
  };

  const isWorkflowComplete = () => {
    // Check if we&apos;re at the last UCA type of the last control action of the last controller
    const isLastUcaType = workflowState.currentUcaTypeIndex === UCA_QUESTIONS_MAP.length - 1;
    const isLastAction = availableControlActions.findIndex(ca => 
      ca.id === workflowState.currentControlActionId
    ) === availableControlActions.length - 1;
    const isLastController = getNextController(
      workflowState.currentControllerId,
      controllers,
      controlPaths,
      systemComponents
    ) === null;
    
    return isLastUcaType && isLastAction && isLastController;
  };

  const { totalCombinations, completedCount, skippedCount } = getProgressInfo();
  const progressPercentage = totalCombinations > 0 ? 
    ((completedCount + skippedCount) / totalCombinations) * 100 : 0;

  if (!currentController || !currentControlAction || !currentUcaType) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-300">
          No control actions available for guided analysis. Please ensure controllers and control actions are defined in Step 3.
        </p>
      </div>
    );
  }

  const currentKey = getCurrentCombinationKey();
  const isCompleted = workflowState.completedCombinations.has(currentKey);
  const isSkipped = workflowState.skippedCombinations.has(currentKey);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Guided UCA Analysis Progress
          </h3>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {completedCount + skippedCount} of {totalCombinations} combinations reviewed
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Systematic Completeness Progress */}
      <CompletenessProgressBar compact={true} />

      {/* Current Analysis Context */}
      <div className={`p-6 rounded-lg border ${CONTROLLER_TYPE_COLORS[currentController.ctrlType]}`}>
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Controller: {currentController.name} ({currentController.ctrlType})
            </h3>
            {currentHierarchyLevel !== null && (
              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 rounded">
                Level {currentHierarchyLevel}
              </span>
            )}
            {workflowState.lastMovement === 'upward' && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded">
                ↑ Moved Up
              </span>
            )}
            {workflowState.lastMovement === 'lateral' && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded">
                → Lateral
              </span>
            )}
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Control Action: {currentControlAction.verb} {currentControlAction.object}
          </p>
          <p className="text-md font-medium text-blue-700 dark:text-blue-300">
            UCA Type: {currentUcaType.type} 
            {workflowState.currentUcaInstanceIndex > 0 && (
              <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                Instance #{workflowState.currentUcaInstanceIndex + 1}
              </span>
            )}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Guide Question:
          </p>
          <p className="text-blue-700 dark:text-blue-300 italic">
            {currentUcaType.question}
          </p>
          
          {getExistingUcasForCurrentType().length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                Existing UCAs for this type ({getExistingUcasForCurrentType().length}):
              </p>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {getExistingUcasForCurrentType().map((uca, index) => (
                  <p key={uca.id} className="text-xs text-blue-600 dark:text-blue-300 truncate">
                    #{index + 1}: {uca.context.substring(0, 50)}...
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {(isCompleted || isSkipped) && (
          <div className={`flex items-center gap-2 mb-4 p-2 rounded ${
            isCompleted 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
          }`}>
            {isCompleted ? <CheckIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
            <span className="font-medium">
              {isCompleted ? 'UCA Completed' : 'Skipped - No UCA Identified'}
            </span>
          </div>
        )}

        {/* Hardware Suggestions */}
        {getHardwareSuggestions().length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <LightBulbIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h6 className="font-medium text-yellow-800 dark:text-yellow-200">
                Hardware-Based Suggestions
              </h6>
            </div>
            <div className="space-y-2">
              {getHardwareSuggestions().map((suggestion, index) => (
                <div key={index} className="bg-white dark:bg-yellow-800/30 border border-yellow-300 dark:border-yellow-700 rounded p-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-grow">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                        {suggestion.reasoning}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 italic">
                        "{suggestion.contextTemplate}"
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Priority: {suggestion.priority}
                      </p>
                    </div>
                    <Button
                      onClick={() => applySuggestion(suggestion)}
                      size="sm"
                      variant="secondary"
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:hover:bg-yellow-600 dark:text-yellow-100"
                    >
                      Use
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UCA Form */}
        <div className="space-y-4">
          <Textarea
            label="Context (Why is this unsafe? Describe the specific conditions)"
            value={formData.context}
            onChange={e => setFormData(prev => ({ ...prev, context: e.target.value }))}
            placeholder="Describe the specific conditions or scenario under which this control action becomes unsafe..."
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Link to Hazards (select at least one):
            </label>
            <div className="max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
              {hazards.map(hazard => (
                <Checkbox
                  key={hazard.id}
                  id={`hazard-${hazard.id}`}
                  label={`${hazard.code}: ${hazard.title}`}
                  checked={formData.hazardIds.includes(hazard.id)}
                  onChange={e => handleHazardChange(hazard.id, e.target.checked)}
                  containerClassName="mb-2"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            onClick={moveToPreviousCombination}
            variant="secondary"
            leftIcon={<ChevronLeftIcon className="w-5 h-5" />}
            disabled={workflowState.currentUcaTypeIndex === 0 && 
              workflowState.currentUcaInstanceIndex === 0 &&
              availableControlActions.findIndex(ca => ca.id === workflowState.currentControlActionId) === 0}
          >
            Previous
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={handleSkip}
              variant="secondary"
            >
              Skip (No UCA)
            </Button>
            <Button
              onClick={handleSaveUCA}
              disabled={!formData.context.trim() || formData.hazardIds.length === 0}
            >
              Save UCA & Continue
            </Button>
            <Button
              onClick={addAnotherUCAInstance}
              variant="secondary"
              disabled={!formData.context.trim() || formData.hazardIds.length === 0}
              className="bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-200"
            >
              Save & Add Another
            </Button>
          </div>

          <Button
            onClick={moveToNextCombination}
            variant="secondary"
            rightIcon={<ChevronRightIcon className="w-5 h-5" />}
            disabled={isWorkflowComplete()}
          >
            {isWorkflowComplete() ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuidedUCAWorkflow;