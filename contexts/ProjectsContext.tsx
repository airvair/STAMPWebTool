import React, { createContext, useState, useCallback, ReactNode, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisSession, AnalysisType } from '@/types';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  analyses: AnalysisSession[];
}

interface ProjectsContextState {
  projects: Project[];
  currentProjectId: string | null;
  currentAnalysisId: string | null;
  currentProject: Project | null;
  currentAnalysis: AnalysisSession | null;
  
  // Project operations
  createProject: (name: string, description?: string) => Project;
  updateProject: (projectId: string, updates: Partial<Omit<Project, 'id' | 'analyses' | 'createdAt'>>) => void;
  deleteProject: (projectId: string) => void;
  selectProject: (projectId: string | null) => void;
  
  // Analysis operations
  createAnalysis: (projectId: string, type: AnalysisType, title?: string) => AnalysisSession;
  updateAnalysis: (projectId: string, analysisId: string, updates: Partial<Omit<AnalysisSession, 'id' | 'analysisType' | 'createdAt'>>) => void;
  deleteAnalysis: (projectId: string, analysisId: string) => void;
  selectAnalysis: (analysisId: string | null) => void;
  
  // Import existing analysis
  importAnalysisToProject: (projectId: string, analysis: AnalysisSession) => void;
}

const PROJECTS_STORAGE_KEY = 'stamp-projects';
const CURRENT_PROJECT_KEY = 'stamp-current-project';
const CURRENT_ANALYSIS_KEY = 'stamp-current-analysis';

// Helper to get initial data from localStorage
const getStoredProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getStoredCurrentIds = (): { projectId: string | null; analysisId: string | null } => {
  try {
    return {
      projectId: localStorage.getItem(CURRENT_PROJECT_KEY),
      analysisId: localStorage.getItem(CURRENT_ANALYSIS_KEY)
    };
  } catch {
    return { projectId: null, analysisId: null };
  }
};

// Check for legacy single analysis and migrate
const migrateLegacyAnalysis = (): Project[] => {
  try {
    const legacyAnalysis = localStorage.getItem('analysisSession');
    if (legacyAnalysis) {
      const analysis: AnalysisSession = JSON.parse(legacyAnalysis);
      const now = new Date().toISOString();
      
      // Create a default project for the legacy analysis
      const defaultProject: Project = {
        id: uuidv4(),
        name: 'Default Project',
        description: 'Migrated from previous version',
        createdAt: analysis.createdAt || now,
        updatedAt: now,
        analyses: [analysis]
      };
      
      // Save the migrated project
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([defaultProject]));
      localStorage.setItem(CURRENT_PROJECT_KEY, defaultProject.id);
      localStorage.setItem(CURRENT_ANALYSIS_KEY, analysis.id);
      
      // Remove the legacy storage
      localStorage.removeItem('analysisSession');
      
      return [defaultProject];
    }
  } catch (error) {
    console.error('Error migrating legacy analysis:', error);
  }
  return [];
};

const initialState: ProjectsContextState = {
  projects: [],
  currentProjectId: null,
  currentAnalysisId: null,
  currentProject: null,
  currentAnalysis: null,
  createProject: () => ({} as Project),
  updateProject: () => {},
  deleteProject: () => {},
  selectProject: () => {},
  createAnalysis: () => ({} as AnalysisSession),
  updateAnalysis: () => {},
  deleteAnalysis: () => {},
  selectAnalysis: () => {},
  importAnalysisToProject: () => {}
};

export const ProjectsContext = createContext<ProjectsContextState>(initialState);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with migration check
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = getStoredProjects();
    if (stored.length === 0) {
      // Check for legacy analysis to migrate
      const migrated = migrateLegacyAnalysis();
      return migrated.length > 0 ? migrated : [];
    }
    return stored;
  });
  
  const { projectId: storedProjectId, analysisId: storedAnalysisId } = getStoredCurrentIds();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(storedProjectId);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(storedAnalysisId);
  
  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);
  
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  }, [currentProjectId]);
  
  useEffect(() => {
    if (currentAnalysisId) {
      localStorage.setItem(CURRENT_ANALYSIS_KEY, currentAnalysisId);
    } else {
      localStorage.removeItem(CURRENT_ANALYSIS_KEY);
    }
  }, [currentAnalysisId]);
  
  // Compute current project and analysis
  const currentProject = projects.find(p => p.id === currentProjectId) || null;
  const currentAnalysis = currentProject?.analyses.find(a => a.id === currentAnalysisId) || null;
  
  // Project operations
  const createProject = useCallback((name: string, description?: string): Project => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      analyses: []
    };
    
    setProjects(prev => [...prev, newProject]);
    setCurrentProjectId(newProject.id);
    setCurrentAnalysisId(null);
    
    return newProject;
  }, []);
  
  const updateProject = useCallback((projectId: string, updates: Partial<Omit<Project, 'id' | 'analyses' | 'createdAt'>>) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { ...project, ...updates, updatedAt: new Date().toISOString() }
        : project
    ));
  }, []);
  
  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    
    // If deleting current project, clear selection
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
      setCurrentAnalysisId(null);
    }
  }, [currentProjectId]);
  
  const selectProject = useCallback((projectId: string | null) => {
    setCurrentProjectId(projectId);
    // Clear analysis selection when switching projects
    setCurrentAnalysisId(null);
  }, []);
  
  // Analysis operations
  const createAnalysis = useCallback((projectId: string, type: AnalysisType, title?: string): AnalysisSession => {
    const now = new Date().toISOString();
    const newAnalysis: AnalysisSession = {
      id: uuidv4(),
      analysisType: type,
      title: title || `${type} Analysis - ${new Date().toLocaleDateString()}`,
      createdBy: 'Analyst',
      createdAt: now,
      updatedAt: now,
      currentStep: type === AnalysisType.CAST ? '/cast/step2' : '/stpa/step2'
    };
    
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? { 
            ...project, 
            analyses: [...project.analyses, newAnalysis],
            updatedAt: now 
          }
        : project
    ));
    
    // Auto-select the new analysis
    setCurrentProjectId(projectId);
    setCurrentAnalysisId(newAnalysis.id);
    
    return newAnalysis;
  }, []);
  
  const updateAnalysis = useCallback((projectId: string, analysisId: string, updates: Partial<Omit<AnalysisSession, 'id' | 'analysisType' | 'createdAt'>>) => {
    const now = new Date().toISOString();
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? {
            ...project,
            analyses: project.analyses.map(analysis =>
              analysis.id === analysisId
                ? { ...analysis, ...updates, updatedAt: now }
                : analysis
            ),
            updatedAt: now
          }
        : project
    ));
  }, []);
  
  const deleteAnalysis = useCallback((projectId: string, analysisId: string) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? {
            ...project,
            analyses: project.analyses.filter(a => a.id !== analysisId),
            updatedAt: new Date().toISOString()
          }
        : project
    ));
    
    // If deleting current analysis, clear selection
    if (currentAnalysisId === analysisId) {
      setCurrentAnalysisId(null);
    }
  }, [currentAnalysisId]);
  
  const selectAnalysis = useCallback((analysisId: string | null) => {
    setCurrentAnalysisId(analysisId);
    
    // If selecting an analysis, ensure its project is also selected
    if (analysisId) {
      const project = projects.find(p => p.analyses.some(a => a.id === analysisId));
      if (project) {
        setCurrentProjectId(project.id);
      }
    }
  }, [projects]);
  
  const importAnalysisToProject = useCallback((projectId: string, analysis: AnalysisSession) => {
    const now = new Date().toISOString();
    setProjects(prev => prev.map(project => 
      project.id === projectId 
        ? {
            ...project,
            analyses: [...project.analyses, { ...analysis, id: uuidv4() }],
            updatedAt: now
          }
        : project
    ));
  }, []);
  
  const value: ProjectsContextState = {
    projects,
    currentProjectId,
    currentAnalysisId,
    currentProject,
    currentAnalysis,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    createAnalysis,
    updateAnalysis,
    deleteAnalysis,
    selectAnalysis,
    importAnalysisToProject
  };
  
  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};