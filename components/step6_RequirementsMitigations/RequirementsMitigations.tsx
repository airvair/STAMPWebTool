
import React, { useState, useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Requirement, AnalysisType } from '@/types';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Button from '../shared/Button';

const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

interface RequirementFormState {
  text: string;
  linkedScenarioIds: string[];
}

const RequirementsMitigations: React.FC = () => {
  const { analysisSession, scenarios, requirements, addRequirement, updateRequirement, deleteRequirement, ucas, controlActions } = useAnalysis();
  
  const [formState, setFormState] = useState<RequirementFormState>({ text: '', linkedScenarioIds: [] });
  const [editingReqId, setEditingReqId] = useState<string | null>(null);

  const term = analysisSession?.analysisType === AnalysisType.STPA ? 'Requirement' : 'Mitigation';

  useEffect(() => {
    // BR-7-MitCount: Sort Requirements descending by mitigation-count (linkedScenarioIds.length)
    // This sorting should ideally happen when displaying or before export.
    // The context's `requirements` array is not sorted here, but displayed list will be.
  }, [requirements]);

  const resetForm = () => {
    setFormState({ text: '', linkedScenarioIds: [] });
    setEditingReqId(null);
  };

  const handleScenarioLinkChange = (scenarioId: string, checked: boolean) => {
    setFormState(prev => {
      const newLinkedIds = checked
        ? [...prev.linkedScenarioIds, scenarioId]
        : prev.linkedScenarioIds.filter(id => id !== scenarioId);
      return { ...prev, linkedScenarioIds: newLinkedIds };
    });
  };

  const handleSaveRequirement = () => {
    if (!formState.text.trim() || formState.linkedScenarioIds.length === 0) {
      alert(`Please provide ${term.toLowerCase()} text and link it to at least one causal scenario.`);
      return;
    }

    const requirementData: Omit<Requirement, 'id' | 'type'> = {
      text: formState.text,
      linkedScenarioIds: formState.linkedScenarioIds,
    };
    
    if (editingReqId) {
      updateRequirement(editingReqId, { ...requirementData, type: term });
    } else {
      addRequirement({ ...requirementData, type: term });
    }
    resetForm();
  };

  const editRequirement = (req: Requirement) => {
    setEditingReqId(req.id);
    setFormState({
      text: req.text,
      linkedScenarioIds: req.linkedScenarioIds,
    });
  };

  const getScenarioDetails = (scenarioId: string): string => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return "Unknown Scenario";
    const uca = ucas.find(u => u.id === scenario.ucaId);
    const action = uca ? controlActions.find(ca => ca.id === uca.controlActionId) : null;
    const ucaLabel = uca ? `${uca.code || `UCA-${uca.id.substring(0,4)}`} (${uca.ucaType}, Action: ${action?.verb || 'N/A'} ${action?.object || ''})` : 'N/A';
    return `Scenario for ${ucaLabel}: ${scenario.description.substring(0, 50)}... (Class ${scenario.classType})`;
  };
  
  const sortedRequirements = [...requirements].sort((a, b) => b.linkedScenarioIds.length - a.linkedScenarioIds.length);

  if (scenarios.length === 0) return <p className="text-slate-600">No Causal Scenarios defined. Please complete Step 5.</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        Define {term.toLowerCase()}s to prevent or mitigate the causal scenarios identified.
        Link each {term.toLowerCase()} to the scenarios it addresses.
      </p>

      {/* Requirement/Mitigation Form */}
      <div className="p-4 rounded-lg border bg-slate-50 border-slate-200 space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">
          {editingReqId ? `Edit ${term}` : `Add New ${term}`}
        </h3>
        <Textarea
          label={`${term} Text:`}
          value={formState.text}
          onChange={e => setFormState(prev => ({ ...prev, text: e.target.value }))}
          placeholder={`Describe the ${term.toLowerCase()}...`}
          rows={3}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Link to Causal Scenarios (select at least one):</label>
          <div className="max-h-60 overflow-y-auto p-2 border border-slate-300 rounded-md bg-white space-y-1">
            {scenarios.map(scenario => (
              <Checkbox
                key={scenario.id}
                id={`req-scenario-link-${scenario.id}`}
                label={getScenarioDetails(scenario.id)}
                checked={formState.linkedScenarioIds.includes(scenario.id)}
                onChange={e => handleScenarioLinkChange(scenario.id, e.target.checked)}
              />
            ))}
          </div>
          {formState.linkedScenarioIds.length === 0 && <p className="text-xs text-red-500 mt-1">Must link to at least one scenario.</p>}
        </div>
        <div className="flex space-x-2 pt-2">
          <Button 
            onClick={handleSaveRequirement} 
            leftIcon={<PlaceholderPlusIcon />}
            disabled={!formState.text.trim() || formState.linkedScenarioIds.length === 0}
          >
            {editingReqId ? `Update ${term}` : `Add ${term}`}
          </Button>
          {editingReqId && <Button onClick={resetForm} variant="secondary">Cancel Edit</Button>}
        </div>
      </div>

      {/* List of Requirements/Mitigations */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-slate-700 mb-3">Defined {term}s</h3>
        {sortedRequirements.length > 0 ? (
          <ul className="space-y-3">
            {sortedRequirements.map(req => (
              <li key={req.id} className="p-4 border rounded-md shadow-sm bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-md">{req.text}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Addresses {req.linkedScenarioIds.length} scenario(s): 
                      {req.linkedScenarioIds.map(sid => scenarios.find(s => s.id === sid)?.classType).filter(Boolean).join(', Class ') && ` (Classes: ${req.linkedScenarioIds.map(sid => `Class ${scenarios.find(s => s.id === sid)?.classType}`).filter(s => s !== 'Class undefined').join(', ')})`}
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-500 pl-4 mt-1">
                        {req.linkedScenarioIds.map(sid => <li key={sid}>{getScenarioDetails(sid)}</li>)}
                    </ul>
                  </div>
                  <div className="space-x-1 flex-shrink-0">
                    <Button onClick={() => editRequirement(req)} size="sm" variant="ghost">Edit</Button>
                    <Button onClick={() => deleteRequirement(req.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                      <PlaceholderTrashIcon />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">No {term.toLowerCase()}s defined yet.</p>
        )}
      </div>
    </div>
  );
};

export default RequirementsMitigations;
    