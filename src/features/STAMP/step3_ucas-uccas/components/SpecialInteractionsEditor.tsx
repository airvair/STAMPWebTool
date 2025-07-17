import React, { useState } from 'react';
import { Controller, ControlAction, SpecialInteraction } from '@/types/types';
import { useAnalysisContext } from '@/context/AnalysisContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Edit, 
  Ban,
  Star,
  GitBranch,
  AlertTriangle,
  Info,
  Copy,
  FileDown,
  FileUp,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface SpecialInteractionsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (interactions: SpecialInteraction[]) => void;
  initialInteractions?: SpecialInteraction[];
}

const INTERACTION_TYPE_CONFIG = {
  Mandatory: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    description: 'Combinations that must always be considered'
  },
  Prohibited: {
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    description: 'Combinations that should never occur'
  },
  Conditional: {
    icon: GitBranch,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'Combinations that apply under specific conditions'
  },
  Priority: {
    icon: Star,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    description: 'Combinations with special priority weighting'
  }
};

export const SpecialInteractionsEditor: React.FC<SpecialInteractionsEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialInteractions = []
}) => {
  const { controllers, controlActions } = useAnalysisContext();
  const [interactions, setInteractions] = useState<SpecialInteraction[]>(initialInteractions);
  const [editingInteraction, setEditingInteraction] = useState<SpecialInteraction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteInteractionId, setDeleteInteractionId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'Mandatory' as SpecialInteraction['type'],
    description: '',
    involvedControllerIds: [] as string[],
    involvedControlActionIds: [] as string[],
    conditions: [] as string[],
    priority: 5,
    appliesTo: 'Both' as SpecialInteraction['appliesTo']
  });

  // Get names for display
  const getControllerName = (id: string) => controllers.find(c => c.id === id)?.name || 'Unknown';
  const getActionName = (id: string) => controlActions.find(a => a.id === id)?.name || 'Unknown';

  // Controller and action options for multiselect
  const controllerOptions = controllers.map(c => ({ value: c.id, label: c.name }));
  const actionOptions = controlActions.map(a => ({ value: a.id, label: a.name }));

  // Predefined templates
  const templates = [
    {
      name: 'Critical Safety Override',
      type: 'Mandatory' as const,
      description: 'Emergency stop must override all other actions',
      template: {
        type: 'Mandatory',
        description: 'Emergency stop overrides all other control actions',
        conditions: ['Emergency condition detected'],
        appliesTo: 'Both' as const
      }
    },
    {
      name: 'Conflicting Actions',
      type: 'Prohibited' as const,
      description: 'Actions that conflict and should never occur together',
      template: {
        type: 'Prohibited',
        description: 'Conflicting actions that could cause system instability',
        appliesTo: 'Type1-2' as const
      }
    },
    {
      name: 'Sequential Dependency',
      type: 'Conditional' as const,
      description: 'Actions that must occur in specific order',
      template: {
        type: 'Conditional',
        description: 'Action B can only occur after Action A is complete',
        conditions: ['Action A completed successfully'],
        appliesTo: 'Type3-4' as const
      }
    },
    {
      name: 'High-Risk Combination',
      type: 'Priority' as const,
      description: 'Combinations requiring priority analysis',
      template: {
        type: 'Priority',
        description: 'High-risk combination requiring detailed analysis',
        priority: 9,
        appliesTo: 'Both' as const
      }
    }
  ];

  // Start creating new interaction
  const handleCreateInteraction = () => {
    setFormData({
      type: 'Mandatory',
      description: '',
      involvedControllerIds: [],
      involvedControlActionIds: [],
      conditions: [],
      priority: 5,
      appliesTo: 'Both'
    });
    setEditingInteraction(null);
    setIsEditDialogOpen(true);
  };

  // Apply template
  const applyTemplate = (template: typeof templates[0]) => {
    setFormData(prev => ({
      ...prev,
      ...template.template,
      conditions: template.template.conditions || []
    }));
  };

  // Edit existing interaction
  const handleEditInteraction = (interaction: SpecialInteraction) => {
    setFormData({
      type: interaction.type,
      description: interaction.description,
      involvedControllerIds: interaction.involvedControllerIds || [],
      involvedControlActionIds: interaction.involvedControlActionIds || [],
      conditions: interaction.conditions || [],
      priority: interaction.priority || 5,
      appliesTo: interaction.appliesTo
    });
    setEditingInteraction(interaction);
    setIsEditDialogOpen(true);
  };

  // Save interaction
  const handleSaveInteraction = () => {
    if (!formData.description) return;

    const interactionData: SpecialInteraction = {
      id: editingInteraction?.id || uuidv4(),
      type: formData.type,
      description: formData.description,
      involvedControllerIds: formData.involvedControllerIds.length > 0 ? formData.involvedControllerIds : undefined,
      involvedControlActionIds: formData.involvedControlActionIds.length > 0 ? formData.involvedControlActionIds : undefined,
      conditions: formData.conditions.length > 0 ? formData.conditions : undefined,
      priority: formData.type === 'Priority' ? formData.priority : undefined,
      appliesTo: formData.appliesTo
    };

    if (editingInteraction) {
      setInteractions(interactions.map(i => i.id === editingInteraction.id ? interactionData : i));
    } else {
      setInteractions([...interactions, interactionData]);
    }

    setIsEditDialogOpen(false);
    setEditingInteraction(null);
  };

  // Delete interaction
  const handleDeleteInteraction = (id: string) => {
    setInteractions(interactions.filter(i => i.id !== id));
    setDeleteInteractionId(null);
  };

  // Duplicate interaction
  const handleDuplicateInteraction = (interaction: SpecialInteraction) => {
    const newInteraction: SpecialInteraction = {
      ...interaction,
      id: uuidv4(),
      description: `${interaction.description} (Copy)`
    };
    setInteractions([...interactions, newInteraction]);
  };

  // Add/remove condition
  const addCondition = (value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, value]
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  // Export/Import handlers
  const handleExport = () => {
    const exportData = {
      specialInteractions: interactions,
      metadata: {
        exportedAt: new Date().toISOString(),
        interactionCount: interactions.length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'special-interactions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.specialInteractions) {
          setInteractions(data.specialInteractions);
        }
      } catch (error) {
        console.error('Failed to import:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    onSave(interactions);
    onClose();
  };

  // Group interactions by type
  const groupedInteractions = interactions.reduce((acc, interaction) => {
    if (!acc[interaction.type]) acc[interaction.type] = [];
    acc[interaction.type].push(interaction);
    return acc;
  }, {} as Record<SpecialInteraction['type'], SpecialInteraction[]>);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Special Interactions Editor
            </DialogTitle>
            <DialogDescription>
              Define special rules and patterns for UCCA analysis
            </DialogDescription>
          </DialogHeader>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {Object.entries(INTERACTION_TYPE_CONFIG).map(([type, config]) => {
              const count = groupedInteractions[type as SpecialInteraction['type']]?.length || 0;
              const Icon = config.icon;
              return (
                <div key={type} className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="text-2xl font-semibold">{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{type}</div>
                </div>
              );
            })}
          </div>

          {/* Interactions List */}
          <ScrollArea className="flex-1 h-[400px]">
            {interactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Zap className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Special Interactions Defined</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Define special rules to guide UCCA identification and prioritization
                </p>
                <Button onClick={handleCreateInteraction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Interaction
                </Button>
              </div>
            ) : (
              <div className="space-y-6 p-1">
                {Object.entries(groupedInteractions).map(([type, typeInteractions]) => {
                  if (typeInteractions.length === 0) return null;
                  
                  const config = INTERACTION_TYPE_CONFIG[type as SpecialInteraction['type']];
                  const Icon = config.icon;
                  
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={cn("h-5 w-5", config.color)} />
                        <h3 className="font-semibold">{type} Interactions</h3>
                        <span className="text-sm text-gray-500">({typeInteractions.length})</span>
                      </div>
                      
                      <div className="space-y-3">
                        {typeInteractions.map(interaction => (
                          <Card key={interaction.id} className={cn("p-4", config.bgColor)}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium">{interaction.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {interaction.appliesTo}
                                  </Badge>
                                  {interaction.priority && (
                                    <Badge variant="secondary" className="text-xs">
                                      Priority: {interaction.priority}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditInteraction(interaction)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDuplicateInteraction(interaction)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteInteractionId(interaction.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-sm">
                              {interaction.involvedControllerIds && interaction.involvedControllerIds.length > 0 && (
                                <div>
                                  <span className="text-gray-500">Controllers: </span>
                                  {interaction.involvedControllerIds.map(id => getControllerName(id)).join(', ')}
                                </div>
                              )}
                              
                              {interaction.involvedControlActionIds && interaction.involvedControlActionIds.length > 0 && (
                                <div>
                                  <span className="text-gray-500">Actions: </span>
                                  {interaction.involvedControlActionIds.map(id => getActionName(id)).join(', ')}
                                </div>
                              )}
                              
                              {interaction.conditions && interaction.conditions.length > 0 && (
                                <div>
                                  <span className="text-gray-500">Conditions: </span>
                                  <ul className="list-disc list-inside mt-1">
                                    {interaction.conditions.map((condition, idx) => (
                                      <li key={idx}>{condition}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Label htmlFor="import-interactions" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <FileUp className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
                <Input
                  id="import-interactions"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </Label>
              {interactions.length > 0 && (
                <Button variant="outline" onClick={handleCreateInteraction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Interaction
                </Button>
              )}
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

      {/* Edit/Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingInteraction ? 'Edit' : 'Create'} Special Interaction
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Templates */}
            {!editingInteraction && (
              <div className="space-y-2">
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map(template => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyTemplate(template)}
                      className="justify-start"
                    >
                      {React.createElement(INTERACTION_TYPE_CONFIG[template.type].icon, {
                        className: cn("h-4 w-4 mr-2", INTERACTION_TYPE_CONFIG[template.type].color)
                      })}
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Type Selection */}
            <div className="space-y-2">
              <Label>Interaction Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  type: value as SpecialInteraction['type'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTERACTION_TYPE_CONFIG).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", config.color)} />
                          <span>{type}</span>
                          <span className="text-xs text-gray-500 ml-2">{config.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this special interaction rule..."
                rows={3}
              />
            </div>

            {/* Applies To */}
            <div className="space-y-2">
              <Label>Applies To</Label>
              <Select
                value={formData.appliesTo}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  appliesTo: value as SpecialInteraction['appliesTo'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Type1-2">Type 1-2 UCCAs (Simultaneous)</SelectItem>
                  <SelectItem value="Type3-4">Type 3-4 UCCAs (Temporal)</SelectItem>
                  <SelectItem value="Both">Both Types</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority (for Priority type) */}
            {formData.type === 'Priority' && (
              <div className="space-y-2">
                <Label>Priority Level ({formData.priority})</Label>
                <Slider
                  value={[formData.priority]}
                  onValueChange={([value]) => setFormData(prev => ({ ...prev, priority: value }))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low Priority</span>
                  <span>High Priority</span>
                </div>
              </div>
            )}

            {/* Controllers */}
            <div className="space-y-2">
              <Label>Involved Controllers (Optional)</Label>
              <MultiSelect
                options={controllerOptions}
                value={formData.involvedControllerIds}
                onChange={(value) => setFormData(prev => ({ ...prev, involvedControllerIds: value }))}
                placeholder="Select controllers..."
              />
            </div>

            {/* Control Actions */}
            <div className="space-y-2">
              <Label>Involved Control Actions (Optional)</Label>
              <MultiSelect
                options={actionOptions}
                value={formData.involvedControlActionIds}
                onChange={(value) => setFormData(prev => ({ ...prev, involvedControlActionIds: value }))}
                placeholder="Select control actions..."
              />
            </div>

            {/* Conditions */}
            {(formData.type === 'Conditional' || formData.type === 'Mandatory') && (
              <div className="space-y-2">
                <Label>Conditions</Label>
                <div className="space-y-2">
                  {formData.conditions.map((condition, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input value={condition} readOnly className="flex-1" />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCondition(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Input
                    placeholder="Add condition..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCondition((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveInteraction}
              disabled={!formData.description}
            >
              {editingInteraction ? 'Update' : 'Create'} Interaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInteractionId} onOpenChange={() => setDeleteInteractionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Special Interaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the special interaction rule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInteractionId && handleDeleteInteraction(deleteInteractionId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Interaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};