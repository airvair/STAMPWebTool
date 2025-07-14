import { 
  WrenchScrewdriverIcon, 
  ExclamationTriangleIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon,
  FunnelIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
import React, { useState, useMemo } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { groupControllersByLevel } from '@/utils/controlStructureHierarchy';
import { mapHardwareToControllers } from '@/utils/hardwareUCAIntegration';
import Button from '../shared/Button';

// Import phase components
import GuidedUCAWorkflow from './GuidedUCAWorkflow';
import GuidedUCCAWorkflow from './GuidedUCCAWorkflow';
import HardwareAnalysis from './HardwareAnalysis';
import ScopeManagement from './ScopeManagement';

export enum WorkflowPhase {
  Hardware = 'hardware',
  IndividualUCA = 'individual-uca',
  ControllerUCCA = 'controller-ucca',
  CrossLevelUCCA = 'cross-level-ucca',
  OrganizationalUCCA = 'organizational-ucca',
  ScopeFiltering = 'scope-filtering',
  Complete = 'complete'
}

interface PhaseDefinition {
  id: WorkflowPhase;
  title: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: string;
  prerequisites: WorkflowPhase[];
}

interface WorkflowState {
  currentPhase: WorkflowPhase;
  completedPhases: Set<WorkflowPhase>;
  phaseData: Record<WorkflowPhase, any>;
  currentHierarchyLevel: number | null;
  currentControllerPosition: number;
}

const PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    id: WorkflowPhase.Hardware,
    title: 'Hardware & Electro-Mechanical Analysis',
    description: 'Identify hardware components, failure modes, and unsafe interactions at the foundation level',
    icon: <WrenchScrewdriverIcon className="w-6 h-6" />,
    estimatedTime: '15-30 min',
    prerequisites: []
  },
  {
    id: WorkflowPhase.IndividualUCA,
    title: 'Individual UCA Analysis',
    description: 'Systematic analysis of individual control actions for unsafe conditions',
    icon: <ExclamationTriangleIcon className="w-6 h-6" />,
    estimatedTime: '20-45 min',
    prerequisites: [WorkflowPhase.Hardware]
  },
  {
    id: WorkflowPhase.ControllerUCCA,
    title: 'Controller-Level UCCA Analysis',
    description: 'Identify unsafe combinations between controllers at the same hierarchy level',
    icon: <UserGroupIcon className="w-6 h-6" />,
    estimatedTime: '15-25 min',
    prerequisites: [WorkflowPhase.IndividualUCA]
  },
  {
    id: WorkflowPhase.CrossLevelUCCA,
    title: 'Cross-Level UCCA Analysis',
    description: 'Analyze unsafe combinations between different hierarchy levels',
    icon: <ArrowRightIcon className="w-6 h-6" />,
    estimatedTime: '10-20 min',
    prerequisites: [WorkflowPhase.ControllerUCCA]
  },
  {
    id: WorkflowPhase.OrganizationalUCCA,
    title: 'Organizational UCCA Analysis',
    description: 'Department and role-based unsafe combination analysis',
    icon: <BuildingOfficeIcon className="w-6 h-6" />,
    estimatedTime: '10-15 min',
    prerequisites: [WorkflowPhase.CrossLevelUCCA]
  },
  {
    id: WorkflowPhase.ScopeFiltering,
    title: 'Scope Filtering & Validation',
    description: 'Final review and filtering of UCAs/UCCAs based on analysis scope',
    icon: <FunnelIcon className="w-6 h-6" />,
    estimatedTime: '5-10 min',
    prerequisites: [WorkflowPhase.OrganizationalUCCA]
  }
];

