import React, { useMemo } from 'react';
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
  onCreateUCA: (ucaType?: UCAType) => void;
}

const UCA_TYPES: { value: UCAType; label: string; shortLabel: string }[] = [
  { value: 'not-provided', label: 'Not Provided', shortLabel: 'NP' },
  { value: 'provided', label: 'Provided', shortLabel: 'P' },
  { value: 'too-early', label: 'Too Early', shortLabel: 'TE' },
  { value: 'too-late', label: 'Too Late', shortLabel: 'TL' },
  { value: 'wrong-order', label: 'Wrong Order', shortLabel: 'WO' },
  { value: 'too-long', label: 'Too Long', shortLabel: 'TLo' },
  { value: 'too-short', label: 'Too Short', shortLabel: 'TS' }
];

interface UCAAnalysisCell {
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType;
  status: 'analyzed' | 'not-analyzed' | 'not-applicable';
  ucaCount: number;
}

const UCAAnalysis: React.FC<UCAAnalysisProps> = ({
  controllers,
  controlActions,
  ucas,
  selectedController,
  onSelectControlAction,
  onCreateUCA
}) => {
  // Build the analysis matrix
  const analysisMatrix = useMemo(() => {
    const matrix: UCAAnalysisCell[][] = [];
    
    // Filter controllers and actions
    const relevantControllers = selectedController 
      ? controllers.filter(c => c.id === selectedController)
      : controllers;
    
    const relevantActions = controlActions.filter(ca => 
      relevantControllers.some(c => c.id === ca.controllerId)
    );

    // Group actions by controller
    const actionsByController = new Map<string, ControlAction[]>();
    relevantActions.forEach(action => {
      if (!actionsByController.has(action.controllerId)) {
        actionsByController.set(action.controllerId, []);
      }
      actionsByController.get(action.controllerId)!.push(action);
    });

    // Build matrix rows
    relevantControllers.forEach(controller => {
      const controllerActions = actionsByController.get(controller.id) || [];
      
      controllerActions.forEach(action => {
        const row: UCAAnalysisCell[] = UCA_TYPES.map(ucaType => {
          const matchingUCAs = ucas.filter(uca => 
            uca.controllerId === controller.id &&
            uca.controlActionId === action.id &&
            uca.ucaType === ucaType.value
          );

          return {
            controllerId: controller.id,
            controlActionId: action.id,
            ucaType: ucaType.value,
            status: matchingUCAs.length > 0 ? 'analyzed' : 'not-analyzed',
            ucaCount: matchingUCAs.length
          };
        });
        
        matrix.push(row);
      });
    });

    return matrix;
  }, [controllers, controlActions, ucas, selectedController]);

  // Calculate statistics
  const statistics = useMemo(() => {
    let totalCells = 0;
    let analyzedCells = 0;
    let notApplicableCells = 0;

    analysisMatrix.forEach(row => {
      row.forEach(cell => {
        totalCells++;
        if (cell.status === 'analyzed') analyzedCells++;
        if (cell.status === 'not-applicable') notApplicableCells++;
      });
    });

    const completionRate = totalCells > 0 
      ? Math.round((analyzedCells / (totalCells - notApplicableCells)) * 100)
      : 0;

    return {
      totalCells,
      analyzedCells,
      notApplicableCells,
      completionRate
    };
  }, [analysisMatrix]);

  const getControllerName = (id: string) => {
    return controllers.find(c => c.id === id)?.name || 'Unknown';
  };

  const getControlActionName = (id: string) => {
    const action = controlActions.find(ca => ca.id === id);
    return action ? `${action.verb} ${action.object}` : 'Unknown';
  };

  const handleCellClick = (cell: UCAAnalysisCell) => {
    onSelectControlAction(cell.controlActionId);
    // Pass the UCA type from the cell to pre-fill in the editor
    onCreateUCA(cell.ucaType);
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">UCA Analysis</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Systematic analysis of all control action and UCA type combinations
        </p>
        
        {/* Statistics */}
        <Card className="p-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Total Combinations</p>
              <p className="text-2xl font-semibold">{statistics.totalCells}</p>
            </div>
            <div>
              <p className="text-gray-500">Analyzed</p>
              <p className="text-2xl font-semibold text-green-600">{statistics.analyzedCells}</p>
            </div>
            <div>
              <p className="text-gray-500">Remaining</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {statistics.totalCells - statistics.analyzedCells - statistics.notApplicableCells}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Completion</p>
              <p className="text-2xl font-semibold">{statistics.completionRate}%</p>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleCellClick(cell)}
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

      {/* Legend */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <span>Analyzed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/10 rounded border-2 border-dashed border-yellow-400 flex items-center justify-center">
              <Plus className="h-4 w-4 text-yellow-600" />
            </div>
            <span>Not Analyzed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
              <X className="h-4 w-4 text-gray-400" />
            </div>
            <span>Not Applicable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UCAAnalysis;