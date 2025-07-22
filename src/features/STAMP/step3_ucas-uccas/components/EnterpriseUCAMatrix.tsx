import React, { useMemo, useState } from 'react';
import { Controller, ControlAction, UnsafeControlAction, UCAType } from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  BarChart3,
  AlertCircle,
  TrendingUp,
  Shield,
  Clock,
  HelpCircle,
  Layers,
  Eye,
  EyeOff
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


const UCA_TYPES: { value: UCAType; label: string; shortLabel: string; colorClass: string; borderColorClass: string; textColorClass: string; bgGradient: string; iconColorClass: string; group: string; description: string }[] = [
  { 
    value: UCAType.NotProvided, 
    label: 'Not Provided', 
    shortLabel: 'NP', 
    colorClass: 'bg-red-100 dark:bg-red-900/20',
    borderColorClass: 'border-red-400 dark:border-red-600',
    textColorClass: 'text-red-700 dark:text-red-400',
    bgGradient: 'from-red-500/20 to-red-600/20',
    iconColorClass: 'text-red-500',
    group: 'provision',
    description: 'Control action is not provided when required'
  },
  { 
    value: UCAType.ProvidedUnsafe, 
    label: 'Provided', 
    shortLabel: 'P', 
    colorClass: 'bg-orange-100 dark:bg-orange-900/20',
    borderColorClass: 'border-orange-400 dark:border-orange-600',
    textColorClass: 'text-orange-700 dark:text-orange-400',
    bgGradient: 'from-orange-500/20 to-orange-600/20',
    iconColorClass: 'text-orange-500',
    group: 'provision',
    description: 'Control action is provided but causes hazard'
  },
  { 
    value: UCAType.TooEarly, 
    label: 'Too Early', 
    shortLabel: 'TE', 
    colorClass: 'bg-yellow-100 dark:bg-yellow-900/20',
    borderColorClass: 'border-yellow-400 dark:border-yellow-600',
    textColorClass: 'text-yellow-700 dark:text-yellow-400',
    bgGradient: 'from-yellow-500/20 to-yellow-600/20',
    iconColorClass: 'text-yellow-500',
    group: 'timing',
    description: 'Control action provided before conditions are met'
  },
  { 
    value: UCAType.TooLate, 
    label: 'Too Late', 
    shortLabel: 'TL', 
    colorClass: 'bg-amber-100 dark:bg-amber-900/20',
    borderColorClass: 'border-amber-400 dark:border-amber-600',
    textColorClass: 'text-amber-700 dark:text-amber-400',
    bgGradient: 'from-amber-500/20 to-amber-600/20',
    iconColorClass: 'text-amber-500',
    group: 'timing',
    description: 'Control action provided after deadline'
  },
  { 
    value: UCAType.WrongOrder, 
    label: 'Wrong Order', 
    shortLabel: 'WO', 
    colorClass: 'bg-purple-100 dark:bg-purple-900/20',
    borderColorClass: 'border-purple-400 dark:border-purple-600',
    textColorClass: 'text-purple-700 dark:text-purple-400',
    bgGradient: 'from-purple-500/20 to-purple-600/20',
    iconColorClass: 'text-purple-500',
    group: 'timing',
    description: 'Control action provided out of sequence'
  },
  { 
    value: UCAType.TooLong, 
    label: 'Applied Too Long', 
    shortLabel: 'ATL', 
    colorClass: 'bg-blue-100 dark:bg-blue-900/20',
    borderColorClass: 'border-blue-400 dark:border-blue-600',
    textColorClass: 'text-blue-700 dark:text-blue-400',
    bgGradient: 'from-blue-500/20 to-blue-600/20',
    iconColorClass: 'text-blue-500',
    group: 'duration',
    description: 'Control action applied for excessive duration'
  },
  { 
    value: UCAType.TooShort, 
    label: 'Too Short', 
    shortLabel: 'TS', 
    colorClass: 'bg-indigo-100 dark:bg-indigo-900/20',
    borderColorClass: 'border-indigo-400 dark:border-indigo-600',
    textColorClass: 'text-indigo-700 dark:text-indigo-400',
    bgGradient: 'from-indigo-500/20 to-indigo-600/20',
    iconColorClass: 'text-indigo-500',
    group: 'duration',
    description: 'Control action stopped before completion'
  }
];

