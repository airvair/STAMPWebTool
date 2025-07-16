import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load section components for better performance
const SystemComponentsBuilder = React.lazy(() => import('../partials/SystemComponentsBuilder'));
const ControllersBuilder = React.lazy(() => import('../partials/ControllersBuilder'));
const ControlPathsBuilder = React.lazy(() => import('../partials/ControlPathsBuilder'));
const FeedbackPathsBuilder = React.lazy(() => import('../partials/FeedbackPathsBuilder'));
const CommunicationLinksBuilder = React.lazy(() => import('../partials/CommunicationLinksBuilder'));

interface WorkspaceContentProps {
  activeSection: string;
  markUnsavedChanges: (section: string, hasChanges: boolean) => void;
}

const SectionSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <div className="space-y-2 mt-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-3/4" />
    </div>
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

const EmptyState: React.FC<{ 
  title: string; 
  description: string; 
  action?: { label: string; onClick: () => void } 
}> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center p-8">
    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors duration-200"
      >
        {action.label}
      </button>
    )}
  </div>
);

const SectionHeader: React.FC<{ 
  title: string; 
  description: string; 
  count?: number;
  actions?: React.ReactNode;
}> = ({ title, description, count, actions }) => (
  <div className="border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {count !== undefined && count > 0 && (
            <span className="px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 text-sm rounded-full">
              {count} item{count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{description}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  </div>
);

const WorkspaceContent: React.FC<WorkspaceContentProps> = ({
  activeSection
}) => {
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'components':
        return (
          <div>
            <SectionHeader
              title="System Components"
              description="Define the physical and logical components that make up your system"
              actions={
                <button className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
                  Auto-suggest from Hazards
                </button>
              }
            />
            <Suspense fallback={<SectionSkeleton />}>
              <SystemComponentsBuilder />
            </Suspense>
          </div>
        );

      case 'controllers':
        return (
          <div>
            <SectionHeader
              title="Controllers"
              description="Define the entities that control system components (human, software, teams, organizations)"
            />
            <Suspense fallback={<SectionSkeleton />}>
              <ControllersBuilder />
            </Suspense>
          </div>
        );

      case 'control-paths':
        return (
          <div>
            <SectionHeader
              title="Control Paths"
              description="Define command relationships and control actions between controllers and components"
            />
            <Suspense fallback={<SectionSkeleton />}>
              <ControlPathsBuilder />
            </Suspense>
          </div>
        );

      case 'feedback-paths':
        return (
          <div>
            <SectionHeader
              title="Feedback Paths"
              description="Define information flow from components back to controllers"
            />
            <Suspense fallback={<SectionSkeleton />}>
              <FeedbackPathsBuilder />
            </Suspense>
          </div>
        );

      case 'communication':
        return (
          <div>
            <SectionHeader
              title="Communication Links"
              description="Define peer-to-peer communication between controllers"
            />
            <Suspense fallback={<SectionSkeleton />}>
              <CommunicationLinksBuilder />
            </Suspense>
          </div>
        );

      default:
        return (
          <EmptyState
            title="Section Not Found"
            description="The requested section could not be found. Please select a valid section from the navigation."
            action={{
              label: "Go to Components",
              onClick: () => {/* This will be handled by parent */}
            }}
          />
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="h-full">
        <div className="p-6">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceContent;