import React, { useState, useCallback, useEffect, ChangeEvent, Suspense } from 'react';
import { Button } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Loss, Hazard, SystemConstraint, AnalysisType } from '@/types/types';
import { STANDARD_LOSSES } from '@/utils/constants';

// Lazy load all section components
const ScopeBuilder = React.lazy(() => import('./partials/scope-builder'));
const SequenceOfEventsBuilder = React.lazy(() => import('./partials/sequence-of-events-builder'));
const LossesBuilder = React.lazy(() => import('./partials/losses-builder'));
const HazardsBuilder = React.lazy(() => import('./partials/hazards-builder'));
const SystemConstraintsBuilder = React.lazy(() => import('./partials/system-constraints-builder'));

// Section skeleton loader component
const SectionSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <div className="mt-6 space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-3/4" />
    </div>
    <div className="mt-4 flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

const CAST_SUB_STEPS = ['Scope', 'Events', 'Losses', 'Hazards', 'Constraints'];

const CastStep2: React.FC = () => {
  const {
    analysisSession,
    updateAnalysisSession,
    castStep2SubStep,
    setCastStep2SubStep,
    losses,
    addLoss,
    deleteLoss,
    hazards,
    addHazard,
    updateHazard,
    deleteHazard,
    systemConstraints,
    addSystemConstraint,
    updateSystemConstraint,
    deleteSystemConstraint,
    sequenceOfEvents,
    addEventDetail,
    updateEventDetail,
    deleteEventDetail,
    reorderEventDetails,
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
  // Validation status removed - was unused after removing stepper

  // Validation removed - was only used by stepper

  // Listen for substep changes from sidebar
  useEffect(() => {
    const handleSubstepChange = (event: CustomEvent) => {
      setCastStep2SubStep(event.detail.substep);
    };

    window.addEventListener('cast-substep-change', handleSubstepChange as EventListener);
    return () => {
      window.removeEventListener('cast-substep-change', handleSubstepChange as EventListener);
    };
  }, [setCastStep2SubStep]);

  useEffect(() => {
    setScope(analysisSession?.scope || '');
  }, [analysisSession?.scope]);
  useEffect(() => {
    const standardLossIds = losses
      .filter(l => l.isStandard)
      .map(l => STANDARD_LOSSES.find(sl => sl.title === l.title)?.id)
      .filter((id): id is string => Boolean(id));
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

  const handleScopeBlur = () => {
    if (analysisSession && analysisSession.scope !== scope) updateAnalysisSession({ scope });
  };
  const handleAddEvent = () => {
    if (newEventDesc.trim() === '') return;
    addEventDetail({ description: newEventDesc });
    setNewEventDesc('');
  };

  const handleLossSelectionChange = (lossId: string, isSelected: boolean) => {
    const standardLoss = STANDARD_LOSSES.find(sl => sl.id === lossId);
    if (standardLoss) {
      const existing = losses.find(l => l.title === standardLoss.title && l.isStandard);
      if (isSelected && !existing) {
        addLoss({
          title: standardLoss.title,
          description: standardLoss.description,
          isStandard: true,
        });
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
    setLinkedLossIds(prev => (checked ? [...prev, lossId] : prev.filter(id => id !== lossId)));
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
      systemState:
        currentHazardText.substring(currentHazardText.indexOf(' ') + 1) || 'Unknown State',
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
        addSystemConstraint({ text: constraintText, hazardId: hazard.id } as Omit<
          SystemConstraint,
          'id' | 'code'
        >);
      } else if (existingConstraint.text !== constraintText) {
        updateSystemConstraint(existingConstraint.id, { text: constraintText });
      }
    });
  }, [hazards, systemConstraints, addSystemConstraint, updateSystemConstraint]);

  useEffect(() => {
    autoGenerateConstraints();
  }, [hazards, autoGenerateConstraints]);

  const getUnlinkedLosses = (): Loss[] =>
    losses.filter(loss => !hazards.some(h => h.linkedLossIds.includes(loss.id)));
  const coveredLossCount = losses.length > 0 ? losses.length - getUnlinkedLosses().length : 0;

  const renderSubStep = () => {
    switch (castStep2SubStep) {
      case 0:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <ScopeBuilder
              analysisType={AnalysisType.CAST}
              scope={scope}
              setScope={setScope}
              handleScopeBlur={handleScopeBlur}
            />
          </Suspense>
        );
      case 1:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <SequenceOfEventsBuilder
              sequenceOfEvents={sequenceOfEvents}
              newEventDesc={newEventDesc}
              setNewEventDesc={setNewEventDesc}
              handleAddEvent={handleAddEvent}
              updateEventDetail={updateEventDetail}
              deleteEventDetail={deleteEventDetail}
              reorderEventDetails={reorderEventDetails}
            />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <LossesBuilder
              analysisType={AnalysisType.CAST}
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
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <HazardsBuilder
              analysisType={AnalysisType.CAST}
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
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <SystemConstraintsBuilder
              analysisType={AnalysisType.CAST}
              systemConstraints={systemConstraints}
              hazards={hazards}
              updateSystemConstraint={updateSystemConstraint}
            />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<SectionSkeleton />}>
            <ScopeBuilder
              analysisType={AnalysisType.CAST}
              scope={scope}
              setScope={setScope}
              handleScopeBlur={handleScopeBlur}
            />
          </Suspense>
        );
    }
  };

  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-md sm:p-8 dark:border-slate-700/50 dark:bg-slate-800/50">
        {renderSubStep()}
      </div>
      <div className="mt-8 flex items-center justify-between">
        <Button
          onClick={() => setCastStep2SubStep(s => s - 1)}
          disabled={castStep2SubStep === 0}
          variant="secondary"
        >
          Back
        </Button>

        {castStep2SubStep < CAST_SUB_STEPS.length - 1 && (
          <Button onClick={() => setCastStep2SubStep(s => s + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
};

export default CastStep2;
