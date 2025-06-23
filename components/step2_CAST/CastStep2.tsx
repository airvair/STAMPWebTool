// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step2_CAST/CastStep2.tsx
import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { Loss, Hazard, SystemConstraint, EventDetail, AnalysisType } from '../../types';
import { STANDARD_LOSSES } from '../../constants';
import ScopeBuilder from './partials/ScopeBuilder';
import SequenceOfEventsBuilder from './partials/SequenceOfEventsBuilder';
import LossesBuilder from './partials/LossesBuilder';
import HazardsBuilder from './partials/HazardsBuilder';
import SystemConstraintsBuilder from './partials/SystemConstraintsBuilder';
import SubStepper from './partials/SubStepper';
import Button from '../shared/Button';

const CAST_SUB_STEPS = ['Scope', 'Events', 'Losses', 'Hazards', 'Constraints'];

const CastStep2: React.FC = () => {
  const {
    analysisSession, updateAnalysisSession,
    castStep2SubStep, setCastStep2SubStep, castStep2MaxReachedSubStep,
    losses, addLoss, updateLoss, deleteLoss,
    hazards, addHazard, updateHazard, deleteHazard,
    systemConstraints, addSystemConstraint, updateSystemConstraint, deleteSystemConstraint,
    sequenceOfEvents, addEventDetail, updateEventDetail, deleteEventDetail, reorderEventDetails
  } = useAnalysis();

  const [scope, setScope] = useState(analysisSession?.scope || '');
  const [otherLossTitle, setOtherLossTitle] = useState('');
  const [otherLossDesc, setOtherLossDesc] = useState('');
  const [selectedLossIdsState, setSelectedLossIdsState] = useState<string[]>([]);
  const [newEventDesc, setNewEventDesc] = useState('');
  const [currentHazardText, setCurrentHazardText] = useState('');
  const [editingHazardId, setEditingHazardId] = useState<string | null>(null);
  const [hazardError, setHazardError] = useState('');
  const [linkedLossIds, setLinkedLossIds] = useState<string[]>([]);
  const [parentHazardForSubHazard, setParentHazardForSubHazard] = useState<string | null>(null);
  const [subHazardDescription, setSubHazardDescription] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<boolean[]>([]);

  const validateSteps = useCallback(() => {
    const status = CAST_SUB_STEPS.map((step, index) => {
      switch (index) {
        case 0: return scope.trim() !== '';
        case 1: return sequenceOfEvents.length > 0;
        case 2: return losses.length > 0;
        case 3:
          const allLossesCovered = losses.every(l => hazards.some(h => h.linkedLossIds.includes(l.id)));
          return hazards.length > 0 && allLossesCovered;
        case 4: return systemConstraints.length >= hazards.length && hazards.length > 0;
        default: return false;
      }
    });
    setValidationStatus(status);
  }, [scope, sequenceOfEvents, losses, hazards, systemConstraints]);

  useEffect(() => {
    validateSteps();
  }, [scope, sequenceOfEvents, losses, hazards, systemConstraints, validateSteps]);


  useEffect(() => { setScope(analysisSession?.scope || ''); }, [analysisSession?.scope]);
  useEffect(() => {
    const standardLossIds = losses.filter(l => l.isStandard).map(l => STANDARD_LOSSES.find(sl => sl.title === l.title)?.id).filter((id): id is string => Boolean(id));
    const customLossIds = losses.filter(l => !l.isStandard).map(l => l.id);
    setSelectedLossIdsState([...standardLossIds, ...customLossIds]);
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
    const currentEvents = [...sequenceOfEvents].sort((a, b) => a.order - b.order);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentEvents.length) return;
    const newEvents = [...currentEvents];
    [newEvents[index], newEvents[targetIndex]] = [newEvents[targetIndex], newEvents[index]];
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
  };
  const handleAddOtherLoss = () => {
    if (otherLossTitle.trim() === '') return;
    addLoss({ title: otherLossTitle, description: otherLossDesc, isStandard: false });
    setOtherLossTitle('');
    setOtherLossDesc('');
  };
  const handleHazardInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentHazardText(e.target.value);
    setHazardError('');
  };
  const handleHazardLossLinkChange = (lossId: string, checked: boolean) => {
    setLinkedLossIds(prev => checked ? [...prev, lossId] : prev.filter(id => id !== lossId));
  };
  const handleSaveHazard = () => {
    if (currentHazardText.trim() === '') { setHazardError('Please enter the hazard description.'); return; }
    if (linkedLossIds.length === 0) { setHazardError('Please link the hazard to at least one loss.'); return; }
    setHazardError('');
    const hazardPayload: Omit<Hazard, 'id' | 'code'> = {
      title: currentHazardText,
      systemComponent: currentHazardText.split(' ')[0] || 'Unknown Component',
      environmentalCondition: '',
      systemState: currentHazardText.substring(currentHazardText.indexOf(' ') + 1) || 'Unknown State',
      linkedLossIds: linkedLossIds,
    };
    if (editingHazardId) { updateHazard(editingHazardId, hazardPayload); } else { addHazard(hazardPayload); }
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
    if (!parentHazardForSubHazard || !subHazardDescription.trim()) return;
    const parentHazard = hazards.find(h => h.id === parentHazardForSubHazard);
    if (!parentHazard) return;
    const subHazardData: Omit<Hazard, 'id' | 'code'> = {
      title: subHazardDescription,
      systemComponent: parentHazard.systemComponent,
      environmentalCondition: parentHazard.environmentalCondition,
      systemState: subHazardDescription,
      linkedLossIds: [...parentHazard.linkedLossIds],
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
      const constraintText = `The system must prevent: ${hazard.title}.`;
      if (!existingConstraint) {
        addSystemConstraint({ text: constraintText, hazardId: hazard.id } as Omit<SystemConstraint, 'id' | 'code'>);
      } else if (existingConstraint.text !== constraintText) {
        updateSystemConstraint(existingConstraint.id, { text: constraintText });
      }
    });
  }, [hazards, systemConstraints, addSystemConstraint, updateSystemConstraint]);

  useEffect(() => { autoGenerateConstraints(); }, [hazards, autoGenerateConstraints]);

  const getUnlinkedLosses = (): Loss[] => losses.filter(loss => !hazards.some(h => h.linkedLossIds.includes(loss.id)));
  const coveredLossCount = losses.length > 0 ? losses.length - getUnlinkedLosses().length : 0;

  const renderSubStep = () => {
    switch (castStep2SubStep) {
      case 0: return <ScopeBuilder analysisType={AnalysisType.CAST} scope={scope} setScope={setScope} handleScopeBlur={handleScopeBlur} />;
      case 1: return <SequenceOfEventsBuilder sequenceOfEvents={sequenceOfEvents} newEventDesc={newEventDesc} setNewEventDesc={setNewEventDesc} handleAddEvent={handleAddEvent} updateEventDetail={updateEventDetail} deleteEventDetail={deleteEventDetail} moveEvent={moveEvent} />;
      case 2: return <LossesBuilder analysisType={AnalysisType.CAST} losses={losses} selectedLossIdsState={selectedLossIdsState} otherLossTitle={otherLossTitle} otherLossDesc={otherLossDesc} getUnlinkedLosses={getUnlinkedLosses} handleLossSelectionChange={handleLossSelectionChange} setOtherLossTitle={setOtherLossTitle} setOtherLossDesc={setOtherLossDesc} handleAddOtherLoss={handleAddOtherLoss} deleteLoss={deleteLoss} />;
      case 3: return <HazardsBuilder analysisType={AnalysisType.CAST} hazards={hazards} losses={losses} currentHazardText={currentHazardText} hazardError={hazardError} editingHazardId={editingHazardId} linkedLossIds={linkedLossIds} parentHazardForSubHazard={parentHazardForSubHazard} subHazardDescription={subHazardDescription} coveredLossCount={coveredLossCount} handleHazardInputChange={handleHazardInputChange} handleHazardLossLinkChange={handleHazardLossLinkChange} handleSaveHazard={handleSaveHazard} resetHazardForm={resetHazardForm} editHazard={editHazard} deleteHazard={deleteHazard} setParentHazardForSubHazard={setParentHazardForSubHazard} setSubHazardDescription={setSubHazardDescription} handleAddSubHazard={handleAddSubHazard} />;
      case 4: return <SystemConstraintsBuilder analysisType={AnalysisType.CAST} systemConstraints={systemConstraints} hazards={hazards} updateSystemConstraint={updateSystemConstraint} />;
      default: return <ScopeBuilder analysisType={AnalysisType.CAST} scope={scope} setScope={setScope} handleScopeBlur={handleScopeBlur} />;
    }
  };

  return (
      <div>
        <SubStepper steps={CAST_SUB_STEPS} currentStep={castStep2SubStep} maxReachedStep={castStep2MaxReachedSubStep} setStep={setCastStep2SubStep} validationStatus={validationStatus} />
        <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 p-6 sm:p-8 rounded-xl shadow-md border border-slate-200 dark:border-slate-700/50">
          {renderSubStep()}
        </div>
        <div className="flex justify-between items-center mt-8">
          <Button onClick={() => setCastStep2SubStep(s => s - 1)} disabled={castStep2SubStep === 0} variant="secondary">Back</Button>

          {castStep2SubStep < CAST_SUB_STEPS.length - 1 && (
              <Button onClick={() => setCastStep2SubStep(s => s + 1)}>Next</Button>
          )}
        </div>
      </div>
  );
};

export default CastStep2;