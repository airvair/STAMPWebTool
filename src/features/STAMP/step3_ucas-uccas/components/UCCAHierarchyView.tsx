import React, { useState, useMemo } from 'react';
import {
  UCCAHierarchy,
  AbstractUCCA,
  RefinedUCCA,
  Controller,
  ControlAction,
  Hazard
} from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  GitBranch,
  Users,
  Clock,
  Filter,
  Search,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  Info,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UCCAHierarchyViewProps {
  hierarchies: UCCAHierarchy[];
  onSelectAbstractUCCA?: (ucca: AbstractUCCA) => void;
  onSelectRefinedUCCA?: (ucca: RefinedUCCA) => void;
  onAnalyzeScenario?: (ucca: RefinedUCCA | UCCA) => void;
}

export const UCCAHierarchyView: React.FC<UCCAHierarchyViewProps> = ({
  hierarchies,
  onSelectAbstractUCCA,
  onSelectRefinedUCCA,
  onAnalyzeScenario
}) => {
  const { controllers, controlActions, hazards } = useAnalysisContext();
  const [expandedHierarchies, setExpandedHierarchies] = useState<Set<string>>(new Set());
  const [showPruned, setShowPruned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [filterType, setFilterType] = useState<'All' | 'Type1-2' | 'Type3-4'>('All');

  // Helper functions for display
  const getControllerName = (id: string) => controllers.find(c => c.id === id)?.name || 'Unknown';
  const getActionName = (id: string) => controlActions.find(a => a.id === id)?.name || 'Unknown';
  const getHazard = (id: string) => hazards.find(h => h.id === id);

  // Toggle hierarchy expansion
  const toggleHierarchy = (hierarchyId: string) => {
    const newExpanded = new Set(expandedHierarchies);
    if (newExpanded.has(hierarchyId)) {
      newExpanded.delete(hierarchyId);
    } else {
      newExpanded.add(hierarchyId);
    }
    setExpandedHierarchies(newExpanded);
  };

  // Filter hierarchies based on search and filters
  const filteredHierarchies = useMemo(() => {
    return hierarchies.filter(hierarchy => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAbstract = 
          hierarchy.abstractUCCA.description.toLowerCase().includes(query) ||
          hierarchy.abstractUCCA.context.toLowerCase().includes(query) ||
          hierarchy.abstractUCCA.code.toLowerCase().includes(query);
        
        const matchesRefined = hierarchy.refinedUCCAs.some(refined =>
          refined.description.toLowerCase().includes(query) ||
          refined.code.toLowerCase().includes(query)
        );

        if (!matchesAbstract && !matchesRefined) return false;
      }

      // Type filter
      if (filterType !== 'All') {
        const isType12 = ['Team-based', 'Cross-Controller'].includes(hierarchy.abstractUCCA.uccaType);
        const isType34 = hierarchy.abstractUCCA.uccaType === 'Temporal';
        
        if (filterType === 'Type1-2' && !isType12) return false;
        if (filterType === 'Type3-4' && !isType34) return false;
      }

      // Priority filter (check if any refined UCCA matches)
      if (filterPriority !== 'All') {
        const hasMatchingPriority = hierarchy.refinedUCCAs.some(
          refined => refined.priority === filterPriority
        );
        if (!hasMatchingPriority) return false;
      }

      return true;
    });
  }, [hierarchies, searchQuery, filterType, filterPriority]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAbstract = filteredHierarchies.length;
    const totalRefined = filteredHierarchies.reduce((sum, h) => sum + h.totalRefined, 0);
    const totalPruned = filteredHierarchies.reduce((sum, h) => sum + h.prunedCount, 0);
    const totalHighPriority = filteredHierarchies.reduce((sum, h) => sum + h.highPriorityCount, 0);
    
    return { totalAbstract, totalRefined, totalPruned, totalHighPriority };
  }, [filteredHierarchies]);

  // Render priority badge
  const renderPriorityBadge = (priority: 'High' | 'Medium' | 'Low', score?: number) => {
    const config = {
      High: { color: 'destructive', icon: AlertTriangle },
      Medium: { color: 'secondary', icon: Info },
      Low: { color: 'outline', icon: null }
    };

    const { color, icon: Icon } = config[priority];

    return (
      <Badge variant={color as any} className="text-xs">
        {Icon && <Icon className="h-3 w-3 mr-1" />}
        {priority}
        {score && ` (${score})`}
      </Badge>
    );
  };

  // Render abstraction level badge
  const renderAbstractionBadge = (level: '2a' | '2b') => {
    return (
      <Badge variant="outline" className="text-xs">
        {level === '2a' ? (
          <>
            <Users className="h-3 w-3 mr-1" />
            Team-level
          </>
        ) : (
          <>
            <GitBranch className="h-3 w-3 mr-1" />
            Controller-specific
          </>
        )}
      </Badge>
    );
  };

  // Render UCCA type icon
  const renderUCCATypeIcon = (type: string) => {
    switch (type) {
      case 'Team-based':
      case 'Cross-Controller':
        return <Users className="h-4 w-4" />;
      case 'Temporal':
        return <Clock className="h-4 w-4" />;
      default:
        return <GitBranch className="h-4 w-4" />;
    }
  };

  // Empty state
  if (hierarchies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Layers className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No UCCA hierarchies to display</p>
          <p className="text-sm mt-2">Generate UCCAs using the algorithm first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search UCCAs..."
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Type1-2">Type 1-2</SelectItem>
              <SelectItem value="Type3-4">Type 3-4</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Priorities</SelectItem>
              <SelectItem value="High">High Priority</SelectItem>
              <SelectItem value="Medium">Medium Priority</SelectItem>
              <SelectItem value="Low">Low Priority</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPruned(!showPruned)}
          >
            {showPruned ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showPruned ? 'Hide' : 'Show'} Pruned
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedHierarchies(new Set(filteredHierarchies.map(h => h.abstractUCCA.id)))}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedHierarchies(new Set())}
          >
            Collapse All
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Abstract UCCAs</div>
          <div className="text-2xl font-semibold">{stats.totalAbstract}</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Refined UCCAs</div>
          <div className="text-2xl font-semibold">{stats.totalRefined}</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">Pruned</div>
          <div className="text-2xl font-semibold text-gray-500">{stats.totalPruned}</div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">High Priority</div>
          <div className="text-2xl font-semibold text-red-600">{stats.totalHighPriority}</div>
        </Card>
      </div>

      {/* Hierarchies */}
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {filteredHierarchies.map(hierarchy => {
            const isExpanded = expandedHierarchies.has(hierarchy.abstractUCCA.id);
            const visibleRefined = showPruned 
              ? hierarchy.refinedUCCAs 
              : hierarchy.refinedUCCAs.filter(r => !r.isPruned);

            return (
              <Card key={hierarchy.abstractUCCA.id} className="overflow-hidden">
                {/* Abstract UCCA Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  onClick={() => toggleHierarchy(hierarchy.abstractUCCA.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {renderUCCATypeIcon(hierarchy.abstractUCCA.uccaType)}
                        <span className="font-mono text-sm">{hierarchy.abstractUCCA.code}</span>
                        {renderAbstractionBadge(hierarchy.abstractUCCA.abstractionLevel)}
                        <Badge variant="outline" className="text-xs">
                          {hierarchy.totalRefined} refined
                        </Badge>
                        {hierarchy.prunedCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {hierarchy.prunedCount} pruned
                          </Badge>
                        )}
                        {hierarchy.highPriorityCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {hierarchy.highPriorityCount} high priority
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm font-medium mb-1">
                        {hierarchy.abstractUCCA.description}
                      </p>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {hierarchy.abstractUCCA.context}
                      </p>

                      {hierarchy.abstractUCCA.abstractPattern && (
                        <div className="mt-2">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {hierarchy.abstractUCCA.abstractPattern}
                          </code>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        {hierarchy.abstractUCCA.hazardIds.map(hazardId => {
                          const hazard = getHazard(hazardId);
                          return hazard ? (
                            <Badge key={hazardId} variant="outline" className="text-xs">
                              {hazard.code}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {onSelectAbstractUCCA && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAbstractUCCA(hierarchy.abstractUCCA);
                        }}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>

                {/* Refined UCCAs */}
                <Collapsible open={isExpanded}>
                  <CollapsibleContent>
                    <div className="border-t bg-gray-50/50 dark:bg-gray-900/50">
                      {visibleRefined.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No refined UCCAs to display
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Code</TableHead>
                              <TableHead>Specific Assignment</TableHead>
                              <TableHead className="w-32">Priority</TableHead>
                              <TableHead className="w-24">Status</TableHead>
                              <TableHead className="w-20"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visibleRefined.map(refined => (
                              <TableRow 
                                key={refined.id}
                                className={cn(
                                  "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
                                  refined.isPruned && "opacity-50"
                                )}
                                onClick={() => onSelectRefinedUCCA?.(refined)}
                              >
                                <TableCell className="font-mono text-xs">
                                  {refined.code}
                                </TableCell>
                                
                                <TableCell>
                                  <div className="space-y-1">
                                    {/* Group assignments by action */}
                                    {Object.entries(
                                      refined.specificControllerAssignments.reduce((acc, assignment) => {
                                        const actionName = getActionName(assignment.controlActionId);
                                        if (!acc[actionName]) acc[actionName] = [];
                                        acc[actionName].push(assignment);
                                        return acc;
                                      }, {} as Record<string, typeof refined.specificControllerAssignments>)
                                    ).map(([actionName, assignments]) => (
                                      <div key={actionName} className="text-sm">
                                        <span className="font-medium">{actionName}:</span>
                                        <span className="ml-2">
                                          {assignments.map(a => (
                                            <span key={`${a.controllerId}-${a.controlActionId}`}>
                                              {getControllerName(a.controllerId)}
                                              {a.performed ? (
                                                <CheckCircle className="inline h-3 w-3 ml-1 text-green-500" />
                                              ) : (
                                                <XCircle className="inline h-3 w-3 ml-1 text-red-500" />
                                              )}
                                            </span>
                                          )).reduce((prev, curr, idx) => 
                                            idx === 0 ? [curr] : [...prev, <span key={idx}>, </span>, curr], 
                                            [] as React.ReactNode[]
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  {renderPriorityBadge(refined.priority, refined.priorityScore)}
                                </TableCell>

                                <TableCell>
                                  {refined.isPruned ? (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Badge variant="secondary" className="text-xs">
                                            Pruned
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">{refined.pruneReason}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <Badge variant="default" className="text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </TableCell>

                                <TableCell>
                                  {onAnalyzeScenario && !refined.isPruned && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAnalyzeScenario(refined);
                                      }}
                                    >
                                      <ArrowRight className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};