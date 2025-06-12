import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { 
  AnalysisSession, AnalysisType, Loss, Hazard, SystemConstraint, SystemComponent, 
  Controller, ControlAction, UnsafeControlAction, CausalScenario, Requirement, EventDetail,
  ControlPath, FeedbackPath, UCCA, FiveFactorArchetype, FiveFactorScores
} from '../types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

interface AnalysisContextState {
  analysisSession: AnalysisSession | null;
  losses: Loss[];
  hazards: Hazard[];
  systemConstraints: SystemConstraint[];
  systemComponents: SystemComponent[];
  controllers: Controller[];
  controlPaths: ControlPath[];
  feedbackPaths: FeedbackPath[];
  controlActions: ControlAction[];
  ucas: UnsafeControlAction[];
  uccas: UCCA[]; // Added for Unsafe Combinations of Control Actions
  scenarios: CausalScenario[];
  requirements: Requirement[];
  sequenceOfEvents: EventDetail[]; // CAST specific

  setAnalysisType: (type: AnalysisType, initialStep: string) => void;
  updateAnalysisSession: (data: Partial<Omit<AnalysisSession, 'id' | 'analysisType' | 'createdAt' | 'updatedAt'>>) => void;
  
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

  addControlPath: (path: Omit<ControlPath, 'id'>) => void;
  updateControlPath: (id: string, updates: Partial<ControlPath>) => void;
  deleteControlPath: (id: string) => void;

  addFeedbackPath: (path: Omit<FeedbackPath, 'id'>) => void;
  updateFeedbackPath: (id: string, updates: Partial<FeedbackPath>) => void;
  deleteFeedbackPath: (id: string) => void;

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
  resetAnalysis: () => void;
}

const initialState: AnalysisContextState = {
  analysisSession: null,
  losses: [], hazards: [], systemConstraints: [], systemComponents: [], controllers: [],
  controlPaths: [], feedbackPaths: [], controlActions: [], ucas: [], uccas: [], scenarios: [], requirements: [], sequenceOfEvents: [],
  setAnalysisType: () => {}, updateAnalysisSession: () => {},
  addLoss: () => {}, updateLoss: () => {}, deleteLoss: () => {},
  addHazard: () => {}, updateHazard: () => {}, deleteHazard: () => {},
  addSystemConstraint: () => {}, updateSystemConstraint: () => {}, deleteSystemConstraint: () => {},
  addEventDetail: () => {}, updateEventDetail: () => {}, deleteEventDetail: () => {}, reorderEventDetails: () => {},
  addSystemComponent: () => {}, updateSystemComponent: () => {}, deleteSystemComponent: () => {},
  addController: () => {}, updateController: () => {}, deleteController: () => {},
  addControlPath: () => {}, updateControlPath: () => {}, deleteControlPath: () => {},
  addFeedbackPath: () => {}, updateFeedbackPath: () => {}, deleteFeedbackPath: () => {},
  addControlAction: () => {}, updateControlAction: () => {}, deleteControlAction: () => {},
  addUCA: () => {}, updateUCA: () => {}, deleteUCA: () => {},
  addUCCA: () => {}, updateUCCA: () => {}, deleteUCCA: () => {},
  addScenario: () => {}, updateScenario: () => {}, deleteScenario: () => {},
  addRequirement: () => {}, updateRequirement: () => {}, deleteRequirement: () => {},
  setCurrentStep: () => {},
  resetAnalysis: () => {},
};

export const AnalysisContext = createContext<AnalysisContextState>(initialState);

