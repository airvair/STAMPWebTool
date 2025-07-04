import { useState, useEffect, useCallback } from 'react';

export interface WorkspaceSection {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
}

export interface WorkspaceVisualizationState {
  isVisible: boolean;
  isPinned: boolean;
  layout: 'sidebar' | 'overlay' | 'split';
  zoomLevel: number;
  viewBox: { x: number; y: number; width: number; height: number };
}

export interface WorkspaceState {
  activeSection: string;
  sectionHistory: string[];
  visualizationState: WorkspaceVisualizationState;
  unsavedChanges: Record<string, boolean>;
  lastSaved: number;
}

export const WORKSPACE_SECTIONS: WorkspaceSection[] = [
  {
    id: 'components',
    title: 'Components',
    description: 'Define system components that need to be controlled',
    dependencies: []
  },
  {
    id: 'controllers',
    title: 'Controllers',
    description: 'Define entities that control the system components',
    dependencies: ['components']
  },
  {
    id: 'control-paths',
    title: 'Control Paths',
    description: 'Define command relationships and control actions',
    dependencies: ['controllers', 'components']
  },
  {
    id: 'feedback-paths',
    title: 'Feedback Paths',
    description: 'Define information flow back to controllers',
    dependencies: ['controllers']
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Define peer-to-peer controller communication',
    dependencies: ['controllers']
  }
];

const defaultWorkspaceState: WorkspaceState = {
  activeSection: 'components',
  sectionHistory: ['components'],
  visualizationState: {
    isVisible: true,
    isPinned: true,
    layout: 'sidebar',
    zoomLevel: 1,
    viewBox: { x: 0, y: 0, width: 800, height: 600 }
  },
  unsavedChanges: {},
  lastSaved: Date.now()
};

const STORAGE_KEY = 'control-structure-workspace-state';

export const useWorkspaceState = () => {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultWorkspaceState, ...JSON.parse(saved) } : defaultWorkspaceState;
    } catch (error) {
      console.warn('Failed to load workspace state from localStorage:', error);
      return defaultWorkspaceState;
    }
  });

  const setActiveSection = useCallback((section: string) => {
    setWorkspaceState(prev => ({
      ...prev,
      activeSection: section,
      sectionHistory: [
        ...prev.sectionHistory.filter(s => s !== section).slice(-4),
        section
      ]
    }));
  }, []);

  const markSectionComplete = useCallback((_section: string, _isComplete: boolean = true) => {
    // This function is no longer needed as we derive status from actual data
    // Keeping for backward compatibility but it's a no-op
  }, []);

  const setVisualizationState = useCallback((newState: Partial<WorkspaceVisualizationState>) => {
    setWorkspaceState(prev => ({
      ...prev,
      visualizationState: {
        ...prev.visualizationState,
        ...newState
      }
    }));
  }, []);

  const markUnsavedChanges = useCallback((section: string, hasChanges: boolean = true) => {
    setWorkspaceState(prev => ({
      ...prev,
      unsavedChanges: {
        ...prev.unsavedChanges,
        [section]: hasChanges
      }
    }));
  }, []);

  const saveWorkspaceState = useCallback(() => {
    const stateToSave = {
      ...workspaceState,
      lastSaved: Date.now(),
      unsavedChanges: {} // Clear unsaved changes on save
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      setWorkspaceState(stateToSave);
    } catch (error) {
      console.error('Failed to save workspace state to localStorage:', error);
    }
  }, [workspaceState]);

  const restoreWorkspaceState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const restoredState = { ...defaultWorkspaceState, ...JSON.parse(saved) };
        setWorkspaceState(restoredState);
      }
    } catch (error) {
      console.error('Failed to restore workspace state from localStorage:', error);
    }
  }, []);

  const getSectionStatus = useCallback((sectionId: string, data: any): 'empty' | 'in-progress' | 'completed' | 'blocked' => {
    const section = WORKSPACE_SECTIONS.find(s => s.id === sectionId);
    if (!section) return 'empty';

    // Check dependencies recursively
    const checkDependencies = (depId: string): boolean => {
      const depSection = WORKSPACE_SECTIONS.find(s => s.id === depId);
      if (!depSection) return true;
      
      const depDataCount = getSectionDataCount(depId, data);
      return depDataCount > 0;
    };

    const hasDependencies = section.dependencies.every(checkDependencies);
    
    if (!hasDependencies) return 'blocked';

    // Check if section has data
    const dataCount = getSectionDataCount(sectionId, data);
    
    if (dataCount === 0) return 'empty';
    
    // Section has data and dependencies are met
    return 'completed';
  }, []);

  const getSectionDataCount = useCallback((sectionId: string, data: any) => {
    switch (sectionId) {
      case 'components':
        return data?.systemComponents?.length || 0;
      case 'controllers':
        return data?.controllers?.length || 0;
      case 'control-paths':
        return data?.controlPaths?.length || 0;
      case 'feedback-paths':
        return data?.feedbackPaths?.length || 0;
      case 'communication':
        return data?.communicationLinks?.length || 0;
      default:
        return 0;
    }
  }, []);

  // Auto-save workspace state periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceState));
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [workspaceState]);

  return {
    workspaceState,
    setActiveSection,
    markSectionComplete,
    setVisualizationState,
    markUnsavedChanges,
    saveWorkspaceState,
    restoreWorkspaceState,
    getSectionStatus,
    getSectionDataCount,
    sections: WORKSPACE_SECTIONS
  };
};