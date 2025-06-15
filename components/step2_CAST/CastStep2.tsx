import React, { useState, useCallback, useEffect, ChangeEvent, ReactNode } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { Loss, Hazard, SystemConstraint, EventDetail, AnalysisType } from '../../types';
import { STANDARD_LOSSES } from '../../constants';
import Input from '../shared/Input';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Button from '../shared/Button';
import InfoPopup from '../shared/InfoPopup';

// Placeholder SVGs, replace with actual SVG code or a library
const PlaceholderPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PlaceholderTrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const PlaceholderArrowUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>;
const PlaceholderArrowDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>;

const hazardInfoContent = (
    <>
      <p>As an example, consider a nuclear power plant. A release of radioactive materials, the proximity of a nearby population or city, and the direction of the wind may all be important factors that lead to a potential loss of life. However, as engineers we cannot control the wind and we may not be able to control the city location, but we can control the release of radioactive materials in or outside the plant (a system-level hazard).</p>
      <p>Once the system and system boundary is identified, the next step is to define the system-level hazards by identifying system states or conditions that will lead to a loss in worst-case environmental conditions. The following list provides some examples of system-level hazards:</p>
      <ul>
        <li>H-1: Aircraft violate minimum separation standards in flight [L-1, L-2, L-4, L-5]</li>
        <li>H-2: Aircraft airframe integrity is lost [L-1, L-2, L-4, L-5]</li>
        <li>H-3: Aircraft leaves designated taxiway, runway, or apron on ground [L-1, L-2, L-5]</li>
        <li>H-4: Aircraft comes too close to other objects on the ground [L-1, L-2, L-5]</li>
        <li>H-8: Nuclear power plant releases dangerous materials [L-1, L-4, L-7, L-8]</li>
      </ul>
      <p>There are three basic criteria for defining system-level hazards:</p>
      <ul>
        <li>Hazards are system states or conditions (not component-level causes or environmental states)</li>
        <li>Hazards will lead to a loss in some worst-case environment</li>
        <li>Hazards must describe states or conditions to be prevented</li>
      </ul>
      <h4>Common mistakes when identifying system-level hazards</h4>
      <h5>Confusing hazards with causes of hazards</h5>
      <p>A common mistake in defining hazards is to confuse hazards with causes of hazards. For example, “brake failure”, “brake failure not annunciated”, “operator is distracted”, “engine failure”, and “hydraulic leak” are not system-level hazards but potential causes of hazards. To avoid this mistake, make sure the identified hazards do not refer to individual components of the system, like brakes, engines, hydraulic lines, etc. Instead, the hazards should refer to the overall system and system states.</p>
      <h5>Too many hazards containing unnecessary detail</h5>
      <p>Like losses, there are no hard limits on the number of system-level hazards to include. As a rule of thumb, if you have more than about seven to ten system-level hazards, consider grouping or combining hazards to create a more manageable list.</p>
      <h5>Ambiguous or recursive wording</h5>
      <p>The system-level hazards define exactly what “unsafe” means at the system level. A common mistake is to use the word “unsafe” in the hazards themselves. Doing so creates a recursive definition and does not add information or value to the analysis. A simple solution is to avoid using the word “unsafe” in the hazard itself and instead specify exactly what is meant by “unsafe”—what system states or conditions would make it unsafe?</p>
      <h5>Confusing hazards with failures</h5>
      <p>Hazard identification in STPA is about system states and conditions that are inherently unsafe— regardless of the cause. In fact, the system hazards should be specified at a high-enough level that does not distinguish between causes related to technical failures, design errors, flawed requirements, or human procedures and interactions.</p>
    </>
);

