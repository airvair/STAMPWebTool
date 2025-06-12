
import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { UnsafeControlAction, UCAType, Hazard, UCCA } from '../../types';
import { UCA_QUESTIONS_MAP, CONTROLLER_TYPE_COLORS } from '../../constants';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Button from '../shared/Button';
import Select from '../shared/Select';

const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

interface UCAFormState {
  context: string;
  hazardIds: string[];
}

interface UCCAFormState {
  description: string;
  context: string;
  hazardIds: string[];
}

const UnsafeControlActions: React.FC = () => {
  const { controllers, controlActions, ucas, addUCA, updateUCA, deleteUCA, hazards,
          uccas, addUCCA, updateUCCA, deleteUCCA } = useAnalysis();

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
      alert("Please select a control action and a UCA type.");
      return;
    }
    if (formState.hazardIds.length === 0) { // BR-5-HazSel
      alert("A UCA must be linked to at least one hazard. Please select or create a new hazard if needed.");
      return;
    }
    if (!formState.context.trim()) { // BR-5-Complete (simplified, assuming context is a key part)
        alert("Please provide a context for the UCA.");
        return;
    }

    const ucaData: Omit<UnsafeControlAction, 'id' | 'code'> = { // Corrected type: Omit 'id' and 'code'
      controllerId: currentControlAction.controllerId, // Store controllerId for easier access
      controlActionId: selectedControlActionId,
      ucaType: selectedUcaType,
      context: formState.context,
      hazardIds: formState.hazardIds,
    };

    if (editingUcaId) {
      // For update, the context might not regenerate the code, or it might if it's based on list length.
      // Assuming updateUCA handles the code correctly or it's not meant to change.
      // The Omit here is for the properties of the *update payload*, not necessarily the full object state.
      // If code shouldn't be part of updates, it should be Omit<'id' | 'code'> too.
      // For simplicity and matching addUCA, we'll assume `code` is not part of the `updates` partial.
      // The update function in context takes Partial<UnsafeControlAction>, so this is fine.
      updateUCA(editingUcaId, {
        controllerId: currentControlAction.controllerId,
        controlActionId: selectedControlActionId,
        ucaType: selectedUcaType,
        context: formState.context,
        hazardIds: formState.hazardIds,
      });
    } else {
      // Check if UCA for this action and type already exists to prevent duplicates before adding
      const existing = ucas.find(u => u.controlActionId === selectedControlActionId && u.ucaType === selectedUcaType);
      if (existing && !editingUcaId) { // only prevent add, not update
        alert(`A UCA of type "${selectedUcaType}" already exists for this control action. You can edit it below.`);
        setEditingUcaId(existing.id); // switch to edit mode for the existing one
        setFormState({context: existing.context, hazardIds: existing.hazardIds});
        return;
      }
      addUCA(ucaData);
    }
    // Don't reset form immediately, user might want to link more hazards or refine context
    // resetForm(); // Or keep form populated for minor edits
  };

  const handleSaveUCCA = () => {
    if (!uccaForm.description.trim() || !uccaForm.context.trim()) {
      alert('Please provide a description and context for the UCCA.');
      return;
    }
    if (uccaForm.hazardIds.length === 0) {
      alert('A UCCA must be linked to at least one hazard.');
      return;
    }
    const data: Omit<UCCA, 'id' | 'code'> = {
      description: uccaForm.description,
      context: uccaForm.context,
      hazardIds: uccaForm.hazardIds,
    };
    if (editingUccaId) {
      updateUCCA(editingUccaId, data);
    } else {
      addUCCA(data);
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
  if (controlActions.filter(ca => !ca.isOutOfScope).length === 0) return <p className="text-slate-600">No (in-scope) control actions defined. Please complete Step 4.</p>;
  if (hazards.length === 0) return <p className="text-slate-600">No hazards defined. Please complete Step 2 (Losses & Hazards).</p>;

  const controllerOptions = controllers.map(c => ({ value: c.id, label: `${c.name} (${c.ctrlType})` }));
  const controlActionOptions = availableControlActions.map(ca => ({ value: ca.id, label: `${ca.verb} ${ca.object}` }));
  const ucaTypeOptions = UCA_QUESTIONS_MAP.map(q => ({ value: q.type, label: q.type }));

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        For each control action, analyze potential Unsafe Control Actions (UCAs) using the provided guide questions.
        Document the context in which the control action becomes unsafe and link it to relevant hazards.
      </p>

      {/* Filters: Controller, Control Action, UCA Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-100 rounded-lg border border-slate-200">
        <Select label="Filter by Controller" value={selectedControllerId || ''} onChange={e => setSelectedControllerId(e.target.value)} options={[{value: '', label: 'All Controllers'}, ...controllerOptions]} placeholder="All Controllers" />
        <Select label="Filter by Control Action" value={selectedControlActionId || ''} onChange={e => setSelectedControlActionId(e.target.value)} options={[{value: '', label: 'All Actions'}, ...controlActionOptions]} disabled={!selectedControllerId} placeholder="All Actions" />
        <Select label="Filter by UCA Type" value={selectedUcaType || ''} onChange={e => setSelectedUcaType(e.target.value as UCAType)} options={[{value: '', label: 'All Types'}, ...ucaTypeOptions]} disabled={!selectedControlActionId} placeholder="All Types" />
      </div>

      {/* UCA Definition Area - only show if a specific CA and UCA Type are selected */}
      {selectedControlActionId && selectedUcaType && currentControlAction && (
        <div className={`p-4 rounded-lg border space-y-3 bg-slate-50 ${CONTROLLER_TYPE_COLORS[controllers.find(c => c.id === currentControlAction.controllerId)!.ctrlType]}`}>
          <h3 className="text-lg font-semibold">
            Defining UCA for: <span className="font-bold">{currentControlAction.verb} {currentControlAction.object}</span>
          </h3>
          <p className="text-md font-medium text-sky-700">Type: {selectedUcaType}</p>
          <p className="text-sm italic text-slate-600">{UCA_QUESTIONS_MAP.find(q => q.type === selectedUcaType)?.question}</p>
          
          <Textarea
            label="Context (Why is this unsafe?)"
            value={formState.context}
            onChange={e => setFormState(prev => ({ ...prev, context: e.target.value }))}
            placeholder="Describe the specific conditions or scenario under which this control action, when [UCA type], leads to a hazard."
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link to Hazards (select at least one):</label>
            <div className="max-h-40 overflow-y-auto p-2 border border-slate-300 rounded-md bg-white">
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
            <Button onClick={handleSaveUCA} leftIcon={<PlaceholderPlusIcon />}>
              {editingUcaId ? 'Update UCA' : 'Add UCA'}
            </Button>
            {editingUcaId && <Button onClick={resetForm} variant="secondary">Cancel Edit / New</Button>}
          </div>
        </div>
      )}

      {/* List of existing UCAs based on filters */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-slate-700 mb-3">Identified Unsafe Control Actions</h3>
        {displayedUcas.length > 0 ? (
          <ul className="space-y-3">
            {displayedUcas.map(uca => {
              const action = controlActions.find(ca => ca.id === uca.controlActionId);
              const controller = controllers.find(c => c.id === action?.controllerId);
              return (
                <li key={uca.id} className={`p-4 border rounded-md shadow-sm ${controller ? CONTROLLER_TYPE_COLORS[controller.ctrlType] : 'bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{uca.code || `UCA-${uca.id.substring(0,4)}`}: <span className="font-normal">{uca.ucaType}</span></p>
                      {action && controller && <p className="text-sm text-slate-700">For Control Action: <span className="font-medium">{action.verb} {action.object}</span> (Controller: {controller.name})</p>}
                      <p className="mt-1 text-sm text-slate-600">Context: {uca.context}</p>
                      <p className="text-sm text-slate-600">Linked Hazards: {uca.hazardIds.map(hid => hazards.find(h => h.id === hid)?.code || 'N/A').join(', ')}</p>
                    </div>
                    <div className="space-x-1 flex-shrink-0">
                      <Button onClick={() => loadUcaForEdit(uca)} size="sm" variant="ghost" className="bg-white/50 hover:bg-white/70">Edit</Button>
                      <Button onClick={() => deleteUCA(uca.id)} size="sm" variant="ghost" className="text-red-600 hover:text-red-700 bg-white/50 hover:bg-white/70">
                        <PlaceholderTrashIcon />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-slate-500">No UCAs match the current filter criteria. Select a controller, control action, and UCA type to define one, or broaden your filters.</p>
        )}
      </div>

      {/* UCCA Definition Section */}
      <div className="mt-10 space-y-4">
        <h3 className="text-xl font-semibold text-slate-700">Unsafe Combinations of Control Actions (UCCAs)</h3>
        <p className="text-sm text-slate-600">Describe combinations of control actions that together could lead to a hazard.</p>
        <Textarea
          label="Description of Combination"
          value={uccaForm.description}
          onChange={e => setUccaForm(prev => ({ ...prev, description: e.target.value }))}
          rows={2}
        />
        <Textarea
          label="Context (Why is this unsafe?)"
          value={uccaForm.context}
          onChange={e => setUccaForm(prev => ({ ...prev, context: e.target.value }))}
          rows={3}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Link to Hazards (select at least one):</label>
          <div className="max-h-40 overflow-y-auto p-2 border border-slate-300 rounded-md bg-white">
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
          <Button onClick={handleSaveUCCA} leftIcon={<PlaceholderPlusIcon />}>{editingUccaId ? 'Update UCCA' : 'Add UCCA'}</Button>
          {editingUccaId && <Button onClick={resetForm} variant="secondary">Cancel Edit</Button>}
        </div>

        {/* Existing UCCAs */}
        {displayedUccas.length > 0 ? (
          <ul className="space-y-3">
            {displayedUccas.map(ucca => (
              <li key={ucca.id} className="p-4 border rounded-md shadow-sm bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{ucca.code}</p>
                    <p className="text-sm text-slate-700">{ucca.description}</p>
                    <p className="mt-1 text-sm text-slate-600">Context: {ucca.context}</p>
                    <p className="text-sm text-slate-600">Linked Hazards: {ucca.hazardIds.map(hid => hazards.find(h => h.id === hid)?.code || 'N/A').join(', ')}</p>
                  </div>
                  <div className="space-x-1 flex-shrink-0">
                    <Button onClick={() => loadUccaForEdit(ucca)} size="sm" variant="ghost" className="bg-white/50 hover:bg-white/70">Edit</Button>
                    <Button onClick={() => deleteUCCA(ucca.id)} size="sm" variant="ghost" className="text-red-600 hover:text-red-700 bg-white/50 hover:bg-white/70">
                      <PlaceholderTrashIcon />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">No UCCAs defined yet.</p>
        )}
      </div>
    </div>
  );
};

export default UnsafeControlActions;