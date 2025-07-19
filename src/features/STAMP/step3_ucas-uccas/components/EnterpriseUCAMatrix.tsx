import React, { useMemo, useState } from 'react';
import { Controller, ControlAction, UnsafeControlAction, UCAType } from '@/types/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Check, 
  X, 
  Plus, 
  ChevronRight, 
  Grid3x3,
  Filter,
  Download,
  Search,
  Zap,
  Activity,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnterpriseUCAMatrixProps {
  controllers: Controller[];
  controlActions: ControlAction[];
  ucas: UnsafeControlAction[];
  selectedController: string | null;
  onSelectControlAction: (id: string) => void;
  onCreateUCA: (ucaType?: UCAType, controllerId?: string, controlActionId?: string) => void;
}

const UCA_TYPES: { value: UCAType; label: string; shortLabel: string; colorClass: string; borderColorClass: string; textColorClass: string }[] = [
  { 
    value: UCAType.NotProvided, 
    label: 'Not Provided', 
    shortLabel: 'NP', 
    colorClass: 'bg-red-100 dark:bg-red-900/20',
    borderColorClass: 'border-red-400 dark:border-red-600',
    textColorClass: 'text-red-700 dark:text-red-400'
  },
  { 
    value: UCAType.ProvidedUnsafe, 
    label: 'Provided', 
    shortLabel: 'P', 
    colorClass: 'bg-orange-100 dark:bg-orange-900/20',
    borderColorClass: 'border-orange-400 dark:border-orange-600',
    textColorClass: 'text-orange-700 dark:text-orange-400'
  },
  { 
    value: UCAType.TooEarly, 
    label: 'Too Early', 
    shortLabel: 'TE', 
    colorClass: 'bg-yellow-100 dark:bg-yellow-900/20',
    borderColorClass: 'border-yellow-400 dark:border-yellow-600',
    textColorClass: 'text-yellow-700 dark:text-yellow-400'
  },
  { 
    value: UCAType.TooLate, 
    label: 'Too Late', 
    shortLabel: 'TL', 
    colorClass: 'bg-amber-100 dark:bg-amber-900/20',
    borderColorClass: 'border-amber-400 dark:border-amber-600',
    textColorClass: 'text-amber-700 dark:text-amber-400'
  },
  { 
    value: UCAType.WrongOrder, 
    label: 'Wrong Order', 
    shortLabel: 'WO', 
    colorClass: 'bg-purple-100 dark:bg-purple-900/20',
    borderColorClass: 'border-purple-400 dark:border-purple-600',
    textColorClass: 'text-purple-700 dark:text-purple-400'
  },
  { 
    value: UCAType.TooLong, 
    label: 'Too Long', 
    shortLabel: 'TLo', 
    colorClass: 'bg-blue-100 dark:bg-blue-900/20',
    borderColorClass: 'border-blue-400 dark:border-blue-600',
    textColorClass: 'text-blue-700 dark:text-blue-400'
  },
  { 
    value: UCAType.TooShort, 
    label: 'Too Short', 
    shortLabel: 'TS', 
    colorClass: 'bg-indigo-100 dark:bg-indigo-900/20',
    borderColorClass: 'border-indigo-400 dark:border-indigo-600',
    textColorClass: 'text-indigo-700 dark:text-indigo-400'
  }
];

interface UCAMatrixCell {
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType;
  status: 'analyzed' | 'not-analyzed' | 'not-applicable';
  ucaCount: number;
  ucas: UnsafeControlAction[];
}

const EnterpriseUCAMatrix: React.FC<EnterpriseUCAMatrixProps> = ({
  controllers,
  controlActions,
  ucas,
  selectedController,
  onSelectControlAction,
  onCreateUCA
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'default' | 'heatmap' | 'progress'>('default');

  // Build the analysis matrix with enhanced data
  const { matrix, statistics, maxUCACount } = useMemo(() => {
    const matrixData: UCAMatrixCell[][] = [];
    let totalCells = 0;
    let analyzedCells = 0;
    let totalUCAs = 0;
    let maxCount = 0;
    
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
        const row: UCAMatrixCell[] = UCA_TYPES.map(ucaType => {
          const matchingUCAs = ucas.filter(uca => 
            uca.controllerId === controller.id &&
            uca.controlActionId === action.id &&
            uca.ucaType === ucaType.value
          );

          totalCells++;
          if (matchingUCAs.length > 0) {
            analyzedCells++;
            totalUCAs += matchingUCAs.length;
            maxCount = Math.max(maxCount, matchingUCAs.length);
          }

          return {
            controllerId: controller.id,
            controlActionId: action.id,
            ucaType: ucaType.value,
            status: matchingUCAs.length > 0 ? 'analyzed' : 'not-analyzed',
            ucaCount: matchingUCAs.length,
            ucas: matchingUCAs
          };
        });
        
        matrixData.push(row);
      });
    });

    const completionRate = totalCells > 0 
      ? Math.round((analyzedCells / totalCells) * 100)
      : 0;

    return {
      matrix: matrixData,
      statistics: {
        totalCells,
        analyzedCells,
        totalUCAs,
        completionRate,
        averageUCAsPerCell: analyzedCells > 0 ? (totalUCAs / analyzedCells).toFixed(1) : '0'
      },
      maxUCACount: maxCount
    };
  }, [controllers, controlActions, ucas, selectedController]);

  const getControllerName = (id: string) => {
    return controllers.find(c => c.id === id)?.name || 'Unknown';
  };

  const getControlActionName = (id: string) => {
    const action = controlActions.find(ca => ca.id === id);
    return action ? `${action.verb} ${action.object}` : 'Unknown';
  };

  const handleCellClick = (cell: UCAMatrixCell) => {
    if (cell.status === 'analyzed' && cell.ucas.length > 0) {
      // Toggle expanded state for analyzed cells
      const rowKey = `${cell.controllerId}-${cell.controlActionId}`;
      const newExpanded = new Set(expandedRows);
      if (newExpanded.has(rowKey)) {
        newExpanded.delete(rowKey);
      } else {
        newExpanded.add(rowKey);
      }
      setExpandedRows(newExpanded);
    } else {
      // Create new UCA for not-analyzed cells
      onCreateUCA(cell.ucaType, cell.controllerId, cell.controlActionId);
    }
  };

  const getCellIntensity = (count: number) => {
    if (count === 0) return 0;
    return Math.min((count / maxUCACount) * 100, 100);
  };

  const renderCell = (cell: UCAMatrixCell, ucaTypeInfo: typeof UCA_TYPES[0]) => {
    const isHovered = hoveredCell === `${cell.controllerId}-${cell.controlActionId}-${cell.ucaType}`;
    const intensity = getCellIntensity(cell.ucaCount);

    return (
      <div
        className={cn(
          "relative group transition-all duration-200",
          viewMode === 'heatmap' && cell.status === 'analyzed' && "transform-gpu"
        )}
        onMouseEnter={() => setHoveredCell(`${cell.controllerId}-${cell.controlActionId}-${cell.ucaType}`)}
        onMouseLeave={() => setHoveredCell(null)}
      >
        <button
          onClick={() => handleCellClick(cell)}
          className={cn(
            "w-20 h-16 rounded-lg flex flex-col items-center justify-center transition-all duration-200",
            "border backdrop-blur-sm relative overflow-hidden",
            cell.status === 'analyzed' 
              ? viewMode === 'heatmap'
                ? "border-gray-200 dark:border-gray-700"
                : "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 border-green-200 dark:border-green-800"
              : cell.status === 'not-applicable'
              ? "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-50"
              : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/30 border-gray-300 dark:border-gray-700 border-dashed",
            isHovered && cell.status !== 'not-applicable' && "scale-105 shadow-lg z-10",
            cell.status === 'analyzed' && !isHovered && "hover:shadow-md"
          )}
          disabled={cell.status === 'not-applicable'}
        >
          {/* Heatmap background */}
          {viewMode === 'heatmap' && cell.status === 'analyzed' && (
            <div 
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, rgba(239, 68, 68, ${intensity / 100}) 0%, rgba(234, 179, 8, ${intensity / 100}) 100%)`,
                opacity: 0.8
              }}
            />
          )}

          {/* Progress indicator */}
          {viewMode === 'progress' && cell.status === 'analyzed' && (
            <div className="absolute inset-x-2 bottom-1">
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${intensity}%` }}
                />
              </div>
            </div>
          )}

          {/* Cell content */}
          <div className="relative z-10">
            {cell.status === 'analyzed' ? (
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  "bg-white/80 dark:bg-gray-900/80 shadow-sm"
                )}>
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {cell.ucaCount}
                </span>
              </div>
            ) : cell.status === 'not-applicable' ? (
              <X className="h-5 w-5 text-gray-400" />
            ) : (
              <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  "bg-white/60 dark:bg-gray-900/60 border-2 border-dashed",
                  ucaTypeInfo.borderColorClass
                )}>
                  <Plus className={cn("h-4 w-4", ucaTypeInfo.textColorClass)} />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Add
                </span>
              </div>
            )}
          </div>

          {/* Hover effect */}
          {isHovered && cell.status !== 'not-applicable' && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-gradient-to-br from-gray-50/50 to-gray-100/30 dark:from-gray-950/50 dark:to-gray-900/30">
      {/* Header with statistics */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              UCA Analysis Matrix
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive safety analysis across all control actions
            </p>
          </div>
          
          {/* View mode toggles */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-gray-900 rounded-lg p-1 shadow-sm">
              <Button
                variant={viewMode === 'default' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('default')}
                className="gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                Default
              </Button>
              <Button
                variant={viewMode === 'heatmap' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('heatmap')}
                className="gap-2"
              >
                <Activity className="h-4 w-4" />
                Heat Map
              </Button>
              <Button
                variant={viewMode === 'progress' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('progress')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Progress
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Cells
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {statistics.totalCells}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Grid3x3 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Analyzed
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {statistics.analyzedCells}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total UCAs
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {statistics.totalUCAs}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg per Cell
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {statistics.averageUCAsPerCell}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completion
                </p>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {statistics.completionRate}%
                </span>
              </div>
              <Progress value={statistics.completionRate} className="h-2" />
            </div>
          </Card>
        </div>
      </div>

      {/* Matrix */}
      <Card className="flex-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Controller
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Control Action
                      </span>
                    </div>
                  </th>
                  {UCA_TYPES.map(type => (
                    <th key={type.value} className="p-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium",
                                type.colorClass,
                                type.textColorClass
                              )}>
                                {type.shortLabel}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{type.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, rowIdx) => {
                  const firstCell = row[0];
                  const controllerName = getControllerName(firstCell.controllerId);
                  const actionName = getControlActionName(firstCell.controlActionId);
                  const rowKey = `${firstCell.controllerId}-${firstCell.controlActionId}`;
                  const isExpanded = expandedRows.has(rowKey);
                  
                  return (
                    <React.Fragment key={rowIdx}>
                      <tr className={cn(
                        "border-t border-gray-100 dark:border-gray-800",
                        isExpanded && "bg-gray-50/50 dark:bg-gray-900/30"
                      )}>
                        <td className="sticky left-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                const hasAnalyzedCells = row.some(cell => cell.status === 'analyzed');
                                if (hasAnalyzedCells) {
                                  const newExpanded = new Set(expandedRows);
                                  if (newExpanded.has(rowKey)) {
                                    newExpanded.delete(rowKey);
                                  } else {
                                    newExpanded.add(rowKey);
                                  }
                                  setExpandedRows(newExpanded);
                                }
                              }}
                              className={cn(
                                "p-1 rounded-md transition-colors",
                                row.some(cell => cell.status === 'analyzed')
                                  ? "hover:bg-gray-100 dark:hover:bg-gray-800"
                                  : "opacity-30 cursor-default"
                              )}
                            >
                              <ChevronRight className={cn(
                                "h-4 w-4 text-gray-500 transition-transform",
                                isExpanded && "rotate-90"
                              )} />
                            </button>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {controllerName}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {actionName}
                              </span>
                            </div>
                          </div>
                        </td>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    {renderCell(cell, UCA_TYPES[cellIdx])}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {cell.status === 'analyzed' ? (
                                    <div>
                                      <p className="font-medium">{cell.ucaCount} UCA(s) defined</p>
                                      <p className="text-xs text-gray-400">Click to view details</p>
                                    </div>
                                  ) : cell.status === 'not-applicable' ? (
                                    <p>Not applicable</p>
                                  ) : (
                                    <div>
                                      <p className="font-medium">Not analyzed</p>
                                      <p className="text-xs text-gray-400">Click to add UCA</p>
                                    </div>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Expanded row with UCA details */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={UCA_TYPES.length + 1} className="p-0">
                            <div className="bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-800">
                              <div className="p-4 space-y-2">
                                {row.filter(cell => cell.status === 'analyzed').map((cell, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                      {UCA_TYPES.find(t => t.value === cell.ucaType)?.label}:
                                    </div>
                                    {cell.ucas.map((uca, ucaIdx) => (
                                      <div 
                                        key={ucaIdx}
                                        className="ml-4 p-2 bg-white dark:bg-gray-800 rounded-md text-sm border border-gray-200 dark:border-gray-700"
                                      >
                                        <div className="font-mono text-xs text-gray-500 mb-1">{uca.code}</div>
                                        <div className="text-gray-700 dark:text-gray-300">{uca.description}</div>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 border border-green-200 dark:border-green-800 flex items-center justify-center">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-gray-600 dark:text-gray-400">Analyzed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/30 border border-gray-300 dark:border-gray-700 border-dashed flex items-center justify-center">
            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-gray-600 dark:text-gray-400">Not Analyzed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 flex items-center justify-center opacity-50">
            <X className="h-4 w-4 text-gray-400" />
          </div>
          <span className="text-gray-600 dark:text-gray-400">Not Applicable</span>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseUCAMatrix;