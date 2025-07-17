import React, { useState, useMemo } from 'react';
import { UnsafeControlAction, Controller, ControlAction, UCAType } from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Copy,
  FileDown,
  Grid3x3,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import UCAAnalysis from './UCAAnalysis';

interface UCAWorkspaceProps {
  ucas: UnsafeControlAction[];
  controllers: Controller[];
  controlActions: ControlAction[];
  selectedController: string | null;
  selectedControlAction: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateUCA: (ucaType?: UCAType) => void;
  onEditUCA: (uca: UnsafeControlAction) => void;
  onSelectControlAction: (id: string | null) => void;
}

const UCA_TYPE_LABELS: Record<UCAType, string> = {
  [UCAType.NotProvided]: 'Not Provided',
  [UCAType.ProvidedUnsafe]: 'Provided',
  [UCAType.TooEarly]: 'Too Early',
  [UCAType.TooLate]: 'Too Late',
  [UCAType.WrongOrder]: 'Wrong Order',
  [UCAType.TooLong]: 'Too Long',
  [UCAType.TooShort]: 'Too Short'
};

const UCA_TYPE_COLORS: Record<UCAType, string> = {
  [UCAType.NotProvided]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  [UCAType.ProvidedUnsafe]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  [UCAType.TooEarly]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  [UCAType.TooLate]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  [UCAType.WrongOrder]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  [UCAType.TooLong]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  [UCAType.TooShort]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
};

const UCAWorkspace: React.FC<UCAWorkspaceProps> = ({
  ucas,
  controllers,
  controlActions,
  selectedController,
  selectedControlAction,
  searchQuery,
  onSearchChange,
  onCreateUCA,
  onEditUCA,
  onSelectControlAction
}) => {
  const { deleteUCA, addUCA, hazards } = useAnalysisContext();
  const [selectedUCAs, setSelectedUCAs] = useState<Set<string>>(new Set());
  const [showUCAAnalysis, setShowUCAAnalysis] = useState(true);

  // Get controller and control action names
  const getControllerName = (id: string) => {
    return controllers.find(c => c.id === id)?.name || 'Unknown';
  };

  const getControlActionName = (id: string) => {
    const action = controlActions.find(ca => ca.id === id);
    return action ? `${action.verb} ${action.object}` : 'Unknown';
  };

  const getHazardCodes = (hazardIds: string[]) => {
    return hazardIds.map(id => {
      const hazard = hazards.find(h => h.id === id);
      return hazard?.code || 'Unknown';
    });
  };

  // Filter suggestions
  const filteredControlActions = useMemo(() => {
    if (!selectedController) return [];
    return controlActions.filter(ca => ca.controllerId === selectedController);
  }, [controlActions, selectedController]);

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUCAs(new Set(ucas.map(uca => uca.id)));
    } else {
      setSelectedUCAs(new Set());
    }
  };

  const handleSelectUCA = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedUCAs);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedUCAs(newSelected);
  };

  // Batch operations
  const handleDeleteSelected = () => {
    selectedUCAs.forEach(id => deleteUCA(id));
    setSelectedUCAs(new Set());
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Exporting UCAs...');
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search UCAs by description, context, or code..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUCAAnalysis(!showUCAAnalysis)}
              className={cn(showUCAAnalysis && "bg-blue-50 dark:bg-blue-950/30")}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              UCA Analysis
            </Button>
            
            {selectedUCAs.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export UCAs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button onClick={onCreateUCA}>
              <Plus className="h-4 w-4 mr-2" />
              Add UCA
            </Button>
          </div>
        </div>

        {/* Quick filters for selected controller/action */}
        {(selectedController || selectedControlAction) && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Filtering by:</span>
            {selectedController && (
              <Badge variant="secondary">
                Controller: {getControllerName(selectedController)}
              </Badge>
            )}
            {selectedControlAction && (
              <Badge variant="secondary">
                Action: {getControlActionName(selectedControlAction)}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* UCA Analysis or Table View */}
      {showUCAAnalysis ? (
        <UCAAnalysis
          controllers={controllers}
          controlActions={controlActions}
          ucas={ucas}
          selectedController={selectedController}
          onSelectControlAction={onSelectControlAction}
          onCreateUCA={onCreateUCA}
        />
      ) : (
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUCAs.size === ucas.length && ucas.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-24">Code</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Context</TableHead>
                <TableHead className="w-32">Hazards</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ucas.map((uca) => (
                <TableRow 
                  key={uca.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => onEditUCA(uca)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedUCAs.has(uca.id)}
                      onCheckedChange={(checked) => handleSelectUCA(uca.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {uca.code}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={cn("text-xs", UCA_TYPE_COLORS[uca.ucaType])}
                    >
                      {UCA_TYPE_LABELS[uca.ucaType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{uca.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getControllerName(uca.controllerId)} → {getControlActionName(uca.controlActionId)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-sm">{uca.context}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getHazardCodes(uca.hazardIds).map((code, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditUCA(uca)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const { id, code, ...ucaData } = uca;
                          addUCA(ucaData);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteUCA(uca.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
};

export default UCAWorkspace;