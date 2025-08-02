import React, { useMemo, useCallback } from 'react';
import { Controller, ControlAction, UnsafeControlAction, UCAType } from '@/types/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Check, X, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UCAAnalysisProps {
  controllers: Controller[];
  controlActions: ControlAction[];
  ucas: UnsafeControlAction[];
  selectedController: string | null;
  onSelectControlAction: (id: string) => void;
  onCreateUCA: (ucaType?: UCAType, controllerId?: string, controlActionId?: string) => void;
}

const UCA_TYPES: { value: UCAType; label: string; shortLabel: string }[] = [
  { value: UCAType.NotProvided, label: 'Not Provided', shortLabel: 'NP' },
  { value: UCAType.ProvidedUnsafe, label: 'Provided', shortLabel: 'P' },
  { value: UCAType.TooEarly, label: 'Too Early', shortLabel: 'TE' },
  { value: UCAType.TooLate, label: 'Too Late', shortLabel: 'TL' },
  { value: UCAType.WrongOrder, label: 'Wrong Order', shortLabel: 'WO' },
  { value: UCAType.TooLong, label: 'Too Long', shortLabel: 'TLo' },
  { value: UCAType.TooShort, label: 'Too Short', shortLabel: 'TS' }
];

interface UCAAnalysisCell {
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType;
  status: 'analyzed' | 'not-analyzed' | 'not-applicable';
  ucaCount: number;
}

