
// This component reuses the structure from CastStep2 but with STPA specific labels/logic if needed.
// For now, it's largely identical due to FR-5.3 stating "Identical UI widgets as 5.2 except copy changes".
// The copy changes are handled within SharedLossesHazards component via analysisType prop.

import React, {ChangeEvent} from 'react';
import { AnalysisType, Hazard, Loss, SystemConstraint } from '../../types'; // Removed EventDetail as it's CAST-specific
import { useState, useCallback, useEffect } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { STANDARD_LOSSES, SYSTEM_COMPONENT_EXAMPLES, SYSTEM_STATE_CONDITION_EXAMPLES } from '../../constants';
import Input from '../shared/Input';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Button from '../shared/Button';
import Select from '../shared/Select'; // Added for dropdowns

// Placeholder SVGs - these should be proper SVG components or from a library
const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

// This is the shared component logic, potentially moved to its own file in a larger refactor.
const SharedLossesHazardsComponent: React.FC<{ analysisType: AnalysisType }> = ({ analysisType }) => {
  const {
    analysisSession, updateAnalysisSession,
    losses, addLoss, updateLoss, deleteLoss,
    hazards, addHazard, updateHazard, deleteHazard,
    systemConstraints, addSystemConstraint, updateSystemConstraint,
  } = useAnalysis();

  const [scope, setScope] = useState(analysisSession?.scope || '');
  const [otherLossTitle, setOtherLossTitle] = useState('');
  const [otherLossDesc, setOtherLossDesc] = useState('');
  const [selectedLossIdsState, setSelectedLossIdsState] = useState<string[]>(losses.map(l => l.id));

  // Hazard creation form state
  const [currentHazardData, setCurrentHazardData] = useState<Partial<Omit<Hazard, 'id' | 'code'>>>({ systemComponent: '', environmentalCondition: '', systemState: '', linkedLossIds: [] });
  const [editingHazardId, setEditingHazardId] = useState<string | null>(null);
  
  // Sub-hazard state
  const [parentHazardForSubHazard, setParentHazardForSubHazard] = useState<string | null>(null);
  const [subHazardDescription, setSubHazardDescription] = useState<string>('');
  // System Constraint specific state for STPA
  const [constraintShallNotMustNot, setConstraintShallNotMustNot] = useState<'shall not' | 'must not'>('shall not');


  useEffect(() => { setScope(analysisSession?.scope || ''); }, [analysisSession?.scope]);
  useEffect(() => { setSelectedLossIdsState(losses.map(l => l.id)); }, [losses]);

  const handleScopeBlur = () => { if (analysisSession && analysisSession.scope !== scope) updateAnalysisSession({ scope }); };
  
  const handleLossSelectionChange = (lossId: string, isSelected: boolean) => {
    const standardLoss = STANDARD_LOSSES.find(sl => sl.id === lossId);
    if (standardLoss) {
      const existing = losses.find(l => l.id === lossId);
      if (isSelected && !existing) {
        addLoss({ title: standardLoss.title, description: standardLoss.description, isStandard: true });
      }
    }
    setSelectedLossIdsState(prev => isSelected ? [...prev, lossId] : prev.filter(id => id !== lossId));
  };

  const handleAddOtherLoss = () => {
    if (otherLossTitle.trim() === '') return;
    addLoss({ title: otherLossTitle, description: otherLossDesc, isStandard: false });
    setOtherLossTitle(''); setOtherLossDesc('');
  };
  
  const handleHazardInputChange = <K extends keyof Omit<Hazard, 'id' | 'code'>>(field: K, value: Omit<Hazard, 'id' | 'code'>[K]) => {
    setCurrentHazardData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleHazardLossLinkChange = (lossId: string, checked: boolean) => {
    setCurrentHazardData(prev => ({ ...prev, linkedLossIds: checked ? [...(prev.linkedLossIds || []), lossId] : (prev.linkedLossIds || []).filter(id => id !== lossId) }));
  };

  const handleSaveHazard = () => {
    if (!currentHazardData.systemComponent || !currentHazardData.environmentalCondition || !currentHazardData.systemState || !currentHazardData.linkedLossIds || currentHazardData.linkedLossIds.length === 0) {
      alert("Please fill all hazard fields (System Component, Environmental Condition, System State) and link to at least one loss."); return;
    }
    const hazardTitle = `${currentHazardData.systemComponent} ${currentHazardData.environmentalCondition} when ${currentHazardData.systemState}`;
    const hazardPayload = { ...currentHazardData, title: hazardTitle } as Omit<Hazard, 'id' | 'code'>;

    if (editingHazardId) {
      updateHazard(editingHazardId, hazardPayload);
    } else {
      addHazard(hazardPayload);
    }
    resetHazardForm();
  };
  
  const resetHazardForm = () => {
    setCurrentHazardData({ systemComponent: '', environmentalCondition: '', systemState: '', linkedLossIds: [] });
    setEditingHazardId(null);
  };

  const editHazard = (hazard: Hazard) => {
    setEditingHazardId(hazard.id);
    setCurrentHazardData({ systemComponent: hazard.systemComponent, environmentalCondition: hazard.environmentalCondition, systemState: hazard.systemState, linkedLossIds: hazard.linkedLossIds });
  };
  
  const handleAddSubHazard = () => {
    if (!parentHazardForSubHazard || !subHazardDescription.trim()) {
        alert("Please select a parent hazard and provide a description for the sub-hazard.");
        return;
    }
    const parentHazard = hazards.find(h => h.id === parentHazardForSubHazard);
    if (!parentHazard) return;

    // Sub-hazard title could be: Parent Title - Sub-description, or user defined.
    // For simplicity, we'll use the description as the main defining text.
    // The `subHazardDetails` field in `Hazard` type stores this.
    // A sub-hazard is still a hazard, so it needs its own component, state, condition, and linked losses (can inherit from parent).
    const subHazardData: Omit<Hazard, 'id' | 'code'> = {
        title: `${parentHazard.systemComponent} - ${subHazardDescription}`, // Simplified title
        systemComponent: parentHazard.systemComponent, // Inherit or specify
        environmentalCondition: parentHazard.environmentalCondition, // Inherit or specify
        systemState: subHazardDescription, // Main differentiator
        linkedLossIds: [...parentHazard.linkedLossIds], // Inherit linked losses
        parentHazardId: parentHazard.id,
        subHazardDetails: subHazardDescription,
    };
    addHazard(subHazardData);
    setParentHazardForSubHazard(null);
    setSubHazardDescription('');
  };

  const autoGenerateConstraints = useCallback(() => {
    hazards.forEach(hazard => {
      const existingConstraint = systemConstraints.find(sc => sc.hazardId === hazard.id);
      let constraintPrefix = "The system";
      if(analysisType === AnalysisType.STPA) {
        constraintPrefix += ` ${hazard.parentHazardId ? (systemConstraints.find(psc => psc.hazardId === hazard.parentHazardId)?.shallNotMustNot || 'shall not') : constraintShallNotMustNot}`;
      } else {
        constraintPrefix += " must prevent";
      }

      const constraintText = `${constraintPrefix}: ${hazard.systemComponent} ${hazard.environmentalCondition} when ${hazard.systemState}.`;
      
      const newConstraintData: Partial<SystemConstraint> = { text: constraintText };
      if (analysisType === AnalysisType.STPA) {
        newConstraintData.shallNotMustNot = hazard.parentHazardId 
            ? systemConstraints.find(psc => psc.hazardId === hazard.parentHazardId)?.shallNotMustNot || 'shall not'
            : constraintShallNotMustNot;
      }

      if (!existingConstraint) {
        addSystemConstraint({ text: constraintText, hazardId: hazard.id, ... (analysisType === AnalysisType.STPA && {shallNotMustNot: newConstraintData.shallNotMustNot}) } as Omit<SystemConstraint, 'id'|'code'>);
      } else if (existingConstraint.text !== constraintText || (analysisType === AnalysisType.STPA && existingConstraint.shallNotMustNot !== newConstraintData.shallNotMustNot)) {
        updateSystemConstraint(existingConstraint.id, newConstraintData);
      }
    });
  }, [hazards, systemConstraints, addSystemConstraint, updateSystemConstraint, analysisType, constraintShallNotMustNot]);

  useEffect(() => { autoGenerateConstraints(); }, [hazards, autoGenerateConstraints]);

  const getUnlinkedLosses = (): Loss[] => losses.filter(loss => !hazards.some(h => h.linkedLossIds.includes(loss.id)));
  
  const systemComponentOptions = SYSTEM_COMPONENT_EXAMPLES.map(e => ({ value: e, label: e }));
  const stateConditionOptions = SYSTEM_STATE_CONDITION_EXAMPLES.flatMap(cat => 
    cat.examples.map(ex => ({ value: ex, label: `${cat.category} - ${ex}` }))
  );


  return (
    <div className="space-y-8">
      {/* Scope */}
      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">
          1. Define {analysisType === AnalysisType.CAST ? "Accident Scope & Boundaries" : "System Purpose, Scope & Boundaries"}
        </h3>
        <p className="text-sm text-slate-600 mb-2">{analysisType === AnalysisType.CAST ? "Define the scope of your investigation. This is normally limited to those individuals or entities who can implement your recommendations... You will not include anything outside of the scope you define here..." : "Define the scope of your investigation based on the losses and hazards you have identified. This is normally limited to those individuals or entities who can implement your recommendations..."}</p>
        <Textarea
          label={analysisType === AnalysisType.CAST ? "Describe the accident or incident being investigated." : "Describe the system and its purpose, including boundaries."}
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          onBlur={handleScopeBlur}
          placeholder="Enter details here..."
          rows={3}
        />
      </div>

      {/* Losses */}
      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">
          2. Identify {analysisType === AnalysisType.CAST ? "Losses that Occurred" : "System-Level Losses to Prevent"}
        </h3>
        <p className="text-sm text-slate-600 mb-1">Select standard losses and/or define custom ones. At least one loss must be defined and linked to a hazard.</p>
        {getUnlinkedLosses().length > 0 && losses.length > 0 && (
           <p className="text-xs text-orange-600 mb-3 p-2 bg-orange-100 border border-orange-300 rounded-md">
             Warning (BR-2-HLink): The following losses are not yet linked to any hazard: {getUnlinkedLosses().map(l => `${l.code}: ${l.title}`).join(', ')}. Please link them in the Hazards section.
           </p>
        )}
        <div className="space-y-3">
          {STANDARD_LOSSES.map(stdLoss => (
            <Checkbox
              key={stdLoss.id}
              id={`loss-${stdLoss.id}-${analysisType}`}
              label={`${stdLoss.title} - ${stdLoss.description}`}
              checked={selectedLossIdsState.includes(stdLoss.id)}
              onChange={(e) => handleLossSelectionChange(stdLoss.id, e.target.checked)}
            />
          ))}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-md font-semibold text-slate-600 mb-2">Other Losses:</h4>
            {losses.filter(l => !l.isStandard).map(loss => (
              <div key={loss.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-md mb-2 bg-slate-50">
                <div>
                  <p className="font-medium text-slate-700">{loss.code}: {loss.title}</p>
                  <p className="text-sm text-slate-500">{loss.description}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteLoss(loss.id)} className="text-red-500 hover:text-red-700">
                  <PlaceholderTrashIcon/>
                </Button>
              </div>
            ))}
            <div className="flex items-end space-x-2">
              <Input label="Custom Loss Title" id={`otherLossTitle-${analysisType}`} value={otherLossTitle} onChange={(e) => setOtherLossTitle(e.target.value)} placeholder="e.g., Loss of Public Confidence" containerClassName="flex-grow"/>
              <Input label="Custom Loss Description" id={`otherLossDesc-${analysisType}`} value={otherLossDesc} onChange={(e) => setOtherLossDesc(e.target.value)} placeholder="Brief description" containerClassName="flex-grow"/>
              <Button onClick={handleAddOtherLoss} leftIcon={<PlaceholderPlusIcon />} className="mb-4">Add Custom Loss</Button>
            </div>
             {losses.length === 0 && (<p className="text-xs text-red-600">Please add at least one loss.</p>)}
          </div>
          {losses.length > 0 && (<div className="mt-4">
            <h4 className="text-md font-semibold text-slate-600 mb-1">Selected/Defined Losses:</h4>
            <ul className="list-disc list-inside ml-4 text-sm">
                {losses.map(l => <li key={l.id}>{l.code}: {l.title}</li>)}
            </ul>
          </div>)}
        </div>
      </div>

      {/* Hazards */}
      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">
         3. Identify System-Level Hazards
        </h3>
         <p className="text-sm text-slate-600 mb-1">A hazard is a system state or set of conditions that, together with a worst-case environment, will lead to a loss.</p>
         <p className="text-xs text-slate-500 mb-3">Format: {"<System Component> <Environmental Condition> when <System State>"}. Use the dropdowns for examples or type directly.</p>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 mb-6">
          <Select label="System Component (involved in the hazard)" value={currentHazardData.systemComponent || ''} onChange={e => handleHazardInputChange('systemComponent', e.target.value)} options={[{value:'', label:'Select or type component'}, ...systemComponentOptions]} placeholder="e.g., Aircraft"/>
          <Select label="Environmental Condition (that makes it hazardous)" value={currentHazardData.environmentalCondition || ''} onChange={e => handleHazardInputChange('environmentalCondition', e.target.value)} options={[{value:'', label:'Select or type condition'}, ...stateConditionOptions.filter(opt => opt.label.toLowerCase().includes("condition") || opt.label.toLowerCase().includes("inflight") || opt.label.toLowerCase().includes("ground"))]} placeholder="e.g., in heavy turbulence"/>
          <Select label="System State (that is hazardous under this condition)" value={currentHazardData.systemState || ''} onChange={e => handleHazardInputChange('systemState', e.target.value)} options={[{value:'', label:'Select or type state'}, ...stateConditionOptions]} placeholder="e.g., provides incorrect altitude reading"/>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link to Losses (select at least one):</label>
            {losses.length === 0 && <p className="text-sm text-slate-500">No losses defined yet. Please add losses first.</p>}
            {losses.map(loss => ( <Checkbox key={loss.id} id={`hazard-link-${loss.id}-${analysisType}`} label={`${loss.code}: ${loss.title}`} checked={currentHazardData.linkedLossIds?.includes(loss.id) || false} onChange={e => handleHazardLossLinkChange(loss.id, e.target.checked)}/> ))}
             {currentHazardData.linkedLossIds?.length === 0 && <p className="text-xs text-red-500 mt-1">A hazard must be linked to at least one loss.</p>}
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleSaveHazard} leftIcon={<PlaceholderPlusIcon />}>{editingHazardId ? 'Update Hazard' : 'Add Hazard'}</Button>
            {editingHazardId && <Button onClick={resetHazardForm} variant="secondary">Cancel Edit</Button>}
          </div>
        </div>

        {hazards.filter(h => !h.parentHazardId).length > 0 && (
          <div>
            <h4 className="text-md font-semibold text-slate-600 mb-2">Defined Hazards:</h4>
            <ul className="space-y-2">
              {hazards.filter(h => !h.parentHazardId).map(h => (
                <li key={h.id} className="p-3 border border-slate-200 rounded-md bg-white">
                  <p className="font-semibold text-slate-800">{h.code}: {h.title}</p>
                  <p className="text-sm text-slate-500">Linked Losses: {h.linkedLossIds.map(id => losses.find(l=>l.id===id)?.code || 'N/A').join(', ')}</p>
                  <div className="mt-2 space-x-2">
                    <Button onClick={() => editHazard(h)} size="sm" variant="ghost">Edit</Button>
                    <Button onClick={() => deleteHazard(h.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700">Delete</Button>
                    <Button onClick={() => setParentHazardForSubHazard(h.id)} size="sm" variant="ghost" className="text-sky-600 hover:text-sky-800">Add Sub-Hazard</Button>
                  </div>
                  {/* Sub-hazards for this hazard */}
                  {hazards.filter(subH => subH.parentHazardId === h.id).map(subH => (
                    <div key={subH.id} className="ml-4 mt-2 p-2 border-l-2 border-sky-200 bg-sky-50 rounded-r-md">
                        <p className="font-medium text-sky-700">{subH.code}: {subH.subHazardDetails} (Sub-hazard of {h.code})</p>
                        <p className="text-xs text-slate-500">Linked Losses: {subH.linkedLossIds.map(id => losses.find(l=>l.id===id)?.code || 'N/A').join(', ')}</p>
                         <div className="mt-1 space-x-1">
                            <Button onClick={() => editHazard(subH)} size="sm" variant="ghost">Edit</Button>
                            <Button onClick={() => deleteHazard(subH.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700">Delete</Button>
                        </div>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Define Sub-Hazards Section */}
      {parentHazardForSubHazard && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="text-md font-semibold text-amber-700 mb-2">Define Sub-Hazard for {hazards.find(h=>h.id === parentHazardForSubHazard)?.code}:</h4>
            <Textarea 
                label="Sub-Hazard Description (Specific condition or refinement of the parent hazard):"
                value={subHazardDescription}
                onChange={e => setSubHazardDescription(e.target.value)}
                placeholder="e.g., Thrust not sufficient during takeoff roll, Angle of attack too high during landing flare"
                rows={2}
            />
            <div className="flex space-x-2 mt-2">
                <Button onClick={handleAddSubHazard} leftIcon={<PlaceholderPlusIcon/>} className="bg-amber-500 hover:bg-amber-600 text-white">Add Sub-Hazard</Button>
                <Button onClick={() => {setParentHazardForSubHazard(null); setSubHazardDescription('');}} variant="secondary">Cancel</Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Sub-hazards will inherit linked losses from the parent hazard but can be modified later if needed.</p>
        </div>
      )}


      {/* System Constraints */}
      <div>
        <h3 className="text-xl font-semibold text-slate-700 mb-3">
          4. Define System Safety Constraints
        </h3>
        <p className="text-sm text-slate-600 mb-3">Safety constraints are the inverse of hazards and represent requirements for safe operation. These are auto-generated but can be refined. For STPA, specify if the constraint is a "shall not" or "must not" condition related to the hazard.</p>
        {analysisType === AnalysisType.STPA && (
             <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Default constraint phrasing for new top-level hazards:</label>
                <Select
                    value={constraintShallNotMustNot}
                    onChange={(e) => setConstraintShallNotMustNot(e.target.value as 'shall not' | 'must not')}
                    options={[
                        { value: 'shall not', label: 'System shall not...' },
                        { value: 'must not', label: 'System must not...' }
                    ]}
                    containerClassName="!mb-0 w-1/3"
                />
            </div>
        )}
        {systemConstraints.length > 0 ? (
          <ul className="space-y-2">
            {systemConstraints.map(sc => (
              <li key={sc.id} className="p-3 border border-slate-200 rounded-md bg-slate-50">
                <Textarea
                  label={`${sc.code}: (Derived from Hazard ${hazards.find(h=>h.id === sc.hazardId)?.code || 'N/A'})`}
                  value={sc.text}
                  onChange={(e) => updateSystemConstraint(sc.id, { text: e.target.value })}
                  rows={2}
                />
                {analysisType === AnalysisType.STPA && (
                     <Select
                        label="Constraint Type (effective phrasing)"
                        value={sc.shallNotMustNot || 'shall not'}
                        onChange={(e) => updateSystemConstraint(sc.id, { shallNotMustNot: e.target.value as 'shall not' | 'must not' })}
                        options={[
                            { value: 'shall not', label: 'System shall not...' },
                            { value: 'must not', label: 'System must not...' }
                        ]}
                        containerClassName="mt-2 w-1/3"
                    />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No hazards defined yet. Constraints will appear here once hazards are added.</p>
        )}
      </div>
    </div>
  );
};


const StpaStep2: React.FC = () => <SharedLossesHazardsComponent analysisType={AnalysisType.STPA} />;

export default StpaStep2;