const subHazardInfoContent: ReactNode = (
    <>
      <h4>Refining the system-level hazards (optional)</h4>
      <p>
        Once the list of system-level hazards has been identified and reviewed, these hazards can be refined into sub-hazards if appropriate. Sub-hazards are not necessary for many STPA applications, but they can be useful for large analysis efforts and complex applications because they can guide future steps like modeling the control structure.
      </p>
      <p>
        The first step in refining the system-level hazards is to identify basic system processes or activities that need to be controlled to prevent system hazards. For example, consider the system-level hazard we identified earlier for commercial aviation:
      </p>
      <blockquote className="border-l-4 pl-4 my-4 italic">
        <p>H-4: Aircraft comes too close to other objects on the ground [L-1, L-2, L-5]</p>
      </blockquote>
      <p>
        One way to derive sub-hazards is to ask: What do we need to control to prevent this hazard? To control the aircraft on the ground, we will need some way to control aircraft deceleration, acceleration, and steering. If these are not controlled adequately (for example if the deceleration is insufficient), it could lead to a system-level hazard.
      </p>
      <p>The following sub-hazards can be derived for H-4:</p>
      <blockquote className="border-l-4 pl-4 my-4">
        <p className="font-semibold">H-4: Aircraft comes too close to other objects on the ground [L-1, L-2, L-5]</p>
        <h5 className="font-semibold mt-2">Deceleration</h5>
        <ul className="list-disc list-inside">
          <li>H-4.1: Deceleration is insufficient upon landing, rejected takeoff, or during taxiing</li>
          <li>H-4.2: Asymmetric deceleration maneuvers aircraft toward other objects</li>
          <li>H-4.3: Deceleration occurs after V1 point during takeoff</li>
        </ul>
        <h5 className="font-semibold mt-2">Acceleration</h5>
        <ul className="list-disc list-inside">
          <li>H-4.4: Excessive acceleration provided while taxiing</li>
          <li>H-4.5: Asymmetric acceleration maneuvers aircraft toward other objects</li>
          <li>H-4.6: Acceleration is insufficient during takeoff</li>
          <li>H-4.7: Acceleration is provided during landing or when parked</li>
          <li>H-4.8: Acceleration continues to be applied during rejected takeoff</li>
        </ul>
        <h5 className="font-semibold mt-2">Steering</h5>
        <ul className="list-disc list-inside">
          <li>H-4.9: Insufficient steering to turn along taxiway, runway, or apron path</li>
          <li>H-4.10: Steering maneuvers aircraft off the taxiway, runway, or apron path</li>
        </ul>
      </blockquote>
      <p>
        Each of these sub-hazards can be used to produce more specific constraints.
      </p>
    </>
);

