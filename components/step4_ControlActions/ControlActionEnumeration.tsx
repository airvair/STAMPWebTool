
import React, { useState } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { ControlAction, Controller } from '../../types';
import { CONTROLLER_TYPE_COLORS } from '../../constants';
import Input from '../shared/Input';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Button from '../shared/Button';

const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

interface ControlActionFormState {
  verb: string;
  object: string;
  description: string;
  isOutOfScope: boolean;
}

const ControlActionEnumeration: React.FC = () => {
  const { controllers, controlActions, addControlAction, updateControlAction, deleteControlAction } = useAnalysis();
  
  const [currentControllerId, setCurrentControllerId] = useState<string | null>(controllers.length > 0 ? controllers[0].id : null);
  const [formState, setFormState] = useState<ControlActionFormState>({ verb: '', object: '', description: '', isOutOfScope: false });
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  const handleInputChange = <K extends keyof ControlActionFormState>(field: K, value: ControlActionFormState[K]) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormState({ verb: '', object: '', description: '', isOutOfScope: false });
    setEditingActionId(null);
  };

  const handleSaveControlAction = () => {
    if (!currentControllerId || !formState.verb || !formState.object) {
      alert("Please select a controller and fill in verb and object for the control action.");
      return;
    }
    const actionData: Omit<ControlAction, 'id' | 'controllerId'> = { 
      verb: formState.verb, 
      object: formState.object, 
      description: formState.description,
      isOutOfScope: formState.isOutOfScope,
    };

    if (editingActionId) {
      updateControlAction(editingActionId, { ...actionData, controllerId: currentControllerId });
    } else {
      addControlAction({ ...actionData, controllerId: currentControllerId });
    }
    resetForm();
  };

  const editAction = (action: ControlAction) => {
    setCurrentControllerId(action.controllerId); // Ensure the correct controller is selected
    setEditingActionId(action.id);
    setFormState({ 
      verb: action.verb, 
      object: action.object, 
      description: action.description,
      isOutOfScope: action.isOutOfScope 
    });
  };

  const filteredActions = currentControllerId ? controlActions.filter(ca => ca.controllerId === currentControllerId) : [];

  if (controllers.length === 0) {
    return <p className="text-slate-600">No controllers defined yet. Please define controllers in Step 3 first.</p>;
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        For each controller identified in your control structure, list the control actions it can issue.
        Mark actions as "Out of Scope" if they are not relevant to this specific safety analysis.
      </p>

      {/* Controller Selector */}
      <div>
        <label htmlFor="controllerSelect" className="block text-sm font-medium text-slate-700 mb-1">Select Controller:</label>
        <select
          id="controllerSelect"
          value={currentControllerId || ''}
          onChange={(e) => { setCurrentControllerId(e.target.value); resetForm(); }}
          className="block w-full md:w-1/2 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>-- Select a Controller --</option>
          {controllers.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.ctrlType})</option>
          ))}
        </select>
      </div>

      {currentControllerId && (
        <>
          {/* Control Action Form */}
          <div className={`p-4 rounded-lg border space-y-3 bg-slate-50 ${CONTROLLER_TYPE_COLORS[controllers.find(c=>c.id === currentControllerId)!.ctrlType]}`}>
            <h3 className="text-lg font-semibold">
              {editingActionId ? 'Edit Control Action for ' : 'Add New Control Action for '} 
              <span className="font-bold">{controllers.find(c=>c.id === currentControllerId)?.name}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Verb"
                value={formState.verb}
                onChange={e => handleInputChange('verb', e.target.value)}
                placeholder="e.g., SET, START, TRANSMIT"
              />
              <Input
                label="Object / Parameter"
                value={formState.object}
                onChange={e => handleInputChange('object', e.target.value)}
                placeholder="e.g., ALTITUDE, ENGINE, DATA_PACKET"
              />
            </div>
            <Textarea
              label="Description (optional)"
              value={formState.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Provide context for this control action"
              rows={2}
            />
            <Checkbox
              label="Mark as Out of Scope for this analysis"
              checked={formState.isOutOfScope}
              onChange={e => handleInputChange('isOutOfScope', e.target.checked)}
            />
            <div className="flex space-x-2 pt-2">
              <Button onClick={handleSaveControlAction} leftIcon={<PlaceholderPlusIcon />}>
                {editingActionId ? 'Update Control Action' : 'Add Control Action'}
              </Button>
              {editingActionId && <Button onClick={resetForm} variant="secondary">Cancel Edit</Button>}
            </div>
          </div>

          {/* List of Control Actions for Selected Controller */}
          {filteredActions.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-slate-600 mb-2">
                Defined Control Actions for {controllers.find(c=>c.id === currentControllerId)?.name}:
              </h4>
              <ul className="space-y-2">
                {filteredActions.map(action => (
                  <li key={action.id} className={`p-3 border rounded-md shadow-sm ${action.isOutOfScope ? 'bg-slate-100 opacity-70' : 'bg-white'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${action.isOutOfScope ? 'line-through' : ''}`}>
                          {action.verb} {action.object}
                        </p>
                        {action.description && <p className="text-sm text-slate-500 mt-1">{action.description}</p>}
                        {action.isOutOfScope && <p className="text-xs text-orange-600 font-medium">(Out of Scope)</p>}
                      </div>
                      <div className="space-x-1 flex-shrink-0">
                        <Button onClick={() => editAction(action)} size="sm" variant="ghost">Edit</Button>
                        <Button onClick={() => deleteControlAction(action.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                          <PlaceholderTrashIcon />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
           {filteredActions.length === 0 && <p className="text-sm text-slate-500 mt-4">No control actions defined for this controller yet.</p>}
        </>
      )}
    </div>
  );
};

export default ControlActionEnumeration;
    