const GuidedWorkflowOrchestrator: React.FC = () => {
  const { 
    controllers, 
    controlActions, 
    controlPaths, 
    systemComponents,
    hardwareComponents,
    failureModes,
    ucas,
    uccas
  } = useAnalysis();

  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentPhase: WorkflowPhase.Hardware,
    completedPhases: new Set(),
    phaseData: {
      [WorkflowPhase.Hardware]: {},
      [WorkflowPhase.IndividualUCA]: {},
      [WorkflowPhase.ControllerUCCA]: {},
      [WorkflowPhase.CrossLevelUCCA]: {},
      [WorkflowPhase.OrganizationalUCCA]: {},
      [WorkflowPhase.ScopeFiltering]: {},
      [WorkflowPhase.Complete]: {}
    },
    currentHierarchyLevel: null,
    currentControllerPosition: 0
  });

  // Get hierarchy information
  const hierarchyLevels = useMemo(() => 
    groupControllersByLevel(controllers, controlPaths, systemComponents),
    [controllers, controlPaths, systemComponents]
  );

  // Generate hardware-to-controller mappings
  const hardwareMappings = useMemo(() => 
    mapHardwareToControllers(controllers, controlActions, hardwareComponents, failureModes),
    [controllers, controlActions, hardwareComponents, failureModes]
  );

  const totalControllers = controllers.length;
  const totalControlActions = controlActions.filter(ca => !ca.isOutOfScope).length;

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalPhases = PHASE_DEFINITIONS.length;
    const completedCount = workflowState.completedPhases.size;
    const currentPhaseProgress = getCurrentPhaseProgress();
    
    return ((completedCount + currentPhaseProgress) / totalPhases) * 100;
  }, [workflowState.completedPhases, workflowState.currentPhase]);

  function getCurrentPhaseProgress(): number {
    switch (workflowState.currentPhase) {
      case WorkflowPhase.Hardware:
        return hardwareComponents.length > 0 ? 0.5 : 0;
      case WorkflowPhase.IndividualUCA: {
        const totalCombinations = totalControlActions * 7; // 7 UCA types
        const completedUCAs = ucas.length;
        return Math.min(completedUCAs / Math.max(totalCombinations, 1), 1);
      }
      case WorkflowPhase.ControllerUCCA:
      case WorkflowPhase.CrossLevelUCCA:
      case WorkflowPhase.OrganizationalUCCA:
        return uccas.length > 0 ? 0.7 : 0;
      case WorkflowPhase.ScopeFiltering:
        return 0.8;
      default:
        return 0;
    }
  }

  const moveToNextPhase = () => {
    const currentIndex = PHASE_DEFINITIONS.findIndex(p => p.id === workflowState.currentPhase);
    if (currentIndex < PHASE_DEFINITIONS.length - 1) {
      const nextPhase = PHASE_DEFINITIONS[currentIndex + 1];
      setWorkflowState(prev => ({
        ...prev,
        currentPhase: nextPhase.id,
        completedPhases: new Set([...prev.completedPhases, prev.currentPhase])
      }));
    } else {
      setWorkflowState(prev => ({
        ...prev,
        currentPhase: WorkflowPhase.Complete,
        completedPhases: new Set([...prev.completedPhases, prev.currentPhase])
      }));
    }
  };

  const canAdvanceToNextPhase = (phaseId: WorkflowPhase): boolean => {
    switch (phaseId) {
      case WorkflowPhase.Hardware:
        return hardwareComponents.length > 0;
      case WorkflowPhase.IndividualUCA:
        return ucas.length > 0;
      case WorkflowPhase.ControllerUCCA:
      case WorkflowPhase.CrossLevelUCCA:
      case WorkflowPhase.OrganizationalUCCA:
        return true; // These can be skipped if no UCCAs are identified
      case WorkflowPhase.ScopeFiltering:
        return true;
      default:
        return false;
    }
  };

  const renderPhaseContent = () => {
    switch (workflowState.currentPhase) {
      case WorkflowPhase.Hardware:
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Hardware Analysis Phase
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Start at the foundation level by identifying hardware components, their failure modes, 
                and potential unsafe interactions. This analysis informs the subsequent UCA analysis.
              </p>
            </div>
            
            {/* Hardware-Controller Mapping Preview */}
            {hardwareMappings.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  Hardware-Controller Analysis Preview
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hardwareMappings.slice(0, 6).map(mapping => (
                    <div key={mapping.controllerId} className="bg-white dark:bg-blue-800/30 p-3 rounded border">
                      <div className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                        {controllers.find(c => c.id === mapping.controllerId)?.name}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        {mapping.relatedHardwareComponents.length} hardware components
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        {mapping.criticalFailureModes.length} critical failures
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-300">
                        {mapping.recommendedUCAs.length} UCA suggestions
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-3">
                  Hardware analysis will generate suggested UCAs based on failure modes. 
                  These suggestions will appear during the individual UCA analysis phase.
                </p>
              </div>
            )}
            
            <HardwareAnalysis />
          </div>
        );

      case WorkflowPhase.IndividualUCA:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Individual UCA Analysis Phase
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Systematic bottom-up analysis of individual control actions. We&apos;ll move through controllers 
                laterally at each hierarchy level, then progress upward.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-medium">Hierarchy Levels:</span> {hierarchyLevels.length}
                </div>
                <div>
                  <span className="font-medium">Total Controllers:</span> {totalControllers}
                </div>
                <div>
                  <span className="font-medium">Control Actions:</span> {totalControlActions}
                </div>
              </div>
            </div>
            <GuidedUCAWorkflow hardwareMappings={hardwareMappings} />
          </div>
        );

      case WorkflowPhase.ControllerUCCA:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Controller-Level UCCA Analysis Phase
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Identify unsafe combinations of control actions between controllers at the same hierarchy level. 
                Focus on coordination failures and conflicting actions.
              </p>
            </div>
            <GuidedUCCAWorkflow 
              workflowLevel="controller" 
              availableControllers={controllers.filter(c => c.ctrlType !== 'O')}
            />
          </div>
        );

      case WorkflowPhase.CrossLevelUCCA:
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                Cross-Level UCCA Analysis Phase
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Analyze unsafe combinations between different hierarchy levels. Focus on authority gaps, 
                overlaps, and coordination issues between supervisory and operational controllers.
              </p>
            </div>
            <GuidedUCCAWorkflow 
              workflowLevel="cross-level" 
              availableControllers={controllers.filter(c => c.ctrlType !== 'O')}
            />
          </div>
        );

      case WorkflowPhase.OrganizationalUCCA:
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
                Organizational UCCA Analysis Phase
              </h4>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Examine department and role-based unsafe combinations. Focus on policy conflicts, 
                resource allocation issues, and organizational coordination failures.
              </p>
            </div>
            <GuidedUCCAWorkflow 
              workflowLevel="organizational" 
              availableControllers={controllers.filter(c => c.ctrlType === 'O')}
            />
          </div>
        );

      case WorkflowPhase.ScopeFiltering:
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Scope Filtering & Validation Phase
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Final review and filtering of identified UCAs and UCCAs. Consider interactions between 
                apparently unrelated items before eliminating them from the analysis scope.
              </p>
            </div>
            <ScopeManagement />
          </div>
        );

      case WorkflowPhase.Complete:
        return (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Analysis Complete!
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              You have completed all phases of the guided UCA/UCCA analysis workflow.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{hardwareComponents.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Hardware Components</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{ucas.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">UCAs Identified</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{uccas.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">UCCAs Identified</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">{hierarchyLevels.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Hierarchy Levels</div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown phase</div>;
    }
  };

  if (controllers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-300">
          No controllers defined. Please complete Step 3 before proceeding with guided analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall Progress Header */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Comprehensive UCA/UCCA Analysis Workflow
          </h2>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {Math.round(overallProgress)}% Complete
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Phase Pills */}
        <div className="flex flex-wrap gap-2">
          {PHASE_DEFINITIONS.map((phase) => {
            const isCompleted = workflowState.completedPhases.has(phase.id);
            const isCurrent = workflowState.currentPhase === phase.id;
            const isAccessible = phase.prerequisites.every(req => workflowState.completedPhases.has(req));

            return (
              <div
                key={phase.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  isCompleted
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    : isCurrent
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 ring-2 ring-blue-300'
                    : isAccessible
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="w-4 h-4" />
                ) : (
                  phase.icon
                )}
                <span>{phase.title}</span>
                {isCurrent && <span className="text-xs">({phase.estimatedTime})</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Phase Content */}
      <div className="min-h-96">
        {renderPhaseContent()}
      </div>

      {/* Navigation Controls */}
      {workflowState.currentPhase !== WorkflowPhase.Complete && (
        <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-700">
          <div>
            <h4 className="font-medium text-slate-800 dark:text-slate-100">
              Current Phase: {PHASE_DEFINITIONS.find(p => p.id === workflowState.currentPhase)?.title}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {PHASE_DEFINITIONS.find(p => p.id === workflowState.currentPhase)?.description}
            </p>
          </div>
          
          <Button
            onClick={moveToNextPhase}
            disabled={!canAdvanceToNextPhase(workflowState.currentPhase)}
            rightIcon={<ArrowRightIcon className="w-5 h-5" />}
          >
            {workflowState.currentPhase === PHASE_DEFINITIONS[PHASE_DEFINITIONS.length - 1].id 
              ? 'Complete Analysis' 
              : 'Continue to Next Phase'
            }
          </Button>
        </div>
      )}
    </div>
  );
};

export default GuidedWorkflowOrchestrator;