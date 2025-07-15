import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/context/ProjectsContext';

/**
 * Hook to synchronize URL parameters with project and analysis selection
 */
export const useUrlSync = () => {
  const { projectName, analysisName } = useParams<{ projectName: string; analysisName: string }>();
  const navigate = useNavigate();
  const { 
    projects, 
    currentProject, 
    currentAnalysis, 
    selectProject, 
    selectAnalysis 
  } = useProjects();

  // Sync URL to state when URL changes
  useEffect(() => {
    if (!projectName) return;

    // Decode URL parameters
    const decodedProjectName = decodeURIComponent(projectName);

    // Find project by URL slug
    const project = projects.find(p => 
      p.name.toLowerCase().replace(/\s+/g, '-') === decodedProjectName.toLowerCase()
    );

    if (project) {
      // Select project if not already selected
      if (currentProject?.id !== project.id) {
        selectProject(project.id);
      }

      // Handle analysis selection
      if (analysisName) {
        const decodedAnalysisName = decodeURIComponent(analysisName);
        
        // Find analysis by URL slug within the project
        const analysis = project.analyses.find(a => 
          a.title.toLowerCase().replace(/\s+/g, '-') === decodedAnalysisName.toLowerCase()
        );

        if (analysis && currentAnalysis?.id !== analysis.id) {
          selectAnalysis(analysis.id);
        }
      } else {
        // If no analysis in URL but one is selected, deselect it
        if (currentAnalysis) {
          selectAnalysis(null);
        }
      }
    }
  }, [projectName, analysisName, projects, currentProject, currentAnalysis, selectProject, selectAnalysis]);

  // Sync state to URL when project/analysis changes
  useEffect(() => {
    if (currentProject) {
      const projectSlug = encodeURIComponent(currentProject.name.toLowerCase().replace(/\s+/g, '-'));
      
      let targetPath: string;
      if (currentAnalysis) {
        // Include analysis in URL
        const analysisSlug = encodeURIComponent(currentAnalysis.title.toLowerCase().replace(/\s+/g, '-'));
        targetPath = `/${projectSlug}/${analysisSlug}`;
      } else {
        // Just project in URL
        targetPath = `/${projectSlug}`;
      }
      
      // Only navigate if the path is different
      if (window.location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [currentProject, currentAnalysis, navigate]);

  return {
    projectName,
    analysisName,
    currentProject,
    currentAnalysis
  };
};