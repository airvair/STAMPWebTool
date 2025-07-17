import React, { useState, useMemo } from 'react';
import { UCCA, Controller, ControlAction, UCCAType, UCCAHierarchy, CausalScenario } from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Clock, 
  GitBranch,
  Building,
  Shuffle,
  Plus,
  AlertTriangle,
  Brain,
  Layers,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UCCAHierarchyView } from './UCCAHierarchyView';
import { UCCACausalScenarioWizard } from './UCCACausalScenarioWizard';

interface UCCAWorkspaceProps {
  uccas: UCCA[];
  controllers: Controller[];
  controlActions: ControlAction[];
  selectedController: string | null;
  onCreateUCCA: () => void;
  onEditUCCA: (ucca: UCCA) => void;
  onOpenAlgorithm?: () => void;
}

const UCCA_TYPE_CONFIG: Record<UCCAType, { label: string; icon: React.ReactNode; color: string }> = {
  'Team-based': { 
    label: 'Team-based',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  },
  'Role-based': { 
    label: 'Role-based',
    icon: <Building className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  },
  'Organizational': { 
    label: 'Organizational',
    icon: <GitBranch className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  },
  'Cross-Controller': { 
    label: 'Cross-Controller',
    icon: <Shuffle className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  },
  'Temporal': { 
    label: 'Temporal',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
  }
};

const UCCAWorkspace: React.FC<UCCAWorkspaceProps> = ({
  uccas,
  controllers,
  controlActions,
  selectedController,
  onCreateUCCA,
  onEditUCCA,
  onOpenAlgorithm
}) => {
  const { hazards, addScenario } = useAnalysisContext();
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('list');
  const [hierarchies, setHierarchies] = useState<UCCAHierarchy[]>([]);
  const [selectedUCCAForAnalysis, setSelectedUCCAForAnalysis] = useState<UCCA | null>(null);
  const [isCausalWizardOpen, setIsCausalWizardOpen] = useState(false);
  
  // Get names for display
  const getControllerNames = (controllerIds: string[]) => {
    return controllerIds.map(id => 
      controllers.find(c => c.id === id)?.name || 'Unknown'
    ).join(' + ');
  };

  const getHazardCodes = (hazardIds: string[]) => {
    return hazardIds.map(id => {
      const hazard = hazards.find(h => h.id === id);
      return hazard?.code || 'Unknown';
    });
  };

  // Group UCCAs by type for overview
  const uccasByType = useMemo(() => {
    const grouped = new Map<UCCAType, UCCA[]>();
    
    Object.keys(UCCA_TYPE_CONFIG).forEach(type => {
      grouped.set(type as UCCAType, []);
    });
    
    uccas.forEach(ucca => {
      const typeUccas = grouped.get(ucca.uccaType) || [];
      typeUccas.push(ucca);
      grouped.set(ucca.uccaType, typeUccas);
    });
    
    return grouped;
  }, [uccas]);

  // Empty state
  if (uccas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Unsafe Combinations of Control Actions Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            UCCAs identify unsafe interactions between multiple controllers or control actions. 
            These unsafe combinations of control actions can create hazards even when individual actions are safe.
          </p>
          <div className="flex gap-2">
            <Button onClick={onCreateUCCA}>
              <Plus className="h-4 w-4 mr-2" />
              Create First UCCA
            </Button>
            {onOpenAlgorithm && (
              <Button variant="outline" onClick={onOpenAlgorithm}>
                <Brain className="h-4 w-4 mr-2" />
                Use Algorithm
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Unsafe Combinations of Control Actions (UCCAs)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analyzing interactions between multiple controllers
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onCreateUCCA}>
              <Plus className="h-4 w-4 mr-2" />
              Add UCCA
            </Button>
            {onOpenAlgorithm && (
              <Button variant="outline" onClick={onOpenAlgorithm}>
                <Brain className="h-4 w-4 mr-2" />
                Use Algorithm
              </Button>
            )}
          </div>
        </div>
        
        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'hierarchy')}>
          <TabsList>
            <TabsTrigger value="list">
              List View
            </TabsTrigger>
            <TabsTrigger value="hierarchy">
              <Layers className="h-4 w-4 mr-2" />
              Hierarchy View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Type Overview */}
        <div className="grid grid-cols-5 gap-3">
          {Array.from(uccasByType.entries()).map(([type, typeUccas]) => {
            const config = UCCA_TYPE_CONFIG[type];
            return (
              <Card key={type} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("p-1.5 rounded", config.color)}>
                    {config.icon}
                  </div>
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="text-2xl font-semibold">{typeUccas.length}</div>
                <div className="text-xs text-gray-500">
                  {typeUccas.length === 1 ? 'interaction' : 'interactions'}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        /* List View */
        <ScrollArea className="flex-1">
          <div className="p-6">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead>Controllers</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Context</TableHead>
                <TableHead className="w-32">Hazards</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uccas.map((ucca) => {
                const config = UCCA_TYPE_CONFIG[ucca.uccaType];
                
                return (
                  <TableRow 
                    key={ucca.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                    onClick={() => onEditUCCA(ucca)}
                  >
                    <TableCell className="font-mono text-sm">
                      {ucca.code}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn("text-xs gap-1", config.color)}
                      >
                        {config.icon}
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getControllerNames(ucca.involvedControllerIds)}
                      </div>
                      {ucca.temporalRelationship && (
                        <div className="text-xs text-gray-500 mt-1">
                          {ucca.temporalRelationship}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">{ucca.description}</div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm">{ucca.context}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getHazardCodes(ucca.hazardIds).map((code, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUCCAForAnalysis(ucca);
                            setIsCausalWizardOpen(true);
                          }}
                          title="Analyze Causal Scenarios"
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
      ) : (
        /* Hierarchy View */
        <div className="flex-1 p-6">
          <UCCAHierarchyView 
            hierarchies={hierarchies}
            onSelectRefinedUCCA={(ucca) => {
              // Convert refined UCCA to regular UCCA for editing
              const regularUCCA: UCCA = {
                id: ucca.id,
                code: ucca.code,
                description: ucca.description,
                context: ucca.context,
                hazardIds: ucca.hazardIds,
                uccaType: ucca.uccaType,
                involvedControllerIds: ucca.involvedControllerIds
              };
              onEditUCCA(regularUCCA);
            }}
            onAnalyzeScenario={(ucca) => {
              setSelectedUCCAForAnalysis(ucca);
              setIsCausalWizardOpen(true);
            }}
          />
        </div>
      )}
      
      {/* Causal Scenario Wizard */}
      {selectedUCCAForAnalysis && (
        <UCCACausalScenarioWizard
          isOpen={isCausalWizardOpen}
          onClose={() => {
            setIsCausalWizardOpen(false);
            setSelectedUCCAForAnalysis(null);
          }}
          ucca={selectedUCCAForAnalysis}
          onSave={(scenarios) => {
            // Save scenarios to context
            scenarios.forEach(scenario => {
              addScenario(scenario);
            });
            setIsCausalWizardOpen(false);
            setSelectedUCCAForAnalysis(null);
          }}
        />
      )}
    </div>
  );
};

export default UCCAWorkspace;