import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisSession, AnalysisType, Loss, Hazard, SystemConstraint, SystemComponent,
  Controller, ControlAction, UnsafeControlAction, Requirement, EventDetail,
  ControlPath, FeedbackPath, UCCA, CommunicationPath, HardwareComponent, FailureMode, 
  UnsafeInteraction, HardwareAnalysisSession, CausalScenario
} from '@/types/types';
import { useProjects } from './ProjectsContext';

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
  requirements: Requirement[];
  sequenceOfEvents: EventDetail[];
  activeContexts: { [key: string]: string };
  hardwareComponents: HardwareComponent[];
  failureModes: FailureMode[];
  unsafeInteractions: UnsafeInteraction[];
  hardwareAnalysisSession: HardwareAnalysisSession | null;
  scenarios: CausalScenario[]; // Added scenarios property

  setAnalysisType: (type: AnalysisType) => void;
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

  addScenario: (scenario: Omit<CausalScenario, 'id' | 'code'>) => void;
  updateScenario: (id: string, updates: Partial<CausalScenario>) => void;
  deleteScenario: (id: string) => void;
}

const initialState: AnalysisContextState = {
  analysisSession: null,
  castStep2SubStep: 0,
  castStep2MaxReachedSubStep: 0,
  losses: [], hazards: [], systemConstraints: [], systemComponents: [], controllers: [],
  controlPaths: [], feedbackPaths: [], communicationPaths: [], controlActions: [], ucas: [], uccas: [], requirements: [], sequenceOfEvents: [],
  activeContexts: {},
  hardwareComponents: [], failureModes: [], unsafeInteractions: [], hardwareAnalysisSession: null, scenarios: [],
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
  addRequirement: () => {}, updateRequirement: () => {}, deleteRequirement: () => {},
  setCurrentStep: () => {},
  setActiveContext: () => {},
  resetAnalysis: () => {},
  addHardwareComponent: () => {}, updateHardwareComponent: () => {}, deleteHardwareComponent: () => {},
  addFailureMode: () => {}, updateFailureMode: () => {}, deleteFailureMode: () => {},
  addUnsafeInteraction: () => {}, updateUnsafeInteraction: () => {}, deleteUnsafeInteraction: () => {},
  updateHardwareAnalysisSession: () => {},
  addScenario: () => {}, updateScenario: () => {}, deleteScenario: () => {},
};

export const AnalysisContext = createContext<AnalysisContextState>(initialState);

export const useAnalysisContext = () => {
  const context = React.useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext must be used within an AnalysisProvider');
  }
  return context;
};

export const AnalysisProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { currentAnalysis, currentProjectId, createAnalysis, updateAnalysis: updateProjectAnalysis, isLoading: isProjectsLoading } = useProjects();
  
  // Create storage key based on current analysis ID
  const getStorageKey = (key: string) => {
    if (currentAnalysis) {
      return `${key}-${currentAnalysis.id}`;
    }
    
    // Fallback: if projects are still loading, try to get the analysis ID from localStorage
    if (isProjectsLoading) {
      const storedAnalysisId = localStorage.getItem('stamp-current-analysis');
      if (storedAnalysisId) {
        return `${key}-${storedAnalysisId}`;
      }
    }
    
    return null;
  };
  
  // Helper to load data from localStorage for current analysis
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    const storageKey = getStorageKey(key);
    if (!storageKey) return defaultValue;
    
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  };
  
  // State is now tied to the current analysis from ProjectsContext
  const analysisSession = currentAnalysis;
  
  // Initialize state with localStorage data if available during initial render
  const [castStep2SubStep, _setCastStep2SubStep] = useState<number>(() => 
    isProjectsLoading ? loadFromStorage('castStep2SubStep', 0) : 0
  );
  const [castStep2MaxReachedSubStep, setCastStep2MaxReachedSubStep] = useState<number>(() => 
    isProjectsLoading ? loadFromStorage('castStep2MaxReachedSubStep', 0) : 0
  );

  const [losses, setLosses] = useState<Loss[]>(() => 
    isProjectsLoading ? loadFromStorage('losses', []) : []
  );
  const [hazards, setHazards] = useState<Hazard[]>(() => 
    isProjectsLoading ? loadFromStorage('hazards', []) : []
  );
  const [systemConstraints, setSystemConstraints] = useState<SystemConstraint[]>(() => 
    isProjectsLoading ? loadFromStorage('systemConstraints', []) : []
  );
  const [sequenceOfEvents, setSequenceOfEvents] = useState<EventDetail[]>(() => 
    isProjectsLoading ? loadFromStorage('sequenceOfEvents', []) : []
  );
  const [systemComponents, setSystemComponents] = useState<SystemComponent[]>(() => 
    isProjectsLoading ? loadFromStorage('systemComponents', []) : []
  );
  const [controllers, setControllers] = useState<Controller[]>(() => 
    isProjectsLoading ? loadFromStorage('controllers', []) : []
  );
  const [controlPaths, setControlPaths] = useState<ControlPath[]>(() => 
    isProjectsLoading ? loadFromStorage('controlPaths', []) : []
  );
  const [feedbackPaths, setFeedbackPaths] = useState<FeedbackPath[]>(() => 
    isProjectsLoading ? loadFromStorage('feedbackPaths', []) : []
  );
  const [communicationPaths, setCommunicationPaths] = useState<CommunicationPath[]>(() => 
    isProjectsLoading ? loadFromStorage('communicationPaths', []) : []
  );
  const [controlActions, setControlActions] = useState<ControlAction[]>(() => 
    isProjectsLoading ? loadFromStorage('controlActions', []) : []
  );
  const [ucas, setUcas] = useState<UnsafeControlAction[]>(() => 
    isProjectsLoading ? loadFromStorage('ucas', []) : []
  );
  const [uccas, setUccas] = useState<UCCA[]>(() => 
    isProjectsLoading ? loadFromStorage('uccas', []) : []
  );
  const [requirements, setRequirements] = useState<Requirement[]>(() => 
    isProjectsLoading ? loadFromStorage('requirements', []) : []
  );
  const [activeContexts, setActiveContexts] = useState<{ [key: string]: string; }>(() => 
    isProjectsLoading ? loadFromStorage('activeContexts', {}) : {}
  );
  const [hardwareComponents, setHardwareComponents] = useState<HardwareComponent[]>(() => 
    isProjectsLoading ? loadFromStorage('hardwareComponents', []) : []
  );
  const [failureModes, setFailureModes] = useState<FailureMode[]>(() => 
    isProjectsLoading ? loadFromStorage('failureModes', []) : []
  );
  const [unsafeInteractions, setUnsafeInteractions] = useState<UnsafeInteraction[]>(() => 
    isProjectsLoading ? loadFromStorage('unsafeInteractions', []) : []
  );
  const [hardwareAnalysisSession, setHardwareAnalysisSession] = useState<HardwareAnalysisSession | null>(() => 
    isProjectsLoading ? loadFromStorage('hardwareAnalysisSession', null) : null
  );
  const [scenarios, setScenarios] = useState<CausalScenario[]>(() => 
    isProjectsLoading ? loadFromStorage('scenarios', []) : []
  );
  
  // Track if we've done the initial load
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  
  // Load data when analysis changes
  useEffect(() => {
    // Don't do anything while projects are still loading
    if (isProjectsLoading) {
      return;
    }
    
    // Mark that we've finished initial loading
    if (!hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
    
    if (currentAnalysis) {
      _setCastStep2SubStep(loadFromStorage('castStep2SubStep', 0));
      setCastStep2MaxReachedSubStep(loadFromStorage('castStep2MaxReachedSubStep', 0));
      setLosses(loadFromStorage('losses', []));
      setHazards(loadFromStorage('hazards', []));
      setSystemConstraints(loadFromStorage('systemConstraints', []));
      setSequenceOfEvents(loadFromStorage('sequenceOfEvents', []));
      setSystemComponents(loadFromStorage('systemComponents', []));
      setControllers(loadFromStorage('controllers', []));
      setControlPaths(loadFromStorage('controlPaths', []));
      setFeedbackPaths(loadFromStorage('feedbackPaths', []));
      setCommunicationPaths(loadFromStorage('communicationPaths', []));
      setControlActions(loadFromStorage('controlActions', []));
      setUcas(loadFromStorage('ucas', []));
      setUccas(loadFromStorage('uccas', []));
      setRequirements(loadFromStorage('requirements', []));
      setActiveContexts(loadFromStorage('activeContexts', {}));
      setHardwareComponents(loadFromStorage('hardwareComponents', []));
      setFailureModes(loadFromStorage('failureModes', []));
      setUnsafeInteractions(loadFromStorage('unsafeInteractions', []));
      setHardwareAnalysisSession(loadFromStorage('hardwareAnalysisSession', null));
      setScenarios(loadFromStorage('scenarios', []));
    } else if (hasInitiallyLoaded) {
      // Only clear state when no analysis is selected AND we've already done initial loading
      // This prevents clearing data during the initial page load
      _setCastStep2SubStep(0);
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
      setRequirements([]);
      setActiveContexts({});
      setHardwareComponents([]);
      setFailureModes([]);
      setUnsafeInteractions([]);
      setHardwareAnalysisSession(null);
      setScenarios([]);
    }
  }, [currentAnalysis?.id, isProjectsLoading, hasInitiallyLoaded]);


  // Save data to localStorage with analysis-specific keys
  // Only save after initial load is complete to prevent overwriting with empty data
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('castStep2SubStep');
    if (key) localStorage.setItem(key, castStep2SubStep.toString());
  }, [castStep2SubStep, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('castStep2MaxReachedSubStep');
    if (key) localStorage.setItem(key, castStep2MaxReachedSubStep.toString());
  }, [castStep2MaxReachedSubStep, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('losses');
    if (key) localStorage.setItem(key, JSON.stringify(losses));
  }, [losses, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('hazards');
    if (key) localStorage.setItem(key, JSON.stringify(hazards));
  }, [hazards, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('systemConstraints');
    if (key) localStorage.setItem(key, JSON.stringify(systemConstraints));
  }, [systemConstraints, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('sequenceOfEvents');
    if (key) localStorage.setItem(key, JSON.stringify(sequenceOfEvents));
  }, [sequenceOfEvents, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('systemComponents');
    if (key) localStorage.setItem(key, JSON.stringify(systemComponents));
  }, [systemComponents, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('controllers');
    if (key) localStorage.setItem(key, JSON.stringify(controllers));
  }, [controllers, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('controlPaths');
    if (key) localStorage.setItem(key, JSON.stringify(controlPaths));
  }, [controlPaths, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('feedbackPaths');
    if (key) localStorage.setItem(key, JSON.stringify(feedbackPaths));
  }, [feedbackPaths, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('communicationPaths');
    if (key) localStorage.setItem(key, JSON.stringify(communicationPaths));
  }, [communicationPaths, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('controlActions');
    if (key) localStorage.setItem(key, JSON.stringify(controlActions));
  }, [controlActions, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('ucas');
    if (key) localStorage.setItem(key, JSON.stringify(ucas));
  }, [ucas, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('uccas');
    if (key) localStorage.setItem(key, JSON.stringify(uccas));
  }, [uccas, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('requirements');
    if (key) localStorage.setItem(key, JSON.stringify(requirements));
  }, [requirements, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('activeContexts');
    if (key) localStorage.setItem(key, JSON.stringify(activeContexts));
  }, [activeContexts, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('hardwareComponents');
    if (key) localStorage.setItem(key, JSON.stringify(hardwareComponents));
  }, [hardwareComponents, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('failureModes');
    if (key) localStorage.setItem(key, JSON.stringify(failureModes));
  }, [failureModes, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('unsafeInteractions');
    if (key) localStorage.setItem(key, JSON.stringify(unsafeInteractions));
  }, [unsafeInteractions, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('hardwareAnalysisSession');
    if (key && hardwareAnalysisSession) {
      localStorage.setItem(key, JSON.stringify(hardwareAnalysisSession));
    }
  }, [hardwareAnalysisSession, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);
  
  useEffect(() => {
    if (!hasInitiallyLoaded || isProjectsLoading) return;
    const key = getStorageKey('scenarios');
    if (key) localStorage.setItem(key, JSON.stringify(scenarios));
  }, [scenarios, currentAnalysis?.id, hasInitiallyLoaded, isProjectsLoading]);

  const setCastStep2SubStep = useCallback((stepUpdater: number | ((prevStep: number) => number)) => {
    _setCastStep2SubStep(prevStep => {
      const newStep = typeof stepUpdater === 'function' ? stepUpdater(prevStep) : stepUpdater;
      setCastStep2MaxReachedSubStep(prevMax => Math.max(prevMax, newStep));
      return newStep;
    });
  }, []);

  const setAnalysisType = useCallback((type: AnalysisType) => {
    // This method now creates a new analysis in the current project
    if (currentProjectId) {
      createAnalysis(currentProjectId, type, `${type} Analysis - ${new Date().toLocaleDateString()}`);
    }
    // Reset progress for the specific step
    setCastStep2SubStep(0);
    setCastStep2MaxReachedSubStep(0);
  }, [currentProjectId, createAnalysis]);

  const updateAnalysisSession = useCallback((data: Partial<Omit<AnalysisSession, 'id' | 'analysisType' | 'createdAt' | 'updatedAt'>>) => {
    if (currentAnalysis && currentProjectId) {
      updateProjectAnalysis(currentProjectId, currentAnalysis.id, data);
    }
  }, [currentAnalysis, currentProjectId, updateProjectAnalysis]);

  const setCurrentStep = useCallback((stepPath: string) => {
    if (currentAnalysis && currentProjectId) {
      updateProjectAnalysis(currentProjectId, currentAnalysis.id, { currentStep: stepPath });
    }
  }, [currentAnalysis, currentProjectId, updateProjectAnalysis]);

  const setActiveContext = useCallback((controllerId: string, contextId: string) => {
    setActiveContexts(prev => ({...prev, [controllerId]: contextId}));
  }, []);

  const resetAnalysis = useCallback(() => {
    // Clear all state
    _setCastStep2SubStep(0);
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
    setRequirements([]);
    setActiveContexts({});
    setHardwareComponents([]);
    setFailureModes([]);
    setUnsafeInteractions([]);
    setHardwareAnalysisSession(null);
    setScenarios([]);
    
    // Clear localStorage for current analysis
    if (currentAnalysis) {
      const keysToRemove = [
        'castStep2SubStep', 'castStep2MaxReachedSubStep', 'losses', 'hazards',
        'systemConstraints', 'sequenceOfEvents', 'systemComponents', 'controllers',
        'controlPaths', 'feedbackPaths', 'communicationPaths', 'controlActions',
        'ucas', 'uccas', 'requirements', 'activeContexts',
        'hardwareComponents', 'failureModes', 'unsafeInteractions', 'hardwareAnalysisSession', 'scenarios'
      ];
      
      keysToRemove.forEach(key => {
        const storageKey = getStorageKey(key);
        if (storageKey) localStorage.removeItem(storageKey);
      });
    }
  }, [currentAnalysis, getStorageKey]);

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
  const requirementOps = createCrudOperations(setRequirements, requirements);
  const hardwareComponentOps = createCrudOperations(setHardwareComponents, hardwareComponents);
  const failureModeOps = createCrudOperations(setFailureModes, failureModes);
  const unsafeInteractionOps = createCrudOperations(setUnsafeInteractions, unsafeInteractions);
  const scenarioOps = createCrudOperations(setScenarios, scenarios, 'CS');

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
        communicationPaths, controlActions, ucas, uccas, requirements, sequenceOfEvents, activeContexts,
        hardwareComponents, failureModes, unsafeInteractions, hardwareAnalysisSession, scenarios,
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
        addRequirement: requirementOps.add, updateRequirement: requirementOps.update, deleteRequirement: requirementOps.delete,
        addHardwareComponent: hardwareComponentOps.add, updateHardwareComponent: hardwareComponentOps.update, deleteHardwareComponent: hardwareComponentOps.delete,
        addFailureMode: failureModeOps.add, updateFailureMode: failureModeOps.update, deleteFailureMode: failureModeOps.delete,
        addUnsafeInteraction: unsafeInteractionOps.add, updateUnsafeInteraction: unsafeInteractionOps.update, deleteUnsafeInteraction: unsafeInteractionOps.delete,
        updateHardwareAnalysisSession,
        addScenario: scenarioOps.add as (scenario: Omit<CausalScenario, 'id' | 'code'>) => void,
        updateScenario: scenarioOps.update,
        deleteScenario: scenarioOps.delete,
      }}>
        {children}
      </AnalysisContext.Provider>
  );
};