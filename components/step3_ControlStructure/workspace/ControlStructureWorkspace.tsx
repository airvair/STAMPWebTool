import React, { useCallback, useEffect, useState } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import WorkspaceNavigation from './WorkspaceNavigation';
import WorkspaceContent from './WorkspaceContent';
import WorkspaceVisualization from './WorkspaceVisualization';

interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

const BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
};

type ScreenSize = 'mobile' | 'tablet' | 'desktop';

const useResponsiveLayout = () => {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      if (width < BREAKPOINTS.mobile) {
        setScreenSize('mobile');
      } else if (width < BREAKPOINTS.tablet) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial state

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { screenSize, windowWidth };
};

const ControlStructureWorkspace: React.FC = () => {
  const analysisData = useAnalysis();
  const {
    workspaceState,
    setActiveSection,
    setVisualizationState,
    markUnsavedChanges,
    saveWorkspaceState,
    getSectionStatus,
    getSectionDataCount
  } = useWorkspaceState();

  const { screenSize } = useResponsiveLayout();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Auto-determine visualization layout based on screen size
  useEffect(() => {
    let newLayout = workspaceState.visualizationState.layout;
    
    if (screenSize === 'mobile') {
      newLayout = 'overlay';
    } else if (screenSize === 'tablet') {
      newLayout = 'split';
    } else {
      newLayout = 'sidebar';
    }

    if (newLayout !== workspaceState.visualizationState.layout) {
      setVisualizationState({ layout: newLayout });
    }
  }, [screenSize, workspaceState.visualizationState.layout, setVisualizationState]);

  // Handle section switching with mobile navigation
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    if (screenSize === 'mobile') {
      setIsMobileNavOpen(false);
    }
  }, [setActiveSection, screenSize]);

  // Handle visualization toggle for mobile
  const handleVisualizationToggle = useCallback(() => {
    setVisualizationState({
      isVisible: !workspaceState.visualizationState.isVisible
    });
  }, [workspaceState.visualizationState.isVisible, setVisualizationState]);

  // Auto-save functionality
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasUnsavedChanges = Object.keys(workspaceState.unsavedChanges).length > 0;
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [workspaceState.unsavedChanges]);

  const renderMobileHeader = () => (
    <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Toggle navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Control Structure
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleVisualizationToggle}
          className={`p-2 rounded-lg transition-colors ${
            workspaceState.visualizationState.isVisible
              ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          aria-label="Toggle diagram"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        
        <button
          onClick={saveWorkspaceState}
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );

  const renderDesktopLayout = () => (
    <div className="h-[calc(100vh-200px)] flex overflow-hidden -m-6 md:-m-8 rounded-xl">
      {/* Navigation Sidebar */}
      <div className="flex-shrink-0">
        <WorkspaceNavigation
          activeSection={workspaceState.activeSection}
          onSectionChange={handleSectionChange}
          getSectionStatus={getSectionStatus}
          getSectionDataCount={getSectionDataCount}
          workspaceState={workspaceState}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-w-0 h-full">
        <div className="flex-1">
          <WorkspaceContent
            activeSection={workspaceState.activeSection}
            markUnsavedChanges={markUnsavedChanges}
          />
        </div>

        {/* Visualization Panel */}
        {workspaceState.visualizationState.isVisible && (
          <div className={`
            border-l border-slate-200 dark:border-slate-700 overflow-hidden
            ${workspaceState.visualizationState.layout === 'sidebar' ? 'w-1/2' : 'w-full'}
          `}>
            <WorkspaceVisualization
              visualizationState={workspaceState.visualizationState}
              onVisualizationStateChange={setVisualizationState}
              analysisData={analysisData}
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderMobileLayout = () => (
    <div className="h-screen flex flex-col">
      {renderMobileHeader()}
      
      {/* Mobile Navigation Drawer */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileNavOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-80 max-w-sm">
            <WorkspaceNavigation
              activeSection={workspaceState.activeSection}
              onSectionChange={handleSectionChange}
              getSectionStatus={getSectionStatus}
              getSectionDataCount={getSectionDataCount}
              workspaceState={workspaceState}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {workspaceState.visualizationState.isVisible && 
         workspaceState.visualizationState.layout === 'overlay' ? (
          <div className="h-full">
            <WorkspaceVisualization
              visualizationState={workspaceState.visualizationState}
              onVisualizationStateChange={setVisualizationState}
              analysisData={analysisData}
            />
          </div>
        ) : (
          <WorkspaceContent
            activeSection={workspaceState.activeSection}
            markUnsavedChanges={markUnsavedChanges}
          />
        )}
      </div>
    </div>
  );

  // Render appropriate layout based on screen size
  if (screenSize === 'mobile') {
    return renderMobileLayout();
  }

  return renderDesktopLayout();
};

export default ControlStructureWorkspace;