// Memoized cell component for better performance
const AnalysisCell = React.memo<{
  cell: UCAAnalysisCell;
  ucaType: typeof UCA_TYPES[0];
  onCellClick: (cell: UCAAnalysisCell) => void;
}>(({ cell, ucaType, onCellClick }) => {
  const handleClick = useCallback(() => {
    onCellClick(cell);
  }, [cell, onCellClick]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              "w-16 h-12 rounded-md flex items-center justify-center transition-colors",
              cell.status === 'analyzed' 
                ? "bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30"
                : cell.status === 'not-applicable'
                ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                : "bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 border-2 border-dashed border-yellow-400"
            )}
            disabled={cell.status === 'not-applicable'}
          >
            {cell.status === 'analyzed' ? (
              <div className="flex flex-col items-center">
                <Check className="h-5 w-5 text-green-600" />
                {cell.ucaCount > 1 && (
                  <span className="text-xs text-green-700 font-medium">
                    {cell.ucaCount}
                  </span>
                )}
              </div>
            ) : cell.status === 'not-applicable' ? (
              <X className="h-5 w-5 text-gray-400" />
            ) : (
              <Plus className="h-5 w-5 text-yellow-600" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {cell.status === 'analyzed' ? (
            <p>{cell.ucaCount} UCA(s) defined</p>
          ) : cell.status === 'not-applicable' ? (
            <p>Not applicable</p>
          ) : (
            <p>Click to analyze this combination</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

AnalysisCell.displayName = 'AnalysisCell';

const UCAAnalysis: React.FC<UCAAnalysisProps> = ({
  controllers,
  controlActions,
  ucas,
  selectedController,
  onSelectControlAction,
  onCreateUCA
}) => {
  // Build the analysis matrix with optimized filtering
  const { analysisMatrix, relevantControllers, relevantActions } = useMemo(() => {
    const matrix: UCAAnalysisCell[][] = [];
    
    // Filter controllers and actions
    const filteredControllers = selectedController 
      ? controllers.filter(c => c.id === selectedController)
      : controllers;
    
    const filteredActions = controlActions.filter(ca => 
      filteredControllers.some(c => c.id === ca.controllerId)
    );

    // Group actions by controller for O(1) lookup
    const actionsByController = new Map<string, ControlAction[]>();
    const ucaLookup = new Map<string, number>();
    
    // Pre-compute UCA counts for faster lookup
    ucas.forEach(uca => {
      const key = `${uca.controllerId}-${uca.controlActionId}-${uca.ucaType}`;
      ucaLookup.set(key, (ucaLookup.get(key) || 0) + 1);
    });
    
    filteredActions.forEach(action => {
      if (!actionsByController.has(action.controllerId)) {
        actionsByController.set(action.controllerId, []);
      }
      actionsByController.get(action.controllerId)!.push(action);
    });

    // Build matrix rows
    filteredControllers.forEach(controller => {
      const controllerActions = actionsByController.get(controller.id) || [];
      
      controllerActions.forEach(action => {
        const row: UCAAnalysisCell[] = UCA_TYPES.map(ucaType => {
          const key = `${controller.id}-${action.id}-${ucaType.value}`;
          const ucaCount = ucaLookup.get(key) || 0;

          return {
            controllerId: controller.id,
            controlActionId: action.id,
            ucaType: ucaType.value,
            status: ucaCount > 0 ? 'analyzed' : 'not-analyzed',
            ucaCount
          };
        });
        
        matrix.push(row);
      });
    });

    return {
      analysisMatrix: matrix,
      relevantControllers: filteredControllers,
      relevantActions: filteredActions
    };
  }, [controllers, controlActions, ucas, selectedController]);

  // Calculate statistics with additional insights
  const statistics = useMemo(() => {
    let totalCells = 0;
    let analyzedCells = 0;
    let notApplicableCells = 0;
    let totalUCAs = 0;
    const ucasByType = new Map<UCAType, number>();

    analysisMatrix.forEach(row => {
      row.forEach(cell => {
        totalCells++;
        if (cell.status === 'analyzed') {
          analyzedCells++;
          totalUCAs += cell.ucaCount;
          ucasByType.set(cell.ucaType, (ucasByType.get(cell.ucaType) || 0) + cell.ucaCount);
        }
        if (cell.status === 'not-applicable') notApplicableCells++;
      });
    });

    const completionRate = totalCells > 0 
      ? Math.round((analyzedCells / (totalCells - notApplicableCells)) * 100)
      : 0;

    // Find most common UCA type
    let mostCommonType: UCAType | null = null;
    let maxCount = 0;
    ucasByType.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    });

    return {
      totalCells,
      analyzedCells,
      notApplicableCells,
      completionRate,
      totalUCAs,
      averageUCAsPerCell: analyzedCells > 0 ? (totalUCAs / analyzedCells).toFixed(1) : '0',
      mostCommonType
    };
  }, [analysisMatrix]);

  // Memoized helper functions
  const getControllerName = useCallback((id: string) => {
    return controllers.find(c => c.id === id)?.name || 'Unknown';
  }, [controllers]);

  const getControlActionName = useCallback((id: string) => {
    const action = controlActions.find(ca => ca.id === id);
    return action ? `${action.verb} ${action.object}` : 'Unknown';
  }, [controlActions]);

  const handleCellClick = useCallback((cell: UCAAnalysisCell) => {
    // Pass the controller, control action, and UCA type from the cell to pre-fill in the editor
    // Don't change the selected control action to keep the view stable
    onCreateUCA(cell.ucaType, cell.controllerId, cell.controlActionId);
  }, [onCreateUCA]);

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">UCA Analysis</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Systematic analysis of all control action and UCA type combinations
        </p>
        
        {/* Enhanced Statistics Card */}
        <Card className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total Combinations</p>
              <p className="text-2xl font-semibold">{statistics.totalCells}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Analyzed</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{statistics.analyzedCells}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {statistics.totalUCAs} total UCAs
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Remaining</p>
              <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                {statistics.totalCells - statistics.analyzedCells - statistics.notApplicableCells}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Avg: {statistics.averageUCAsPerCell} per cell
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Completion</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-semibold">{statistics.completionRate}%</p>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                  <div 
                    className="h-full bg-green-600 dark:bg-green-500 transition-all duration-500"
                    style={{ width: `${statistics.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Matrix */}
      <ScrollArea className="flex-1">
        <div className="inline-block min-w-full">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white dark:bg-gray-950 p-2 text-left">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Controller</span>
                    <span className="text-sm text-gray-500">Control Action</span>
                  </div>
                </th>
                {UCA_TYPES.map(type => (
                  <th key={type.value} className="p-2 text-center w-16">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs">
                            {type.shortLabel}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{type.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysisMatrix.map((row, rowIdx) => {
                const firstCell = row[0];
                const controllerName = getControllerName(firstCell.controllerId);
                const actionName = getControlActionName(firstCell.controlActionId);
                
                return (
                  <tr key={rowIdx} className="border-t">
                    <td className="sticky left-0 z-10 bg-white dark:bg-gray-950 p-2 border-r">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{controllerName}</span>
                        <span className="text-sm text-gray-600">{actionName}</span>
                      </div>
                    </td>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="p-2 text-center">
                        <AnalysisCell 
                          cell={cell} 
                          ucaType={UCA_TYPES[cellIdx]} 
                          onCellClick={handleCellClick}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Enhanced Legend with Quick Actions */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Analyzed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-50 dark:bg-yellow-900/10 rounded border-2 border-dashed border-yellow-400 flex items-center justify-center">
                <Plus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Not Analyzed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                <X className="h-4 w-4 text-gray-400" />
              </div>
              <span className="text-gray-700 dark:text-gray-300">Not Applicable</span>
            </div>
          </div>
          
          {/* Quick action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Find first unanalyzed cell
                for (const row of analysisMatrix) {
                  for (const cell of row) {
                    if (cell.status === 'not-analyzed') {
                      handleCellClick(cell);
                      return;
                    }
                  }
                }
              }}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Analyze Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UCAAnalysis;