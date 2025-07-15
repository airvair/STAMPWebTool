import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NavigationProvider } from '@/context/NavigationContext';
import CleanEnterpriseLayout from '@/layouts/CleanEnterpriseLayout';
import { AnalysisWorkspace } from '@/features/analysis';
import { useProjects } from '@/context/ProjectsContext';

const App: React.FC = () => {
  return (
    <NavigationProvider>
      <Routes>
        <Route path="/" element={<CleanEnterpriseLayout />}>
          {/* Default route - redirect to current project/analysis if available */}
          <Route index element={<DefaultRedirect />} />
          
          {/* Project only route (no analysis selected) */}
          <Route path=":projectName" element={<AnalysisWorkspace />} />
          
          {/* Project and analysis specific routes */}
          <Route path=":projectName/:analysisName" element={<AnalysisWorkspace />} />
        </Route>
      </Routes>
    </NavigationProvider>
  );
};

// Component to handle default route redirection
const DefaultRedirect: React.FC = () => {
  const { currentProject, currentAnalysis } = useProjects();
  
  if (currentProject) {
    const projectSlug = encodeURIComponent(currentProject.name.toLowerCase().replace(/\s+/g, '-'));
    
    // Only include analysis in URL if one is selected
    if (currentAnalysis) {
      const analysisSlug = encodeURIComponent(currentAnalysis.title.toLowerCase().replace(/\s+/g, '-'));
      return <Navigate to={`/${projectSlug}/${analysisSlug}`} replace />;
    } else {
      // Just project URL when no analysis is selected
      return <Navigate to={`/${projectSlug}`} replace />;
    }
  }
  
  // If no current project, show the workspace
  return <AnalysisWorkspace />;
};

export default App;