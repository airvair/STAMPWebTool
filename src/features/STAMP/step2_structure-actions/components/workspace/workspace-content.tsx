import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load section components for better performance
const SystemComponentsBuilder = React.lazy(() => import('../partials/system-components-builder'));
const ControllersBuilder = React.lazy(() => import('../partials/controllers-builder'));
const ControlPathsBuilder = React.lazy(() => import('../partials/control-paths-builder'));
const FeedbackPathsBuilder = React.lazy(() => import('../partials/feedback-paths-builder'));
const CommunicationLinksBuilder = React.lazy(
  () => import('../partials/communication-links-builder')
);
const FailurePathsBuilder = React.lazy(() => import('../partials/failure-paths-builder'));

interface WorkspaceContentProps {
  activeSection: string;
  markUnsavedChanges: (section: string, hasChanges: boolean) => void;
}

const SectionSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <div className="mt-6 space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-3/4" />
    </div>
    <div className="mt-4 flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ title, description, action }) => (
  <div className="flex h-64 flex-col items-center justify-center p-8 text-center">
    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
      <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
    </div>
    <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">{title}</h3>
    <p className="mb-4 max-w-md text-slate-600 dark:text-slate-400">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="rounded-lg bg-sky-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-sky-700"
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
  <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-sky-100 px-2 py-1 text-sm text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
              {count} item{count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </div>
);

const WorkspaceContent: React.FC<WorkspaceContentProps> = ({ activeSection }) => {
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'components':
        return (
          <div>
            <SectionHeader
              title="System Components"
              description="Define the physical and logical components that make up your system"
              actions={
                <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors duration-200 hover:bg-green-700">
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

      case 'failure-paths':
        return (
          <div>
            <SectionHeader
              title="Failure Paths"
              description="Define failure propagation between system components"
            />
            <Suspense fallback={<SectionSkeleton />}>
              <FailurePathsBuilder />
            </Suspense>
          </div>
        );

      default:
        return (
          <EmptyState
            title="Section Not Found"
            description="The requested section could not be found. Please select a valid section from the navigation."
            action={{
              label: 'Go to Components',
              onClick: () => {
                /* This will be handled by parent */
              },
            }}
          />
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="h-full">
        <div className="p-6">{renderSectionContent()}</div>
      </div>
    </div>
  );
};

export default WorkspaceContent;
