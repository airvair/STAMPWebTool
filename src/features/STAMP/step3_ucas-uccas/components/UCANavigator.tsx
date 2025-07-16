import React, { useMemo } from 'react';
import { Controller, ControlAction, UnsafeControlAction, UCCA } from '@/types/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface UCANavigatorProps {
  controllers: Controller[];
  controlActions: ControlAction[];
  selectedController: string | null;
  selectedControlAction: string | null;
  onSelectController: (id: string | null) => void;
  onSelectControlAction: (id: string | null) => void;
  ucaCoverage: UnsafeControlAction[];
  uccaCoverage: UCCA[];
}

interface ControllerCoverage {
  controller: Controller;
  controlActions: ControlAction[];
  ucaCount: number;
  coveragePercentage: number;
  missingTypes: Map<string, string[]>;
}

const UCA_TYPES = [
  'not-provided',
  'provided',
  'too-early',
  'too-late',
  'wrong-order',
  'too-long',
  'too-short'
] as const;

const UCANavigator: React.FC<UCANavigatorProps> = ({
  controllers,
  controlActions,
  selectedController,
  selectedControlAction,
  onSelectController,
  onSelectControlAction,
  ucaCoverage,
  uccaCoverage
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
        const missing = UCA_TYPES.filter(type => !coveredTypes.has(type));
        
        if (missing.length > 0) {
          missingTypes.set(action.id, missing);
        }
      });

      // Calculate coverage percentage
      const totalPossible = ctrlActions.length * UCA_TYPES.length;
      const coveragePercentage = totalPossible > 0 
        ? Math.round((ctrlUCAs.length / totalPossible) * 100)
        : 0;

      return {
        controller,
        controlActions: ctrlActions,
        ucaCount: ctrlUCAs.length,
        coveragePercentage,
        missingTypes
      };
    });
  }, [controllers, controlActions, ucaCoverage]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const totalUCAs = ucaCoverage.length;
    const totalUCCAs = uccaCoverage.length;
    const totalPossible = controlActions.length * UCA_TYPES.length;
    const overallCoverage = totalPossible > 0 
      ? Math.round((totalUCAs / totalPossible) * 100)
      : 0;

    return {
      totalUCAs,
      totalUCCAs,
      overallCoverage
    };
  }, [ucaCoverage, uccaCoverage, controlActions]);

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Control Structure
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Select a controller or action to analyze
          </p>
        </div>

        {/* Overall Statistics */}
        <Card className="p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Overall Coverage</span>
            <span className="font-medium">{overallStats.overallCoverage}%</span>
          </div>
          <Progress value={overallStats.overallCoverage} className="h-1.5" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{overallStats.totalUCAs} UCAs</span>
            <span>{overallStats.totalUCCAs} UCCAs</span>
          </div>
        </Card>
      </div>

      <Separator />

      {/* Controller List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {controllerCoverage.map(({ controller, controlActions: ctrlActions, ucaCount, coveragePercentage, missingTypes }) => {
            const isExpanded = expandedControllers.has(controller.id);
            const isSelected = selectedController === controller.id;
            const hasActions = ctrlActions.length > 0;

            return (
              <div key={controller.id}>
                <div
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                    isSelected 
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={() => handleControllerClick(controller.id)}
                >
                  {hasActions && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleController(controller.id);
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {controller.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs px-1.5 py-0"
                      >
                        {controller.ctrlType}
                      </Badge>
                    </div>
                    
                    {hasActions && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={coveragePercentage} 
                          className="h-1 flex-1"
                        />
                        <span className="text-xs text-gray-500">
                          {coveragePercentage}%
                        </span>
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
                  <div className="ml-6 mt-1 space-y-1">
                    {ctrlActions.map(action => {
                      const actionSelected = selectedControlAction === action.id;
                      const missingForAction = missingTypes.get(action.id) || [];
                      const hasUCAs = ucaCoverage.some(uca => 
                        uca.controlActionId === action.id
                      );

                      return (
                        <div
                          key={action.id}
                          className={cn(
                            "flex items-center gap-2 p-2 pl-4 rounded-md cursor-pointer text-sm transition-colors",
                            actionSelected
                              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                          onClick={() => handleActionClick(controller.id, action.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="truncate">
                              {action.verb} {action.object}
                            </div>
                            {missingForAction.length > 0 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {missingForAction.length} types missing
                              </div>
                            )}
                          </div>
                          
                          {hasUCAs ? (
                            missingForAction.length === 0 ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />
                            )
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer Help */}
      <div className="p-4">
        <div className="text-xs text-gray-500 space-y-1">
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