const SharedLossesHazardsComponent: React.FC<{ analysisType: AnalysisType }> = ({ analysisType }) => {
  const {
    analysisSession, updateAnalysisSession,
    losses, addLoss, updateLoss, deleteLoss,
    hazards, addHazard, updateHazard, deleteHazard,
    systemConstraints, addSystemConstraint, updateSystemConstraint, deleteSystemConstraint,
    sequenceOfEvents, addEventDetail, updateEventDetail, deleteEventDetail, reorderEventDetails
  } = useAnalysis();

  const [scope, setScope] = useState(analysisSession?.scope || '');
  const [otherLossTitle, setOtherLossTitle] = useState('');
  const [otherLossDesc, setOtherLossDesc] = useState('');
  const [selectedLossIdsState, setSelectedLossIdsState] = useState<string[]>(losses.map(l => l.id));

  const [newEventDesc, setNewEventDesc] = useState('');

  // Hazard creation form state
  const [currentHazardText, setCurrentHazardText] = useState('');
  const [editingHazardId, setEditingHazardId] = useState<string | null>(null);
  const [hazardError, setHazardError] = useState('');
  const [linkedLossIds, setLinkedLossIds] = useState<string[]>([]);

  // Sub-hazard state
  const [parentHazardForSubHazard, setParentHazardForSubHazard] = useState<string | null>(null);
  const [subHazardDescription, setSubHazardDescription] = useState<string>('');
  // System Constraint specific state for STPA
  const [constraintShallNotMustNot, setConstraintShallNotMustNot] = useState<'shall not' | 'must not'>('shall not');


  useEffect(() => { setScope(analysisSession?.scope || ''); }, [analysisSession?.scope]);
  useEffect(() => {
    const ids = losses
        .filter(l => l.isStandard)
        .map(l => STANDARD_LOSSES.find(sl => sl.title === l.title)?.id)
        .filter((id): id is string => Boolean(id));
    setSelectedLossIdsState(ids);
  }, [losses]);

  useEffect(() => {
    if (editingHazardId) {
      const hazardToEdit = hazards.find(h => h.id === editingHazardId);
      if (hazardToEdit) {
        setCurrentHazardText(hazardToEdit.title);
        setLinkedLossIds(hazardToEdit.linkedLossIds);
      }
    }
  }, [editingHazardId, hazards]);

  // Effect to remove orphaned constraints when a hazard is deleted
  useEffect(() => {
    const hazardIds = new Set(hazards.map(h => h.id));
    const orphanedConstraints = systemConstraints.filter(sc => !hazardIds.has(sc.hazardId));

    if (orphanedConstraints.length > 0) {
      orphanedConstraints.forEach(sc => deleteSystemConstraint(sc.id));
    }
  }, [hazards, systemConstraints, deleteSystemConstraint]);

  const handleScopeBlur = () => { if (analysisSession && analysisSession.scope !== scope) updateAnalysisSession({ scope }); };

  const handleAddEvent = () => {
    if (newEventDesc.trim() === '') return;
    addEventDetail({ description: newEventDesc });
    setNewEventDesc('');
  };

  const moveEvent = (index: number, direction: 'up' | 'down') => {
    const currentEvents = [...sequenceOfEvents].sort((a,b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= currentEvents.length) return;

    const newEvents = [...currentEvents];
    const temp = newEvents[index];
    newEvents[index] = newEvents[targetIndex];
    newEvents[targetIndex] = temp;
    reorderEventDetails(newEvents);
  };

  const handleLossSelectionChange = (lossId: string, isSelected: boolean) => {
    const standardLoss = STANDARD_LOSSES.find(sl => sl.id === lossId);
    if (standardLoss) {
      const existing = losses.find(l => l.title === standardLoss.title && l.isStandard);
      if (isSelected && !existing) {
        addLoss({ title: standardLoss.title, description: standardLoss.description, isStandard: true });
      } else if (!isSelected && existing) {
        deleteLoss(existing.id);
      }
    }
    setSelectedLossIdsState(prev =>
        isSelected ? (prev.includes(lossId) ? prev : [...prev, lossId]) : prev.filter(id => id !== lossId)
    );
  };

  const handleAddOtherLoss = () => {
    if (otherLossTitle.trim() === '') return;
    addLoss({ title: otherLossTitle, description: otherLossDesc, isStandard: false });
    setOtherLossTitle('');
    setOtherLossDesc('');
  };

  const handleHazardInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentHazardText(e.target.value);
    setHazardError(''); // Clear any previous error when the user types
  };

  const handleHazardLossLinkChange = (lossId: string, checked: boolean) => {
    setLinkedLossIds(prev => checked ? [...prev, lossId] : prev.filter(id => id !== lossId));
  };

  const handleSaveHazard = () => {
    if (currentHazardText.trim() === '') {
      setHazardError('Please enter the hazard description.');
      return;
    }
    if (linkedLossIds.length === 0) {
      setHazardError('Please link the hazard to at least one loss.');
      return;
    }
    setHazardError('');

    // For simplicity, we'll store the full text as the title,
    // and attempt a basic parse for the component parts.
    // A more advanced implementation could use regex or structured input.
    const hazardPayload: Omit<Hazard, 'id' | 'code'> = {
      title: currentHazardText,
      systemComponent: currentHazardText.split(' ')[0] || 'Unknown Component', // Simple parse
      environmentalCondition: '', // Not parsed from single input
      systemState: currentHazardText.substring(currentHazardText.indexOf(' ') + 1) || 'Unknown State', // Simple parse
      linkedLossIds: linkedLossIds,
    };

    if (editingHazardId) {
      updateHazard(editingHazardId, hazardPayload);
    } else {
      addHazard(hazardPayload);
    }
    resetHazardForm();
  };

  const resetHazardForm = () => {
    setCurrentHazardText('');
    setEditingHazardId(null);
    setLinkedLossIds([]);
  };

  const editHazard = (hazard: Hazard) => {
    setEditingHazardId(hazard.id);
    setCurrentHazardText(hazard.title);
    setLinkedLossIds(hazard.linkedLossIds);
  };

  const handleAddSubHazard = () => {
    if (!parentHazardForSubHazard || !subHazardDescription.trim()) {
      alert("Please select a parent hazard and provide a description for the sub-hazard.");
      return;
    }
    const parentHazard = hazards.find(h => h.id === parentHazardForSubHazard);
    if (!parentHazard) return;

    const subHazardData: Omit<Hazard, 'id' | 'code'> = {
      title: subHazardDescription, // The new title is the description itself
      systemComponent: parentHazard.systemComponent, // Inherit component
      environmentalCondition: parentHazard.environmentalCondition, // Inherit condition
      systemState: subHazardDescription, // The new state is the description
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
      if(analysisType === AnalysisType.STPA) { // STPA specific phrasing
        constraintPrefix += ` ${hazard.parentHazardId ? (systemConstraints.find(psc => psc.hazardId === hazard.parentHazardId)?.shallNotMustNot || 'shall not') : constraintShallNotMustNot}`;
      } else { // CAST specific or general phrasing
        constraintPrefix += " must prevent";
      }
      // Use the full title for the constraint text
      const constraintText = `${constraintPrefix}: ${hazard.title}.`;

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

  const coveredLossCount = losses.filter(loss => hazards.some(h => h.linkedLossIds.includes(loss.id))).length;

  return (
      <div className="space-y-8">
        {/* Scope */}
        <div>
          <h3 className="text-xl font-semibold text-slate-700 mb-3">
            1. Define {analysisType === AnalysisType.CAST ? "Accident Scope & Boundaries" : "System Purpose, Scope & Boundaries"}
          </h3>
          <p className="text-sm text-slate-600 mb-2">{analysisType === AnalysisType.CAST ? "Describe the physical, functional, organisational and temporal boundaries of the investigation. Recommendations should address actors within these boundaries." : "Define the scope of your investigation based on the losses and hazards you have identified. This is normally limited to those individuals or entities who can implement your recommendations..."}</p>
          {analysisType === AnalysisType.CAST && (
              <ul className="list-disc ml-6 text-xs text-slate-500 mb-2">
                <li>Out-of-scope: international ATC providers, third-party maintenance</li>
              </ul>
          )}
          {analysisType === AnalysisType.CAST && (
              <p className="text-xs text-slate-500 mb-3">Record the date, time and location of the occurrence.</p>
          )}
          <Textarea
              label={analysisType === AnalysisType.CAST ? "Describe the accident or incident being investigated." : "Describe the system and its purpose, including boundaries."}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              onBlur={handleScopeBlur}
              placeholder="Enter details here..."
              rows={3}
          />
        </div>

        {/* Sequence of Events (CAST only) */}
        {analysisType === AnalysisType.CAST && (
            <div>
              <h3 className="text-xl font-semibold text-slate-700 mb-3">2. Document Sequence of Events</h3>
              <p className="text-sm text-slate-600 mb-1">List the sequence of events leading to the occurrence. Each entry will be automatically numbered; include time-stamps if available.</p>
              <p className="text-xs text-slate-500 mb-3">Guidance: Do not use the word 'fail' unless it describes a mechanical component that broke. For people or software, describe their actions in a neutral way (e.g., "the pilot did not extend the landing gear" NOT "the pilot failed to extend...").</p>
              <p className="text-xs text-slate-400 mb-2">Example: 1. 00:42:17 – The aircraft descended through 10 000 ft without a cabin pressure checklist.</p>
              <div className="space-y-2 mb-4">
                {sequenceOfEvents.sort((a,b) => a.order - b.order).map((event, index) => (
                    <div key={event.id} className="flex items-center space-x-2 p-2 border border-slate-200 rounded-md bg-slate-50">
                      <span className="text-slate-500 w-6 text-right">{index + 1}.</span>
                      <Input value={event.description} onChange={(e) => updateEventDetail(event.id, { description: e.target.value })} className="flex-grow !mb-0" containerClassName="!mb-0 flex-grow"/>
                      <div className="flex flex-col">
                        <Button variant="ghost" size="sm" onClick={() => moveEvent(index, 'up')} disabled={index === 0} className="p-1"><PlaceholderArrowUpIcon /></Button>
                        <Button variant="ghost" size="sm" onClick={() => moveEvent(index, 'down')} disabled={index === sequenceOfEvents.length - 1} className="p-1"><PlaceholderArrowDownIcon /></Button>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteEventDetail(event.id)} className="text-red-500 hover:text-red-700 p-1"><PlaceholderTrashIcon /></Button>
                    </div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Input value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} placeholder="Enter new event description" className="flex-grow !mb-0" containerClassName="!mb-0 flex-grow" onKeyPress={(e) => e.key === 'Enter' && handleAddEvent()}/>
                <Button onClick={handleAddEvent} leftIcon={<PlaceholderPlusIcon />}>Add Event</Button>
              </div>
            </div>
        )}

        {/* Losses */}
        <div>
          <h3 className="text-xl font-semibold text-slate-700 mb-3">
            {analysisType === AnalysisType.CAST ? "3. Identify Losses that Occurred" : "2. Identify System-Level Losses to Prevent"}
          </h3>
          <p className="text-sm text-slate-600 mb-1">Select standard losses and/or define custom ones. At least one loss must be defined and linked to a hazard.</p>
          {getUnlinkedLosses().length > 0 && losses.length > 0 && (
              <p className="text-xs text-orange-600 mb-3 p-2 bg-orange-100 border border-orange-300 rounded-md">
                Warning (BR-2-HLink): The following losses are not yet linked to any hazard: {getUnlinkedLosses().map(l => `${l.code}: ${l.title}`).join(', ')}. Please link them in the Hazards section.
              </p>
          )}
          <div className="space-y-3">
            {STANDARD_LOSSES.map(stdLoss => (
                <Checkbox key={stdLoss.id} id={`loss-${stdLoss.id}-${analysisType}`} label={`${stdLoss.title} - ${stdLoss.description}`} checked={selectedLossIdsState.includes(stdLoss.id)} onChange={(e) => handleLossSelectionChange(stdLoss.id, e.target.checked)}/>
            ))}
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-md font-semibold text-slate-600 mb-2">Other Losses:</h4>
              {losses.filter(l => !l.isStandard).map(loss => (
                  <div key={loss.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-md mb-2 bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-700">{loss.code}: {loss.title}</p>
                      <p className="text-sm text-slate-500">{loss.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteLoss(loss.id)} className="text-red-500 hover:text-red-700"><PlaceholderTrashIcon/></Button>
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
          <div className="flex items-center space-x-2 mb-3">
            <h3 className="text-xl font-semibold text-slate-700">
              {analysisType === AnalysisType.CAST ? "4. Identify Hazards Leading to Losses" : "3. Identify System-Level Hazards"}
              {losses.length > 0 && (
                  <span className="ml-2 text-xs bg-slate-200 text-slate-800 rounded-full px-2 py-0.5 align-middle">
                {coveredLossCount} / {losses.length} losses covered
                </span>
              )}
            </h3>
            <InfoPopup title="About System-Level Hazards" content={hazardInfoContent} />
          </div>

          <div className="text-sm text-slate-600 mb-4 space-y-2">
            <p>You will now be led through the process to write out your hazards.</p>
          </div>

          <div className="bg-slate-100 p-3 rounded-md border border-slate-300 mb-4">
            <h4 className="font-semibold text-slate-700">Here is what a hazard looks like:</h4>
            <p className="text-sm text-slate-600 mt-1 font-mono p-2 bg-white rounded">
              <span style={{color: 'red'}}>H-1:</span> <span style={{color: 'green'}}>[System Component]</span> <span style={{color: 'blue'}}>[Environmental Condition and System State]</span> <span style={{color: 'purple'}}>[L-1, L-2..]</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Example: H-1: Aircraft violates minimum separation standards inflight [L-1, L-2]</p>
          </div>

          <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg mb-4">
            <h4 className="font-semibold text-slate-700 mb-2">Tips to prevent common mistakes when identifying hazards:</h4>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
              <li>Hazards should not refer to individual components of the system.</li>
              <li>All hazards should refer to the overall system and system state.</li>
              <li>Hazards should refer to factors that can be controlled or managed by the system designers and operators.</li>
              <li>All hazards should describe system-level conditions to be prevented.</li>
              <li>The number of hazards should be relatively small, usually no more than 7 to 10.</li>
              <li>Hazards should not include ambiguous or recursive words like “unsafe”, “unintended”, “accidental”, etc.</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 mb-6">
            <Input
                label="Enter the hazard description"
                id="hazard-description"
                value={currentHazardText}
                onChange={handleHazardInputChange}
                placeholder="e.g., Aircraft violates minimum separation standards inflight"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link to Losses (select at least one):
                {linkedLossIds.length > 0 && (
                    <span className="text-green-600 ml-1">✓</span>
                )}
              </label>
              {losses.length === 0 && <p className="text-sm text-slate-500">No losses defined yet. Please add losses first.</p>}
              {losses.map(loss => ( <Checkbox key={loss.id} id={`hazard-link-${loss.id}-${analysisType}`} label={`${loss.code}: ${loss.title}`} checked={linkedLossIds.includes(loss.id)} onChange={e => handleHazardLossLinkChange(loss.id, e.target.checked)}/> ))}
              {linkedLossIds.length === 0 && <p className="text-xs text-red-500 mt-1">A hazard must be linked to at least one loss.</p>}
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSaveHazard} leftIcon={<PlaceholderPlusIcon />}>{editingHazardId ? 'Update Hazard' : 'Add Hazard'}</Button>
              {editingHazardId && <Button onClick={resetHazardForm} variant="secondary">Cancel Edit</Button>}
            </div>
            {hazardError && <p className="text-red-500 text-sm mt-1">{hazardError}</p>}
          </div>

          {hazards.filter(h => !h.parentHazardId).length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-slate-600 mb-2">Defined Hazards:</h4>
                <p className="text-xs text-slate-500 mb-2">After each hazard is completed, you can create an additional hazard using the form above.</p>
                <ul className="space-y-2">
                  {hazards.filter(h => !h.parentHazardId).map(h => (
                      <li key={h.id} className="p-3 border border-slate-200 rounded-md bg-white">
                        <div className="font-semibold text-slate-800">{h.code}: {h.title} [{h.linkedLossIds.map(id => losses.find(l=>l.id===id)?.code || 'N/A').join(', ')}]</div>
                        <div className="mt-2 flex items-center space-x-2">
                          <Button onClick={() => editHazard(h)} size="sm" variant="ghost">Edit</Button>
                          <Button onClick={() => deleteHazard(h.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700">Delete</Button>
                          <Button onClick={() => setParentHazardForSubHazard(h.id)} size="sm" variant="ghost" className="text-sky-600 hover:text-sky-800">Add Sub-Hazard</Button>
                          <InfoPopup title="Refining System-Level Hazards" content={subHazardInfoContent} />
                        </div>
                        {hazards.filter(subH => subH.parentHazardId === h.id).map(subH => (
                            <div key={subH.id} className="ml-4 mt-2 p-2 border-l-2 border-sky-200 bg-sky-50 rounded-r-md">
                              <p className="font-medium text-sky-700">{subH.code}: {subH.title} (Sub-hazard of {h.code})</p>
                              <p className="text-xs text-slate-500">Linked Losses: {subH.linkedLossIds.map(id => losses.find(l=>l.id===id)?.code || 'N/A').join(', ')}</p>
                              <div className="mt-1 space-x-1"> <Button onClick={() => editHazard(subH)} size="sm" variant="ghost">Edit</Button> <Button onClick={() => deleteHazard(subH.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700">Delete</Button> </div>
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
            </div>
        )}

        {/* System Constraints */}
        <div>
          <h3 className="text-xl font-semibold text-slate-700 mb-3">
            {analysisType === AnalysisType.CAST ? "5. Elicit Safety Constraints from Hazards" : "4. Define System Safety Constraints from Hazards"}
          </h3>
          <p className="text-sm text-slate-600 mb-3">Safety constraints express the positive requirements for safe operation derived from each hazard. These are auto-generated but can be refined.</p>
          {systemConstraints.length > 0 ? (
              <ul className="space-y-2">
                {systemConstraints.map(sc => (
                    <li key={sc.id} className="p-3 border border-slate-200 rounded-md bg-slate-50">
                      <Textarea label={`${sc.code}: (Derived from Hazard ${hazards.find(h=>h.id === sc.hazardId)?.code || 'N/A'})`} value={sc.text} onChange={(e) => updateSystemConstraint(sc.id, { text: e.target.value })} rows={2}/>
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


const CastStep2: React.FC = () => <SharedLossesHazardsComponent analysisType={AnalysisType.CAST} />;

export default CastStep2;