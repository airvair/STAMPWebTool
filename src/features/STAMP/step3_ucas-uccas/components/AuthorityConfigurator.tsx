import React, { useState, useMemo } from 'react';
import { Controller, ControlAction, AuthorityRelationship } from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  ArrowRight, 
  AlertCircle, 
  FileDown, 
  FileUp,
  CheckCircle2,
  XCircle,
  Users,
  Workflow
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthorityConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (authorityRelationships: AuthorityRelationship[]) => void;
  initialRelationships?: AuthorityRelationship[];
}

export const AuthorityConfigurator: React.FC<AuthorityConfiguratorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRelationships = []
}) => {
  const { controllers, controlActions } = useAnalysisContext();
  const [authorityMatrix, setAuthorityMatrix] = useState<Map<string, Map<string, boolean>>>(new Map());
  const [constraints, setConstraints] = useState<Map<string, Map<string, string[]>>>(new Map());
  const [delegations, setDelegations] = useState<Map<string, Map<string, string>>>(new Map());
  const [activeTab, setActiveTab] = useState<'matrix' | 'hierarchy'>('matrix');
  const [selectedController, setSelectedController] = useState<string | null>(null);

  // Initialize authority matrix from initial relationships
  React.useEffect(() => {
    const newMatrix: Map<string, Map<string, boolean>> = new Map();
    const newConstraints: Map<string, Map<string, string[]>> = new Map();
    const newDelegations: Map<string, Map<string, string>> = new Map();

    // Initialize with all false
    controllers.forEach(controller => {
      const actionMap: Map<string, boolean> = new Map();
      const constraintMap: Map<string, string[]> = new Map();
      const delegationMap: Map<string, string> = new Map();
      
      controlActions.forEach(action => {
        actionMap.set(action.id, false);
        constraintMap.set(action.id, []);
        delegationMap.set(action.id, '');
      });
      
      newMatrix.set(controller.id, actionMap);
      newConstraints.set(controller.id, constraintMap);
      newDelegations.set(controller.id, delegationMap);
    });

    // Apply initial relationships
    initialRelationships.forEach(rel => {
      const actionMap = newMatrix.get(rel.controllerId);
      if (actionMap) {
        actionMap.set(rel.controlActionId, rel.hasAuthority);
      }
      
      if (rel.constraints) {
        const constraintMap = newConstraints.get(rel.controllerId);
        if (constraintMap) {
          constraintMap.set(rel.controlActionId, rel.constraints);
        }
      }
      
      if (rel.delegatedFrom) {
        const delegationMap = newDelegations.get(rel.controllerId);
        if (delegationMap) {
          delegationMap.set(rel.controlActionId, rel.delegatedFrom);
        }
      }
    });

    setAuthorityMatrix(newMatrix);
    setConstraints(newConstraints);
    setDelegations(newDelegations);
  }, [controllers, controlActions, initialRelationships]);

  // Toggle authority for a controller-action pair
  const toggleAuthority = (controllerId: string, actionId: string) => {
    const newMatrix = new Map(authorityMatrix);
    const actionMap = newMatrix.get(controllerId) || new Map();
    actionMap.set(actionId, !actionMap.get(actionId));
    newMatrix.set(controllerId, actionMap);
    setAuthorityMatrix(newMatrix);
  };

  // Add constraint
  const addConstraint = (controllerId: string, actionId: string, constraint: string) => {
    if (!constraint.trim()) return;
    
    const newConstraints = new Map(constraints);
    const constraintMap = newConstraints.get(controllerId) || new Map();
    const actionConstraints = constraintMap.get(actionId) || [];
    constraintMap.set(actionId, [...actionConstraints, constraint]);
    newConstraints.set(controllerId, constraintMap);
    setConstraints(newConstraints);
  };

  // Remove constraint
  const removeConstraint = (controllerId: string, actionId: string, index: number) => {
    const newConstraints = new Map(constraints);
    const constraintMap = newConstraints.get(controllerId) || new Map();
    const actionConstraints = constraintMap.get(actionId) || [];
    actionConstraints.splice(index, 1);
    constraintMap.set(actionId, actionConstraints);
    newConstraints.set(controllerId, constraintMap);
    setConstraints(newConstraints);
  };

  // Calculate authority statistics
  const authorityStats = useMemo(() => {
    const stats = {
      totalRelationships: 0,
      authorizedCount: 0,
      constrainedCount: 0,
      delegatedCount: 0,
      controllerStats: new Map() as Map<string, { authorized: number; total: number }>
    };

    controllers.forEach(controller => {
      const actionMap = authorityMatrix.get(controller.id) || new Map();
      const constraintMap = constraints.get(controller.id) || new Map();
      const delegationMap = delegations.get(controller.id) || new Map();
      
      let authorized = 0;
      
      controlActions.forEach(action => {
        stats.totalRelationships++;
        
        if (actionMap.get(action.id)) {
          stats.authorizedCount++;
          authorized++;
        }
        
        const actionConstraints = constraintMap.get(action.id) || [];
        if (actionConstraints.length > 0) {
          stats.constrainedCount++;
        }
        
        if (delegationMap.get(action.id)) {
          stats.delegatedCount++;
        }
      });
      
      stats.controllerStats.set(controller.id, {
        authorized,
        total: controlActions.length
      });
    });

    return stats;
  }, [controllers, controlActions, authorityMatrix, constraints, delegations]);

  // Convert to AuthorityRelationship array
  const buildAuthorityRelationships = (): AuthorityRelationship[] => {
    const relationships: AuthorityRelationship[] = [];

    controllers.forEach(controller => {
      const actionMap = authorityMatrix.get(controller.id) || new Map();
      const constraintMap = constraints.get(controller.id) || new Map();
      const delegationMap = delegations.get(controller.id) || new Map();

      controlActions.forEach(action => {
        const hasAuthority = actionMap.get(action.id) || false;
        const actionConstraints = constraintMap.get(action.id) || [];
        const delegatedFrom = delegationMap.get(action.id) || undefined;

        // Only include relationships where authority is granted or there are constraints/delegations
        if (hasAuthority || actionConstraints.length > 0 || delegatedFrom) {
          relationships.push({
            controllerId: controller.id,
            controlActionId: action.id,
            hasAuthority,
            constraints: actionConstraints.length > 0 ? actionConstraints : undefined,
            delegatedFrom
          });
        }
      });
    });

    return relationships;
  };

  const handleSave = () => {
    const relationships = buildAuthorityRelationships();
    onSave(relationships);
    onClose();
  };

  // Export authority configuration
  const handleExport = () => {
    const relationships = buildAuthorityRelationships();
    const exportData = {
      authorityRelationships: relationships,
      metadata: {
        exportedAt: new Date().toISOString(),
        controllerCount: controllers.length,
        actionCount: controlActions.length,
        relationshipCount: relationships.length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'authority-configuration.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import authority configuration
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.authorityRelationships) {
          // Apply imported relationships
          const newMatrix: Map<string, Map<string, boolean>> = new Map();
          const newConstraints: Map<string, Map<string, string[]>> = new Map();
          const newDelegations: Map<string, Map<string, string>> = new Map();

          // Initialize with all false
          controllers.forEach(controller => {
            const actionMap: Map<string, boolean> = new Map();
            const constraintMap: Map<string, string[]> = new Map();
            const delegationMap: Map<string, string> = new Map();
            
            controlActions.forEach(action => {
              actionMap.set(action.id, false);
              constraintMap.set(action.id, []);
              delegationMap.set(action.id, '');
            });
            
            newMatrix.set(controller.id, actionMap);
            newConstraints.set(controller.id, constraintMap);
            newDelegations.set(controller.id, delegationMap);
          });

          // Apply imported relationships
          data.authorityRelationships.forEach((rel: AuthorityRelationship) => {
            const actionMap = newMatrix.get(rel.controllerId);
            if (actionMap) {
              actionMap.set(rel.controlActionId, rel.hasAuthority);
            }
            
            if (rel.constraints) {
              const constraintMap = newConstraints.get(rel.controllerId);
              if (constraintMap) {
                constraintMap.set(rel.controlActionId, rel.constraints);
              }
            }
            
            if (rel.delegatedFrom) {
              const delegationMap = newDelegations.get(rel.controllerId);
              if (delegationMap) {
                delegationMap.set(rel.controlActionId, rel.delegatedFrom);
              }
            }
          });

          setAuthorityMatrix(newMatrix);
          setConstraints(newConstraints);
          setDelegations(newDelegations);
        }
      } catch (error) {
        console.error('Failed to import authority configuration:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authority Configuration
          </DialogTitle>
          <DialogDescription>
            Define which controllers have authority to perform which control actions
          </DialogDescription>
        </DialogHeader>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-semibold">{authorityStats.totalRelationships}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Relationships</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600">{authorityStats.authorizedCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Authorized</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-amber-600">{authorityStats.constrainedCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Constrained</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">{authorityStats.delegatedCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Delegated</div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'matrix' | 'hierarchy')} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="matrix" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Authority Matrix
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Hierarchy View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="flex-1 mt-4">
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white dark:bg-gray-950 z-10 w-48">Controller</TableHead>
                    {controlActions.map(action => (
                      <TableHead key={action.id} className="text-center min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">{action.name}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controllers.map(controller => {
                    const actionMap = authorityMatrix.get(controller.id) || new Map();
                    const stats = authorityStats.controllerStats.get(controller.id);
                    
                    return (
                      <TableRow key={controller.id}>
                        <TableCell className="sticky left-0 bg-white dark:bg-gray-950 font-medium">
                          <div className="flex items-center justify-between">
                            <span>{controller.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {stats?.authorized || 0}/{stats?.total || 0}
                            </Badge>
                          </div>
                        </TableCell>
                        {controlActions.map(action => {
                          const hasAuthority = actionMap.get(action.id) || false;
                          const actionConstraints = constraints.get(controller.id)?.get(action.id) || [];
                          const hasDelegation = !!delegations.get(controller.id)?.get(action.id);
                          
                          return (
                            <TableCell key={action.id} className="text-center p-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center gap-1">
                                      <Checkbox
                                        checked={hasAuthority}
                                        onCheckedChange={() => toggleAuthority(controller.id, action.id)}
                                        className={cn(
                                          "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600",
                                          actionConstraints.length > 0 && "ring-2 ring-amber-400",
                                          hasDelegation && "ring-2 ring-blue-400"
                                        )}
                                      />
                                      <div className="flex gap-1">
                                        {actionConstraints.length > 0 && (
                                          <AlertCircle className="h-3 w-3 text-amber-500" />
                                        )}
                                        {hasDelegation && (
                                          <ArrowRight className="h-3 w-3 text-blue-500" />
                                        )}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {controller.name} → {action.name}
                                      </div>
                                      <div className="text-xs">
                                        Status: {hasAuthority ? 'Authorized' : 'Not Authorized'}
                                      </div>
                                      {actionConstraints.length > 0 && (
                                        <div className="text-xs text-amber-500">
                                          {actionConstraints.length} constraint(s)
                                        </div>
                                      )}
                                      {hasDelegation && (
                                        <div className="text-xs text-blue-500">
                                          Has delegation
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="hierarchy" className="flex-1 mt-4">
            <div className="grid grid-cols-3 gap-4 h-full">
              {/* Controller List */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Controllers</h3>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-2">
                    {controllers.map(controller => {
                      const stats = authorityStats.controllerStats.get(controller.id);
                      return (
                        <Button
                          key={controller.id}
                          variant={selectedController === controller.id ? "default" : "outline"}
                          className="w-full justify-between"
                          onClick={() => setSelectedController(controller.id)}
                        >
                          <span>{controller.name}</span>
                          <Badge variant="secondary">
                            {stats?.authorized || 0} actions
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Authority Details */}
              <div className="col-span-2 border rounded-lg p-4">
                {selectedController ? (
                  <>
                    <h3 className="font-medium mb-3">
                      Authority Details: {controllers.find(c => c.id === selectedController)?.name}
                    </h3>
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-4">
                        {controlActions.map(action => {
                          const hasAuthority = authorityMatrix.get(selectedController)?.get(action.id) || false;
                          const actionConstraints = constraints.get(selectedController)?.get(action.id) || [];
                          
                          return (
                            <div key={action.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Label className="font-medium">{action.name}</Label>
                                  {hasAuthority ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <Checkbox
                                  checked={hasAuthority}
                                  onCheckedChange={() => toggleAuthority(selectedController, action.id)}
                                />
                              </div>
                              
                              {hasAuthority && (
                                <div className="space-y-2 mt-2">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Constraints:
                                  </div>
                                  {actionConstraints.map((constraint, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {constraint}
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeConstraint(selectedController, action.id, idx)}
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Input
                                    placeholder="Add constraint..."
                                    className="h-8 text-sm"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        addConstraint(selectedController, action.id, (e.target as HTMLInputElement).value);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a controller to view authority details
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Label htmlFor="import-file" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <FileUp className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};