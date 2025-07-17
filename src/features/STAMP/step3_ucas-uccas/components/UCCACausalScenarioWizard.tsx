import React, { useState } from 'react';
import {
  UCCA,
  RefinedUCCA,
  Controller,
  ControlAction,
  Hazard,
  CausalScenario,
  CausalFactor
} from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelect } from '@/components/ui/multi-select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Users,
  GitBranch,
  Zap,
  Shield,
  Target,
  FileText,
  Brain,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface UCCACausalScenarioWizardProps {
  isOpen: boolean;
  onClose: () => void;
  ucca: UCCA | RefinedUCCA;
  onSave: (scenarios: CausalScenario[]) => void;
}

type WizardStep = 'context' | 'factors' | 'interactions' | 'constraints';

interface CausalFactorCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  factors: {
    id: string;
    name: string;
    description: string;
    questions: string[];
  }[];
}

const CAUSAL_FACTOR_CATEGORIES: CausalFactorCategory[] = [
  {
    id: 'controller',
    name: 'Controller Issues',
    description: 'Problems with individual controllers',
    icon: <Users className="h-4 w-4" />,
    factors: [
      {
        id: 'inadequate-control-algorithm',
        name: 'Inadequate Control Algorithm',
        description: 'Controller logic does not handle all cases',
        questions: [
          'Are there missing cases in the control logic?',
          'Does the algorithm fail under certain conditions?',
          'Are there inadequate decision criteria?'
        ]
      },
      {
        id: 'inadequate-process-model',
        name: 'Inadequate Process Model',
        description: 'Controller has incorrect understanding of system state',
        questions: [
          'Is the controller\'s model of the system accurate?',
          'Are there delays in updating the process model?',
          'Are there missing state variables?'
        ]
      },
      {
        id: 'inappropriate-control-action',
        name: 'Inappropriate Control Action',
        description: 'Controller provides wrong action for the context',
        questions: [
          'Does the controller misinterpret the situation?',
          'Are control actions appropriate for all contexts?',
          'Are there conflicting goals or priorities?'
        ]
      }
    ]
  },
  {
    id: 'coordination',
    name: 'Coordination Failures',
    description: 'Problems with multi-controller interactions',
    icon: <GitBranch className="h-4 w-4" />,
    factors: [
      {
        id: 'communication-flaws',
        name: 'Communication Flaws',
        description: 'Information not shared properly between controllers',
        questions: [
          'Is critical information shared between controllers?',
          'Are there delays in communication?',
          'Is information lost or corrupted in transmission?'
        ]
      },
      {
        id: 'conflicting-control-actions',
        name: 'Conflicting Control Actions',
        description: 'Controllers provide incompatible actions',
        questions: [
          'Do controllers have conflicting goals?',
          'Are control actions coordinated?',
          'Is there a clear priority scheme?'
        ]
      },
      {
        id: 'synchronization-issues',
        name: 'Synchronization Issues',
        description: 'Timing problems between controllers',
        questions: [
          'Are actions properly synchronized?',
          'Do timing delays cause conflicts?',
          'Is there a race condition between controllers?'
        ]
      }
    ]
  },
  {
    id: 'feedback',
    name: 'Feedback Issues',
    description: 'Problems with sensing and feedback',
    icon: <Zap className="h-4 w-4" />,
    factors: [
      {
        id: 'missing-feedback',
        name: 'Missing Feedback',
        description: 'Controllers lack necessary information',
        questions: [
          'Do controllers receive feedback about their actions?',
          'Is system state observable by all controllers?',
          'Are there blind spots in sensing?'
        ]
      },
      {
        id: 'delayed-feedback',
        name: 'Delayed Feedback',
        description: 'Information arrives too late',
        questions: [
          'Are feedback delays acceptable?',
          'Do delays cause controllers to act on stale information?',
          'Can the system compensate for delays?'
        ]
      },
      {
        id: 'incorrect-feedback',
        name: 'Incorrect Feedback',
        description: 'Controllers receive wrong information',
        questions: [
          'Is feedback accurate and reliable?',
          'Are sensors properly calibrated?',
          'Can faulty feedback be detected?'
        ]
      }
    ]
  },
  {
    id: 'external',
    name: 'External Factors',
    description: 'Environmental and system-level issues',
    icon: <AlertCircle className="h-4 w-4" />,
    factors: [
      {
        id: 'environmental-conditions',
        name: 'Environmental Conditions',
        description: 'External conditions affecting control',
        questions: [
          'Do environmental factors affect control actions?',
          'Are there unexpected disturbances?',
          'Is the system robust to environmental changes?'
        ]
      },
      {
        id: 'system-constraints',
        name: 'System Constraints',
        description: 'Physical or design limitations',
        questions: [
          'Are there physical constraints limiting actions?',
          'Do design decisions create conflicts?',
          'Are resources adequately allocated?'
        ]
      }
    ]
  }
];

export const UCCACausalScenarioWizard: React.FC<UCCACausalScenarioWizardProps> = ({
  isOpen,
  onClose,
  ucca,
  onSave
}) => {
  const { controllers, controlActions, hazards } = useAnalysisContext();
  const [currentStep, setCurrentStep] = useState<WizardStep>('context');
  const [scenarios, setScenarios] = useState<CausalScenario[]>([]);
  
  // Form state
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [selectedFactors, setSelectedFactors] = useState<Set<string>>(new Set());
  const [factorDetails, setFactorDetails] = useState<Map<string, string>>(new Map());
  const [interactions, setInteractions] = useState<string[]>([]);
  const [safetyConstraints, setSafetyConstraints] = useState<string[]>([]);
  const [recommendedActions, setRecommendedActions] = useState<string[]>([]);

  // Get display names
  const getControllerName = (id: string) => controllers.find(c => c.id === id)?.name || 'Unknown';
  const getActionName = (id: string) => controlActions.find(a => a.id === id)?.name || 'Unknown';
  const getHazard = (id: string) => hazards.find(h => h.id === id);

  // Step configuration
  const steps: { id: WizardStep; title: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'context',
      title: 'Scenario Context',
      description: 'Define the causal scenario context',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'factors',
      title: 'Causal Factors',
      description: 'Identify why the UCCA can occur',
      icon: <Brain className="h-5 w-5" />
    },
    {
      id: 'interactions',
      title: 'Factor Interactions',
      description: 'Analyze how factors combine',
      icon: <GitBranch className="h-5 w-5" />
    },
    {
      id: 'constraints',
      title: 'Safety Constraints',
      description: 'Define prevention measures',
      icon: <Shield className="h-5 w-5" />
    }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Navigation
  const canGoNext = () => {
    switch (currentStep) {
      case 'context':
        return scenarioName.trim() && scenarioDescription.trim();
      case 'factors':
        return selectedFactors.size > 0;
      case 'interactions':
        return interactions.length > 0;
      case 'constraints':
        return safetyConstraints.length > 0;
      default:
        return false;
    }
  };

  const goToNext = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id);
    }
  };

  const goToPrevious = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  // Save scenario
  const handleSave = () => {
    const causalFactors: CausalFactor[] = Array.from(selectedFactors).map(factorId => {
      // Find the factor in categories
      let factorInfo: any = null;
      let categoryName = '';
      
      CAUSAL_FACTOR_CATEGORIES.forEach(category => {
        const found = category.factors.find(f => f.id === factorId);
        if (found) {
          factorInfo = found;
          categoryName = category.name;
        }
      });

      return {
        id: uuidv4(),
        category: categoryName,
        description: factorInfo?.name || factorId,
        details: factorDetails.get(factorId) || ''
      };
    });

    const scenario: CausalScenario = {
      id: uuidv4(),
      name: scenarioName,
      description: scenarioDescription,
      uccaId: ucca.id,
      causalFactors,
      factorInteractions: interactions,
      safetyConstraints: safetyConstraints.map((constraint, index) => ({
        id: uuidv4(),
        description: constraint,
        type: 'Preventive',
        enforcedBy: [],
        rationale: recommendedActions[index] || ''
      })),
      likelihood: 'Medium',
      severity: 'High',
      riskLevel: 'High'
    };

    setScenarios([...scenarios, scenario]);
    
    // Reset form for next scenario
    setScenarioName('');
    setScenarioDescription('');
    setSelectedFactors(new Set());
    setFactorDetails(new Map());
    setInteractions([]);
    setSafetyConstraints([]);
    setRecommendedActions([]);
    setCurrentStep('context');
  };

  const handleFinish = () => {
    if (scenarios.length > 0) {
      onSave(scenarios);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>UCCA Causal Scenario Analysis</DialogTitle>
          <DialogDescription>
            Analyzing: {ucca.code} - {ucca.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.icon}
                <span className="hidden md:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* UCCA Info */}
        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{ucca.code}</Badge>
              <span className="text-sm font-medium">{ucca.uccaType}</span>
            </div>
            <p className="text-sm">{ucca.context}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Controllers:</span>
              {ucca.involvedControllerIds.map(id => (
                <Badge key={id} variant="secondary" className="text-xs">
                  {getControllerName(id)}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hazards:</span>
              {ucca.hazardIds.map(id => {
                const hazard = getHazard(id);
                return hazard ? (
                  <Badge key={id} variant="destructive" className="text-xs">
                    {hazard.code}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        </Card>

        {/* Step Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'context' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g., Simultaneous Control Conflict During Emergency"
                />
              </div>
              
              <div>
                <Label htmlFor="scenario-description">Scenario Description</Label>
                <Textarea
                  id="scenario-description"
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  placeholder="Describe the specific scenario where this UCCA leads to a hazard..."
                  rows={4}
                />
              </div>

              <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Scenario Context Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Describe the specific conditions under which the UCCA occurs</li>
                      <li>Include relevant system state and environmental factors</li>
                      <li>Explain why this particular combination is hazardous</li>
                      <li>Reference the specific controllers and actions involved</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {currentStep === 'factors' && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {CAUSAL_FACTOR_CATEGORIES.map(category => (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 mb-3">
                      {category.icon}
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    <div className="space-y-3">
                      {category.factors.map(factor => {
                        const isSelected = selectedFactors.has(factor.id);
                        return (
                          <Card
                            key={factor.id}
                            className={cn(
                              "p-4 cursor-pointer transition-colors",
                              isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                            )}
                            onClick={() => {
                              const newSelected = new Set(selectedFactors);
                              if (isSelected) {
                                newSelected.delete(factor.id);
                                factorDetails.delete(factor.id);
                              } else {
                                newSelected.add(factor.id);
                              }
                              setSelectedFactors(newSelected);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => {}}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{factor.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {factor.description}
                                </p>
                                <div className="mt-2 space-y-1">
                                  {factor.questions.map((question, idx) => (
                                    <p key={idx} className="text-xs text-muted-foreground">
                                      • {question}
                                    </p>
                                  ))}
                                </div>
                                {isSelected && (
                                  <div className="mt-3">
                                    <Textarea
                                      value={factorDetails.get(factor.id) || ''}
                                      onChange={(e) => {
                                        const newDetails = new Map(factorDetails);
                                        newDetails.set(factor.id, e.target.value);
                                        setFactorDetails(newDetails);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="Provide specific details about how this factor contributes..."
                                      rows={2}
                                      className="text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {currentStep === 'interactions' && (
            <div className="space-y-4">
              <div>
                <Label>How do these factors interact?</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Describe how the selected causal factors combine to create the hazardous scenario
                </p>
                
                <div className="space-y-3">
                  {interactions.map((interaction, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={interaction}
                        onChange={(e) => {
                          const newInteractions = [...interactions];
                          newInteractions[index] = e.target.value;
                          setInteractions(newInteractions);
                        }}
                        placeholder="Describe factor interaction..."
                        rows={2}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setInteractions(interactions.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => setInteractions([...interactions, ''])}
                    className="w-full"
                  >
                    Add Interaction
                  </Button>
                </div>
              </div>

              <Card className="p-4">
                <h4 className="font-medium mb-2">Selected Causal Factors:</h4>
                <div className="space-y-2">
                  {Array.from(selectedFactors).map(factorId => {
                    const factor = CAUSAL_FACTOR_CATEGORIES
                      .flatMap(c => c.factors)
                      .find(f => f.id === factorId);
                    return factor ? (
                      <div key={factorId}>
                        <p className="text-sm font-medium">{factor.name}</p>
                        {factorDetails.get(factorId) && (
                          <p className="text-xs text-muted-foreground">
                            {factorDetails.get(factorId)}
                          </p>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </Card>
            </div>
          )}

          {currentStep === 'constraints' && (
            <div className="space-y-4">
              <div>
                <Label>Safety Constraints</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Define constraints to prevent this causal scenario
                </p>
                
                <div className="space-y-3">
                  {safetyConstraints.map((constraint, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Constraint {index + 1}</Label>
                          <Textarea
                            value={constraint}
                            onChange={(e) => {
                              const newConstraints = [...safetyConstraints];
                              newConstraints[index] = e.target.value;
                              setSafetyConstraints(newConstraints);
                            }}
                            placeholder="Define the safety constraint..."
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-sm">Recommended Implementation</Label>
                          <Textarea
                            value={recommendedActions[index] || ''}
                            onChange={(e) => {
                              const newActions = [...recommendedActions];
                              newActions[index] = e.target.value;
                              setRecommendedActions(newActions);
                            }}
                            placeholder="How should this constraint be implemented?"
                            rows={2}
                          />
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSafetyConstraints(safetyConstraints.filter((_, i) => i !== index));
                            setRecommendedActions(recommendedActions.filter((_, i) => i !== index));
                          }}
                        >
                          Remove Constraint
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSafetyConstraints([...safetyConstraints, '']);
                      setRecommendedActions([...recommendedActions, '']);
                    }}
                    className="w-full"
                  >
                    Add Safety Constraint
                  </Button>
                </div>
              </div>

              {scenarios.length > 0 && (
                <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm">
                      {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''} analyzed
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStepIndex < steps.length - 1 ? (
              <Button
                onClick={goToNext}
                disabled={!canGoNext()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={!canGoNext()}
              >
                Save Scenario
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {scenarios.length > 0 && (
              <Button onClick={handleFinish}>
                Finish Analysis ({scenarios.length} scenarios)
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};