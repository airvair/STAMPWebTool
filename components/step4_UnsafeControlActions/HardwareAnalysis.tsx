import React, { useState } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { HardwareComponent, FailureMode, FailureType, UnsafeInteraction } from '@/types';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Modal from '../shared/Modal';
import { PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface HardwareComponentForm {
  name: string;
  type: string;
  description: string;
  systemComponentId: string;
}

interface FailureModeForm {
  hardwareComponentId: string;
  failureType: FailureType;
  description: string;
  probabilityAssessment: string;
  severityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  detectionDifficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Very Difficult';
}

interface UnsafeInteractionForm {
  sourceComponentId: string;
  affectedComponentIds: string[];
  interactionType: 'Cascading' | 'Blocking' | 'Common Cause' | 'Environmental' | 'Other';
  description: string;
  hazardIds: string[];
}

const HardwareAnalysis: React.FC = () => {
  const {
    systemComponents,
    hardwareComponents,
    failureModes,
    unsafeInteractions,
    hazards,
    addHardwareComponent,
    updateHardwareComponent,
    deleteHardwareComponent,
    addFailureMode,
    updateFailureMode,
    deleteFailureMode,
    addUnsafeInteraction,
    updateUnsafeInteraction,
    deleteUnsafeInteraction,
    hardwareAnalysisSession,
    updateHardwareAnalysisSession
  } = useAnalysis();

  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showFailureModeModal, setShowFailureModeModal] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [editingFailureModeId, setEditingFailureModeId] = useState<string | null>(null);
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);

  const [componentForm, setComponentForm] = useState<HardwareComponentForm>({
    name: '',
    type: '',
    description: '',
    systemComponentId: ''
  });

  const [failureModeForm, setFailureModeForm] = useState<FailureModeForm>({
    hardwareComponentId: '',
    failureType: FailureType.MechanicalWear,
    description: '',
    probabilityAssessment: '',
    severityLevel: 'Medium',
    detectionDifficulty: 'Moderate'
  });

  const [interactionForm, setInteractionForm] = useState<UnsafeInteractionForm>({
    sourceComponentId: '',
    affectedComponentIds: [],
    interactionType: 'Cascading',
    description: '',
    hazardIds: []
  });

  const hardwareComponentTypes = [
    'Motor', 'Gearbox', 'Sensor', 'Actuator', 'Controller', 'Wiring',
    'Valve', 'Pump', 'Battery', 'Circuit Board', 'Display', 'Switch'
  ];

  const failureTypeOptions = Object.values(FailureType).map(type => ({ 
    value: type, 
    label: type 
  }));

  const severityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  const detectionOptions = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Difficult', label: 'Difficult' },
    { value: 'Very Difficult', label: 'Very Difficult' }
  ];

  const interactionTypeOptions = [
    { value: 'Cascading', label: 'Cascading Failure' },
    { value: 'Blocking', label: 'Mechanical Blocking' },
    { value: 'Common Cause', label: 'Common Cause Factor' },
    { value: 'Environmental', label: 'Environmental Factor' },
    { value: 'Other', label: 'Other' }
  ];

  const handleSaveComponent = () => {
    if (!componentForm.name.trim() || !componentForm.type.trim()) {
      alert('Please provide a name and type for the hardware component.');
      return;
    }

    const componentData = {
      name: componentForm.name,
      type: componentForm.type,
      description: componentForm.description,
      systemComponentId: componentForm.systemComponentId || undefined
    };

    if (editingComponentId) {
      updateHardwareComponent(editingComponentId, componentData);
    } else {
      addHardwareComponent(componentData);
    }

    resetComponentForm();
  };

  const handleSaveFailureMode = () => {
    if (!failureModeForm.hardwareComponentId || !failureModeForm.description.trim()) {
      alert('Please select a hardware component and provide a failure description.');
      return;
    }

    const failureModeData = {
      hardwareComponentId: failureModeForm.hardwareComponentId,
      failureType: failureModeForm.failureType,
      description: failureModeForm.description,
      probabilityAssessment: failureModeForm.probabilityAssessment 
        ? parseFloat(failureModeForm.probabilityAssessment) 
        : undefined,
      severityLevel: failureModeForm.severityLevel,
      detectionDifficulty: failureModeForm.detectionDifficulty
    };

    if (editingFailureModeId) {
      updateFailureMode(editingFailureModeId, failureModeData);
    } else {
      addFailureMode(failureModeData);
    }

    resetFailureModeForm();
  };

  const handleSaveInteraction = () => {
    if (!interactionForm.sourceComponentId || 
        interactionForm.affectedComponentIds.length === 0 || 
        !interactionForm.description.trim()) {
      alert('Please select source and affected components and provide a description.');
      return;
    }

    const interactionData = {
      sourceComponentId: interactionForm.sourceComponentId,
      affectedComponentIds: interactionForm.affectedComponentIds,
      interactionType: interactionForm.interactionType,
      description: interactionForm.description,
      hazardIds: interactionForm.hazardIds
    };

    if (editingInteractionId) {
      updateUnsafeInteraction(editingInteractionId, interactionData);
    } else {
      addUnsafeInteraction(interactionData);
    }

    resetInteractionForm();
  };

  const resetComponentForm = () => {
    setComponentForm({ name: '', type: '', description: '', systemComponentId: '' });
    setEditingComponentId(null);
    setShowComponentModal(false);
  };

  const resetFailureModeForm = () => {
    setFailureModeForm({
      hardwareComponentId: '',
      failureType: FailureType.MechanicalWear,
      description: '',
      probabilityAssessment: '',
      severityLevel: 'Medium',
      detectionDifficulty: 'Moderate'
    });
    setEditingFailureModeId(null);
    setShowFailureModeModal(false);
  };

  const resetInteractionForm = () => {
    setInteractionForm({
      sourceComponentId: '',
      affectedComponentIds: [],
      interactionType: 'Cascading',
      description: '',
      hazardIds: []
    });
    setEditingInteractionId(null);
    setShowInteractionModal(false);
  };

  const loadComponentForEdit = (component: HardwareComponent) => {
    setComponentForm({
      name: component.name,
      type: component.type,
      description: component.description || '',
      systemComponentId: component.systemComponentId || ''
    });
    setEditingComponentId(component.id);
    setShowComponentModal(true);
  };

  const loadFailureModeForEdit = (failureMode: FailureMode) => {
    setFailureModeForm({
      hardwareComponentId: failureMode.hardwareComponentId,
      failureType: failureMode.failureType,
      description: failureMode.description,
      probabilityAssessment: failureMode.probabilityAssessment?.toString() || '',
      severityLevel: failureMode.severityLevel || 'Medium',
      detectionDifficulty: failureMode.detectionDifficulty || 'Moderate'
    });
    setEditingFailureModeId(failureMode.id);
    setShowFailureModeModal(true);
  };

  const loadInteractionForEdit = (interaction: UnsafeInteraction) => {
    setInteractionForm({
      sourceComponentId: interaction.sourceComponentId,
      affectedComponentIds: interaction.affectedComponentIds,
      interactionType: interaction.interactionType,
      description: interaction.description,
      hazardIds: interaction.hazardIds
    });
    setEditingInteractionId(interaction.id);
    setShowInteractionModal(true);
  };

  const handleAffectedComponentChange = (componentId: string, checked: boolean) => {
    setInteractionForm(prev => ({
      ...prev,
      affectedComponentIds: checked
        ? [...prev.affectedComponentIds, componentId]
        : prev.affectedComponentIds.filter(id => id !== componentId)
    }));
  };

  const handleHazardChange = (hazardId: string, checked: boolean) => {
    setInteractionForm(prev => ({
      ...prev,
      hazardIds: checked
        ? [...prev.hazardIds, hazardId]
        : prev.hazardIds.filter(id => id !== hazardId)
    }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Hardware & Electro-Mechanical Component Analysis
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This preliminary evaluation identifies hardware/electro-mechanical failures and unsafe interactions. 
              Consider mechanical wear, electrical faults, sensor issues, and combinations of failures that can create hazards.
            </p>
          </div>
        </div>
      </div>

      {/* Hardware Components Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Hardware Components
          </h3>
          <Button
            onClick={() => setShowComponentModal(true)}
            leftIcon={<PlusIcon className="w-5 h-5" />}
          >
            Add Component
          </Button>
        </div>

        {hardwareComponents.length > 0 ? (
          <div className="grid gap-4">
            {hardwareComponents.map(component => (
              <div key={component.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                      {component.name} ({component.type})
                    </h4>
                    {component.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {component.description}
                      </p>
                    )}
                    {component.systemComponentId && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Linked to: {systemComponents.find(sc => sc.id === component.systemComponentId)?.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => loadComponentForEdit(component)}
                      size="sm"
                      variant="secondary"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => deleteHardwareComponent(component.id)}
                      size="sm"
                      variant="secondary"
                      className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No hardware components defined. Add components to begin failure mode analysis.
          </p>
        )}
      </div>

      {/* Failure Modes Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Failure Modes
          </h3>
          <Button
            onClick={() => setShowFailureModeModal(true)}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            disabled={hardwareComponents.length === 0}
          >
            Add Failure Mode
          </Button>
        </div>

        {failureModes.length > 0 ? (
          <div className="grid gap-4">
            {failureModes.map(mode => {
              const component = hardwareComponents.find(c => c.id === mode.hardwareComponentId);
              return (
                <div key={mode.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                        {component?.name} - {mode.failureType}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {mode.description}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          mode.severityLevel === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                          mode.severityLevel === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                          mode.severityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          Severity: {mode.severityLevel}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          Detection: {mode.detectionDifficulty}
                        </span>
                        {mode.probabilityAssessment && (
                          <span className="text-slate-600 dark:text-slate-400">
                            Probability: {(mode.probabilityAssessment * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => loadFailureModeForEdit(mode)}
                        size="sm"
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteFailureMode(mode.id)}
                        size="sm"
                        variant="secondary"
                        className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No failure modes defined. Add failure modes to analyze component vulnerabilities.
          </p>
        )}
      </div>

      {/* Unsafe Interactions Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Unsafe Interactions
          </h3>
          <Button
            onClick={() => setShowInteractionModal(true)}
            leftIcon={<PlusIcon className="w-5 h-5" />}
            disabled={hardwareComponents.length < 2}
          >
            Add Interaction
          </Button>
        </div>

        {unsafeInteractions.length > 0 ? (
          <div className="grid gap-4">
            {unsafeInteractions.map(interaction => {
              const sourceComponent = hardwareComponents.find(c => c.id === interaction.sourceComponentId);
              const affectedComponents = interaction.affectedComponentIds.map(id => 
                hardwareComponents.find(c => c.id === id)?.name
              ).filter(Boolean);
              
              return (
                <div key={interaction.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                        {interaction.interactionType}: {sourceComponent?.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Affects: {affectedComponents.join(', ')}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {interaction.description}
                      </p>
                      {interaction.hazardIds.length > 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                          Linked Hazards: {interaction.hazardIds.map(hid => 
                            hazards.find(h => h.id === hid)?.code
                          ).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => loadInteractionForEdit(interaction)}
                        size="sm"
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteUnsafeInteraction(interaction.id)}
                        size="sm"
                        variant="secondary"
                        className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No unsafe interactions defined. Add interactions to analyze failure combinations.
          </p>
        )}
      </div>

      {/* Hardware Component Modal */}
      <Modal
        isOpen={showComponentModal}
        onClose={resetComponentForm}
        title={editingComponentId ? 'Edit Hardware Component' : 'Add Hardware Component'}
      >
        <div className="space-y-4">
          <Input
            label="Component Name"
            value={componentForm.name}
            onChange={e => setComponentForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Main Engine, Landing Gear Motor"
          />
          
          <Select
            label="Component Type"
            value={componentForm.type}
            onChange={e => setComponentForm(prev => ({ ...prev, type: e.target.value }))}
            options={hardwareComponentTypes.map(type => ({ value: type, label: type }))}
            placeholder="Select component type"
          />
          
          <Textarea
            label="Description (Optional)"
            value={componentForm.description}
            onChange={e => setComponentForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Additional details about the component"
            rows={3}
          />
          
          <Select
            label="Link to System Component (Optional)"
            value={componentForm.systemComponentId}
            onChange={e => setComponentForm(prev => ({ ...prev, systemComponentId: e.target.value }))}
            options={[
              { value: '', label: 'No link' },
              ...systemComponents.map(sc => ({ value: sc.id, label: sc.name }))
            ]}
          />
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveComponent}>
              {editingComponentId ? 'Update' : 'Add'} Component
            </Button>
            <Button onClick={resetComponentForm} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Failure Mode Modal */}
      <Modal
        isOpen={showFailureModeModal}
        onClose={resetFailureModeForm}
        title={editingFailureModeId ? 'Edit Failure Mode' : 'Add Failure Mode'}
      >
        <div className="space-y-4">
          <Select
            label="Hardware Component"
            value={failureModeForm.hardwareComponentId}
            onChange={e => setFailureModeForm(prev => ({ ...prev, hardwareComponentId: e.target.value }))}
            options={hardwareComponents.map(c => ({ value: c.id, label: `${c.name} (${c.type})` }))}
            placeholder="Select hardware component"
          />
          
          <Select
            label="Failure Type"
            value={failureModeForm.failureType}
            onChange={e => setFailureModeForm(prev => ({ ...prev, failureType: e.target.value as FailureType }))}
            options={failureTypeOptions}
          />
          
          <Textarea
            label="Failure Description"
            value={failureModeForm.description}
            onChange={e => setFailureModeForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe how the component fails and its effects"
            rows={3}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Severity Level"
              value={failureModeForm.severityLevel}
              onChange={e => setFailureModeForm(prev => ({ ...prev, severityLevel: e.target.value as any }))}
              options={severityOptions}
            />
            
            <Select
              label="Detection Difficulty"
              value={failureModeForm.detectionDifficulty}
              onChange={e => setFailureModeForm(prev => ({ ...prev, detectionDifficulty: e.target.value as any }))}
              options={detectionOptions}
            />
          </div>
          
          <Input
            label="Probability Assessment (0-1, optional)"
            value={failureModeForm.probabilityAssessment}
            onChange={e => setFailureModeForm(prev => ({ ...prev, probabilityAssessment: e.target.value }))}
            placeholder="e.g., 0.01 for 1% probability"
            type="number"
            min="0"
            max="1"
            step="0.001"
          />
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveFailureMode}>
              {editingFailureModeId ? 'Update' : 'Add'} Failure Mode
            </Button>
            <Button onClick={resetFailureModeForm} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unsafe Interaction Modal */}
      <Modal
        isOpen={showInteractionModal}
        onClose={resetInteractionForm}
        title={editingInteractionId ? 'Edit Unsafe Interaction' : 'Add Unsafe Interaction'}
      >
        <div className="space-y-4">
          <Select
            label="Source Component (fails first)"
            value={interactionForm.sourceComponentId}
            onChange={e => setInteractionForm(prev => ({ ...prev, sourceComponentId: e.target.value }))}
            options={hardwareComponents.map(c => ({ value: c.id, label: `${c.name} (${c.type})` }))}
            placeholder="Select source component"
          />
          
          <Select
            label="Interaction Type"
            value={interactionForm.interactionType}
            onChange={e => setInteractionForm(prev => ({ ...prev, interactionType: e.target.value as any }))}
            options={interactionTypeOptions}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Affected Components (select at least one):
            </label>
            <div className="max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
              {hardwareComponents
                .filter(c => c.id !== interactionForm.sourceComponentId)
                .map(component => (
                  <Checkbox
                    key={component.id}
                    id={`affected-${component.id}`}
                    label={`${component.name} (${component.type})`}
                    checked={interactionForm.affectedComponentIds.includes(component.id)}
                    onChange={e => handleAffectedComponentChange(component.id, e.target.checked)}
                    containerClassName="mb-2"
                  />
                ))}
            </div>
          </div>
          
          <Textarea
            label="Interaction Description"
            value={interactionForm.description}
            onChange={e => setInteractionForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe how the failure spreads or creates unsafe conditions"
            rows={3}
          />
          
          {hazards.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Link to Hazards (optional):
              </label>
              <div className="max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
                {hazards.map(hazard => (
                  <Checkbox
                    key={hazard.id}
                    id={`hazard-${hazard.id}`}
                    label={`${hazard.code}: ${hazard.title}`}
                    checked={interactionForm.hazardIds.includes(hazard.id)}
                    onChange={e => handleHazardChange(hazard.id, e.target.checked)}
                    containerClassName="mb-2"
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveInteraction}>
              {editingInteractionId ? 'Update' : 'Add'} Interaction
            </Button>
            <Button onClick={resetInteractionForm} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HardwareAnalysis;