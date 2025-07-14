import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAnalysis } from '@/hooks/useAnalysis';
import { UCAType, Controller, ControlAction, UnsafeControlAction } from '@/types';
import { CheckCircle2, AlertCircle, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatrixCellData {
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType;
  status: 'not-analyzed' | 'has-ucas' | 'analyzed-no-ucas';
  ucaCount: number;
  ucas: UnsafeControlAction[];
}

interface ControlActionMatrixProps {
  onCellClick: (data: MatrixCellData) => void;
  selectedCell?: { controlActionId: string; ucaType: UCAType } | null;
  className?: string;
}

const UCA_TYPES: UCAType[] = [
  UCAType.NotProvided,
  UCAType.ProvidedUnsafe,
  UCAType.TooEarly,
  UCAType.TooLate,
  UCAType.WrongOrder,
  UCAType.TooLong,
  UCAType.TooShort
];

const UCA_TYPE_SHORT_NAMES: Record<UCAType, string> = {
  [UCAType.NotProvided]: 'Not Provided',
  [UCAType.ProvidedUnsafe]: 'Provided Unsafe',
  [UCAType.TooEarly]: 'Too Early',
  [UCAType.TooLate]: 'Too Late',
  [UCAType.WrongOrder]: 'Wrong Order',
  [UCAType.TooLong]: 'Too Long',
  [UCAType.TooShort]: 'Too Short'
};

const ControlActionMatrix: React.FC<ControlActionMatrixProps> = ({
  onCellClick,
  selectedCell,
  className
}) => {
  const { controllers, controlActions, ucas } = useAnalysis();
  const [expandedControllers, setExpandedControllers] = useState<Set<string>>(new Set());

  // Group control actions by controller
  const controllerGroups = useMemo(() => {
    const groups = new Map<Controller, ControlAction[]>();
    
    controllers.forEach(controller => {
      const actions = controlActions.filter(
        ca => ca.controllerId === controller.id && !ca.isOutOfScope
      );
      if (actions.length > 0) {
        groups.set(controller, actions);
      }
    });
    
    return groups;
  }, [controllers, controlActions]);

  // Calculate cell data for each control action / UCA type combination
  const getCellData = (controlAction: ControlAction, ucaType: UCAType): MatrixCellData => {
    const cellUcas = ucas.filter(
      uca => uca.controlActionId === controlAction.id && uca.ucaType === ucaType
    );
    
    let status: MatrixCellData['status'] = 'not-analyzed';
    if (cellUcas.length > 0) {
      status = 'has-ucas';
    } else {
      // Check if this combination has been analyzed (you might want to track this separately)
      // For now, we'll assume if there are any UCAs for this control action, it's been analyzed
      const hasAnyUcas = ucas.some(uca => uca.controlActionId === controlAction.id);
      if (hasAnyUcas) {
        status = 'analyzed-no-ucas';
      }
    }
    
    return {
      controllerId: controlAction.controllerId,
      controlActionId: controlAction.id,
      ucaType,
      status,
      ucaCount: cellUcas.length,
      ucas: cellUcas
    };
  };

  const toggleControllerExpansion = (controllerId: string) => {
    setExpandedControllers(prev => {
      const next = new Set(prev);
      if (next.has(controllerId)) {
        next.delete(controllerId);
      } else {
        next.add(controllerId);
      }
      return next;
    });
  };

  const renderCell = (cellData: MatrixCellData) => {
    const isSelected = selectedCell?.controlActionId === cellData.controlActionId 
      && selectedCell?.ucaType === cellData.ucaType;

    const cellContent = (
      <button
        onClick={() => onCellClick(cellData)}
        className={cn(
          // Base cell styles
          "relative w-full h-12 flex items-center justify-center",
          "border rounded-lg transition-all duration-200",
          // Status-based styling
          cellData.status === 'not-analyzed' && "bg-muted/30 border-border/50 hover:bg-muted/50",
          cellData.status === 'analyzed-no-ucas' && "bg-green-500/10 border-green-500/30 hover:bg-green-500/20",
          cellData.status === 'has-ucas' && "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20",
          // Selected state
          isSelected && "ring-2 ring-primary ring-offset-2",
          // Hover effect
          "hover:scale-105 hover:shadow-md"
        )}
      >
        {/* Status icon */}
        {cellData.status === 'not-analyzed' && (
          <Circle className="size-5 text-muted-foreground" />
        )}
        {cellData.status === 'analyzed-no-ucas' && (
          <CheckCircle2 className="size-5 text-green-600" />
        )}
        {cellData.status === 'has-ucas' && (
          <>
            <AlertCircle className="size-5 text-amber-600" />
            {cellData.ucaCount > 1 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-semibold text-white">
                {cellData.ucaCount}
              </span>
            )}
          </>
        )}
      </button>
    );

    return cellContent;
  };

  return (
    <div className={cn("w-full overflow-auto", className)}>
      <div className="min-w-[800px] space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-4">
          <h2 className="text-xl font-semibold mb-4">Control Action Analysis Matrix</h2>
          
          {/* Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Circle className="size-4 text-muted-foreground" />
              <span>Not Analyzed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              <span>Analyzed (No UCAs)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" />
              <span>Has UCAs</span>
            </div>
          </div>
        </div>

        {/* Matrix */}
        <div className="border rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[300px_repeat(7,1fr)] bg-muted/50">
            <div className="p-3 font-medium border-r">Control Action</div>
            {UCA_TYPES.map(ucaType => (
              <div key={ucaType} className="p-3 text-center font-medium text-sm">
                {UCA_TYPE_SHORT_NAMES[ucaType]}
              </div>
            ))}
          </div>

          {/* Controller groups */}
          {Array.from(controllerGroups.entries()).map(([controller, actions]) => {
            const isExpanded = expandedControllers.has(controller.id);
            
            return (
              <div key={controller.id} className="border-t">
                {/* Controller header */}
                <button
                  onClick={() => toggleControllerExpansion(controller.id)}
                  className="w-full grid grid-cols-[300px_repeat(7,1fr)] bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-3 flex items-center gap-2 font-medium">
                    {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    {controller.name}
                    <span className="text-sm text-muted-foreground">({actions.length} actions)</span>
                  </div>
                  {/* Summary cells for controller */}
                  {UCA_TYPES.map(ucaType => {
                    const totalUcas = actions.reduce((sum, action) => {
                      const cellData = getCellData(action, ucaType);
                      return sum + cellData.ucaCount;
                    }, 0);
                    
                    return (
                      <div key={ucaType} className="p-3 text-center text-sm text-muted-foreground">
                        {totalUcas > 0 && `${totalUcas} UCAs`}
                      </div>
                    );
                  })}
                </button>

                {/* Control actions (expandable) */}
                {isExpanded && actions.map(action => (
                  <div 
                    key={action.id} 
                    className="grid grid-cols-[300px_repeat(7,1fr)] border-t bg-background"
                  >
                    <div className="p-3 pl-9 text-sm">
                      {action.verb} {action.object}
                    </div>
                    {UCA_TYPES.map(ucaType => (
                      <div key={ucaType} className="p-2">
                        {renderCell(getCellData(action, ucaType))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Summary statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-semibold">{controlActions.filter(ca => !ca.isOutOfScope).length}</div>
            <div className="text-sm text-muted-foreground">Total Control Actions</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-semibold">{ucas.length}</div>
            <div className="text-sm text-muted-foreground">UCAs Identified</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <div className="text-2xl font-semibold">
              {Math.round((ucas.length / (controlActions.filter(ca => !ca.isOutOfScope).length * UCA_TYPES.length)) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Analysis Coverage</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlActionMatrix;