import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Brain, AlertTriangle, CheckCircle, Settings, Shield, Users, Zap, Layers } from 'lucide-react';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { 
  PotentialUCCA, 
  UCCA, 
  UCCAType, 
  AbstractUCCA, 
  UCCARefinementConfig,
  AuthorityRelationship,
  InterchangeableControllerGroup,
  SpecialInteraction
} from '@/types/types';
import { UCCAIdentificationAlgorithm } from '@/utils/uccaAlgorithms';
import { EnhancedUCCAEnumerator, UCCAEnumerationConfig } from '@/utils/enhancedUccaAlgorithms';
import { UCCARefinementEngine } from '@/lib/analysis/uccaRefinement';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { AuthorityConfigurator } from './AuthorityConfigurator';
import { InterchangeableControllersManager } from './InterchangeableControllersManager';
import { SpecialInteractionsEditor } from './SpecialInteractionsEditor';

interface UCCAAlgorithmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (uccas: Omit<UCCA, 'id' | 'code'>[]) => void;
}

export const UCCAAlgorithmDialog: React.FC<UCCAAlgorithmDialogProps> = ({ 
  isOpen, 
  onClose, 
  onImport 
}) => {
  const { controllers, controlActions, ucas, uccas, hazards } = useAnalysisContext();
  
  // Algorithm configuration state
  const [algorithmType, setAlgorithmType] = useState<'basic' | 'enhanced'>('basic');
  const [abstractionLevel, setAbstractionLevel] = useState<'2a' | '2b'>('2b');
  const [maxControllers, setMaxControllers] = useState(3);
  const [enableType1_2, setEnableType1_2] = useState(true);
  const [enableType3_4, setEnableType3_4] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState(0.3);
  
  // Refinement configuration state
  const [enableRefinement, setEnableRefinement] = useState(false);
  const [authorityRelationships, setAuthorityRelationships] = useState<AuthorityRelationship[]>([]);
  const [interchangeableGroups, setInterchangeableGroups] = useState<InterchangeableControllerGroup[]>([]);
  const [specialInteractions, setSpecialInteractions] = useState<SpecialInteraction[]>([]);
  const [pruneEquivalent, setPruneEquivalent] = useState(true);
  const [includePartialAuthority, setIncludePartialAuthority] = useState(false);
  
  // Configuration dialog states
  const [showAuthorityConfig, setShowAuthorityConfig] = useState(false);
  const [showInterchangeableConfig, setShowInterchangeableConfig] = useState(false);
  const [showSpecialInteractionsConfig, setShowSpecialInteractionsConfig] = useState(false);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUCCAs, setGeneratedUCCAs] = useState<PotentialUCCA[]>([]);
  const [selectedUCCAs, setSelectedUCCAs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generation' | 'refinement'>('generation');

  // Generate UCCAs using selected algorithm
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedUCCAs([]);
    setSelectedUCCAs(new Set());

    try {
      let results: PotentialUCCA[] = [];
      
      if (algorithmType === 'basic') {
        // Use basic algorithm
        const algorithm = new UCCAIdentificationAlgorithm(controllers, controlActions, ucas);
        results = algorithm.enumerateControlActionCombinations(abstractionLevel, maxControllers);
      } else {
        // Use enhanced algorithm
        const config: Partial<UCCAEnumerationConfig> = {
          maxCombinationSize: maxControllers,
          enableType1_2,
          enableType3_4,
          enableAbstraction2a: abstractionLevel === '2a',
          enableAbstraction2b: abstractionLevel === '2b',
          riskThreshold,
          prioritizeByHazards: true,
          includeTemporalAnalysis: enableType3_4
        };
        
        const enumerator = new EnhancedUCCAEnumerator(config);
        const result = await enumerator.enumerateUCCAs({
          controllers,
          controlActions,
          existingUCAs: ucas,
          hazards,
          existingUCCAs: uccas,
          interchangeableControllers: interchangeableGroups,
          specialInteractions: specialInteractions.reduce((acc, si) => ({
            ...acc,
            [si.id]: si
          }), {})
        });
        
        results = result.potentialUCCAs;
      }
      
      // Apply refinement if enabled
      if (enableRefinement && authorityRelationships.length > 0) {
        const refinementConfig: UCCARefinementConfig = {
          authorityRelationships,
          interchangeableGroups,
          specialInteractions,
          pruneEquivalent,
          includePartialAuthority
        };
        
        const refinementEngine = new UCCARefinementEngine(refinementConfig, controllers, controlActions);
        
        // Convert potential UCCAs to abstract UCCAs for refinement
        const abstractUCCAs: AbstractUCCA[] = results.map(ucca => ({
          ...ucca,
          id: ucca.id || '',
          code: ucca.code || '',
          isAbstract: true,
          abstractionLevel,
          abstractPattern: ucca.description,
          relevantActions: ucca.involvedControlActionIds
        } as AbstractUCCA));
        
        // Refine and get hierarchies
        const hierarchies = refinementEngine.refineAbstractUCCAs(abstractUCCAs);
        
        // Flatten refined UCCAs back to potential UCCAs for display
        results = hierarchies.flatMap(h => 
          h.refinedUCCAs
            .filter(r => !r.isPruned || !pruneEquivalent)
            .map(r => ({
              ...r,
              id: r.id,
              description: r.description,
              context: r.context,
              hazardIds: r.hazardIds,
              uccaType: r.uccaType,
              involvedControllerIds: r.involvedControllerIds,
              involvedControlActionIds: r.specificControllerAssignments.map(a => a.controlActionId),
              riskScore: r.priorityScore || 0
            } as PotentialUCCA))
        );
      }
      
      setGeneratedUCCAs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate UCCAs');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle selection of a UCCA
  const toggleSelection = (uccaId: string) => {
    const newSelection = new Set(selectedUCCAs);
    if (newSelection.has(uccaId)) {
      newSelection.delete(uccaId);
    } else {
      newSelection.add(uccaId);
    }
    setSelectedUCCAs(newSelection);
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedUCCAs.size === generatedUCCAs.length) {
      setSelectedUCCAs(new Set());
    } else {
      setSelectedUCCAs(new Set(generatedUCCAs.map(u => u.id)));
    }
  };

  // Import selected UCCAs
  const handleImport = () => {
    const selectedPotentials = generatedUCCAs.filter(u => selectedUCCAs.has(u.id));
    
    // Convert PotentialUCCAs to UCCAs
    const uccasToImport: Omit<UCCA, 'id' | 'code'>[] = selectedPotentials.map(potential => {
      // Determine UCCA type based on combination type
      let uccaType: UCCAType;
      switch (potential.combinationType) {
        case 'hierarchical':
          uccaType = UCCAType.Organizational;
          break;
        case 'temporal':
          uccaType = UCCAType.Temporal;
          break;
        default:
          uccaType = UCCAType.CrossController;
      }

      return {
        description: potential.description,
        context: `Generated from ${potential.pattern} pattern`, // User should update this
        hazardIds: [], // User needs to link hazards
        uccaType,
        involvedControllerIds: potential.controllerIds,
        temporalRelationship: potential.combinationType === 'temporal' ? 'Sequential' : 'Simultaneous',
        isSystematic: true,
        specificCause: potential.pattern
      };
    });

    onImport(uccasToImport);
    onClose();
  };

  // Get risk level badge color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const canGenerate = controllers.length >= 2 && controlActions.length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              UCCA Algorithm Assistant
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generation">
                <Layers className="h-4 w-4 mr-2" />
                Generation
              </TabsTrigger>
              <TabsTrigger value="refinement">
                <Settings className="h-4 w-4 mr-2" />
                Refinement
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="generation" className="flex-1 flex gap-6 min-h-0 mt-4">
          {/* Left Panel - Configuration */}
          <div className="w-80 space-y-6">
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Algorithm Configuration</h3>
              
              {/* Algorithm Type */}
              <div className="space-y-2">
                <Label>Algorithm Type</Label>
                <Select value={algorithmType} onValueChange={(v) => setAlgorithmType(v as 'basic' | 'enhanced')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Enumeration</SelectItem>
                    <SelectItem value="enhanced">Enhanced (with Risk Analysis)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Abstraction Level */}
              <div className="space-y-2">
                <Label>Abstraction Level</Label>
                <Select value={abstractionLevel} onValueChange={(v) => setAbstractionLevel(v as '2a' | '2b')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2a">2a - Team Level</SelectItem>
                    <SelectItem value="2b">2b - Controller Specific</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {abstractionLevel === '2a' 
                    ? 'Groups controllers by team/organization'
                    : 'Considers all controller combinations'}
                </p>
              </div>

              {/* Max Controllers */}
              <div className="space-y-2">
                <Label>Max Controllers in Combination: {maxControllers}</Label>
                <Slider
                  value={[maxControllers]}
                  onValueChange={([v]) => setMaxControllers(v)}
                  min={2}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* UCCA Types */}
              <div className="space-y-3">
                <Label>UCCA Types to Generate</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="type12"
                      checked={enableType1_2}
                      onCheckedChange={setEnableType1_2}
                    />
                    <Label htmlFor="type12" className="text-sm font-normal cursor-pointer">
                      Type 1-2: Provide/Not Provide
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="type34"
                      checked={enableType3_4}
                      onCheckedChange={setEnableType3_4}
                    />
                    <Label htmlFor="type34" className="text-sm font-normal cursor-pointer">
                      Type 3-4: Temporal (Sequential)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Risk Threshold (Enhanced only) */}
              {algorithmType === 'enhanced' && (
                <div className="space-y-2">
                  <Label>Risk Threshold: {(riskThreshold * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[riskThreshold]}
                    onValueChange={([v]) => setRiskThreshold(v)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={!canGenerate || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate UCCAs'
                )}
              </Button>

              {!canGenerate && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Need at least 2 controllers and some control actions to generate UCCAs.
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 flex flex-col min-h-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {generatedUCCAs.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">
                      Generated UCCAs ({selectedUCCAs.size} of {generatedUCCAs.length} selected)
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {selectedUCCAs.size === generatedUCCAs.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-4 space-y-3">
                    {generatedUCCAs.map((ucca) => (
                      <Card 
                        key={ucca.id} 
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedUCCAs.has(ucca.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleSelection(ucca.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedUCCAs.has(ucca.id)}
                            onCheckedChange={() => toggleSelection(ucca.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={getRiskLevelColor(ucca.riskLevel)}>
                                {ucca.riskLevel} risk
                              </Badge>
                              <Badge variant="outline">
                                {ucca.combinationType}
                              </Badge>
                              <Badge variant="outline">
                                {ucca.abstractionLevel}
                              </Badge>
                            </div>
                            <p className="text-sm">{ucca.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Pattern: {ucca.pattern}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Controllers: {ucca.controllerIds.map(id => 
                                controllers.find(c => c.id === id)?.name || 'Unknown'
                              ).join(', ')}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}

            {!isGenerating && generatedUCCAs.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Configure and run the algorithm to generate UCCA suggestions</p>
                </div>
              </div>
            )}
          </div>
            </TabsContent>
            
            <TabsContent value="refinement" className="flex-1 flex flex-col gap-4 mt-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Refinement Configuration</h3>
                  <Switch
                    checked={enableRefinement}
                    onCheckedChange={setEnableRefinement}
                    aria-label="Enable refinement"
                  />
                </div>
                
                {enableRefinement && (
                  <div className="space-y-4">
                    {/* Authority Configuration */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium">Authority Configuration</p>
                            <p className="text-sm text-gray-600">Define controller-action authorities</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {authorityRelationships.length} defined
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAuthorityConfig(true)}
                          >
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Interchangeable Controllers */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium">Interchangeable Controllers</p>
                            <p className="text-sm text-gray-600">Define controller equivalence groups</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {interchangeableGroups.length} groups
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowInterchangeableConfig(true)}
                          >
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Special Interactions */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-600" />
                          <div>
                            <p className="font-medium">Special Interactions</p>
                            <p className="text-sm text-gray-600">Define special rules and patterns</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {specialInteractions.length} rules
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowSpecialInteractionsConfig(true)}
                          >
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Refinement Options */}
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="prune-equivalent" className="text-sm font-normal cursor-pointer">
                          Prune equivalent combinations
                        </Label>
                        <Switch
                          id="prune-equivalent"
                          checked={pruneEquivalent}
                          onCheckedChange={setPruneEquivalent}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="partial-authority" className="text-sm font-normal cursor-pointer">
                          Include partial authority scenarios
                        </Label>
                        <Switch
                          id="partial-authority"
                          checked={includePartialAuthority}
                          onCheckedChange={setIncludePartialAuthority}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              
              {enableRefinement && authorityRelationships.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Authority configuration is required for refinement. Click "Configure" above to set up controller authorities.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={selectedUCCAs.size === 0}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Import {selectedUCCAs.size} Selected UCCA{selectedUCCAs.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Configuration Dialogs */}
    <AuthorityConfigurator
      isOpen={showAuthorityConfig}
      onClose={() => setShowAuthorityConfig(false)}
      onSave={setAuthorityRelationships}
      initialRelationships={authorityRelationships}
    />
    
    <InterchangeableControllersManager
      isOpen={showInterchangeableConfig}
      onClose={() => setShowInterchangeableConfig(false)}
      onSave={setInterchangeableGroups}
      initialGroups={interchangeableGroups}
    />
    
    <SpecialInteractionsEditor
      isOpen={showSpecialInteractionsConfig}
      onClose={() => setShowSpecialInteractionsConfig(false)}
      onSave={setSpecialInteractions}
      initialInteractions={specialInteractions}
    />
  </>
  );
};