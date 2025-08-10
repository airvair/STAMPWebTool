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
  EyeOff,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { cn } from '@/lib/utils';
import { Controller, ControlAction, UnsafeControlAction, UCAType } from '@/types/types';

interface EnterpriseUCAMatrixProps {
  controllers: Controller[];
  controlActions: ControlAction[];
  ucas: UnsafeControlAction[];
  selectedController: string | null;
  onSelectControlAction: (id: string) => void;
  onCreateUCA: (ucaType?: UCAType, controllerId?: string, controlActionId?: string) => void;
}

const UCA_TYPES: {
  value: UCAType;
  label: string;
  shortLabel: string;
  colorClass: string;
  borderColorClass: string;
  textColorClass: string;
  bgGradient: string;
  iconColorClass: string;
  group: string;
  description: string;
}[] = [
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
    description: 'Control action is not provided when required',
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
    description: 'Control action is provided but causes hazard',
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
    description: 'Control action provided before conditions are met',
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
    description: 'Control action provided after deadline',
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
    description: 'Control action provided out of sequence',
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
    description: 'Control action applied for excessive duration',
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
    description: 'Control action stopped before completion',
  },
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
    iconClass: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'timing',
    label: 'Timing & Sequence',
    icon: Clock,
    types: UCA_TYPES.filter(t => t.group === 'timing'),
    borderClass: 'border-yellow-200 dark:border-yellow-800',
    bgClass:
      'bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'duration',
    label: 'Duration',
    icon: Activity,
    types: UCA_TYPES.filter(t => t.group === 'duration'),
    borderClass: 'border-blue-200 dark:border-blue-800',
    bgClass:
      'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
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
  onCreateUCA,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [viewMode] = useState<'compact' | 'detailed' | 'analytics'>('analytics');
  const [filterController, setFilterController] = useState<string>('');
  const [filterUCAType, setFilterUCAType] = useState<string>('');
  const [showOnlyAnalyzed, setShowOnlyAnalyzed] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const { notApplicableStatuses, addNotApplicableStatus, removeNotApplicableStatus } =
    useAnalysisContext();

  const isMarkedAsNA = (controllerId: string, controlActionId: string, ucaType: UCAType) => {
    return notApplicableStatuses.some(
      status =>
        status.controllerId === controllerId &&
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
          const matchingUCAs = ucas.filter(
            uca =>
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
            status: isNA ? 'not-applicable' : matchingUCAs.length > 0 ? 'analyzed' : 'not-analyzed',
            ucaCount: matchingUCAs.length,
            ucas: matchingUCAs,
          };
        });

        matrixData.push(row);
      });
    });

    const completionRate = totalCells > 0 ? Math.round((analyzedCells / totalCells) * 100) : 0;

    // Calculate risk metrics
    const riskDistribution = UCA_TYPES.reduce(
      (acc, type) => {
        acc[type.value] = ucas.filter(uca => uca.ucaType === type.value).length;
        return acc;
      },
      {} as Record<UCAType, number>
    );

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
        averageUCAsPerCell: analyzedCells > 0 ? (totalUCAs / analyzedCells).toFixed(1) : '0',
      },
      maxUCACount: maxCount,
      riskMetrics: {
        distribution: riskDistribution,
        highRisk: highRiskCells,
        mediumRisk: mediumRiskCells,
        lowRisk: lowRiskCells,
      },
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
        ucaType: cell.ucaType,
      });
    } else {
      // Add N/A status
      addNotApplicableStatus({
        controllerId: cell.controllerId,
        controlActionId: cell.controlActionId,
        ucaType: cell.ucaType,
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

  const renderCell = (cell: UCAMatrixCell, ucaTypeInfo: (typeof UCA_TYPES)[0]) => {
    const isHovered =
      hoveredCell === `${cell.controllerId}-${cell.controlActionId}-${cell.ucaType}`;
    const intensity = getCellIntensity(cell.ucaCount);
    const riskLevel = getRiskLevel(cell.ucaCount);

    return (
      <div
        className={cn(
          'group relative transition-all duration-300',
          viewMode === 'analytics' && cell.status === 'analyzed' && 'transform-gpu'
        )}
        onMouseEnter={() =>
          setHoveredCell(`${cell.controllerId}-${cell.controlActionId}-${cell.ucaType}`)
        }
        onMouseLeave={() => setHoveredCell(null)}
      >
        <button
          onClick={() => handleCellClick(cell)}
          className={cn(
            'h-11 w-14 lg:h-12 lg:w-16',
            'flex flex-col items-center justify-center rounded-xl transition-all duration-300',
            'group relative overflow-hidden border-2 backdrop-blur-sm',
            cell.status === 'analyzed'
              ? viewMode === 'analytics' && riskLevel.level !== 'none'
                ? cn(
                    'border-2',
                    riskLevel.color === 'red' &&
                      'border-red-400 bg-gradient-to-br from-red-50 to-red-100 dark:border-red-600 dark:from-red-950/30 dark:to-red-900/40',
                    riskLevel.color === 'amber' &&
                      'border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 dark:border-amber-600 dark:from-amber-950/30 dark:to-amber-900/40',
                    riskLevel.color === 'yellow' &&
                      'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:border-yellow-600 dark:from-yellow-950/30 dark:to-yellow-900/40'
                  )
                : 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:border-emerald-700 dark:from-emerald-950/20 dark:to-emerald-900/30'
              : cell.status === 'not-applicable'
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-40 dark:border-gray-800 dark:bg-gray-900/50'
                : 'border-dashed border-gray-200 bg-white hover:border-solid dark:border-gray-700 dark:bg-gray-900/20',
            isHovered && cell.status !== 'not-applicable' && 'z-20 scale-110 border-3 shadow-2xl',
            cell.status === 'analyzed' && !isHovered && 'hover:scale-105 hover:shadow-lg'
          )}
        >
          {/* Analytics mode gradient overlay */}
          {viewMode === 'analytics' && cell.status === 'analyzed' && intensity > 0 && (
            <div
              className="absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle at center, ${ucaTypeInfo.bgGradient.replace('/20', `/${Math.min(intensity * 0.8, 60)}`)} 0%, transparent 70%)`,
              }}
            />
          )}

          {/* Risk indicator bar */}
          {cell.status === 'analyzed' && cell.ucaCount > 0 && (
            <div
              className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r opacity-80"
              style={{
                background:
                  riskLevel.level === 'high'
                    ? 'linear-gradient(to right, #dc2626, #ef4444)'
                    : riskLevel.level === 'medium'
                      ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                      : 'linear-gradient(to right, #84cc16, #22c55e)',
              }}
            />
          )}

          {/* Cell content */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
            {cell.status === 'analyzed' ? (
              <>
                <div
                  className={cn(
                    'h-7 w-7 lg:h-8 lg:w-8',
                    'flex items-center justify-center rounded-full',
                    'border bg-white shadow-md dark:bg-gray-900',
                    riskLevel.level === 'high' && 'border-red-300 dark:border-red-700',
                    riskLevel.level === 'medium' && 'border-amber-300 dark:border-amber-700',
                    riskLevel.level === 'low' && 'border-yellow-300 dark:border-yellow-700',
                    riskLevel.level === 'none' && 'border-emerald-300 dark:border-emerald-700'
                  )}
                >
                  {riskLevel.level === 'high' ? (
                    <AlertCircle
                      className={cn('h-3.5 w-3.5 lg:h-4 lg:w-4', 'text-red-600 dark:text-red-400')}
                    />
                  ) : (
                    <Check
                      className={cn(
                        'h-3.5 w-3.5 lg:h-4 lg:w-4',
                        'text-emerald-600 dark:text-emerald-400'
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'font-bold',
                    'text-xs',
                    riskLevel.level === 'high' && 'text-red-700 dark:text-red-300',
                    riskLevel.level === 'medium' && 'text-amber-700 dark:text-amber-300',
                    riskLevel.level === 'low' && 'text-yellow-700 dark:text-yellow-300',
                    riskLevel.level === 'none' && 'text-emerald-700 dark:text-emerald-300'
                  )}
                >
                  {cell.ucaCount}
                </span>
              </>
            ) : cell.status === 'not-applicable' ? (
              <div className="flex flex-col items-center gap-0.5">
                <X className={cn('h-3.5 w-3.5 lg:h-4 lg:w-4', 'text-gray-400')} />
                {isHovered && (
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      handleMarkAsNA(cell);
                    }}
                    className={cn(
                      'relative z-10 cursor-pointer rounded px-2 py-0.5 text-xs font-medium',
                      'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
                      'text-gray-600 dark:text-gray-400',
                      'border border-gray-300 transition-all duration-200 dark:border-gray-600'
                    )}
                  >
                    Remove N/A
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5 opacity-60 transition-all duration-300 group-hover:opacity-100">
                <div
                  className={cn(
                    'h-7 w-7 lg:h-8 lg:w-8',
                    'flex items-center justify-center rounded-full',
                    'border-2 border-dashed bg-white transition-all duration-300 dark:bg-gray-900',
                    'group-hover:scale-110 group-hover:border-solid group-hover:shadow-md',
                    ucaTypeInfo.borderColorClass
                  )}
                >
                  <Plus
                    className={cn(
                      'h-3.5 w-3.5 lg:h-4 lg:w-4',
                      ucaTypeInfo.iconColorClass,
                      'transition-transform duration-300 group-hover:rotate-90'
                    )}
                  />
                </div>
                {isHovered && (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-medium text-gray-500 dark:text-gray-400',
                        'text-xs',
                        'transition-opacity duration-300'
                      )}
                    >
                      Add
                    </span>
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        handleMarkAsNA(cell);
                      }}
                      className={cn(
                        'cursor-pointer rounded px-2 py-0.5 text-xs font-medium',
                        'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
                        'text-gray-600 dark:text-gray-400',
                        'border border-gray-300 transition-all duration-200 dark:border-gray-600'
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
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
              <div
                className={cn(
                  'absolute -inset-1 rounded-xl opacity-30 blur-md transition-opacity duration-300',
                  cell.status === 'analyzed' && riskLevel.level === 'high' && 'bg-red-400',
                  cell.status === 'analyzed' && riskLevel.level === 'medium' && 'bg-amber-400',
                  cell.status === 'analyzed' && riskLevel.level === 'low' && 'bg-yellow-400',
                  cell.status === 'analyzed' && riskLevel.level === 'none' && 'bg-emerald-400',
                  cell.status === 'not-analyzed' && 'bg-gray-400'
                )}
              />
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50/50 via-gray-50/30 to-zinc-50/20 dark:from-slate-950/50 dark:via-gray-950/30 dark:to-zinc-950/20">
      {/* Header */}
      <div className="p-3 pb-0 lg:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-2 lg:rounded-2xl lg:p-3 dark:from-blue-500/20 dark:to-purple-500/20">
              <Layers className="h-5 w-5 text-blue-600 lg:h-6 lg:w-6 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-lg font-bold text-transparent lg:text-2xl dark:from-gray-100 dark:to-gray-300">
                UCA Risk Analysis Matrix
              </h3>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Comprehensive safety analysis across all control actions</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3.5 w-3.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        This matrix shows all potential Unsafe Control Actions (UCAs) organized by
                        controller, control action, and UCA type. Click on cells to add or view
                        UCAs.
                      </p>
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
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 py-0">
                      {[filterController, filterUCAType, showOnlyAnalyzed].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Filter Options</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="filter-controller" className="text-xs font-medium">
                        Controller Name
                      </Label>
                      <Input
                        id="filter-controller"
                        placeholder="Search controllers..."
                        value={filterController}
                        onChange={e => setFilterController(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="filter-uca-type" className="text-xs font-medium">
                        UCA Type
                      </Label>
                      <Select value={filterUCAType} onValueChange={setFilterUCAType}>
                        <SelectTrigger id="filter-uca-type" className="mt-1">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All types</SelectItem>
                          {UCA_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'rounded px-2 py-0.5 text-xs font-medium',
                                    type.colorClass
                                  )}
                                >
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
                      <Label htmlFor="show-analyzed" className="text-xs font-medium">
                        Show only analyzed
                      </Label>
                      <input
                        id="show-analyzed"
                        type="checkbox"
                        checked={showOnlyAnalyzed}
                        onChange={e => setShowOnlyAnalyzed(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                  </div>
                  <div className="border-t pt-2">
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
      </div>

      {/* Matrix Container */}
      <div className="flex-1 px-3 pb-3 lg:px-6 lg:pb-6">
        <Card className="h-full overflow-hidden border-gray-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-gray-800/80 dark:bg-gray-900/95">
          {/* Matrix Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Control Action Matrix
                </h4>
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
            <div className="min-w-fit p-4 lg:p-6">
              <table className="w-full table-auto border-separate border-spacing-1">
                <thead className="sticky top-0 z-30 bg-white dark:bg-gray-900">
                  {/* Group headers row */}
                  <tr>
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-40 rounded-tl-lg bg-white p-2 lg:p-4 dark:bg-gray-900"
                    >
                      <div className="flex flex-col items-start gap-0.5 lg:gap-1">
                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-700 lg:gap-2 lg:text-sm dark:text-gray-300">
                          <Shield className="h-3 w-3 text-gray-500 lg:h-4 lg:w-4" />
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
                        <th key={group.id} colSpan={group.types.length} className="p-2">
                          <div
                            className={cn(
                              'mx-0.5 rounded-lg border-2 px-2 py-1.5 shadow-sm lg:mx-1 lg:rounded-xl lg:px-4 lg:py-2.5',
                              group.borderClass,
                              group.bgClass,
                              'backdrop-blur-sm'
                            )}
                          >
                            <div className="flex items-center justify-center gap-1 lg:gap-2">
                              <GroupIcon className={cn('h-3 w-3 lg:h-4 lg:w-4', group.iconClass)} />
                              <span className="text-[10px] font-bold tracking-wider text-gray-700 uppercase lg:text-xs dark:text-gray-300">
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
                      <th key={type.value} className="p-1 pb-2 lg:p-2 lg:pb-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex cursor-help flex-col items-center gap-1 lg:gap-1.5">
                                <div
                                  className={cn(
                                    'rounded-md border px-2 py-1 text-[10px] font-bold shadow-sm lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-xs',
                                    type.colorClass,
                                    type.borderColorClass,
                                    type.textColorClass,
                                    'transition-transform hover:scale-105'
                                  )}
                                >
                                  {type.shortLabel}
                                </div>
                                <div
                                  className="h-px w-6 bg-gradient-to-r opacity-50 lg:w-8"
                                  style={{
                                    background: `linear-gradient(to right, transparent, ${type.iconColorClass.replace('text-', 'rgb(var(--')})}, transparent)`,
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
                        <tr
                          className={cn(
                            'transition-colors duration-200',
                            isExpanded && 'bg-blue-50/30 dark:bg-blue-900/10'
                          )}
                        >
                          <td className="sticky left-0 z-20 border-r border-gray-200 bg-white p-2 lg:p-3 dark:border-gray-800 dark:bg-gray-900">
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
                                  'rounded-lg p-1 transition-all duration-200 lg:p-1.5',
                                  hasAnalyzedCells
                                    ? 'hover:bg-gray-100 hover:shadow-sm dark:hover:bg-gray-800'
                                    : 'cursor-default opacity-30'
                                )}
                              >
                                <ChevronRight
                                  className={cn(
                                    'h-3 w-3 text-gray-500 transition-transform duration-200 lg:h-4 lg:w-4',
                                    isExpanded && 'rotate-90'
                                  )}
                                />
                              </button>
                              <div className="flex min-w-0 flex-col items-start">
                                <span className="max-w-[120px] truncate text-xs font-semibold text-gray-900 lg:max-w-[200px] lg:text-sm dark:text-gray-100">
                                  {controllerName}
                                </span>
                                <span className="flex max-w-[120px] items-center gap-0.5 truncate text-[10px] text-gray-600 lg:max-w-[200px] lg:gap-1 lg:text-xs dark:text-gray-400">
                                  <ChevronRight className="h-2.5 w-2.5 flex-shrink-0 lg:h-3 lg:w-3" />
                                  {actionName}
                                </span>
                              </div>
                              {hasAnalyzedCells && (
                                <Badge variant="secondary" className="ml-auto px-2 py-0.5 text-xs">
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
                                    <div>{renderCell(cell, UCA_TYPES[cellIdx])}</div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-sm">
                                    {cell.status === 'analyzed' ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold">
                                            {cell.ucaCount} UCA{cell.ucaCount !== 1 ? 's' : ''}{' '}
                                            Identified
                                          </p>
                                          {getRiskLevel(cell.ucaCount).level !== 'none' && (
                                            <Badge variant="secondary" className="text-xs">
                                              {getRiskLevel(cell.ucaCount).level} risk
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="space-y-1 text-xs text-gray-400">
                                          <p>Type: {UCA_TYPES[cellIdx].label}</p>
                                          <p>Click to add another {UCA_TYPES[cellIdx].label} UCA</p>
                                          <p>
                                            Use chevron to {isExpanded ? 'hide' : 'view'} existing
                                            UCAs
                                          </p>
                                        </div>
                                      </div>
                                    ) : cell.status === 'not-applicable' ? (
                                      <p className="text-sm">
                                        Not applicable for this control action
                                      </p>
                                    ) : (
                                      <div className="space-y-1">
                                        <p className="font-semibold">Not Analyzed</p>
                                        <p className="text-xs text-gray-400">
                                          Click to add {UCA_TYPES[cellIdx].label} UCA
                                        </p>
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
                              <div className="border-y border-gray-200 bg-gradient-to-r from-blue-50/20 to-purple-50/20 dark:border-gray-800 dark:from-blue-900/10 dark:to-purple-900/10">
                                <div className="space-y-4 p-6">
                                  {row
                                    .filter(
                                      cell => cell.status === 'analyzed' && cell.ucas.length > 0
                                    )
                                    .map((cell, idx) => {
                                      const ucaType = UCA_TYPES.find(
                                        t => t.value === cell.ucaType
                                      )!;
                                      return (
                                        <div key={idx} className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={cn(
                                                'rounded-lg px-2.5 py-1 text-xs font-bold',
                                                ucaType.colorClass,
                                                ucaType.textColorClass
                                              )}
                                            >
                                              {ucaType.shortLabel}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                              {ucaType.label}
                                            </span>
                                            <Badge variant="outline" className="ml-auto text-xs">
                                              {cell.ucas.length} UCA
                                              {cell.ucas.length !== 1 ? 's' : ''}
                                            </Badge>
                                          </div>
                                          <div className="ml-8 grid gap-2">
                                            {cell.ucas.map((uca, ucaIdx) => (
                                              <Card
                                                key={ucaIdx}
                                                className="group cursor-pointer border-gray-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                              >
                                                <div className="flex items-start gap-3">
                                                  <div className="flex-shrink-0">
                                                    <div className="rounded bg-gray-100 px-2 py-1 font-mono text-xs font-semibold text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                                      {uca.code}
                                                    </div>
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                                      {uca.description}
                                                    </p>
                                                    {uca.context && (
                                                      <p className="mt-1 text-xs text-gray-500 italic dark:text-gray-400">
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
                                    <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                                      <p className="text-sm">
                                        No UCAs defined for this control action yet.
                                      </p>
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
          <Card className="border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/30 dark:border-gray-700/50 dark:from-gray-900/50 dark:to-gray-800/30">
            <div className="p-3 lg:p-4">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
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

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {/* Cell States */}
                <div className="space-y-3">
                  <h6 className="text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    Cell States
                  </h6>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-12 items-center justify-center rounded-lg border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm dark:border-emerald-700 dark:from-emerald-950/20 dark:to-emerald-900/30">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Analyzed
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">UCAs identified</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-12 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900/20">
                        <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Not Analyzed
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click to add</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-12 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 opacity-40 dark:border-gray-800 dark:bg-gray-900/50">
                        <X className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          N/A
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Not applicable</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Levels */}
                <div className="space-y-3">
                  <h6 className="text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    Risk Levels
                  </h6>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-12 items-center justify-center rounded-lg border-2 border-red-400 bg-gradient-to-br from-red-50 to-red-100 shadow-sm dark:border-red-600 dark:from-red-950/30 dark:to-red-900/40">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          High
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">≥3 UCAs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-12 items-center justify-center rounded-lg border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm dark:border-amber-600 dark:from-amber-950/30 dark:to-amber-900/40">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          2
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Medium
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">2 UCAs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-12 items-center justify-center rounded-lg border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-sm dark:border-yellow-600 dark:from-yellow-950/30 dark:to-yellow-900/40">
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                          1
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Low
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">1 UCA</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* UCA Types */}
                <div className="space-y-3">
                  <h6 className="text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    UCA Types
                  </h6>
                  <div className="space-y-2">
                    {UCA_GROUPS.slice(0, 2).map(group => (
                      <div key={group.id} className="space-y-1">
                        <div className="mb-1 flex items-center gap-2">
                          <group.icon className={cn('h-3 w-3', group.iconClass)} />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {group.label}
                          </span>
                        </div>
                        <div className="ml-5 space-y-1">
                          {group.types.map(type => (
                            <div key={type.value} className="flex items-center gap-2">
                              <div
                                className={cn(
                                  'rounded px-2 py-0.5 text-xs font-bold',
                                  type.colorClass,
                                  type.textColorClass
                                )}
                              >
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
                  <h6 className="text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                    Duration
                  </h6>
                  <div className="space-y-2">
                    {UCA_GROUPS[2] &&
                      (() => {
                        const durationGroup = UCA_GROUPS[2];
                        const DurationIcon = durationGroup.icon;
                        return (
                          <div className="space-y-1">
                            <div className="mb-1 flex items-center gap-2">
                              <DurationIcon className={cn('h-3 w-3', durationGroup.iconClass)} />
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                {durationGroup.label}
                              </span>
                            </div>
                            <div className="ml-5 space-y-1">
                              {durationGroup.types.map(type => (
                                <div key={type.value} className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      'rounded px-2 py-0.5 text-xs font-bold',
                                      type.colorClass,
                                      type.textColorClass
                                    )}
                                  >
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

                    <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                      <h6 className="mb-2 text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                        Quick Tips
                      </h6>
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
