import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisSession, AnalysisType, Loss, Hazard, SystemConstraint, SystemComponent,
  Controller, ControlAction, UnsafeControlAction, CausalScenario, Requirement, EventDetail,
  ControlPath, FeedbackPath, UCCA, CommunicationPath, HardwareComponent, FailureMode, 
  UnsafeInteraction, HardwareAnalysisSession
} from '@/types';

interface AnalysisContextState {
  analysisSession: AnalysisSession | null;
  castStep2SubStep: number;
  castStep2MaxReachedSubStep: number; // New state for furthest progress
  losses: Loss[];
  hazards: Hazard[];
  systemConstraints: SystemConstraint[];
  systemComponents: SystemComponent[];
  controllers: Controller[];
  controlPaths: ControlPath[];
  feedbackPaths: FeedbackPath[];
  communicationPaths: CommunicationPath[];
  controlActions: ControlAction[];
  ucas: UnsafeControlAction[];
  uccas: UCCA[];
  scenarios: CausalScenario[];
  requirements: Requirement[];
  sequenceOfEvents: EventDetail[];
  activeContexts: { [key: string]: string };
  hardwareComponents: HardwareComponent[];
  failureModes: FailureMode[];
  unsafeInteractions: UnsafeInteraction[];
  hardwareAnalysisSession: HardwareAnalysisSession | null;

  setAnalysisType: (type: AnalysisType, initialStep: string) => void;
  updateAnalysisSession: (data: Partial<Omit<AnalysisSession, 'id' | 'analysisType' | 'createdAt' | 'updatedAt'>>) => void;
  setCastStep2SubStep: (step: number | ((prevStep: number) => number)) => void; // Allow function form

  addLoss: (loss: Omit<Loss, 'id' | 'code'>) => void;
  updateLoss: (id: string, updates: Partial<Loss>) => void;
  deleteLoss: (id: string) => void;

  addHazard: (hazard: Omit<Hazard, 'id' | 'code'>) => void;
  updateHazard: (id: string, updates: Partial<Hazard>) => void;
  deleteHazard: (id: string) => void;

  addSystemConstraint: (constraint: Omit<SystemConstraint, 'id' | 'code'>) => void;
  updateSystemConstraint: (id: string, updates: Partial<SystemConstraint>) => void;
  deleteSystemConstraint: (id: string) => void;

  addEventDetail: (event: Omit<EventDetail, 'id' | 'order'>) => void;
  updateEventDetail: (id: string, updates: Partial<EventDetail>) => void;
  deleteEventDetail: (id: string) => void;
  reorderEventDetails: (events: EventDetail[]) => void;

  addSystemComponent: (component: Omit<SystemComponent, 'id'>) => void;
  updateSystemComponent: (id: string, updates: Partial<SystemComponent>) => void;
  deleteSystemComponent: (id: string) => void;

  addController: (controller: Omit<Controller, 'id'>) => void;
  updateController: (id: string, updates: Partial<Controller>) => void;
  deleteController: (id: string) => void;

  addControlPath: (path: Omit<ControlPath, 'id'> & { id?: string }) => void;
  updateControlPath: (id: string, updates: Partial<ControlPath>) => void;
  deleteControlPath: (id: string) => void;

  addFeedbackPath: (path: Omit<FeedbackPath, 'id'>) => void;
  updateFeedbackPath: (id: string, updates: Partial<FeedbackPath>) => void;
  deleteFeedbackPath: (id: string) => void;

  addCommunicationPath: (path: Omit<CommunicationPath, 'id'>) => void;
  updateCommunicationPath: (id: string, updates: Partial<CommunicationPath>) => void;
  deleteCommunicationPath: (id: string) => void;

  addControlAction: (action: Omit<ControlAction, 'id'>) => void;
  updateControlAction: (id: string, updates: Partial<ControlAction>) => void;
  deleteControlAction: (id: string) => void;

  addUCA: (uca: Omit<UnsafeControlAction, 'id' | 'code'>) => void;
  updateUCA: (id: string, updates: Partial<UnsafeControlAction>) => void;
  deleteUCA: (id: string) => void;

  addUCCA: (ucca: Omit<UCCA, 'id' | 'code'>) => void;
  updateUCCA: (id: string, updates: Partial<UCCA>) => void;
  deleteUCCA: (id: string) => void;

  addScenario: (scenario: Omit<CausalScenario, 'id'>) => void;
  updateScenario: (id: string, updates: Partial<CausalScenario>) => void;
  deleteScenario: (id: string) => void;

  addRequirement: (req: Omit<Requirement, 'id'>) => void;
  updateRequirement: (id: string, updates: Partial<Requirement>) => void;
  deleteRequirement: (id: string) => void;

  setCurrentStep: (stepPath: string) => void;
  setActiveContext: (controllerId: string, contextId: string) => void;
  resetAnalysis: () => void;

  addHardwareComponent: (component: Omit<HardwareComponent, 'id'>) => void;
  updateHardwareComponent: (id: string, updates: Partial<HardwareComponent>) => void;
  deleteHardwareComponent: (id: string) => void;

  addFailureMode: (mode: Omit<FailureMode, 'id'>) => void;
  updateFailureMode: (id: string, updates: Partial<FailureMode>) => void;
  deleteFailureMode: (id: string) => void;

  addUnsafeInteraction: (interaction: Omit<UnsafeInteraction, 'id'>) => void;
  updateUnsafeInteraction: (id: string, updates: Partial<UnsafeInteraction>) => void;
  deleteUnsafeInteraction: (id: string) => void;

  updateHardwareAnalysisSession: (data: Partial<HardwareAnalysisSession>) => void;
}

const initialState: AnalysisContextState = {
  analysisSession: null,
  castStep2SubStep: 0,
  castStep2MaxReachedSubStep: 0,
  losses: [], hazards: [], systemConstraints: [], systemComponents: [], controllers: [],
  controlPaths: [], feedbackPaths: [], communicationPaths: [], controlActions: [], ucas: [], uccas: [], scenarios: [], requirements: [], sequenceOfEvents: [],
  activeContexts: {},
  hardwareComponents: [], failureModes: [], unsafeInteractions: [], hardwareAnalysisSession: null,
  setAnalysisType: () => {}, updateAnalysisSession: () => {}, setCastStep2SubStep: () => {},
  addLoss: () => {}, updateLoss: () => {}, deleteLoss: () => {},
  addHazard: () => {}, updateHazard: () => {}, deleteHazard: () => {},
  addSystemConstraint: () => {}, updateSystemConstraint: () => {}, deleteSystemConstraint: () => {},
  addEventDetail: () => {}, updateEventDetail: () => {}, deleteEventDetail: () => {}, reorderEventDetails: () => {},
  addSystemComponent: () => {}, updateSystemComponent: () => {}, deleteSystemComponent: () => {},
  addController: () => {}, updateController: () => {}, deleteController: () => {},
  addControlPath: () => {}, updateControlPath: () => {}, deleteControlPath: () => {},
  addFeedbackPath: () => {}, updateFeedbackPath: () => {}, deleteFeedbackPath: () => {},
  addCommunicationPath: () => {}, updateCommunicationPath: () => {}, deleteCommunicationPath: () => {},
  addControlAction: () => {}, updateControlAction: () => {}, deleteControlAction: () => {},
  addUCA: () => {}, updateUCA: () => {}, deleteUCA: () => {},
  addUCCA: () => {}, updateUCCA: () => {}, deleteUCCA: () => {},
  addScenario: () => {}, updateScenario: () => {}, deleteScenario: () => {},
  addRequirement: () => {}, updateRequirement: () => {}, deleteRequirement: () => {},
  setCurrentStep: () => {},
  setActiveContext: () => {},
  resetAnalysis: () => {},
  addHardwareComponent: () => {}, updateHardwareComponent: () => {}, deleteHardwareComponent: () => {},
  addFailureMode: () => {}, updateFailureMode: () => {}, deleteFailureMode: () => {},
  addUnsafeInteraction: () => {}, updateUnsafeInteraction: () => {}, deleteUnsafeInteraction: () => {},
  updateHardwareAnalysisSession: () => {},
};

