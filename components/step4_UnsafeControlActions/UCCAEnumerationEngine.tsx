import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useAnalysis } from '@/hooks/useAnalysis';
import { UCCA } from '@/types';
import { UCCAIdentificationAlgorithm, PotentialUCCA } from '@/utils/uccaAlgorithms';
import { Button } from '@/components/ui/button';
import { 
  SparklesIcon, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Users,
  Clock
} from 'lucide-react';
import AbstractionLevelSelector from '@/components/shared/AbstractionLevelSelector';

interface UCCAEnumerationEngineProps {
  onPromote: (ucca: Omit<UCCA, 'id'>) => void;
  className?: string;
}

const UCCAEnumerationEngine: React.FC<UCCAEnumerationEngineProps> = ({
  onPromote,
  className
}) => {
  const { controllers, controlActions, ucas, hazards } = useAnalysis();
  const [abstractionLevel, setAbstractionLevel] = useState<'2a' | '2b'>('2a');
  const [maxControllers, setMaxControllers] = useState(3);
  const [filterRiskLevel, setFilterRiskLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedUCCA, setSelectedUCCA] = useState<PotentialUCCA | null>(null);
  const [refinementData, setRefinementData] = useState({
    context: '',
    hazardIds: [] as string[]
  });

  // Run the enumeration algorithm
  const potentialUCCAs = useMemo(() => {
    const algorithm = new UCCAIdentificationAlgorithm(controllers, controlActions, ucas);
    const results = algorithm.enumerateControlActionCombinations(abstractionLevel, maxControllers);
    
    // Filter by risk level if needed
    if (filterRiskLevel !== 'all') {
      return results.filter(ucca => ucca.riskLevel === filterRiskLevel);
    }
    
    return results;
  }, [controllers, controlActions, ucas, abstractionLevel, maxControllers, filterRiskLevel]);

  // Group UCCAs by pattern
  const groupedUCCAs = useMemo(() => {
    const groups = new Map<string, PotentialUCCA[]>();
    
    potentialUCCAs.forEach(ucca => {
      const key = ucca.pattern;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(ucca);
    });
    
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [potentialUCCAs]);

  const toggleGroup = (pattern: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(pattern)) {
        next.delete(pattern);
      } else {
        next.add(pattern);
      }
      return next;
    });
  };

  const handlePromote = () => {
    if (!selectedUCCA || !refinementData.context || refinementData.hazardIds.length === 0) {
      return;
    }

    const algorithm = new UCCAIdentificationAlgorithm(controllers, controlActions, ucas);
    const refinedUCCA = algorithm.refinePotentialUCCA(
      selectedUCCA,
      refinementData.context,
      refinementData.hazardIds
    );

    onPromote(refinedUCCA);
    
    // Reset selection
    setSelectedUCCA(null);
    setRefinementData({ context: '', hazardIds: [] });
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="size-4 text-red-600" />;
      case 'medium': return <AlertTriangle className="size-4 text-amber-600" />;
      case 'low': return <AlertTriangle className="size-4 text-green-600" />;
      default: return null;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <SparklesIcon className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">UCCA Enumeration Engine</h3>
              <p className="text-sm text-muted-foreground">
                Automatically discover potential unsafe control action combinations
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-semibold">{potentialUCCAs.length}</p>
            <p className="text-sm text-muted-foreground">Potential UCCAs</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <AbstractionLevelSelector
            value={abstractionLevel}
            onChange={setAbstractionLevel}
            controllerCount={controllers.length}
          />
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Max Controllers:</label>
            <input
              type="number"
              min="2"
              max="5"
              value={maxControllers}
              onChange={(e) => setMaxControllers(Number(e.target.value))}
              className="w-16 px-2 py-1 border rounded-md"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <select
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value as any)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk Only</option>
              <option value="medium">Medium Risk Only</option>
              <option value="low">Low Risk Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {groupedUCCAs.map(([pattern, uccas]) => {
          const isExpanded = expandedGroups.has(pattern);
          
          return (
            <div key={pattern} className="border rounded-lg">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(pattern)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
                  <h4 className="font-medium">{pattern}</h4>
                  <span className="text-sm text-muted-foreground">({uccas.length} combinations)</span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Risk distribution */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-600">
                      {uccas.filter(u => u.riskLevel === 'high').length}H
                    </span>
                    <span className="text-amber-600">
                      {uccas.filter(u => u.riskLevel === 'medium').length}M
                    </span>
                    <span className="text-green-600">
                      {uccas.filter(u => u.riskLevel === 'low').length}L
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded UCCAs */}
              {isExpanded && (
                <div className="border-t divide-y">
                  {uccas.map(ucca => (
                    <div
                      key={ucca.id}
                      className={cn(
                        "p-4 hover:bg-muted/30 cursor-pointer transition-colors",
                        selectedUCCA?.id === ucca.id && "bg-primary/10"
                      )}
                      onClick={() => setSelectedUCCA(ucca)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getRiskIcon(ucca.riskLevel)}
                            <p className="text-sm">{ucca.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />
                              {ucca.controllerIds.length} controllers
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {ucca.combinationType}
                            </span>
                            <span>
                              Level: {ucca.abstractionLevel.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUCCA(ucca);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Refinement dialog */}
      {selectedUCCA && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Refine Potential UCCA</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add context and link hazards to create a formal UCCA
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUCCA(null);
                    setRefinementData({ context: '', hazardIds: [] });
                  }}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <XCircle className="size-5" />
                </button>
              </div>

              {/* UCCA details */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  {getRiskIcon(selectedUCCA.riskLevel)}
                  <span className="text-sm font-medium">{selectedUCCA.pattern}</span>
                </div>
                <p className="text-sm">{selectedUCCA.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Type: {selectedUCCA.combinationType}</span>
                  <span>Level: {selectedUCCA.abstractionLevel.toUpperCase()}</span>
                </div>
              </div>

              {/* Context input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Add specific context that makes this combination unsafe
                </label>
                <textarea
                  value={refinementData.context}
                  onChange={(e) => setRefinementData({ ...refinementData, context: e.target.value })}
                  placeholder="Describe the conditions under which this combination becomes hazardous..."
                  className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
                />
              </div>

              {/* Hazard selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Link to System Hazards</label>
                <div className="max-h-[200px] overflow-y-auto p-4 bg-muted/30 rounded-lg space-y-2">
                  {hazards.map(hazard => (
                    <label
                      key={hazard.id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={refinementData.hazardIds.includes(hazard.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRefinementData({
                              ...refinementData,
                              hazardIds: [...refinementData.hazardIds, hazard.id]
                            });
                          } else {
                            setRefinementData({
                              ...refinementData,
                              hazardIds: refinementData.hazardIds.filter(id => id !== hazard.id)
                            });
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{hazard.code}</p>
                        <p className="text-xs text-muted-foreground">{hazard.title}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedUCCA(null);
                    setRefinementData({ context: '', hazardIds: [] });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePromote}
                  disabled={!refinementData.context || refinementData.hazardIds.length === 0}
                  className="gap-2"
                >
                  <CheckCircle2 className="size-4" />
                  Create UCCA
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UCCAEnumerationEngine;