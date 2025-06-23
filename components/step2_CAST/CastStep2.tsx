import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { Loss, Hazard, SystemConstraint, EventDetail, AnalysisType } from '../../types';
import { STANDARD_LOSSES } from '../../constants';
import ScopeBuilder from './partials/ScopeBuilder';
import SequenceOfEventsBuilder from './partials/SequenceOfEventsBuilder';
import LossesBuilder from './partials/LossesBuilder';
import HazardsBuilder from './partials/HazardsBuilder';
import SystemConstraintsBuilder from './partials/SystemConstraintsBuilder';

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
    const currentEvents = [...sequenceOfEvents].sort((a, b) => a.order - b.order);
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

    const hazardPayload: Omit<Hazard, 'id' | 'code'> = {
      title: currentHazardText,
      systemComponent: currentHazardText.split(' ')[0] || 'Unknown Component',
      environmentalCondition: '',
      systemState: currentHazardText.substring(currentHazardText.indexOf(' ') + 1) || 'Unknown State',
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
      let constraintPrefix = "The system must prevent";
      const constraintText = `${constraintPrefix}: ${hazard.title}.`;
      const newConstraintData: Partial<SystemConstraint> = { text: constraintText };
      if (!existingConstraint) {
        addSystemConstraint({ text: constraintText, hazardId: hazard.id } as Omit<SystemConstraint, 'id' | 'code'>);
      } else if (existingConstraint.text !== constraintText) {
        updateSystemConstraint(existingConstraint.id, newConstraintData);
      }
    });
  }, [hazards, systemConstraints, addSystemConstraint, updateSystemConstraint]);

  useEffect(() => { autoGenerateConstraints(); }, [hazards, autoGenerateConstraints]);

  const getUnlinkedLosses = (): Loss[] => losses.filter(loss => !hazards.some(h => h.linkedLossIds.includes(loss.id)));

  const coveredLossCount = losses.filter(loss => hazards.some(h => h.linkedLossIds.includes(loss.id))).length;

  return (
      <div className="space-y-8">
        <ScopeBuilder
            analysisType={analysisType}
            scope={scope}
            setScope={setScope}
            handleScopeBlur={handleScopeBlur}
        />

        {analysisType === AnalysisType.CAST && (
            <SequenceOfEventsBuilder
                sequenceOfEvents={sequenceOfEvents}
                newEventDesc={newEventDesc}
                setNewEventDesc={setNewEventDesc}
                handleAddEvent={handleAddEvent}
                updateEventDetail={updateEventDetail}
                deleteEventDetail={deleteEventDetail}
                moveEvent={moveEvent}
            />
        )}

        <LossesBuilder
            analysisType={analysisType}
            losses={losses}
            selectedLossIdsState={selectedLossIdsState}
            otherLossTitle={otherLossTitle}
            otherLossDesc={otherLossDesc}
            getUnlinkedLosses={getUnlinkedLosses}
            handleLossSelectionChange={handleLossSelectionChange}
            setOtherLossTitle={setOtherLossTitle}
            setOtherLossDesc={setOtherLossDesc}
            handleAddOtherLoss={handleAddOtherLoss}
            deleteLoss={deleteLoss}
        />

        <HazardsBuilder
            analysisType={analysisType}
            hazards={hazards}
            losses={losses}
            currentHazardText={currentHazardText}
            hazardError={hazardError}
            editingHazardId={editingHazardId}
            linkedLossIds={linkedLossIds}
            parentHazardForSubHazard={parentHazardForSubHazard}
            subHazardDescription={subHazardDescription}
            coveredLossCount={coveredLossCount}
            handleHazardInputChange={handleHazardInputChange}
            handleHazardLossLinkChange={handleHazardLossLinkChange}
            handleSaveHazard={handleSaveHazard}
            resetHazardForm={resetHazardForm}
            editHazard={editHazard}
            deleteHazard={deleteHazard}
            setParentHazardForSubHazard={setParentHazardForSubHazard}
            setSubHazardDescription={setSubHazardDescription}
            handleAddSubHazard={handleAddSubHazard}
        />

        <SystemConstraintsBuilder
            analysisType={analysisType}
            systemConstraints={systemConstraints}
            hazards={hazards}
            updateSystemConstraint={updateSystemConstraint}
        />
      </div>
  );
};

const CastStep2: React.FC = () => <SharedLossesHazardsComponent analysisType={AnalysisType.CAST} />;

export default CastStep2;