// Define UCA groups for the matrix header
const UCA_GROUPS = [
  {
    id: 'provision',
    label: 'Provision',
    icon: Shield,
    types: UCA_TYPES.filter(t => t.group === 'provision'),
    borderClass: 'border-red-200 dark:border-red-800',
    bgClass: 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20',
    iconClass: 'text-red-600 dark:text-red-400'
  },
  {
    id: 'timing',
    label: 'Timing & Sequence',
    icon: Clock,
    types: UCA_TYPES.filter(t => t.group === 'timing'),
    borderClass: 'border-yellow-200 dark:border-yellow-800',
    bgClass: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20',
    iconClass: 'text-yellow-600 dark:text-yellow-400'
  },
  {
    id: 'duration',
    label: 'Duration',
    icon: Activity,
    types: UCA_TYPES.filter(t => t.group === 'duration'),
    borderClass: 'border-blue-200 dark:border-blue-800',
    bgClass: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20',
    iconClass: 'text-blue-600 dark:text-blue-400'
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
  const [viewMode] = useState<'compact' | 'detailed' | 'analytics'>('analytics');
  const [filterController, setFilterController] = useState<string>('');
  const [filterUCAType, setFilterUCAType] = useState<string>('');
  const [showOnlyAnalyzed, setShowOnlyAnalyzed] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const { notApplicableStatuses, addNotApplicableStatus, removeNotApplicableStatus } = useAnalysisContext();

  const isMarkedAsNA = (controllerId: string, controlActionId: string, ucaType: UCAType) => {
    return notApplicableStatuses.some(
      status => status.controllerId === controllerId && 
                status.controlActionId === controlActionId && 
                status.ucaType === ucaType
    );
  };

  // Enhanced filter logic
  const filteredData = useMemo(() => {
    let filteredControllers = controllers;
    let filteredActions = controlActions;
    
    if (selectedController) {
      filteredControllers = controllers.filter(c => c.id === selectedController);
    }
    
    if (filterController) {
      filteredControllers = filteredControllers.filter(c => 
        c.name.toLowerCase().includes(filterController.toLowerCase())
      );
    }
    
    filteredActions = filteredActions.filter(ca => 
      filteredControllers.some(c => c.id === ca.controllerId)
    );
    
    return { controllers: filteredControllers, actions: filteredActions };
  }, [controllers, controlActions, selectedController, filterController]);

  // Build the analysis matrix with enhanced data
  const { matrix, statistics, maxUCACount, riskMetrics } = useMemo(() => {
    const matrixData: UCAMatrixCell[][] = [];
    let totalCells = 0;
    let analyzedCells = 0;
    let totalUCAs = 0;
    let maxCount = 0;
    
    // Use filtered data
    const relevantControllers = filteredData.controllers;
    const relevantActions = filteredData.actions;

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
          
          const isNA = isMarkedAsNA(controller.id, action.id, ucaType.value);
          
          if (matchingUCAs.length > 0 || isNA) {
            analyzedCells++;
            totalUCAs += matchingUCAs.length;
            maxCount = Math.max(maxCount, matchingUCAs.length);
          }
          
          return {
            controllerId: controller.id,
            controlActionId: action.id,
            ucaType: ucaType.value,
            status: isNA ? 'not-applicable' : (matchingUCAs.length > 0 ? 'analyzed' : 'not-analyzed'),
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

    // Calculate risk metrics
    const riskDistribution = UCA_TYPES.reduce((acc, type) => {
      acc[type.value] = ucas.filter(uca => uca.ucaType === type.value).length;
      return acc;
    }, {} as Record<UCAType, number>);

    const highRiskCells = matrixData.flat().filter(cell => cell.ucaCount >= 3).length;
    const mediumRiskCells = matrixData.flat().filter(cell => cell.ucaCount === 2).length;
    const lowRiskCells = matrixData.flat().filter(cell => cell.ucaCount === 1).length;

    return {
      matrix: matrixData,
      statistics: {
        totalCells,
        analyzedCells,
        totalUCAs,
        completionRate,
        averageUCAsPerCell: analyzedCells > 0 ? (totalUCAs / analyzedCells).toFixed(1) : '0'
      },
      maxUCACount: maxCount,
      riskMetrics: {
        distribution: riskDistribution,
        highRisk: highRiskCells,
        mediumRisk: mediumRiskCells,
        lowRisk: lowRiskCells
      }
    };
  }, [filteredData, ucas, filterUCAType, showOnlyAnalyzed, notApplicableStatuses]);

  const getControllerName = (id: string) => {
    return controllers.find(c => c.id === id)?.name || 'Unknown';
  };

  const getControlActionName = (id: string) => {
    const action = controlActions.find(ca => ca.id === id);
    return action ? `${action.verb} ${action.object}` : 'Unknown';
  };

  const handleCellClick = (cell: UCAMatrixCell) => {
    if (cell.status === 'not-applicable') {
      // Do nothing for N/A cells - the Remove N/A button handles its own click
      return;
    }
    // Always create new UCA when clicking on a cell (whether it has existing UCAs or not)
    onCreateUCA(cell.ucaType, cell.controllerId, cell.controlActionId);
  };

  const handleMarkAsNA = (cell: UCAMatrixCell) => {
    const isCurrentlyNA = isMarkedAsNA(cell.controllerId, cell.controlActionId, cell.ucaType);
    
    if (isCurrentlyNA) {
      // Remove N/A status
      removeNotApplicableStatus({
        controllerId: cell.controllerId,
        controlActionId: cell.controlActionId,
        ucaType: cell.ucaType
      });
    } else {
      // Add N/A status
      addNotApplicableStatus({
        controllerId: cell.controllerId,
        controlActionId: cell.controlActionId,
        ucaType: cell.ucaType
      });
    }
  };

  const getCellIntensity = (count: number) => {
    if (count === 0) return 0;
    return Math.min((count / maxUCACount) * 100, 100);
  };

  const getRiskLevel = (count: number) => {
    if (count >= 3) return { level: 'high', color: 'red' };
    if (count === 2) return { level: 'medium', color: 'amber' };
    if (count === 1) return { level: 'low', color: 'yellow' };
    return { level: 'none', color: 'gray' };
  };

  const renderCell = (cell: UCAMatrixCell, ucaTypeInfo: typeof UCA_TYPES[0]) => {
    const isHovered = hoveredCell === `${cell.controllerId}-${cell.controlActionId}-${cell.ucaType}`;
    const intensity = getCellIntensity(cell.ucaCount);
    const riskLevel = getRiskLevel(cell.ucaCount);

    return (
      <div
        className={cn(
          "relative group transition-all duration-300",
          viewMode === 'analytics' && cell.status === 'analyzed' && "transform-gpu"
        )}
        onMouseEnter={() => setHoveredCell(`${cell.controllerId}-${cell.controlActionId}-${cell.ucaType}`)}
        onMouseLeave={() => setHoveredCell(null)}
      >
        <button
          onClick={() => handleCellClick(cell)}
          className={cn(
            "w-14 h-11 lg:w-16 lg:h-12",
            "rounded-xl flex flex-col items-center justify-center transition-all duration-300",
            "border-2 backdrop-blur-sm relative overflow-hidden group",
            cell.status === 'analyzed' 
              ? viewMode === 'analytics' && riskLevel.level !== 'none'
                ? cn(
                    "border-2",
                    riskLevel.color === 'red' && "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border-red-400 dark:border-red-600",
                    riskLevel.color === 'amber' && "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/40 border-amber-400 dark:border-amber-600",
                    riskLevel.color === 'yellow' && "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/40 border-yellow-400 dark:border-yellow-600"
                  )
                : "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 border-emerald-300 dark:border-emerald-700"
              : cell.status === 'not-applicable'
              ? "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-40"
              : "bg-white dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 border-dashed hover:border-solid",
            isHovered && cell.status !== 'not-applicable' && "scale-110 shadow-2xl z-20 border-3",
            cell.status === 'analyzed' && !isHovered && "hover:shadow-lg hover:scale-105"
          )}
        >
          {/* Analytics mode gradient overlay */}
          {viewMode === 'analytics' && cell.status === 'analyzed' && intensity > 0 && (
            <div 
              className="absolute inset-0 transition-all duration-500 opacity-0 group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle at center, ${ucaTypeInfo.bgGradient.replace('/20', `/${Math.min(intensity * 0.8, 60)}`)} 0%, transparent 70%)`
              }}
            />
          )}

          {/* Risk indicator bar */}
          {cell.status === 'analyzed' && cell.ucaCount > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r opacity-80" 
              style={{
                background: riskLevel.level === 'high' 
                  ? 'linear-gradient(to right, #dc2626, #ef4444)'
                  : riskLevel.level === 'medium'
                  ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                  : 'linear-gradient(to right, #84cc16, #22c55e)'
              }}
            />
          )}

          {/* Cell content */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
            {cell.status === 'analyzed' ? (
              <>
                <div className={cn(
                  "w-7 h-7 lg:w-8 lg:h-8",
                  "rounded-full flex items-center justify-center",
                  "bg-white dark:bg-gray-900 shadow-md border",
                  riskLevel.level === 'high' && "border-red-300 dark:border-red-700",
                  riskLevel.level === 'medium' && "border-amber-300 dark:border-amber-700",
                  riskLevel.level === 'low' && "border-yellow-300 dark:border-yellow-700",
                  riskLevel.level === 'none' && "border-emerald-300 dark:border-emerald-700"
                )}>
                  {riskLevel.level === 'high' ? (
                    <AlertCircle className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", "text-red-600 dark:text-red-400")} />
                  ) : (
                    <Check className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", "text-emerald-600 dark:text-emerald-400")} />
                  )}
                </div>
                <span className={cn(
                  "font-bold",
                  "text-xs",
                  riskLevel.level === 'high' && "text-red-700 dark:text-red-300",
                  riskLevel.level === 'medium' && "text-amber-700 dark:text-amber-300",
                  riskLevel.level === 'low' && "text-yellow-700 dark:text-yellow-300",
                  riskLevel.level === 'none' && "text-emerald-700 dark:text-emerald-300"
                )}>
                  {cell.ucaCount}
                </span>
              </>
            ) : cell.status === 'not-applicable' ? (
              <div className="flex flex-col items-center gap-0.5">
                <X className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", "text-gray-400")} />
                {isHovered && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsNA(cell);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium cursor-pointer relative z-10",
                      "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
                      "text-gray-600 dark:text-gray-400",
                      "transition-all duration-200 border border-gray-300 dark:border-gray-600"
                    )}
                  >
                    Remove N/A
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-all duration-300">
                <div className={cn(
                  "w-7 h-7 lg:w-8 lg:h-8",
                  "rounded-full flex items-center justify-center",
                  "bg-white dark:bg-gray-900 border-2 border-dashed transition-all duration-300",
                  "group-hover:border-solid group-hover:scale-110 group-hover:shadow-md",
                  ucaTypeInfo.borderColorClass
                )}>
                  <Plus className={cn(
                    "h-3.5 w-3.5 lg:h-4 lg:w-4",
                    ucaTypeInfo.iconColorClass,
                    "transition-transform duration-300 group-hover:rotate-90"
                  )} />
                </div>
                {isHovered && (
                  <div className="flex gap-2 items-center">
                    <span className={cn(
                      "text-gray-500 dark:text-gray-400 font-medium",
                      "text-xs",
                      "transition-opacity duration-300"
                    )}>
                      Add
                    </span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsNA(cell);
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium cursor-pointer",
                        "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
                        "text-gray-600 dark:text-gray-400",
                        "transition-all duration-200 border border-gray-300 dark:border-gray-600"
                      )}
                    >
                      N/A
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hover effect with glow */}
          {isHovered && cell.status !== 'not-applicable' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
              <div className={cn(
                "absolute -inset-1 rounded-xl opacity-30 blur-md transition-opacity duration-300",
                cell.status === 'analyzed' && riskLevel.level === 'high' && "bg-red-400",
                cell.status === 'analyzed' && riskLevel.level === 'medium' && "bg-amber-400",
                cell.status === 'analyzed' && riskLevel.level === 'low' && "bg-yellow-400",
                cell.status === 'analyzed' && riskLevel.level === 'none' && "bg-emerald-400",
                cell.status === 'not-analyzed' && "bg-gray-400"
              )} />
            </>
          )}
        </button>
      </div>
    );
  };


  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50/50 via-gray-50/30 to-zinc-50/20 dark:from-slate-950/50 dark:via-gray-950/30 dark:to-zinc-950/20">
      {/* Header with statistics */}
      <div className="p-3 lg:p-6 pb-0">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="p-2 lg:p-3 rounded-xl lg:rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
              <Layers className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                UCA Risk Analysis Matrix
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                <span>Comprehensive safety analysis across all control actions</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">This matrix shows all potential Unsafe Control Actions (UCAs) organized by controller, control action, and UCA type. Click on cells to add or view UCAs.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Filter popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 font-medium">
                  <Filter className="h-4 w-4" />
                  Filters
                  {(filterController || filterUCAType || showOnlyAnalyzed) && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5">
                      {[filterController, filterUCAType, showOnlyAnalyzed].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Filter Options</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="filter-controller" className="text-xs font-medium">Controller Name</Label>
                      <Input
                        id="filter-controller"
                        placeholder="Search controllers..."
                        value={filterController}
                        onChange={(e) => setFilterController(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="filter-uca-type" className="text-xs font-medium">UCA Type</Label>
                      <Select value={filterUCAType} onValueChange={setFilterUCAType}>
                        <SelectTrigger id="filter-uca-type" className="mt-1">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All types</SelectItem>
                          {UCA_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", type.colorClass)}>
                                  {type.shortLabel}
                                </span>
                                {type.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-analyzed" className="text-xs font-medium">Show only analyzed</Label>
                      <input
                        id="show-analyzed"
                        type="checkbox"
                        checked={showOnlyAnalyzed}
                        onChange={(e) => setShowOnlyAnalyzed(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setFilterController('');
                        setFilterUCAType('');
                        setShowOnlyAnalyzed(false);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Legend toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              className="gap-2"
            >
              {showLegend ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Statistics Cards with enhanced styling */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3 mb-4 lg:mb-6">
          {/* Total Cells */}
          <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/70 dark:border-gray-800/70 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="p-3 lg:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 group-hover:scale-110 transition-transform">
                  <Grid3x3 className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.totalCells}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Matrix Cells
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gray-400 to-gray-500" />
          </Card>

          {/* Analyzed Cells */}
          <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/70 dark:border-gray-800/70 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="p-3 lg:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800 dark:to-emerald-700 group-hover:scale-110 transition-transform">
                  <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Analyzed</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {statistics.analyzedCells}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Completed
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500" />
          </Card>

          {/* Total UCAs */}
          <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/70 dark:border-gray-800/70 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="p-3 lg:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 group-hover:scale-110 transition-transform">
                  <AlertCircle className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">UCAs</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {statistics.totalUCAs}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Identified
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-400 to-blue-500" />
          </Card>

          {/* Risk Distribution */}
          <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/70 dark:border-gray-800/70 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="p-3 lg:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-700 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Risk</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {riskMetrics.highRisk}
                </p>
                <span className="text-xs text-gray-500">/</span>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {riskMetrics.mediumRisk}
                </p>
                <span className="text-xs text-gray-500">/</span>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {riskMetrics.lowRisk}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                H / M / L
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-400 via-amber-400 to-yellow-400" />
          </Card>

          {/* Average per Cell */}
          <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/70 dark:border-gray-800/70 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="p-3 lg:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-700 group-hover:scale-110 transition-transform">
                  <Activity className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                </div>
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Average</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {statistics.averageUCAsPerCell}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Per Cell
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-400 to-purple-500" />
          </Card>

          {/* Completion Progress */}
          <Card className="relative overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-gray-200/70 dark:border-gray-800/70 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="p-3 lg:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-800 dark:to-indigo-700 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-4 w-4 text-indigo-700 dark:text-indigo-300" />
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {statistics.completionRate}%
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Completion
                </p>
                <Progress value={statistics.completionRate} className="h-2" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-400 to-indigo-500" />
          </Card>
        </div>
      </div>

      {/* Matrix Container */}
      <div className="flex-1 px-3 lg:px-6 pb-3 lg:pb-6">
        <Card className="h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl border-gray-200/80 dark:border-gray-800/80 overflow-hidden">
          {/* Matrix Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Control Action Matrix</h4>
                <Badge variant="secondary" className="text-xs">
                  {matrix.length} Control Actions × {UCA_TYPES.length} UCA Types
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Click cells to add new UCAs</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>Use chevron to view existing UCAs</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>Hover for details</span>
              </div>
            </div>
          </div>
          
          <div className="h-[calc(100%-4rem)] overflow-auto">
            <div className="p-4 lg:p-6 min-w-fit">
              <table className="w-full border-separate border-spacing-1 table-auto">
                <thead className="sticky top-0 z-30 bg-white dark:bg-gray-900">
                  {/* Group headers row */}
                  <tr>
                    <th rowSpan={2} className="sticky left-0 z-40 bg-white dark:bg-gray-900 p-2 lg:p-4 rounded-tl-lg">
                      <div className="flex flex-col items-start gap-0.5 lg:gap-1">
                        <span className="text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1 lg:gap-2">
                          <Shield className="h-3 w-3 lg:h-4 lg:w-4 text-gray-500" />
                          <span className="hidden sm:inline">Controller</span>
                          <span className="sm:hidden">Ctrl</span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="hidden sm:inline">Control Action</span>
                          <span className="sm:hidden">Action</span>
                        </span>
                      </div>
                    </th>
                    {UCA_GROUPS.map(group => {
                      const GroupIcon = group.icon;
                      return (
                        <th 
                          key={group.id} 
                          colSpan={group.types.length}
                          className="p-2"
                        >
                          <div className={cn(
                            "mx-0.5 lg:mx-1 rounded-lg lg:rounded-xl border-2 px-2 lg:px-4 py-1.5 lg:py-2.5 shadow-sm",
                            group.borderClass,
                            group.bgClass,
                            "backdrop-blur-sm"
                          )}>
                            <div className="flex items-center justify-center gap-1 lg:gap-2">
                              <GroupIcon className={cn("h-3 w-3 lg:h-4 lg:w-4", group.iconClass)} />
                              <span className="text-[10px] lg:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <span className="hidden lg:inline">{group.label}</span>
                                <span className="lg:hidden">{group.label.split(' ')[0]}</span>
                              </span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                  {/* Individual UCA type headers row */}
                  <tr>
                    {UCA_TYPES.map(type => (
                      <th key={type.value} className="p-1 lg:p-2 pb-2 lg:pb-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-1 lg:gap-1.5 cursor-help">
                                <div className={cn(
                                  "px-2 lg:px-3 py-1 lg:py-1.5 rounded-md lg:rounded-lg text-[10px] lg:text-xs font-bold shadow-sm border",
                                  type.colorClass,
                                  type.borderColorClass,
                                  type.textColorClass,
                                  "hover:scale-105 transition-transform"
                                )}>
                                  {type.shortLabel}
                                </div>
                                <div className="h-px w-6 lg:w-8 bg-gradient-to-r opacity-50" 
                                  style={{
                                    background: `linear-gradient(to right, transparent, ${type.iconColorClass.replace('text-', 'rgb(var(--')})}, transparent)`
                                  }}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{type.label}</p>
                                <p className="text-xs text-gray-400">{type.description}</p>
                              </div>
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
                    const hasAnalyzedCells = row.some(cell => cell.status === 'analyzed');
                  
                    return (
                      <React.Fragment key={rowIdx}>
                        <tr className={cn(
                          "transition-colors duration-200",
                          isExpanded && "bg-blue-50/30 dark:bg-blue-900/10"
                        )}>
                          <td className="sticky left-0 z-20 bg-white dark:bg-gray-900 p-2 lg:p-3 border-r border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-2 lg:gap-3">
                              <button
                                onClick={() => {
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
                                  "p-1 lg:p-1.5 rounded-lg transition-all duration-200",
                                  hasAnalyzedCells
                                    ? "hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm"
                                    : "opacity-30 cursor-default"
                                )}
                              >
                                <ChevronRight className={cn(
                                  "h-3 w-3 lg:h-4 lg:w-4 text-gray-500 transition-transform duration-200",
                                  isExpanded && "rotate-90"
                                )} />
                              </button>
                              <div className="flex flex-col items-start min-w-0">
                                <span className="text-xs lg:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] lg:max-w-[200px]">
                                  {controllerName}
                                </span>
                                <span className="text-[10px] lg:text-xs text-gray-600 dark:text-gray-400 flex items-center gap-0.5 lg:gap-1 truncate max-w-[120px] lg:max-w-[200px]">
                                  <ChevronRight className="h-2.5 w-2.5 lg:h-3 lg:w-3 flex-shrink-0" />
                                  {actionName}
                                </span>
                              </div>
                              {hasAnalyzedCells && (
                                <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
                                  {row.filter(cell => cell.status === 'analyzed').length}
                                </Badge>
                              )}
                            </div>
                          </td>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="p-0.5 lg:p-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      {renderCell(cell, UCA_TYPES[cellIdx])}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-sm">
                                    {cell.status === 'analyzed' ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold">{cell.ucaCount} UCA{cell.ucaCount !== 1 ? 's' : ''} Identified</p>
                                          {getRiskLevel(cell.ucaCount).level !== 'none' && (
                                            <Badge variant="secondary" className="text-xs">
                                              {getRiskLevel(cell.ucaCount).level} risk
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-400 space-y-1">
                                          <p>Type: {UCA_TYPES[cellIdx].label}</p>
                                          <p>Click to add another {UCA_TYPES[cellIdx].label} UCA</p>
                                          <p>Use chevron to {isExpanded ? 'hide' : 'view'} existing UCAs</p>
                                        </div>
                                      </div>
                                    ) : cell.status === 'not-applicable' ? (
                                      <p className="text-sm">Not applicable for this control action</p>
                                    ) : (
                                      <div className="space-y-1">
                                        <p className="font-semibold">Not Analyzed</p>
                                        <p className="text-xs text-gray-400">Click to add {UCA_TYPES[cellIdx].label} UCA</p>
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
                              <div className="bg-gradient-to-r from-blue-50/20 to-purple-50/20 dark:from-blue-900/10 dark:to-purple-900/10 border-y border-gray-200 dark:border-gray-800">
                                <div className="p-6 space-y-4">
                                  {row.filter(cell => cell.status === 'analyzed' && cell.ucas.length > 0).map((cell, idx) => {
                                    const ucaType = UCA_TYPES.find(t => t.value === cell.ucaType)!;
                                    return (
                                      <div key={idx} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "px-2.5 py-1 rounded-lg text-xs font-bold",
                                            ucaType.colorClass,
                                            ucaType.textColorClass
                                          )}>
                                            {ucaType.shortLabel}
                                          </div>
                                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {ucaType.label}
                                          </span>
                                          <Badge variant="outline" className="text-xs ml-auto">
                                            {cell.ucas.length} UCA{cell.ucas.length !== 1 ? 's' : ''}
                                          </Badge>
                                        </div>
                                        <div className="grid gap-2 ml-8">
                                          {cell.ucas.map((uca, ucaIdx) => (
                                            <Card 
                                              key={ucaIdx}
                                              className="p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer group"
                                            >
                                              <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0">
                                                  <div className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                                                    {uca.code}
                                                  </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {uca.description}
                                                  </p>
                                                  {uca.context && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                                                      Context: {uca.context}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </Card>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  {row.filter(cell => cell.status === 'analyzed').length === 0 && (
                                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                      <p className="text-sm">No UCAs defined for this control action yet.</p>
                                    </div>
                                  )}
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
          </div>
        </Card>
      </div>

      {/* Legend and Help Section */}
      {showLegend && (
        <div className="px-6 pb-6">
          <Card className="bg-gradient-to-r from-gray-50/50 to-gray-100/30 dark:from-gray-900/50 dark:to-gray-800/30 border-gray-200/50 dark:border-gray-700/50">
            <div className="p-3 lg:p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Legend & Quick Reference
                </h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLegend(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Cell States */}
                <div className="space-y-3">
                  <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Cell States</h6>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center shadow-sm">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyzed</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">UCAs identified</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-white dark:bg-gray-900/20 border-2 border-gray-300 dark:border-gray-700 border-dashed flex items-center justify-center">
                        <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Not Analyzed</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click to add</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-800 flex items-center justify-center opacity-40">
                        <X className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">N/A</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Not applicable</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Risk Levels */}
                <div className="space-y-3">
                  <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Risk Levels</h6>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border-2 border-red-400 dark:border-red-600 flex items-center justify-center shadow-sm">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">High</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">≥3 UCAs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/40 border-2 border-amber-400 dark:border-amber-600 flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">2</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Medium</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">2 UCAs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/40 border-2 border-yellow-400 dark:border-yellow-600 flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">1</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Low</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">1 UCA</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* UCA Types */}
                <div className="space-y-3">
                  <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">UCA Types</h6>
                  <div className="space-y-2">
                    {UCA_GROUPS.slice(0, 2).map(group => (
                      <div key={group.id} className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <group.icon className={cn("h-3 w-3", group.iconClass)} />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {group.label}
                          </span>
                        </div>
                        <div className="ml-5 space-y-1">
                          {group.types.map(type => (
                            <div key={type.value} className="flex items-center gap-2">
                              <div className={cn(
                                "px-2 py-0.5 rounded text-xs font-bold",
                                type.colorClass,
                                type.textColorClass
                              )}>
                                {type.shortLabel}
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {type.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Duration Types */}
                <div className="space-y-3">
                  <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Duration</h6>
                  <div className="space-y-2">
                    {UCA_GROUPS[2] && (() => {
                      const durationGroup = UCA_GROUPS[2];
                      const DurationIcon = durationGroup.icon;
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <DurationIcon className={cn("h-3 w-3", durationGroup.iconClass)} />
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              {durationGroup.label}
                            </span>
                          </div>
                          <div className="ml-5 space-y-1">
                            {durationGroup.types.map(type => (
                              <div key={type.value} className="flex items-center gap-2">
                                <div className={cn(
                                  "px-2 py-0.5 rounded text-xs font-bold",
                                  type.colorClass,
                                  type.textColorClass
                                )}>
                                  {type.shortLabel}
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {type.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Quick Tips</h6>
                      <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-1">
                          <span className="text-gray-400">•</span>
                          <span>Click any cell to add new UCAs</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="text-gray-400">•</span>
                          <span>Use chevron (▶) to view existing UCAs</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="text-gray-400">•</span>
                          <span>Hover over cells for quick details</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="text-gray-400">•</span>
                          <span>Use filters to focus on specific areas</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnterpriseUCAMatrix;