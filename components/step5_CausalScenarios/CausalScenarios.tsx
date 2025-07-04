
import React, { useState, useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { CausalScenario, ScenarioClass } from '@/types';
import { SCENARIO_CLASSES_BY_CONTROLLER, CONTROLLER_TYPE_COLORS } from '@/constants';
import Select from '../shared/Select';
import Checkbox from '../shared/Checkbox';
import Textarea from '../shared/Textarea';
import Button from '../shared/Button';

const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

interface ScenarioFormState {
  classType: ScenarioClass | '';
  description: string;
  isAdditional: boolean;
}

const CausalScenarios: React.FC = () => {
  const { ucas, scenarios, addScenario, updateScenario, deleteScenario, controllers, controlActions } = useAnalysis();
  
  const [selectedUcaId, setSelectedUcaId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ScenarioFormState>({ classType: '', description: '', isAdditional: false });
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);

  const currentUca = ucas.find(u => u.id === selectedUcaId);
  const currentController = currentUca ? controllers.find(c => c.id === currentUca.controllerId) : null;
  const applicableScenarioClasses = currentController ? SCENARIO_CLASSES_BY_CONTROLLER[currentController.ctrlType] : [];

  useEffect(() => {
    resetForm();
  }, [selectedUcaId]);

  const resetForm = () => {
    setFormState({ classType: '', description: '', isAdditional: false });
    setEditingScenarioId(null);
  };

  const handleSaveScenario = () => {
    if (!selectedUcaId || (!formState.classType && !formState.isAdditional) || !formState.description.trim()) {
      alert("Please select a UCA, specify a scenario class (or mark as additional), and provide a description.");
      return;
    }

    const scenarioData: Omit<CausalScenario, 'id'> = {
      ucaId: selectedUcaId,
      classType: formState.isAdditional ? ScenarioClass.Class1 : formState.classType as ScenarioClass, // Default additional to Class1 or handle differently
      description: formState.description,
      isAdditional: formState.isAdditional,
    };
    
    if (editingScenarioId) {
      updateScenario(editingScenarioId, scenarioData);
    } else {
      addScenario(scenarioData);
    }
    resetForm();
  };

  const editScenario = (scenario: CausalScenario) => {
    setSelectedUcaId(scenario.ucaId); // Ensure correct UCA is selected
    setEditingScenarioId(scenario.id);
    setFormState({
      classType: scenario.isAdditional ? '' : scenario.classType,
      description: scenario.description,
      isAdditional: scenario.isAdditional || false,
    });
  };

  const ucaOptions = ucas.map(u => {
    const action = controlActions.find(ca => ca.id === u.controlActionId);
    return { value: u.id, label: `${u.code || `UCA-${u.id.substring(0,4)}`}: ${u.ucaType} (Action: ${action?.verb} ${action?.object || ''})` };
  });

  const filteredScenarios = selectedUcaId ? scenarios.filter(s => s.ucaId === selectedUcaId) : [];

  if (ucas.length === 0) return <p className="text-slate-600">No Unsafe Control Actions (UCAs) defined. Please complete Step 4.</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        For each UCA, identify causal scenarios explaining why the controller might issue it.
        Use the provided categories based on controller type, or add custom scenarios.
      </p>

      <Select
        label="Select Unsafe Control Action (UCA) to Analyze:"
        value={selectedUcaId || ''}
        onChange={e => setSelectedUcaId(e.target.value)}
        options={[{ value: '', label: '-- Select a UCA --' }, ...ucaOptions]}
        containerClassName="max-w-xl"
      />

      {currentUca && currentController && (
        <div className={`p-4 rounded-lg border space-y-4 bg-slate-50 ${CONTROLLER_TYPE_COLORS[currentController.ctrlType]}`}>
          <h3 className="text-lg font-semibold">
            {editingScenarioId ? 'Edit Causal Scenario for ' : 'Add Causal Scenario for '}
            <span className="font-bold">{currentUca.code || `UCA-${currentUca.id.substring(0,4)}`}</span>
          </h3>
          
          {!formState.isAdditional && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Scenario Class (for {currentController.name} - {currentController.ctrlType}):</label>
              {applicableScenarioClasses.length > 0 ? (
                applicableScenarioClasses.map(sc => (
                  <div key={sc.classType} className="mb-2">
                    <input 
                      type="radio" 
                      id={`sc-${sc.classType}`} 
                      name="scenarioClass" 
                      value={sc.classType}
                      checked={formState.classType === sc.classType}
                      onChange={() => setFormState(prev => ({...prev, classType: sc.classType, isAdditional: false}))}
                      className="mr-2 h-4 w-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                    />
                    <label htmlFor={`sc-${sc.classType}`} className="font-medium text-slate-700">
                      Class {sc.classType}: {sc.label}
                      <span className="block text-xs text-slate-500 ml-6">{sc.description}</span>
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No standard scenario classes defined for this controller type ({currentController.ctrlType}). Use "Additional causal scenario".</p>
              )}
            </div>
          )}

          <Checkbox
            label="This is an Additional Causal Scenario (free-text)"
            checked={formState.isAdditional}
            onChange={e => setFormState(prev => ({ ...prev, isAdditional: e.target.checked, classType: e.target.checked ? '' : prev.classType }))}
          />

          <Textarea
            label="Describe Scenario:"
            value={formState.description}
            onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Explain the conditions, reasons, or factors leading to this UCA."
            rows={3}
            disabled={!formState.classType && !formState.isAdditional}
          />

          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={handleSaveScenario} 
              leftIcon={<PlaceholderPlusIcon />}
              disabled={!selectedUcaId || (!formState.classType && !formState.isAdditional) || !formState.description.trim()}
            >
              {editingScenarioId ? 'Update Scenario' : 'Add Scenario'}
            </Button>
            {editingScenarioId && <Button onClick={resetForm} variant="secondary">Cancel Edit</Button>}
          </div>
        </div>
      )}

      {/* List of Scenarios for Selected UCA */}
      {selectedUcaId && filteredScenarios.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-slate-700 mb-3">
            Defined Causal Scenarios for {ucas.find(u=>u.id===selectedUcaId)?.code || `UCA-${selectedUcaId.substring(0,4)}`}:
          </h3>
          <ul className="space-y-3">
            {filteredScenarios.map(scenario => (
              <li key={scenario.id} className="p-4 border rounded-md shadow-sm bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-md">
                      {scenario.isAdditional ? "Additional Scenario" : `Class ${scenario.classType} Scenario`}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{scenario.description}</p>
                  </div>
                  <div className="space-x-1 flex-shrink-0">
                    <Button onClick={() => editScenario(scenario)} size="sm" variant="ghost">Edit</Button>
                    <Button onClick={() => deleteScenario(scenario.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                      <PlaceholderTrashIcon />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedUcaId && filteredScenarios.length === 0 && (
        <p className="text-slate-500 mt-4">No causal scenarios defined for this UCA yet.</p>
      )}
    </div>
  );
};

export default CausalScenarios;
    