export const AnalysisContext = createContext<AnalysisContextState>(initialState);

export const AnalysisProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [analysisSession, setAnalysisSession] = useState<AnalysisSession | null>(() => JSON.parse(localStorage.getItem('analysisSession') || 'null'));
  const [castStep2SubStep, _setCastStep2SubStep] = useState<number>(() => parseInt(localStorage.getItem('castStep2SubStep') || '0', 10));
  const [castStep2MaxReachedSubStep, setCastStep2MaxReachedSubStep] = useState<number>(() => parseInt(localStorage.getItem('castStep2MaxReachedSubStep') || '0', 10));

  const [losses, setLosses] = useState<Loss[]>(() => JSON.parse(localStorage.getItem('losses') || '[]'));
  const [hazards, setHazards] = useState<Hazard[]>(() => JSON.parse(localStorage.getItem('hazards') || '[]'));
  const [systemConstraints, setSystemConstraints] = useState<SystemConstraint[]>(() => JSON.parse(localStorage.getItem('systemConstraints') || '[]'));
  const [sequenceOfEvents, setSequenceOfEvents] = useState<EventDetail[]>(() => JSON.parse(localStorage.getItem('sequenceOfEvents') || '[]'));
  const [systemComponents, setSystemComponents] = useState<SystemComponent[]>(() => JSON.parse(localStorage.getItem('systemComponents') || '[]'));
  const [controllers, setControllers] = useState<Controller[]>(() => JSON.parse(localStorage.getItem('controllers') || '[]'));
  const [controlPaths, setControlPaths] = useState<ControlPath[]>(() => JSON.parse(localStorage.getItem('controlPaths') || '[]'));
  const [feedbackPaths, setFeedbackPaths] = useState<FeedbackPath[]>(() => JSON.parse(localStorage.getItem('feedbackPaths') || '[]'));
  const [communicationPaths, setCommunicationPaths] = useState<CommunicationPath[]>(() => JSON.parse(localStorage.getItem('communicationPaths') || '[]'));
  const [controlActions, setControlActions] = useState<ControlAction[]>(() => JSON.parse(localStorage.getItem('controlActions') || '[]'));
  const [ucas, setUcas] = useState<UnsafeControlAction[]>(() => JSON.parse(localStorage.getItem('ucas') || '[]'));
  const [uccas, setUccas] = useState<UCCA[]>(() => JSON.parse(localStorage.getItem('uccas') || '[]'));
  const [scenarios, setScenarios] = useState<CausalScenario[]>(() => JSON.parse(localStorage.getItem('scenarios') || '[]'));
  const [requirements, setRequirements] = useState<Requirement[]>(() => JSON.parse(localStorage.getItem('requirements') || '[]'));
  const [activeContexts, setActiveContexts] = useState<{ [key: string]: string; }>(() => JSON.parse(localStorage.getItem('activeContexts') || '{}'));
  const [hardwareComponents, setHardwareComponents] = useState<HardwareComponent[]>(() => JSON.parse(localStorage.getItem('hardwareComponents') || '[]'));
  const [failureModes, setFailureModes] = useState<FailureMode[]>(() => JSON.parse(localStorage.getItem('failureModes') || '[]'));
  const [unsafeInteractions, setUnsafeInteractions] = useState<UnsafeInteraction[]>(() => JSON.parse(localStorage.getItem('unsafeInteractions') || '[]'));
  const [hardwareAnalysisSession, setHardwareAnalysisSession] = useState<HardwareAnalysisSession | null>(() => JSON.parse(localStorage.getItem('hardwareAnalysisSession') || 'null'));


  useEffect(() => { if (analysisSession) localStorage.setItem('analysisSession', JSON.stringify(analysisSession)); else localStorage.removeItem('analysisSession'); }, [analysisSession]);
  useEffect(() => { localStorage.setItem('castStep2SubStep', castStep2SubStep.toString()); }, [castStep2SubStep]);
  useEffect(() => { localStorage.setItem('castStep2MaxReachedSubStep', castStep2MaxReachedSubStep.toString()); }, [castStep2MaxReachedSubStep]);
  useEffect(() => { localStorage.setItem('losses', JSON.stringify(losses)); }, [losses]);
  useEffect(() => { localStorage.setItem('hazards', JSON.stringify(hazards)); }, [hazards]);
  useEffect(() => { localStorage.setItem('systemConstraints', JSON.stringify(systemConstraints)); }, [systemConstraints]);
  useEffect(() => { localStorage.setItem('sequenceOfEvents', JSON.stringify(sequenceOfEvents)); }, [sequenceOfEvents]);
  useEffect(() => { localStorage.setItem('systemComponents', JSON.stringify(systemComponents)); }, [systemComponents]);
  useEffect(() => { localStorage.setItem('controllers', JSON.stringify(controllers)); }, [controllers]);
  useEffect(() => { localStorage.setItem('controlPaths', JSON.stringify(controlPaths)); }, [controlPaths]);
  useEffect(() => { localStorage.setItem('feedbackPaths', JSON.stringify(feedbackPaths)); }, [feedbackPaths]);
  useEffect(() => { localStorage.setItem('communicationPaths', JSON.stringify(communicationPaths)); }, [communicationPaths]);
  useEffect(() => { localStorage.setItem('controlActions', JSON.stringify(controlActions)); }, [controlActions]);
  useEffect(() => { localStorage.setItem('ucas', JSON.stringify(ucas)); }, [ucas]);
  useEffect(() => { localStorage.setItem('uccas', JSON.stringify(uccas)); }, [uccas]);
  useEffect(() => { localStorage.setItem('scenarios', JSON.stringify(scenarios)); }, [scenarios]);
  useEffect(() => { localStorage.setItem('requirements', JSON.stringify(requirements)); }, [requirements]);
  useEffect(() => { localStorage.setItem('activeContexts', JSON.stringify(activeContexts)); }, [activeContexts]);
  useEffect(() => { localStorage.setItem('hardwareComponents', JSON.stringify(hardwareComponents)); }, [hardwareComponents]);
  useEffect(() => { localStorage.setItem('failureModes', JSON.stringify(failureModes)); }, [failureModes]);
  useEffect(() => { localStorage.setItem('unsafeInteractions', JSON.stringify(unsafeInteractions)); }, [unsafeInteractions]);
  useEffect(() => { if (hardwareAnalysisSession) localStorage.setItem('hardwareAnalysisSession', JSON.stringify(hardwareAnalysisSession)); else localStorage.removeItem('hardwareAnalysisSession'); }, [hardwareAnalysisSession]);

  const setCastStep2SubStep = useCallback((stepUpdater: number | ((prevStep: number) => number)) => {
    _setCastStep2SubStep(prevStep => {
      const newStep = typeof stepUpdater === 'function' ? stepUpdater(prevStep) : stepUpdater;
      setCastStep2MaxReachedSubStep(prevMax => Math.max(prevMax, newStep));
      return newStep;
    });
  }, []);

  const setAnalysisType = useCallback((type: AnalysisType, initialStep: string) => {
    // Keep resetAnalysis separate to be called explicitly
    const now = new Date().toISOString();
    setAnalysisSession({
      id: uuidv4(),
      analysisType: type,
      title: `${type} Analysis - ${new Date().toLocaleDateString()}`,
      createdBy: 'Analyst',
      createdAt: now,
      updatedAt: now,
      currentStep: initialStep,
    });
    // Reset progress for the specific step
    setCastStep2SubStep(0);
    setCastStep2MaxReachedSubStep(0);
  }, []);

  const updateAnalysisSession = useCallback((data: Partial<Omit<AnalysisSession, 'id' | 'analysisType' | 'createdAt' | 'updatedAt'>>) => {
    setAnalysisSession(prev => prev ? ({ ...prev, ...data, updatedAt: new Date().toISOString() }) : null);
  }, []);

  const setCurrentStep = useCallback((stepPath: string) => {
    setAnalysisSession(prev => prev ? ({ ...prev, currentStep: stepPath, updatedAt: new Date().toISOString() }) : null);
  }, []);

  const setActiveContext = useCallback((controllerId: string, contextId: string) => {
    setActiveContexts(prev => ({...prev, [controllerId]: contextId}));
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysisSession(null);
    setCastStep2SubStep(0);
    setCastStep2MaxReachedSubStep(0);
    setLosses([]);
    setHazards([]);
    setSystemConstraints([]);
    setSequenceOfEvents([]);
    setSystemComponents([]);
    setControllers([]);
    setControlPaths([]);
    setFeedbackPaths([]);
    setCommunicationPaths([]);
    setControlActions([]);
    setUcas([]);
    setUccas([]);
    setScenarios([]);
    setRequirements([]);
    setActiveContexts({});
    setHardwareComponents([]);
    setFailureModes([]);
    setUnsafeInteractions([]);
    setHardwareAnalysisSession(null);
    localStorage.clear();
  }, []);

  const createCrudOperations = <T extends {id: string}>(
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      list: T[],
      codePrefix?: string
  ) => ({
    add: (item: Omit<T, 'id' | 'code'> & { id?: string }) => {
      const newItemData: any = { ...item, id: (item as any).id || uuidv4() };
      if (codePrefix) {
        newItemData.code = `${codePrefix}-${list.length + 1}`;
      }
      const newItem = newItemData as T;
      setter(prev => [...prev, newItem]);
    },
    update: (id: string, updates: Partial<T>) => {
      setter(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    },
    delete: (id: string) => {
      setter(prev => prev.filter(i => i.id !== id));
    },
  });

  const addHazard = (hazard: Omit<Hazard, 'id' | 'code'>) => {
    const parentHazard = hazards.find(h => h.id === hazard.parentHazardId);
    let newCode = '';

    if (parentHazard) {
      const parentCodeNumber = parseInt(parentHazard.code.replace('H-', ''));
      const subHazards = hazards.filter(h => h.parentHazardId === parentHazard.id);
      newCode = `H-${parentCodeNumber}.${subHazards.length + 1}`;
    } else {
      const topLevelHazards = hazards.filter(h => !h.parentHazardId);
      newCode = `H-${topLevelHazards.length + 1}`;
    }

    const newHazard: Hazard = {
      ...hazard,
      id: uuidv4(),
      code: newCode
    };

    setHazards(prev => [...prev, newHazard]);
  };

  const updateHazard = (id: string, updates: Partial<Hazard>) => {
    setHazards(prev => prev.map(h => (h.id === id ? { ...h, ...updates } : h)));
  };

  const deleteHazard = (id: string) => {
    setHazards(prev => prev.filter(h => h.id !== id));
  };


  const lossOps = createCrudOperations(setLosses, losses, 'L');
  const constraintOps = createCrudOperations(setSystemConstraints, systemConstraints, 'SC');
  const ucaOps = createCrudOperations(setUcas, ucas, 'UCA');
  const uccaOps = createCrudOperations(setUccas, uccas, 'UCCA');

  const componentOps = createCrudOperations(setSystemComponents, systemComponents);
  const controllerOps = createCrudOperations(setControllers, controllers);
  const controlPathOps = createCrudOperations(setControlPaths, controlPaths);
  const feedbackPathOps = createCrudOperations(setFeedbackPaths, feedbackPaths);
  const communicationPathOps = createCrudOperations(setCommunicationPaths, communicationPaths);
  const actionOps = createCrudOperations(setControlActions, controlActions);
  const scenarioOps = createCrudOperations(setScenarios, scenarios);
  const requirementOps = createCrudOperations(setRequirements, requirements);
  const hardwareComponentOps = createCrudOperations(setHardwareComponents, hardwareComponents);
  const failureModeOps = createCrudOperations(setFailureModes, failureModes);
  const unsafeInteractionOps = createCrudOperations(setUnsafeInteractions, unsafeInteractions);

  const eventOps = {
    add: (item: Omit<EventDetail, 'id' | 'order'>) => {
      const newEvent = { ...item, id: uuidv4(), order: sequenceOfEvents.length + 1 } as EventDetail;
      setSequenceOfEvents(prev => [...prev, newEvent]);
    },
    update: (id: string, updates: Partial<EventDetail>) => {
      setSequenceOfEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    },
    delete: (id: string) => {
      setSequenceOfEvents(prev => prev.filter(e => e.id !== id).map((e, idx) => ({...e, order: idx + 1})));
    },
    reorder: (updatedEvents: EventDetail[]) => {
      setSequenceOfEvents(updatedEvents.map((e, idx) => ({ ...e, order: idx + 1 })));
    }
  };

  const updateHardwareAnalysisSession = useCallback((data: Partial<HardwareAnalysisSession>) => {
    setHardwareAnalysisSession(prev => {
      const updated = prev ? { ...prev, ...data } : { id: uuidv4(), ...data };
      return updated as HardwareAnalysisSession;
    });
  }, []);

  return (
      <AnalysisContext.Provider value={{
        analysisSession, castStep2SubStep, castStep2MaxReachedSubStep, losses, hazards, systemConstraints, systemComponents, controllers, controlPaths, feedbackPaths,
        communicationPaths, controlActions, ucas, uccas, scenarios, requirements, sequenceOfEvents, activeContexts,
        hardwareComponents, failureModes, unsafeInteractions, hardwareAnalysisSession,
        setAnalysisType, updateAnalysisSession, setCastStep2SubStep, setCurrentStep, resetAnalysis, setActiveContext,
        addLoss: lossOps.add, updateLoss: lossOps.update, deleteLoss: lossOps.delete,
        addHazard, updateHazard, deleteHazard,
        addSystemConstraint: constraintOps.add as (item: Omit<SystemConstraint, 'id' | 'code'>) => void,
        updateSystemConstraint: constraintOps.update,
        deleteSystemConstraint: constraintOps.delete,
        addEventDetail: eventOps.add, updateEventDetail: eventOps.update, deleteEventDetail: eventOps.delete, reorderEventDetails: eventOps.reorder,
        addSystemComponent: componentOps.add, updateSystemComponent: componentOps.update, deleteSystemComponent: componentOps.delete,
        addController: controllerOps.add as (item: Omit<Controller, 'id'>) => void,
        updateController: controllerOps.update,
        deleteController: controllerOps.delete,
        addControlPath: controlPathOps.add, updateControlPath: controlPathOps.update, deleteControlPath: controlPathOps.delete,
        addFeedbackPath: feedbackPathOps.add, updateFeedbackPath: feedbackPathOps.update, deleteFeedbackPath: feedbackPathOps.delete,
        addCommunicationPath: communicationPathOps.add, updateCommunicationPath: communicationPathOps.update, deleteCommunicationPath: communicationPathOps.delete,
        addControlAction: actionOps.add, updateControlAction: actionOps.update, deleteControlAction: actionOps.delete,
        addUCA: ucaOps.add as (uca: Omit<UnsafeControlAction, 'id' | 'code'>) => void,
        updateUCA: ucaOps.update,
        deleteUCA: ucaOps.delete,
        addUCCA: uccaOps.add as (ucca: Omit<UCCA, 'id' | 'code'>) => void,
        updateUCCA: uccaOps.update,
        deleteUCCA: uccaOps.delete,
        addScenario: scenarioOps.add, updateScenario: scenarioOps.update, deleteScenario: scenarioOps.delete,
        addRequirement: requirementOps.add, updateRequirement: requirementOps.update, deleteRequirement: requirementOps.delete,
        addHardwareComponent: hardwareComponentOps.add, updateHardwareComponent: hardwareComponentOps.update, deleteHardwareComponent: hardwareComponentOps.delete,
        addFailureMode: failureModeOps.add, updateFailureMode: failureModeOps.update, deleteFailureMode: failureModeOps.delete,
        addUnsafeInteraction: unsafeInteractionOps.add, updateUnsafeInteraction: unsafeInteractionOps.update, deleteUnsafeInteraction: unsafeInteractionOps.delete,
        updateHardwareAnalysisSession,
      }}>
        {children}
      </AnalysisContext.Provider>
  );
};