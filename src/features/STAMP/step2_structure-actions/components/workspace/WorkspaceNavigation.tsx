import React from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { WORKSPACE_SECTIONS, WorkspaceState } from './hooks/useWorkspaceState';

interface WorkspaceNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  getSectionStatus: (sectionId: string, data: any) => 'empty' | 'in-progress' | 'completed' | 'blocked';
  getSectionDataCount: (sectionId: string, data: any) => number;
  workspaceState: WorkspaceState;
}

type SectionStatus = 'empty' | 'in-progress' | 'completed' | 'blocked';

const StatusIcon: React.FC<{ status: SectionStatus; count?: number }> = ({ status, count }) => {
  const baseClasses = "w-5 h-5 flex-shrink-0";
  
  switch (status) {
    case 'completed':
      return (
        <svg className={`${baseClasses} text-green-600`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.7a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      );
    case 'in-progress':
      return (
        <div className={`${baseClasses} relative`}>
          <svg className="w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-13a1 1 0 112 0v4a1 1 0 01-1 1H8a1 1 0 110-2h1V5z" clipRule="evenodd" />
          </svg>
          {count !== undefined && count > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-sky-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </div>
      );
    case 'blocked':
      return (
        <svg className={`${baseClasses} text-amber-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    default: // empty
      return (
        <svg className={`${baseClasses} text-slate-400 dark:text-slate-500`} fill="none" stroke="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" strokeWidth="2" />
        </svg>
      );
  }
};

const DependencyMessage: React.FC<{ section: typeof WORKSPACE_SECTIONS[0]; status: SectionStatus }> = ({ 
  section, 
  status 
}) => {
  if (status !== 'blocked') return null;

  const dependencyNames = section.dependencies.map(depId => 
    WORKSPACE_SECTIONS.find(s => s.id === depId)?.title
  ).filter(Boolean);

  return (
    <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
      Requires: {dependencyNames.join(', ')}
    </div>
  );
};

const WorkspaceNavigation: React.FC<WorkspaceNavigationProps> = ({
  activeSection,
  onSectionChange,
  getSectionStatus,
  getSectionDataCount,
  workspaceState
}) => {
  const analysisData = useAnalysis();

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Control Structure
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Build your safety control structure
        </p>
      </div>

      {/* Overall Progress */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {WORKSPACE_SECTIONS.filter(section => 
              getSectionStatus(section.id, analysisData) === 'completed'
            ).length}/{WORKSPACE_SECTIONS.length}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-sky-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(WORKSPACE_SECTIONS.filter(section => 
                getSectionStatus(section.id, analysisData) === 'completed'
              ).length / WORKSPACE_SECTIONS.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Section Navigation */}
      <nav className="flex-1 p-2" aria-label="Control structure sections">
        <ul className="space-y-1">
          {WORKSPACE_SECTIONS.map((section) => {
            const status = getSectionStatus(section.id, analysisData);
            const count = getSectionDataCount(section.id, analysisData);
            const isActive = activeSection === section.id;
            const isClickable = status !== 'blocked';
            const hasUnsavedChanges = workspaceState.unsavedChanges[section.id];

            return (
              <li key={section.id}>
                <button
                  onClick={() => isClickable && onSectionChange(section.id)}
                  disabled={!isClickable}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-500 text-sky-800 dark:text-sky-200' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }
                    ${!isClickable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    ${hasUnsavedChanges ? 'ring-2 ring-amber-400/50' : ''}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  title={!isClickable ? `Blocked: requires ${section.dependencies.join(', ')}` : section.description}
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon status={status} count={count} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${isActive ? 'text-sky-800 dark:text-sky-200' : ''}`}>
                          {section.title}
                        </span>
                        {hasUnsavedChanges && (
                          <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" title="Unsaved changes" />
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${isActive ? 'text-sky-700 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {section.description}
                      </p>
                      <DependencyMessage section={section} status={status} />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => {/* TODO: Add save functionality */}}
          className="w-full px-3 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors duration-200"
        >
          Save Progress
        </button>
        {Object.keys(workspaceState.unsavedChanges).length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
            You have unsaved changes
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkspaceNavigation;