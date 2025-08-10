import { ChevronRight, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Controller, ControlAction, UnsafeControlAction, UCAType } from '@/types/types';

interface NotApplicableStatus {
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType;
}

interface UCANavigatorProps {
  controllers: Controller[];
  controlActions: ControlAction[];
  selectedController: string | null;
  selectedControlAction: string | null;
  onSelectController: (id: string | null) => void;
  onSelectControlAction: (id: string | null) => void;
  ucaCoverage: UnsafeControlAction[];
  notApplicableStatuses: NotApplicableStatus[];
}

interface ControllerCoverage {
  controller: Controller;
  controlActions: ControlAction[];
  ucaCount: number;
  coveragePercentage: number;
  missingTypes: Map<string, string[]>;
}

const UCA_TYPES: UCAType[] = [
  UCAType.NotProvided,
  UCAType.ProvidedUnsafe,
  UCAType.TooEarly,
  UCAType.TooLate,
  UCAType.WrongOrder,
  UCAType.TooLong,
  UCAType.TooShort,
];

const UCANavigator: React.FC<UCANavigatorProps> = ({
  controllers,
  controlActions,
  selectedController,
  selectedControlAction,
  onSelectController,
  onSelectControlAction,
  ucaCoverage,
  notApplicableStatuses,
}) => {
  const [expandedControllers, setExpandedControllers] = React.useState<Set<string>>(new Set());

  // Calculate coverage statistics
  const controllerCoverage = useMemo(() => {
    return controllers.map(controller => {
      const ctrlActions = controlActions.filter(ca => ca.controllerId === controller.id);
      const ctrlUCAs = ucaCoverage.filter(uca => uca.controllerId === controller.id);

      // Track which UCA types are missing for each control action
      const missingTypes = new Map<string, string[]>();

      ctrlActions.forEach(action => {
        const actionUCAs = ctrlUCAs.filter(uca => uca.controlActionId === action.id);
        const coveredTypes = new Set(actionUCAs.map(uca => uca.ucaType));

        // Check N/A statuses for this action
        const naTypes = new Set(
          notApplicableStatuses
            .filter(na => na.controllerId === controller.id && na.controlActionId === action.id)
            .map(na => na.ucaType)
        );

        // Consider both UCAs and N/A statuses as covered
        const allCoveredTypes = new Set([...coveredTypes, ...naTypes]);
        const missing = UCA_TYPES.filter(type => !allCoveredTypes.has(type));

        if (missing.length > 0) {
          missingTypes.set(action.id, missing);
        }
      });

      // Calculate coverage percentage including N/A statuses
      const naCount = notApplicableStatuses.filter(na => na.controllerId === controller.id).length;
      const totalCovered = ctrlUCAs.length + naCount;
      const totalPossible = ctrlActions.length * UCA_TYPES.length;
      const coveragePercentage =
        totalPossible > 0 ? Math.round((totalCovered / totalPossible) * 100) : 0;

      return {
        controller,
        controlActions: ctrlActions,
        ucaCount: ctrlUCAs.length,
        coveragePercentage,
        missingTypes,
      };
    });
  }, [controllers, controlActions, ucaCoverage, notApplicableStatuses]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalUCAs = ucaCoverage.length;
    const totalNAs = notApplicableStatuses.length;
    const totalPossible = controlActions.length * UCA_TYPES.length;
    const totalCovered = totalUCAs + totalNAs;
    const overallCoverage =
      totalPossible > 0 ? Math.round((totalCovered / totalPossible) * 100) : 0;

    return {
      totalUCAs,
      overallCoverage,
    };
  }, [ucaCoverage, controlActions, notApplicableStatuses]);

  const toggleController = (controllerId: string) => {
    const newExpanded = new Set(expandedControllers);
    if (newExpanded.has(controllerId)) {
      newExpanded.delete(controllerId);
    } else {
      newExpanded.add(controllerId);
    }
    setExpandedControllers(newExpanded);
  };

  const handleControllerClick = (controllerId: string) => {
    if (selectedController === controllerId) {
      onSelectController(null);
      onSelectControlAction(null);
    } else {
      onSelectController(controllerId);
      onSelectControlAction(null);
    }
  };

  const handleActionClick = (controllerId: string, actionId: string) => {
    onSelectController(controllerId);
    if (selectedControlAction === actionId) {
      onSelectControlAction(null);
    } else {
      onSelectControlAction(actionId);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Control Structure
          </h3>
          <p className="mt-1 text-xs text-gray-500">Select a controller or action to analyze</p>
        </div>

        {/* Overall Statistics */}
        <Card className="space-y-2 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Overall Coverage</span>
            <span className="font-medium">{overallStats.overallCoverage}%</span>
          </div>
          <Progress value={overallStats.overallCoverage} className="h-1.5" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{overallStats.totalUCAs} UCAs</span>
          </div>
        </Card>
      </div>

      <Separator />

      {/* Controller List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {controllerCoverage.map(
            ({
              controller,
              controlActions: ctrlActions,
              ucaCount,
              coveragePercentage,
              missingTypes,
            }) => {
              const isExpanded = expandedControllers.has(controller.id);
              const isSelected = selectedController === controller.id;
              const hasActions = ctrlActions.length > 0;

              return (
                <div key={controller.id}>
                  <div
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors',
                      isSelected
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                    onClick={() => handleControllerClick(controller.id)}
                  >
                    {hasActions && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleController(controller.id);
                        }}
                        className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{controller.name}</span>
                        <Badge variant="outline" className="px-1.5 py-0 text-xs">
                          {controller.ctrlType}
                        </Badge>
                      </div>

                      {hasActions && (
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={coveragePercentage} className="h-1 flex-1" />
                          <span className="text-xs text-gray-500">{coveragePercentage}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {coveragePercentage === 100 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : coveragePercentage > 0 ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      ) : null}
                    </div>
                  </div>

                  {/* Control Actions */}
                  {isExpanded && hasActions && (
                    <div className="mt-1 ml-6 space-y-1">
                      {ctrlActions.map(action => {
                        const actionSelected = selectedControlAction === action.id;
                        const missingForAction = missingTypes.get(action.id) || [];
                        const hasUCAs = ucaCoverage.some(uca => uca.controlActionId === action.id);

                        return (
                          <div
                            key={action.id}
                            className={cn(
                              'flex cursor-pointer items-center gap-2 rounded-md p-2 pl-4 text-sm transition-colors',
                              actionSelected
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            )}
                            onClick={() => handleActionClick(controller.id, action.id)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate">
                                {action.verb} {action.object}
                              </div>
                              {missingForAction.length > 0 && (
                                <div className="mt-0.5 text-xs text-gray-500">
                                  {missingForAction.length} types missing
                                </div>
                              )}
                            </div>

                            {hasUCAs ? (
                              missingForAction.length === 0 ? (
                                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-yellow-600" />
                              )
                            ) : (
                              <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer Help */}
      <div className="p-4">
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Complete coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-yellow-600" />
            <span>Partial coverage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-300" />
            <span>No analysis yet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UCANavigator;
