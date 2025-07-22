import React, { useState, useMemo } from 'react';
import { UnsafeControlAction, Controller, ControlAction, UCAType } from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import EnterpriseUCAMatrix from './EnterpriseUCAMatrix';

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
  const { deleteUCA, hazards } = useAnalysisContext();

  // Get controller and control action names
  const getControllerName = (id: string) => {
    return controllers.find(c => c.id === id)?.name || 'Unknown';
  };

  const getControlActionName = (id: string) => {
    const action = controlActions.find(ca => ca.id === id);
    return action ? `${action.verb} ${action.object}` : 'Unknown';
  };





  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="p-3 lg:p-4 border-b space-y-3 lg:space-y-4">
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

      {/* UCA Analysis Matrix */}
      <EnterpriseUCAMatrix
        controllers={controllers}
        controlActions={controlActions}
        ucas={ucas}
        selectedController={selectedController}
        onSelectControlAction={onSelectControlAction}
        onCreateUCA={onCreateUCA}
      />
    </div>
  );
};

export default UCAWorkspace;