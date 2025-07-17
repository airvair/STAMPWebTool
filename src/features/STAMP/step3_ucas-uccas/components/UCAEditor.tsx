import React, { useState, useEffect, useMemo } from 'react';
import { UnsafeControlAction, Controller, ControlAction, UCAType, Hazard } from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, X, AlertCircle, Lightbulb, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateUCACode } from '@/utils/codeGenerator';
import { validateUCA } from '@/utils/ucaValidation';
import { generateSmartUcaSuggestions } from '@/utils/smartUcaSuggestions';

interface UCAEditorProps {
  isOpen: boolean;
  onClose: () => void;
  uca: UnsafeControlAction | null;
  selectedController: string | null;
  selectedControlAction: string | null;
  preselectedUCAType?: UCAType | null;
  controllers: Controller[];
  controlActions: ControlAction[];
}

interface ContextCondition {
  id: string;
  variable: string;
  operator: 'equals' | 'not-equals' | 'greater' | 'less' | 'contains';
  value: string;
}

const UCA_TYPES: { value: UCAType; label: string; description: string }[] = [
  { 
    value: UCAType.NotProvided, 
    label: 'Not Provided',
    description: 'Control action is not given when it should be'
  },
  { 
    value: UCAType.ProvidedUnsafe, 
    label: 'Provided',
    description: 'Control action is given when it should not be'
  },
  { 
    value: UCAType.TooEarly, 
    label: 'Too Early',
    description: 'Control action is given before it should be'
  },
  { 
    value: UCAType.TooLate, 
    label: 'Too Late',
    description: 'Control action is given after it should be'
  },
  { 
    value: UCAType.WrongOrder, 
    label: 'Wrong Order',
    description: 'Control action is given out of sequence'
  },
  { 
    value: UCAType.TooLong, 
    label: 'Too Long',
    description: 'Control action is applied for too long'
  },
  { 
    value: UCAType.TooShort, 
    label: 'Too Short',
    description: 'Control action is not applied long enough'
  }
];

const OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'not-equals', label: '≠' },
  { value: 'greater', label: '>' },
  { value: 'less', label: '<' },
  { value: 'contains', label: 'contains' }
];

const UCAEditor: React.FC<UCAEditorProps> = ({
  isOpen,
  onClose,
  uca,
  selectedController,
  selectedControlAction,
  preselectedUCAType,
  controllers,
  controlActions
}) => {
  const { hazards, ucas, addUCA, updateUCA } = useAnalysisContext();
  
  // Form state
  const [controllerId, setControllerId] = useState<string>('');
  const [controlActionId, setControlActionId] = useState<string>('');
  const [ucaType, setUcaType] = useState<UCAType>(UCAType.NotProvided);
  const [description, setDescription] = useState('');
  const [contextText, setContextText] = useState('');
  const [contextConditions, setContextConditions] = useState<ContextCondition[]>([]);
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [showStructuredContext, setShowStructuredContext] = useState(false);
  
  // UI state
  const [isHazardPopoverOpen, setIsHazardPopoverOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Initialize form when UCA changes or sheet opens
  useEffect(() => {
    if (uca) {
      // Editing existing UCA
      setControllerId(uca.controllerId);
      setControlActionId(uca.controlActionId);
      setUcaType(uca.ucaType);
      setDescription(uca.description);
      setContextText(uca.context);
      setSelectedHazards(uca.hazardIds);
      setShowStructuredContext(false);
      setContextConditions([]);
    } else {
      // Creating new UCA
      setControllerId(selectedController || '');
      setControlActionId(selectedControlAction || '');
      setUcaType(preselectedUCAType || UCAType.NotProvided);
      setDescription('');
      setContextText('');
      setSelectedHazards([]);
      setShowStructuredContext(true);
      setContextConditions([{
        id: Date.now().toString(),
        variable: '',
        operator: 'equals',
        value: ''
      }]);
    }
    setValidationErrors([]);
  }, [uca, selectedController, selectedControlAction, isOpen]);

  // Generate suggestions when type or action changes
    useEffect(() => {
    if (controlActionId && ucaType && controllerId && controlActions && controllers) {
      const action = controlActions.find(ca => ca.id === controlActionId);
      const controller = controllers.find(c => c.id === controllerId);
      
      if (action && controller) {
        const newSuggestions = generateSmartUcaSuggestions(
          [controller],
          [action],
          hazards,
          ucas || [],
          {
            prioritizeHighRiskControllers: true,
            considerHazardRelevance: true,
            balanceUcaTypes: true,
            focusOnMissingCombinations: true
          }
        ).filter(s => s.ucaType === ucaType && s.controlActionId === action.id);
        setSuggestions(newSuggestions.slice(0, 3));
      }
    }
  }, [controlActionId, ucaType, controllerId, controllers, controlActions, hazards, ucas]);

  // Filter control actions based on selected controller
  const availableControlActions = useMemo(() => {
    if (!controllerId) return [];
    return controlActions.filter(ca => ca.controllerId === controllerId);
  }, [controllerId, controlActions]);

  // Generate description automatically
    useEffect(() => {
    if (controllerId && controlActionId && ucaType && !uca && controllers && controlActions) {
      const controller = controllers.find(c => c.id === controllerId);
      const action = controlActions.find(ca => ca.id === controlActionId);
      
      if (controller && action) {
        const typeLabel = UCA_TYPES.find(t => t.value === ucaType)?.label || '';
        setDescription(`${controller.name} ${typeLabel}: ${action.verb} ${action.object}`);
      }
    }
  }, [controllerId, controlActionId, ucaType, controllers, controlActions, uca]);

  // Convert structured context to text
  const buildContextFromConditions = () => {
    if (contextConditions.length === 0) return '';
    
    return contextConditions
      .filter(c => c.variable && c.value)
      .map(c => {
        const op = OPERATORS.find(o => o.value === c.operator)?.label || c.operator;
        return `${c.variable} ${op} ${c.value}`;
      })
      .join(' AND ');
  };

  const handleAddCondition = () => {
    setContextConditions([
      ...contextConditions,
      {
        id: Date.now().toString(),
        variable: '',
        operator: 'equals',
        value: ''
      }
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setContextConditions(contextConditions.filter(c => c.id !== id));
  };

  const handleUpdateCondition = (id: string, field: keyof ContextCondition, value: string) => {
    setContextConditions(contextConditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleSelectHazard = (hazardId: string) => {
    if (selectedHazards.includes(hazardId)) {
      setSelectedHazards(selectedHazards.filter(id => id !== hazardId));
    } else {
      setSelectedHazards([...selectedHazards, hazardId]);
    }
  };

  const handleApplySuggestion = (suggestion: any) => {
    setContextText(suggestion.context);
    if (suggestion.suggestedHazards && suggestion.suggestedHazards.length > 0) {
      setSelectedHazards(suggestion.suggestedHazards);
    }
  };

  const handleSave = () => {
    // Build final context
    const finalContext = showStructuredContext 
      ? buildContextFromConditions() 
      : contextText;

    // Defensive checks for required data
    if (!controllers || !Array.isArray(controllers)) {
      setValidationErrors(['Controllers data is not available']);
      return;
    }

    if (!controlActions || !Array.isArray(controlActions)) {
      setValidationErrors(['Control actions data is not available']);
      return;
    }

    if (!hazards || !Array.isArray(hazards)) {
      setValidationErrors(['Hazards data is not available']);
      return;
    }

    try {
      // Validate
      const validation = validateUCA(
        {
          controllerId,
          controlActionId,
          ucaType,
          description,
          context: finalContext,
          hazardIds: selectedHazards
        },
        controllers,
        controlActions,
        hazards
      );

      if (!validation.valid) {
        setValidationErrors(validation.errors.map(e => e.message));
        return;
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationErrors(['An error occurred during validation. Please try again.']);
      return;
    }

    // Generate code if creating new
    const code = uca?.code || generateUCACode(ucaType, controlActionId);

    const ucaData: Omit<UnsafeControlAction, 'id'> = {
      code,
      controllerId,
      controlActionId,
      ucaType,
      description,
      context: finalContext,
      hazardIds: selectedHazards
    };

    if (uca) {
      updateUCA(uca.id, ucaData);
    } else {
      addUCA(ucaData);
    }

    onClose();
  };

  const getControllerName = (id: string) => {
    return controllers.find(c => c.id === id)?.name || '';
  };

  const getControlActionName = (id: string) => {
    const action = controlActions.find(ca => ca.id === id);
    return action ? `${action.verb} ${action.object}` : '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {uca ? 'Edit Unsafe Control Action' : 'Create Unsafe Control Action'}
          </DialogTitle>
          <DialogDescription>
            Define how a control action becomes unsafe under specific conditions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Controller Selection */}
            <div className="space-y-2">
              <Label htmlFor="controller">Controller</Label>
              <Select value={controllerId} onValueChange={setControllerId}>
                <SelectTrigger id="controller">
                  <SelectValue placeholder="Select a controller" />
                </SelectTrigger>
                <SelectContent>
                  {controllers.map(controller => (
                    <SelectItem key={controller.id} value={controller.id}>
                      <div className="flex items-center gap-2">
                        <span>{controller.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {controller.ctrlType}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Control Action Selection */}
            <div className="space-y-2">
              <Label htmlFor="action">Control Action</Label>
              <Select 
                value={controlActionId} 
                onValueChange={setControlActionId}
                disabled={!controllerId}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="Select a control action" />
                </SelectTrigger>
                <SelectContent>
                  {availableControlActions.map(action => (
                    <SelectItem key={action.id} value={action.id}>
                      {action.verb} {action.object}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* UCA Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="type">UCA Type</Label>
              <Select value={ucaType} onValueChange={(value) => setUcaType(value as UCAType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UCA_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the unsafe control action..."
                className="min-h-[60px]"
              />
            </div>

            <Separator />

            {/* Context Definition */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Context</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStructuredContext(!showStructuredContext)}
                >
                  {showStructuredContext ? 'Switch to Text' : 'Switch to Structured'}
                </Button>
              </div>

              {showStructuredContext ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Define specific conditions that make this control action unsafe
                  </p>
                  
                  {contextConditions.map((condition, index) => (
                    <div key={condition.id} className="flex items-center gap-2">
                      {index > 0 && (
                        <span className="text-sm font-medium text-gray-500 w-10">AND</span>
                      )}
                      <div className={cn("flex-1 grid grid-cols-3 gap-2", index > 0 && "ml-10")}>
                        <input
                          type="text"
                          placeholder="Variable (e.g., Speed)"
                          value={condition.variable}
                          onChange={(e) => handleUpdateCondition(condition.id, 'variable', e.target.value)}
                          className="px-3 py-1.5 text-sm border rounded-md"
                        />
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => handleUpdateCondition(condition.id, 'operator', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <input
                          type="text"
                          placeholder="Value"
                          value={condition.value}
                          onChange={(e) => handleUpdateCondition(condition.id, 'value', e.target.value)}
                          className="px-3 py-1.5 text-sm border rounded-md"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveCondition(condition.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCondition}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
              ) : (
                <Textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Describe the specific conditions that make this control action unsafe..."
                  className="min-h-[100px]"
                />
              )}
            </div>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <Label className="text-sm">Suggested Contexts</Label>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                      onClick={() => handleApplySuggestion(suggestion)}
                    >
                      <p className="text-sm">{suggestion.context}</p>
                      {suggestion.reasoning && (
                        <p className="text-xs text-gray-500 mt-1">{suggestion.reasoning}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Hazard Selection */}
            <div className="space-y-2">
              <Label>Linked Hazards</Label>
              <p className="text-sm text-gray-600">
                Select hazards that could result from this unsafe control action
              </p>
              
              <Popover open={isHazardPopoverOpen} onOpenChange={setIsHazardPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hazards
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search hazards..." />
                    <CommandEmpty>No hazards found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-64">
                        {hazards.map(hazard => (
                          <CommandItem
                            key={hazard.id}
                            onSelect={() => handleSelectHazard(hazard.id)}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className={cn(
                                "h-4 w-4 border rounded",
                                selectedHazards.includes(hazard.id) && "bg-blue-600 border-blue-600"
                              )}>
                                {selectedHazards.includes(hazard.id) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{hazard.code}</div>
                                <div className="text-sm text-gray-600 line-clamp-2">
                                  {hazard.description}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedHazards.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedHazards.map(hazardId => {
                    const hazard = hazards.find(h => h.id === hazardId);
                    if (!hazard) return null;
                    
                    return (
                      <Badge key={hazardId} variant="secondary">
                        {hazard.code}
                        <button
                          onClick={() => handleSelectHazard(hazardId)}
                          className="ml-1 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {uca ? 'Update' : 'Create'} UCA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UCAEditor;