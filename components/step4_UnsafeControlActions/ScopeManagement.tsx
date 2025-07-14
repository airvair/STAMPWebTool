import { EyeSlashIcon, EyeIcon, FunnelIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import React, { useState, useMemo } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { ControlAction } from '@/types';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import Modal from '../shared/Modal';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';

interface ScopeFilter {
  id: string;
  name: string;
  description: string;
  active: boolean;
  criteria: FilterCriteria;
}

interface FilterCriteria {
  controllerTypes?: string[];
  operationalPhases?: string[];
  scopeBoundaries?: string[];
  analysisType?: 'CAST' | 'STPA' | 'both';
}

interface OutOfScopeReason {
  type: 'operational-phase' | 'system-boundary' | 'analysis-focus' | 'resource-constraint' | 'other';
  description: string;
}

const ScopeManagement: React.FC = () => {
  const {
    controllers,
    controlActions,
    ucas,
    uccas,
    updateControlAction,
    analysisSession
  } = useAnalysis();

  const [showScopeModal, setShowScopeModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [scopeReason, setScopeReason] = useState<OutOfScopeReason>({
    type: 'operational-phase',
    description: ''
  });

  // Predefined scope filters based on common STPA/CAST scenarios
  const defaultFilters: ScopeFilter[] = [
    {
      id: 'flight-only',
      name: 'Flight Operations Only',
      description: 'Exclude ground operations (taxi, maintenance, etc.)',
      active: false,
      criteria: {
        operationalPhases: ['takeoff', 'cruise', 'approach', 'landing'],
        scopeBoundaries: ['aircraft-systems', 'cockpit-operations']
      }
    },
    {
      id: 'normal-ops',
      name: 'Normal Operations',
      description: 'Exclude emergency and abnormal procedures',
      active: false,
      criteria: {
        operationalPhases: ['normal-operations'],
        scopeBoundaries: ['standard-procedures']
      }
    },
    {
      id: 'automated-systems',
      name: 'Automated Systems Only',
      description: 'Focus on software/automated control actions',
      active: false,
      criteria: {
        controllerTypes: ['S'] // Software controllers only
      }
    },
    {
      id: 'human-factors',
      name: 'Human Factors Focus',
      description: 'Focus on human and team controller actions',
      active: false,
      criteria: {
        controllerTypes: ['H', 'T'] // Human and Team controllers
      }
    },
    {
      id: 'critical-systems',
      name: 'Safety-Critical Systems',
      description: 'Exclude non-safety-critical convenience features',
      active: false,
      criteria: {
        scopeBoundaries: ['flight-critical', 'navigation', 'control-surfaces']
      }
    }
  ];

  const [scopeFilters, setScopeFilters] = useState<ScopeFilter[]>(defaultFilters);

  // Get statistics for scope management
  const scopeStatistics = useMemo(() => {
    const totalControlActions = controlActions.length;
    const inScopeControlActions = controlActions.filter(ca => !ca.isOutOfScope).length;
    const outOfScopeControlActions = totalControlActions - inScopeControlActions;
    
    const totalUCAs = ucas.length;
    const affectedUCAs = ucas.filter(uca => {
      const action = controlActions.find(ca => ca.id === uca.controlActionId);
      return action?.isOutOfScope;
    }).length;
    
    const totalUCCAs = uccas.length;
    const affectedUCCAs = uccas.filter(ucca => {
      return ucca.involvedControllerIds.some(controllerId => {
        const actionsForController = controlActions.filter(ca => 
          ca.controllerId === controllerId && ca.isOutOfScope
        );
        return actionsForController.length > 0;
      });
    }).length;

    return {
      totalControlActions,
      inScopeControlActions,
      outOfScopeControlActions,
      totalUCAs,
      affectedUCAs,
      totalUCCAs,
      affectedUCCAs
    };
  }, [controlActions, ucas, uccas]);

  // Get items that would be affected by current filter selection
  const getAffectedItems = () => {
    const activeFilters = scopeFilters.filter(f => selectedFilters.includes(f.id));
    const affectedControlActions = new Set<string>();
    const affectedControllers = new Set<string>();

    for (const filter of activeFilters) {
      // Check controller type filters
      if (filter.criteria.controllerTypes) {
        controllers.forEach(controller => {
          if (!filter.criteria.controllerTypes!.includes(controller.ctrlType)) {
            affectedControllers.add(controller.id);
          }
        });
      }

      // Check scope boundary filters (simplified heuristic based on action descriptions)
      if (filter.criteria.scopeBoundaries) {
        controlActions.forEach(action => {
          const actionText = `${action.verb} ${action.object} ${action.description}`.toLowerCase();
          const isInScope = filter.criteria.scopeBoundaries!.some(boundary => 
            actionText.includes(boundary.replace('-', ' '))
          );
          
          if (!isInScope && filter.criteria.scopeBoundaries!.length > 0) {
            affectedControlActions.add(action.id);
          }
        });
      }
    }

    // Add actions from affected controllers
    affectedControllers.forEach(controllerId => {
      controlActions.forEach(action => {
        if (action.controllerId === controllerId) {
          affectedControlActions.add(action.id);
        }
      });
    });

    return {
      controlActions: Array.from(affectedControlActions),
      controllers: Array.from(affectedControllers)
    };
  };

  const handleApplyFilters = () => {
    const affected = getAffectedItems();
    
    // Mark affected control actions as out of scope
    affected.controlActions.forEach(actionId => {
      updateControlAction(actionId, { 
        isOutOfScope: true 
      });
    });

    // Reset filter selection
    setSelectedFilters([]);
    setScopeFilters(prev => prev.map(f => ({ ...f, active: false })));
  };

  const handleToggleControlActionScope = (actionId: string, outOfScope: boolean) => {
    updateControlAction(actionId, { isOutOfScope: outOfScope });
  };

  const handleBulkScopeUpdate = (actionIds: string[], outOfScope: boolean) => {
    actionIds.forEach(actionId => {
      updateControlAction(actionId, { isOutOfScope: outOfScope });
    });
  };

  const handleCustomScopeExclusion = () => {
    // Apply custom scope reasoning to selected items
    setShowScopeModal(false);
    setScopeReason({ type: 'operational-phase', description: '' });
  };

  const filterTypeOptions = [
    { value: 'operational-phase', label: 'Operational Phase Exclusion' },
    { value: 'system-boundary', label: 'System Boundary Limitation' },
    { value: 'analysis-focus', label: 'Analysis Focus Area' },
    { value: 'resource-constraint', label: 'Resource/Time Constraint' },
    { value: 'other', label: 'Other Reason' }
  ];

  // Group control actions by controller for better organization
  const controlActionsByController = useMemo(() => {
    const grouped = new Map<string, ControlAction[]>();
    
    controlActions.forEach(action => {
      if (!grouped.has(action.controllerId)) {
        grouped.set(action.controllerId, []);
      }
      grouped.get(action.controllerId)!.push(action);
    });

    return grouped;
  }, [controlActions]);

  const affected = getAffectedItems();

  return (
    <div className="space-y-8">
      {/* Scope Overview */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <FunnelIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Analysis Scope Management
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Manage what&apos;s included in your analysis. Items marked as &quot;out of scope&quot; are excluded from UCA/UCCA 
              identification but remain documented for completeness.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white dark:bg-blue-800/30 p-3 rounded">
                <div className="font-medium text-blue-800 dark:text-blue-200">Control Actions</div>
                <div className="text-blue-600 dark:text-blue-300">
                  {scopeStatistics.inScopeControlActions} in scope / {scopeStatistics.totalControlActions} total
                </div>
              </div>
              <div className="bg-white dark:bg-blue-800/30 p-3 rounded">
                <div className="font-medium text-blue-800 dark:text-blue-200">UCAs</div>
                <div className="text-blue-600 dark:text-blue-300">
                  {scopeStatistics.totalUCAs - scopeStatistics.affectedUCAs} active / {scopeStatistics.totalUCAs} total
                </div>
              </div>
              <div className="bg-white dark:bg-blue-800/30 p-3 rounded">
                <div className="font-medium text-blue-800 dark:text-blue-200">UCCAs</div>
                <div className="text-blue-600 dark:text-blue-300">
                  {scopeStatistics.totalUCCAs - scopeStatistics.affectedUCCAs} active / {scopeStatistics.totalUCCAs} total
                </div>
              </div>
              <div className="bg-white dark:bg-blue-800/30 p-3 rounded">
                <div className="font-medium text-blue-800 dark:text-blue-200">Analysis Type</div>
                <div className="text-blue-600 dark:text-blue-300">
                  {analysisSession?.analysisType || 'Not Set'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Scope Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          Quick Scope Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scopeFilters.map(filter => (
            <div key={filter.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`filter-${filter.id}`}
                  label=""
                  checked={selectedFilters.includes(filter.id)}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedFilters(prev => [...prev, filter.id]);
                    } else {
                      setSelectedFilters(prev => prev.filter(id => id !== filter.id));
                    }
                  }}
                />
                <div className="flex-grow">
                  <h4 className="font-medium text-slate-800 dark:text-slate-100">
                    {filter.name}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {filter.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {selectedFilters.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Filter Preview
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              Applying these filters will mark {affected.controlActions.length} control actions 
              as out of scope.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleApplyFilters}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Apply Filters
              </Button>
              <Button
                onClick={() => setSelectedFilters([])}
                size="sm"
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Scope Management */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Control Actions by Controller
          </h3>
          <Button
            onClick={() => setShowScopeModal(true)}
            size="sm"
            variant="secondary"
          >
            Custom Scope Rules
          </Button>
        </div>

        <div className="space-y-6">
          {Array.from(controlActionsByController.entries()).map(([controllerId, actions]) => {
            const controller = controllers.find(c => c.id === controllerId);
            if (!controller) return null;

            const inScopeCount = actions.filter(a => !a.isOutOfScope).length;
            const outOfScopeCount = actions.length - inScopeCount;

            return (
              <div key={controllerId} className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-100">
                        {controller.name} ({controller.ctrlType})
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {inScopeCount} in scope, {outOfScopeCount} out of scope
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleBulkScopeUpdate(actions.map(a => a.id), false)}
                        size="sm"
                        variant="secondary"
                        leftIcon={<EyeIcon className="w-4 h-4" />}
                      >
                        Include All
                      </Button>
                      <Button
                        onClick={() => handleBulkScopeUpdate(actions.map(a => a.id), true)}
                        size="sm"
                        variant="secondary"
                        leftIcon={<EyeSlashIcon className="w-4 h-4" />}
                      >
                        Exclude All
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  {actions.map(action => (
                    <div key={action.id} className="flex justify-between items-center">
                      <div className="flex-grow">
                        <span className={`font-medium ${action.isOutOfScope ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                          {action.verb} {action.object}
                        </span>
                        {action.description && (
                          <p className={`text-sm ${action.isOutOfScope ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                            {action.description}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleToggleControlActionScope(action.id, !action.isOutOfScope)}
                        size="sm"
                        variant="secondary"
                        leftIcon={action.isOutOfScope ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                      >
                        {action.isOutOfScope ? 'Include' : 'Exclude'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Scope Modal */}
      <Modal
        isOpen={showScopeModal}
        onClose={() => setShowScopeModal(false)}
        title="Custom Scope Management"
      >
        <div className="space-y-4">
          <Select
            label="Exclusion Reason Type"
            value={scopeReason.type}
            onChange={e => setScopeReason(prev => ({ ...prev, type: e.target.value as any }))}
            options={filterTypeOptions}
          />
          
          <Textarea
            label="Detailed Reasoning"
            value={scopeReason.description}
            onChange={e => setScopeReason(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Explain why these items are being excluded from analysis..."
            rows={4}
          />
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
              Scope Management Guidelines
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Document the rationale for scope decisions</li>
              <li>• Consider interactions with excluded items</li>
              <li>• CAST: Focus on accident-related factors</li>
              <li>• STPA: Consider broader system safety requirements</li>
              <li>• Review scope decisions as analysis progresses</li>
            </ul>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCustomScopeExclusion}>
              Apply Custom Rules
            </Button>
            <Button onClick={() => setShowScopeModal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScopeManagement;