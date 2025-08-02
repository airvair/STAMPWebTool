import React, { useState } from 'react';
import { Controller, InterchangeableControllerGroup } from '@/types/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  ArrowLeftRight,
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  FileDown,
  FileUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface InterchangeableControllersManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groups: InterchangeableControllerGroup[]) => void;
  initialGroups?: InterchangeableControllerGroup[];
}

export const InterchangeableControllersManager: React.FC<InterchangeableControllersManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGroups = []
}) => {
  const { controllers } = useAnalysisContext();
  const [groups, setGroups] = useState<InterchangeableControllerGroup[]>(initialGroups);
  const [editingGroup, setEditingGroup] = useState<InterchangeableControllerGroup | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    interchangeabilityType: 'Full' as InterchangeableControllerGroup['interchangeabilityType'],
    controllerIds: [] as string[],
    conditions: [] as string[],
    constraints: [] as string[]
  });

  // Get controller name by ID
  const getControllerName = (id: string) => {
    return controllers.find(c => c.id === id)?.name || 'Unknown';
  };

  // Check if a controller is already in another group
  const isControllerInOtherGroup = (controllerId: string, excludeGroupId?: string) => {
    return groups.some(group => 
      group.id !== excludeGroupId && 
      group.controllerIds.includes(controllerId)
    );
  };

  // Get all controllers not in any group
  const getAvailableControllers = (excludeGroupId?: string) => {
    return controllers.filter(controller => 
      !isControllerInOtherGroup(controller.id, excludeGroupId)
    );
  };

  // Start creating a new group
  const handleCreateGroup = () => {
    setFormData({
      name: '',
      description: '',
      interchangeabilityType: 'Full',
      controllerIds: [],
      conditions: [],
      constraints: []
    });
    setEditingGroup(null);
    setIsEditDialogOpen(true);
  };

  // Start editing an existing group
  const handleEditGroup = (group: InterchangeableControllerGroup) => {
    setFormData({
      name: group.name,
      description: group.description,
      interchangeabilityType: group.interchangeabilityType,
      controllerIds: [...group.controllerIds],
      conditions: [...(group.conditions || [])],
      constraints: [...(group.constraints || [])]
    });
    setEditingGroup(group);
    setIsEditDialogOpen(true);
  };

  // Save group (create or update)
  const handleSaveGroup = () => {
    if (!formData.name || formData.controllerIds.length < 2) return;

    const groupData: InterchangeableControllerGroup = {
      id: editingGroup?.id || uuidv4(),
      name: formData.name,
      description: formData.description,
      interchangeabilityType: formData.interchangeabilityType,
      controllerIds: formData.controllerIds,
      conditions: formData.conditions.length > 0 ? formData.conditions : undefined,
      constraints: formData.constraints.length > 0 ? formData.constraints : undefined
    };

    if (editingGroup) {
      setGroups(groups.map(g => g.id === editingGroup.id ? groupData : g));
    } else {
      setGroups([...groups, groupData]);
    }

    setIsEditDialogOpen(false);
    setEditingGroup(null);
  };

  // Delete group
  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
    setDeleteGroupId(null);
  };

  // Duplicate group
  const handleDuplicateGroup = (group: InterchangeableControllerGroup) => {
    const newGroup: InterchangeableControllerGroup = {
      ...group,
      id: uuidv4(),
      name: `${group.name} (Copy)`,
      controllerIds: [] // Start with empty to avoid conflicts
    };
    setGroups([...groups, newGroup]);
  };

  // Add/remove controller from current form
  const toggleController = (controllerId: string) => {
    setFormData(prev => ({
      ...prev,
      controllerIds: prev.controllerIds.includes(controllerId)
        ? prev.controllerIds.filter(id => id !== controllerId)
        : [...prev.controllerIds, controllerId]
    }));
  };

  // Add condition
  const addCondition = (type: 'conditions' | 'constraints', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], value]
    }));
  };

  // Remove condition
  const removeCondition = (type: 'conditions' | 'constraints', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Export configuration
  const handleExport = () => {
    const exportData = {
      interchangeableGroups: groups,
      metadata: {
        exportedAt: new Date().toISOString(),
        groupCount: groups.length,
        controllerCount: controllers.length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interchangeable-controllers.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import configuration
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.interchangeableGroups) {
          setGroups(data.interchangeableGroups);
        }
      } catch (error) {
        console.error('Failed to import configuration:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    onSave(groups);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Interchangeable Controllers Manager
            </DialogTitle>
            <DialogDescription>
              Define groups of controllers that can be considered equivalent for UCCA analysis
            </DialogDescription>
          </DialogHeader>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-semibold">{groups.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Groups Defined</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">
                {groups.reduce((sum, g) => sum + g.controllerIds.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Controllers Grouped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">
                {controllers.length - groups.reduce((sum, g) => sum + g.controllerIds.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ungrouped</div>
            </div>
          </div>

          {/* Group List */}
          <ScrollArea className="flex-1 h-[400px]">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Interchangeable Groups Defined</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Define groups of controllers that can substitute for each other in UCCA scenarios
                </p>
                <Button onClick={handleCreateGroup}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Group
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-1">
                {groups.map(group => (
                  <Card key={group.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{group.name}</h3>
                          <Badge 
                            variant={
                              group.interchangeabilityType === 'Full' ? 'default' :
                              group.interchangeabilityType === 'Partial' ? 'secondary' :
                              'outline'
                            }
                          >
                            {group.interchangeabilityType}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {group.description}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicateGroup(group)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteGroupId(group.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Controllers in group */}
                    <div className="mb-3">
                      <Label className="text-xs text-gray-500 mb-1">Controllers ({group.controllerIds.length})</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {group.controllerIds.map(controllerId => (
                          <Badge key={controllerId} variant="outline">
                            {getControllerName(controllerId)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Conditions and Constraints */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {group.conditions && group.conditions.length > 0 && (
                        <div>
                          <Label className="text-xs text-gray-500 mb-1">Conditions</Label>
                          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {group.conditions.map((condition, idx) => (
                              <li key={idx}>{condition}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {group.constraints && group.constraints.length > 0 && (
                        <div>
                          <Label className="text-xs text-gray-500 mb-1">Constraints</Label>
                          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                            {group.constraints.map((constraint, idx) => (
                              <li key={idx}>{constraint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
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
              {groups.length > 0 && (
                <Button variant="outline" onClick={handleCreateGroup}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
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
              {editingGroup ? 'Edit' : 'Create'} Interchangeable Controller Group
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Ground Control Stations"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe when and why these controllers are interchangeable"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Interchangeability Type</Label>
              <Select
                value={formData.interchangeabilityType}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  interchangeabilityType: value as InterchangeableControllerGroup['interchangeabilityType']
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Full - Controllers are always interchangeable</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Partial">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>Partial - Limited interchangeability</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Conditional">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span>Conditional - Depends on specific conditions</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Controller Selection */}
            <div className="space-y-2">
              <Label>Select Controllers (minimum 2)</Label>
              <ScrollArea className="h-48 border rounded-lg p-3">
                <div className="space-y-2">
                  {getAvailableControllers(editingGroup?.id).map(controller => {
                    const isSelected = formData.controllerIds.includes(controller.id);
                    const isAlreadyGrouped = editingGroup && editingGroup.controllerIds.includes(controller.id);
                    
                    return (
                      <div
                        key={controller.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                          isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                        onClick={() => toggleController(controller.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center",
                            isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                          )}>
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                          <span>{controller.name}</span>
                          {controller.description && (
                            <span className="text-sm text-gray-500">- {controller.description}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              {formData.controllerIds.length < 2 && (
                <p className="text-sm text-amber-500">
                  Select at least 2 controllers to form a group
                </p>
              )}
            </div>

            {/* Conditions */}
            {(formData.interchangeabilityType === 'Partial' || formData.interchangeabilityType === 'Conditional') && (
              <>
                <div className="space-y-2">
                  <Label>Conditions (when controllers are interchangeable)</Label>
                  <div className="space-y-2">
                    {formData.conditions.map((condition, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input value={condition} readOnly className="flex-1" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCondition('conditions', idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Input
                      placeholder="Add condition..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCondition('conditions', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Constraints (limitations on interchangeability)</Label>
                  <div className="space-y-2">
                    {formData.constraints.map((constraint, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input value={constraint} readOnly className="flex-1" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCondition('constraints', idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Input
                      placeholder="Add constraint..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCondition('constraints', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveGroup}
              disabled={!formData.name || formData.controllerIds.length < 2}
            >
              {editingGroup ? 'Update' : 'Create'} Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interchangeable Controller Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the group definition. Controllers will become available for other groups.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGroupId && handleDeleteGroup(deleteGroupId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};