import { PlusIcon, TrashIcon, SparklesIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import React, { useState, useEffect } from 'react';
import { UCA_QUESTIONS_MAP, CONTROLLER_TYPE_COLORS } from '@/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { UnsafeControlAction, UCAType, UCCA, UCCAType } from '@/types';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';
import GuidedWorkflowOrchestrator from './GuidedWorkflowOrchestrator';
import SmartSuggestionsPanel from './SmartSuggestionsPanel';
import { validateUCA, validateUCCALogic } from '@/utils/ucaValidation';
import { useErrorHandler } from '@/utils/errorHandling';
import { UcaSuggestion } from '@/utils/smartUcaSuggestions';

interface UCAFormState {
  context: string;
  hazardIds: string[];
}

interface UCCAFormState {
  description: string;
  context: string;
  hazardIds: string[];
}

type AnalysisMode = 'comprehensive-guided' | 'manual';

const UnsafeControlActions: React.FC = () => {
  const { controllers, controlActions, ucas, addUCA, updateUCA, deleteUCA, hazards,
    uccas, addUCCA, updateUCCA, deleteUCCA } = useAnalysis();
  const { validateAndHandle, showSuccess } = useErrorHandler();

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('comprehensive-guided');

  const [selectedControllerId, setSelectedControllerId] = useState<string | null>(null);
  const [selectedControlActionId, setSelectedControlActionId] = useState<string | null>(null);
  const [selectedUcaType, setSelectedUcaType] = useState<UCAType | null>(null);

  const [formState, setFormState] = useState<UCAFormState>({ context: '', hazardIds: [] });
  const [editingUcaId, setEditingUcaId] = useState<string | null>(null);

  const [uccaForm, setUccaForm] = useState<UCCAFormState>({ description: '', context: '', hazardIds: [] });
  const [editingUccaId, setEditingUccaId] = useState<string | null>(null);

  const availableControlActions = controlActions.filter(ca => ca.controllerId === selectedControllerId && !ca.isOutOfScope);
  const currentControlAction = controlActions.find(ca => ca.id === selectedControlActionId);

  useEffect(() => {
    // Reset selections if controller changes
    setSelectedControlActionId(null);
    setSelectedUcaType(null);
    resetForm();
  }, [selectedControllerId]);

  useEffect(() => {
    // Reset form if control action or UCA type changes
    resetForm();
  }, [selectedControlActionId, selectedUcaType]);

  const resetForm = () => {
    setFormState({ context: '', hazardIds: [] });
    setEditingUcaId(null);
    setUccaForm({ description: '', context: '', hazardIds: [] });
    setEditingUccaId(null);
  };

  const handleSuggestionSelect = (suggestion: UcaSuggestion) => {
    // Set the form to match the suggestion
    setSelectedControllerId(suggestion.controllerId);
    setSelectedControlActionId(suggestion.controlActionId);
    setSelectedUcaType(suggestion.ucaType);
    setFormState({
      context: suggestion.context,
      hazardIds: suggestion.suggestedHazards
    });
    
    // Clear any existing editing state
    setEditingUcaId(null);
  };

  const handleHazardLinkChange = (hazardId: string, checked: boolean) => {
    setFormState(prev => {
      const newHazardIds = checked
          ? [...prev.hazardIds, hazardId]
          : prev.hazardIds.filter(id => id !== hazardId);
      return { ...prev, hazardIds: newHazardIds };
    });
  };

  const handleUccaHazardLinkChange = (hazardId: string, checked: boolean) => {
    setUccaForm(prev => {
      const newHazardIds = checked
          ? [...prev.hazardIds, hazardId]
          : prev.hazardIds.filter(id => id !== hazardId);
      return { ...prev, hazardIds: newHazardIds };
    });
  };

  const handleSaveUCA = () => {
    if (!selectedControlActionId || !selectedUcaType || !currentControlAction) {
      return;
    }

    // Create UCA data for validation
    const ucaData: Partial<UnsafeControlAction> = {
      controllerId: currentControlAction.controllerId,
      controlActionId: selectedControlActionId,
      ucaType: selectedUcaType,
      context: formState.context,
      hazardIds: formState.hazardIds,
    };

    // Validate UCA using MIT STPA compliance framework
    const validationResult = validateUCA(
      ucaData,
      controllers,
      controlActions,
      hazards
    );

    // Handle validation result with professional feedback
    if (!validateAndHandle(validationResult, 'UnsafeControlActions', 'saveUCA')) {
      return;
    }

    // Check for existing UCA of same type
    if (!editingUcaId) {
      const existing = ucas.find(u => u.controlActionId === selectedControlActionId && u.ucaType === selectedUcaType);
      if (existing) {
        setEditingUcaId(existing.id);
        setFormState({context: existing.context, hazardIds: existing.hazardIds});
        return;
      }
    }

    // Save UCA
    const completeUcaData: Omit<UnsafeControlAction, 'id' | 'code'> = {
      controllerId: currentControlAction.controllerId,
      controlActionId: selectedControlActionId,
      ucaType: selectedUcaType,
      context: formState.context,
      hazardIds: formState.hazardIds,
      riskCategory: 'Medium' // Default risk category
    };

    if (editingUcaId) {
      updateUCA(editingUcaId, completeUcaData);
      showSuccess('UCA updated successfully');
    } else {
      addUCA(completeUcaData);
      showSuccess('UCA added successfully');
    }

    resetForm();
  };

  const handleSaveUCCA = () => {
    // Create UCCA data for validation
    const uccaData: Partial<UCCA> = {
      description: uccaForm.description,
      context: uccaForm.context,
      hazardIds: uccaForm.hazardIds,
      uccaType: UCCAType.Team,
      involvedControllerIds: [] // TODO: Add UI for selecting involved controllers
    };

    // Validate UCCA using MIT STPA compliance framework
    const validationResult = validateUCCALogic(
      uccaData,
      controllers,
      controlActions
    );

    // Handle validation result with professional feedback
    if (!validateAndHandle(validationResult, 'UnsafeControlActions', 'saveUCCA')) {
      return;
    }

    // Save UCCA
    const completeUccaData: Omit<UCCA, 'id' | 'code'> = {
      description: uccaForm.description,
      context: uccaForm.context,
      hazardIds: uccaForm.hazardIds,
      uccaType: UCCAType.Team,
      involvedControllerIds: []
    };

    if (editingUccaId) {
      updateUCCA(editingUccaId, completeUccaData);
      showSuccess('UCCA updated successfully');
    } else {
      addUCCA(completeUccaData);
      showSuccess('UCCA added successfully');
    }

    setUccaForm({ description: '', context: '', hazardIds: [] });
    setEditingUccaId(null);
  };

  const loadUcaForEdit = (uca: UnsafeControlAction) => {
    setSelectedControllerId(uca.controllerId);
    setSelectedControlActionId(uca.controlActionId);
    setSelectedUcaType(uca.ucaType);
    setFormState({ context: uca.context, hazardIds: uca.hazardIds });
    setEditingUcaId(uca.id);
  };

  const loadUccaForEdit = (ucca: UCCA) => {
    setUccaForm({ description: ucca.description, context: ucca.context, hazardIds: ucca.hazardIds });
    setEditingUccaId(ucca.id);
  };

  const displayedUcas = ucas.filter(u => selectedControlActionId ? u.controlActionId === selectedControlActionId : true)
      .filter(u => selectedUcaType ? u.ucaType === selectedUcaType : true)
      .filter(u => selectedControllerId ? u.controllerId === selectedControllerId : true);

  const displayedUccas = uccas;


  if (controllers.length === 0) return <p className="text-slate-600">No controllers defined. Please complete Step 3.</p>;
  if (controlActions.filter(ca => !ca.isOutOfScope).length === 0) return <p className="text-slate-600">No (in-scope) control actions defined. Please complete Step 3.</p>;
  if (hazards.length === 0) return <p className="text-slate-600">No hazards defined. Please complete Step 2 (Losses & Hazards).</p>;

  const controllerOptions = controllers.map(c => ({ value: c.id, label: `${c.name} (${c.ctrlType})` }));
  const controlActionOptions = availableControlActions.map(ca => ({ value: ca.id, label: `${ca.verb} ${ca.object}` }));
  const ucaTypeOptions = UCA_QUESTIONS_MAP.map(q => ({ value: q.type, label: q.type }));

  const renderAnalysisModeContent = () => {
    switch (analysisMode) {
      case 'comprehensive-guided':
        return (
          <div className="space-y-6">
            {/* Progress Indicator */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Analysis Progress</h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">6 Phases</span>
              </div>
              <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                     style={{ width: '16.67%' }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-600 dark:text-slate-400">
                <span>Hardware</span>
                <span>Individual UCA</span>
                <span>Controller UCCA</span>
                <span>Cross-Level</span>
                <span>Organizational</span>
                <span>Validation</span>
              </div>
            </div>
            <GuidedWorkflowOrchestrator />
          </div>
        );
      case 'manual':
      default:
        return renderManualAnalysis();
    }
  };

  const renderManualAnalysis = () => (
    <div className="space-y-8">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        For each control action, analyze potential Unsafe Control Actions (UCAs) using the provided guide questions.
        Document the context in which the control action becomes unsafe and link it to relevant hazards.
      </p>

      {/* Filters: Controller, Control Action, UCA Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <Select label="Filter by Controller" value={selectedControllerId || ''} onChange={e => setSelectedControllerId(e.target.value)} options={[{value: '', label: 'All Controllers'}, ...controllerOptions]} placeholder="All Controllers" />
        <Select label="Filter by Control Action" value={selectedControlActionId || ''} onChange={e => setSelectedControlActionId(e.target.value)} options={[{value: '', label: 'All Actions'}, ...controlActionOptions]} disabled={!selectedControllerId} placeholder="All Actions" />
        <Select label="Filter by UCA Type" value={selectedUcaType || ''} onChange={e => setSelectedUcaType(e.target.value as UCAType)} options={[{value: '', label: 'All Types'}, ...ucaTypeOptions]} disabled={!selectedControlActionId} placeholder="All Types" />
      </div>

      {/* Smart Suggestions Panel */}
      {!selectedControlActionId && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <SmartSuggestionsPanel 
            onSelectSuggestion={handleSuggestionSelect}
            maxSuggestions={3}
          />
        </div>
      )}

      {/* UCA Definition Area - only show if a specific CA and UCA Type are selected */}
      {selectedControlActionId && selectedUcaType && currentControlAction && (
          <div className={`p-4 rounded-lg border space-y-3 bg-slate-50 ${CONTROLLER_TYPE_COLORS[controllers.find(c => c.id === currentControlAction.controllerId)!.ctrlType]}`}>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Defining UCA for: <span className="font-bold">{currentControlAction.verb} {currentControlAction.object}</span>
            </h3>
            <p className="text-md font-medium text-sky-700 dark:text-sky-300">Type: {selectedUcaType}</p>
            <p className="text-sm italic text-slate-600 dark:text-slate-300">{UCA_QUESTIONS_MAP.find(q => q.type === selectedUcaType)?.question}</p>

            <Textarea
                label="Context (Why is this unsafe?)"
                value={formState.context}
                onChange={e => setFormState(prev => ({ ...prev, context: e.target.value }))}
                placeholder="Describe the specific conditions or scenario under which this control action, when [UCA type], leads to a hazard."
                rows={3}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link to Hazards (select at least one):</label>
              <div className="max-h-40 overflow-y-auto p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
                {hazards.map(hazard => (
                    <Checkbox
                        key={hazard.id}
                        id={`uca-hazard-link-${hazard.id}`}
                        label={`${hazard.code}: ${hazard.title}`}
                        checked={formState.hazardIds.includes(hazard.id)}
                        onChange={e => handleHazardLinkChange(hazard.id, e.target.checked)}
                        containerClassName="mb-1"
                    />
                ))}
              </div>
              {formState.hazardIds.length === 0 && <p className="text-xs text-red-500 mt-1">BR-5-HazSel: Must link to at least one hazard.</p>}
            </div>
            <div className="flex space-x-2 pt-2">
              <Button onClick={handleSaveUCA} leftIcon={<PlusIcon className="w-5 h-5" />}>
                {editingUcaId ? 'Update UCA' : 'Add UCA'}
              </Button>
              {editingUcaId && <Button onClick={resetForm} variant="secondary">Cancel Edit / New</Button>}
            </div>
          </div>
      )}

      {/* List of existing UCAs based on filters */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Identified Unsafe Control Actions</h3>
        {displayedUcas.length > 0 ? (
            <ul className="space-y-3">
              {displayedUcas.map(uca => {
                const action = controlActions.find(ca => ca.id === uca.controlActionId);
                const controller = controllers.find(c => c.id === action?.controllerId);
                return (
                    <li key={uca.id} className={`p-4 border rounded-md shadow-sm transition-all ${controller ? CONTROLLER_TYPE_COLORS[controller.ctrlType] : 'bg-white dark:bg-slate-800'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">{uca.code || `UCA-${uca.id.substring(0,4)}`}: <span className="font-normal">{uca.ucaType}</span></p>
                          {action && controller && <p className="text-sm text-slate-700 dark:text-slate-300">For Control Action: <span className="font-medium">{action.verb} {action.object}</span> (Controller: {controller.name})</p>}
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Context: {uca.context}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Linked Hazards: {uca.hazardIds.map(hid => hazards.find(h => h.id === hid)?.code || 'N/A').join(', ')}</p>
                        </div>
                        <div className="space-x-1 flex-shrink-0 ml-4">
                          <Button onClick={() => loadUcaForEdit(uca)} size="sm" variant="secondary">Edit</Button>
                          <Button onClick={() => deleteUCA(uca.id)} size="sm" variant="secondary" className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50">
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                );
              })}
            </ul>
        ) : (
            <p className="text-slate-500 dark:text-slate-400">No UCAs match the current filter criteria. Select a controller, control action, and UCA type to define one, or broaden your filters.</p>
        )}
      </div>

      {/* UCCA Definition Section */}
      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Unsafe Combinations of Control Actions (UCCAs)</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">Describe combinations of control actions that together could lead to a hazard.</p>
        <div className="p-4 rounded-lg border space-y-3 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
          <Textarea
              label="Description of Combination"
              value={uccaForm.description}
              onChange={e => setUccaForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="e.g., PM provides flaps too early when PF provides speed reduction too late"
          />
          <Textarea
              label="Context (Why is this unsafe?)"
              value={uccaForm.context}
              onChange={e => setUccaForm(prev => ({ ...prev, context: e.target.value }))}
              placeholder="e.g., Flap speed is exceeded"
              rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link to Hazards (select at least one):</label>
            <div className="max-h-40 overflow-y-auto p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
              {hazards.map(hazard => (
                  <Checkbox
                      key={hazard.id}
                      id={`ucca-hazard-link-${hazard.id}`}
                      label={`${hazard.code}: ${hazard.title}`}
                      checked={uccaForm.hazardIds.includes(hazard.id)}
                      onChange={e => handleUccaHazardLinkChange(hazard.id, e.target.checked)}
                      containerClassName="mb-1"
                  />
              ))}
            </div>
            {uccaForm.hazardIds.length === 0 && <p className="text-xs text-red-500 mt-1">Must link to at least one hazard.</p>}
          </div>
          <div className="flex space-x-2 pt-2">
            <Button onClick={handleSaveUCCA} leftIcon={<PlusIcon className="w-5 h-5" />}>{editingUccaId ? 'Update UCCA' : 'Add UCCA'}</Button>
            {editingUccaId && <Button onClick={resetForm} variant="secondary">Cancel Edit</Button>}
          </div>
        </div>

        {/* Existing UCCAs */}
        {displayedUccas.length > 0 && (
            <ul className="space-y-3 pt-4">
              {displayedUccas.map(ucca => (
                  <li key={ucca.id} className="p-4 border rounded-md shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">{ucca.code}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{ucca.description}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Context: {ucca.context}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Linked Hazards: {ucca.hazardIds.map(hid => hazards.find(h => h.id === hid)?.code || 'N/A').join(', ')}</p>
                      </div>
                      <div className="space-x-1 flex-shrink-0 ml-4">
                        <Button onClick={() => loadUccaForEdit(ucca)} size="sm" variant="secondary">Edit</Button>
                        <Button onClick={() => deleteUCCA(ucca.id)} size="sm" variant="secondary" className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
              ))}
            </ul>
        )}
      </div>
    </div>
  );

  return (
      <div className="space-y-8">
        {/* Analysis Mode Selector */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              Choose Your Analysis Approach
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Select between our AI-powered comprehensive workflow or traditional manual analysis.
              Both methods ensure full MIT STPA compliance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Comprehensive Guided Card */}
            <div
              onClick={() => setAnalysisMode('comprehensive-guided')}
              className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${analysisMode === 'comprehensive-guided' 
                ? 'border-blue-500 dark:border-blue-400 shadow-2xl scale-[1.02]' 
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-xl'}`}
            >
              <div className="bg-gradient-to-br from-blue-500 to-green-500 rounded-t-xl p-1">
                <div className="bg-white dark:bg-slate-800 rounded-t-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg">
                        <SparklesIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                          Comprehensive Guided Analysis
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Recommended for most users
                        </p>
                      </div>
                    </div>
                    {analysisMode === 'comprehensive-guided' && (
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    AI-powered systematic workflow with step-by-step guidance through all phases of UCA and UCCA analysis.
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Hardware Analysis:</strong> Systematic component failure assessment
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Guided UCA Workflow:</strong> Interactive 3-phase identification process
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Enhanced UCCA:</strong> Advanced combination analysis algorithms
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Smart Suggestions:</strong> AI-powered recommendations
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Compliance Tracking:</strong> Real-time MIT STPA adherence
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>Best for:</strong> Teams new to STPA, complex systems, regulated industries
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Manual Analysis Card */}
            <div
              onClick={() => setAnalysisMode('manual')}
              className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 ${analysisMode === 'manual' 
                ? 'border-slate-600 dark:border-slate-400 shadow-2xl scale-[1.02]' 
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-xl'}`}
            >
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-t-xl p-1">
                <div className="bg-white dark:bg-slate-800 rounded-t-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg">
                        <DocumentTextIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                          Manual Analysis
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          Expert mode
                        </p>
                      </div>
                    </div>
                    {analysisMode === 'manual' && (
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Traditional STPA approach with full control over the analysis process and direct entry capabilities.
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Direct Entry:</strong> Create UCAs and UCCAs manually
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Custom Filtering:</strong> Advanced search and organization
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Bulk Operations:</strong> Efficient batch processing
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Full Control:</strong> No automated workflows
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircleIcon className="w-5 h-5 text-slate-500 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        <strong>Expert Features:</strong> Advanced configuration options
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <strong>Best for:</strong> Experienced STPA practitioners, custom workflows
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mode Info Bar */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              <strong>Note:</strong> Both modes provide full MIT STPA compliance. You can switch between modes at any time without losing data.
            </p>
          </div>
        </div>

        {/* Analysis Content */}
        {renderAnalysisModeContent()}
      </div>
  );
};

export default UnsafeControlActions;