export const AnalysisProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [analysisSession, setAnalysisSession] = useState<AnalysisSession | null>(() => {
    const saved = localStorage.getItem('analysisSession');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [losses, setLosses] = useState<Loss[]>(() => JSON.parse(localStorage.getItem('losses') || '[]'));
  const [hazards, setHazards] = useState<Hazard[]>(() => JSON.parse(localStorage.getItem('hazards') || '[]'));
  const [systemConstraints, setSystemConstraints] = useState<SystemConstraint[]>(() => JSON.parse(localStorage.getItem('systemConstraints') || '[]'));
  const [sequenceOfEvents, setSequenceOfEvents] = useState<EventDetail[]>(() => JSON.parse(localStorage.getItem('sequenceOfEvents') || '[]'));
  const [systemComponents, setSystemComponents] = useState<SystemComponent[]>(() => JSON.parse(localStorage.getItem('systemComponents') || '[]'));
  const [controllers, setControllers] = useState<Controller[]>(() => JSON.parse(localStorage.getItem('controllers') || '[]'));
  const [controlPaths, setControlPaths] = useState<ControlPath[]>(() => JSON.parse(localStorage.getItem('controlPaths') || '[]'));
  const [feedbackPaths, setFeedbackPaths] = useState<FeedbackPath[]>(() => JSON.parse(localStorage.getItem('feedbackPaths') || '[]'));
  const [controlActions, setControlActions] = useState<ControlAction[]>(() => JSON.parse(localStorage.getItem('controlActions') || '[]'));
  const [ucas, setUcas] = useState<UnsafeControlAction[]>(() => JSON.parse(localStorage.getItem('ucas') || '[]'));
  const [uccas, setUccas] = useState<UCCA[]>(() => JSON.parse(localStorage.getItem('uccas') || '[]'));
  const [scenarios, setScenarios] = useState<CausalScenario[]>(() => JSON.parse(localStorage.getItem('scenarios') || '[]'));
  const [requirements, setRequirements] = useState<Requirement[]>(() => JSON.parse(localStorage.getItem('requirements') || '[]'));

  useEffect(() => { if (analysisSession) localStorage.setItem('analysisSession', JSON.stringify(analysisSession)); else localStorage.removeItem('analysisSession'); }, [analysisSession]);
  useEffect(() => { localStorage.setItem('losses', JSON.stringify(losses)); }, [losses]);
  useEffect(() => { localStorage.setItem('hazards', JSON.stringify(hazards)); }, [hazards]);
  useEffect(() => { localStorage.setItem('systemConstraints', JSON.stringify(systemConstraints)); }, [systemConstraints]);
  useEffect(() => { localStorage.setItem('sequenceOfEvents', JSON.stringify(sequenceOfEvents)); }, [sequenceOfEvents]);
  useEffect(() => { localStorage.setItem('systemComponents', JSON.stringify(systemComponents)); }, [systemComponents]);
  useEffect(() => { localStorage.setItem('controllers', JSON.stringify(controllers)); }, [controllers]);
  useEffect(() => { localStorage.setItem('controlPaths', JSON.stringify(controlPaths)); }, [controlPaths]);
  useEffect(() => { localStorage.setItem('feedbackPaths', JSON.stringify(feedbackPaths)); }, [feedbackPaths]);
  useEffect(() => { localStorage.setItem('controlActions', JSON.stringify(controlActions)); }, [controlActions]);
  useEffect(() => { localStorage.setItem('ucas', JSON.stringify(ucas)); }, [ucas]);
  useEffect(() => { localStorage.setItem('uccas', JSON.stringify(uccas)); }, [uccas]);
  useEffect(() => { localStorage.setItem('scenarios', JSON.stringify(scenarios)); }, [scenarios]);
  useEffect(() => { localStorage.setItem('requirements', JSON.stringify(requirements)); }, [requirements]);

  const setAnalysisType = useCallback((type: AnalysisType, initialStep: string) => {
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
  }, []);

  const updateAnalysisSession = useCallback((data: Partial<Omit<AnalysisSession, 'id' | 'analysisType' | 'createdAt' | 'updatedAt'>>) => {
    setAnalysisSession(prev => prev ? ({ ...prev, ...data, updatedAt: new Date().toISOString() }) : null);
  }, []);
  
  const setCurrentStep = useCallback((stepPath: string) => {
    setAnalysisSession(prev => prev ? ({ ...prev, currentStep: stepPath, updatedAt: new Date().toISOString() }) : null);
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysisSession(null);
    setLosses([]);
    setHazards([]);
    setSystemConstraints([]);
    setSequenceOfEvents([]);
    setSystemComponents([]);
    setControllers([]);
    setControlPaths([]);
    setFeedbackPaths([]);
    setControlActions([]);
    setUcas([]);
    setUccas([]); // Reset UCCAs
    setScenarios([]);
    setRequirements([]);
    localStorage.clear(); 
  }, []);

  const createCrudOperations = <T extends {id: string}>(
    setter: React.Dispatch<React.SetStateAction<T[]>>, 
    list: T[],
    codePrefix?: string
  ) => ({
    add: (item: Omit<T, 'id' | 'code'> | Omit<T, 'id'>) => { // Allow items without 'code' property
      const newItemData: any = { ...item, id: uuidv4() };
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
  
  const lossOps = createCrudOperations(setLosses, losses, 'L');
  const hazardOps = createCrudOperations(setHazards, hazards, 'H');
  const constraintOps = createCrudOperations(setSystemConstraints, systemConstraints, 'SC');
  const ucaOps = createCrudOperations(setUcas, ucas, 'UCA');
  const uccaOps = createCrudOperations(setUccas, uccas, 'UCCA'); // CRUD for UCCAs

  const componentOps = createCrudOperations(setSystemComponents, systemComponents);
  const controllerOps = createCrudOperations(setControllers, controllers);
  const controlPathOps = createCrudOperations(setControlPaths, controlPaths);
  const feedbackPathOps = createCrudOperations(setFeedbackPaths, feedbackPaths);
  const actionOps = createCrudOperations(setControlActions, controlActions);
  const scenarioOps = createCrudOperations(setScenarios, scenarios);
  const requirementOps = createCrudOperations(setRequirements, requirements);
  
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

  return (
    <AnalysisContext.Provider value={{
      analysisSession, losses, hazards, systemConstraints, systemComponents, controllers, controlPaths, feedbackPaths,
      controlActions, ucas, uccas, scenarios, requirements, sequenceOfEvents,
      setAnalysisType, updateAnalysisSession, setCurrentStep, resetAnalysis,
      addLoss: lossOps.add, updateLoss: lossOps.update, deleteLoss: lossOps.delete,
      addHazard: hazardOps.add as (item: Omit<Hazard, 'id' | 'code'>) => void, 
      updateHazard: hazardOps.update, 
      deleteHazard: hazardOps.delete,
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
      addControlAction: actionOps.add, updateControlAction: actionOps.update, deleteControlAction: actionOps.delete,
      addUCA: ucaOps.add as (uca: Omit<UnsafeControlAction, 'id' | 'code'>) => void, 
      updateUCA: ucaOps.update, 
      deleteUCA: ucaOps.delete,
      addUCCA: uccaOps.add as (ucca: Omit<UCCA, 'id' | 'code'>) => void, 
      updateUCCA: uccaOps.update, 
      deleteUCCA: uccaOps.delete,
      addScenario: scenarioOps.add, updateScenario: scenarioOps.update, deleteScenario: scenarioOps.delete,
      addRequirement: requirementOps.add, updateRequirement: requirementOps.update, deleteRequirement: requirementOps.delete,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};