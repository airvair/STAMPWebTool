import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { UCCA, UCCAType, Controller, Hazard } from '@/types/types';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UCCAEditorProps {
  ucca?: UCCA;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ucca: Omit<UCCA, 'id' | 'code'>) => void;
}

export const UCCAEditor: React.FC<UCCAEditorProps> = ({ ucca, isOpen, onClose, onSave }) => {
  const { controllers, hazards, controlActions } = useAnalysisContext();
  
  // Form state
  const [description, setDescription] = useState(ucca?.description || '');
  const [context, setContext] = useState(ucca?.context || '');
  const [uccaType, setUccaType] = useState<UCCAType>(ucca?.uccaType || UCCAType.CrossController);
  const [involvedControllerIds, setInvolvedControllerIds] = useState<string[]>(ucca?.involvedControllerIds || []);
  const [hazardIds, setHazardIds] = useState<string[]>(ucca?.hazardIds || []);
  const [temporalRelationship, setTemporalRelationship] = useState<'Simultaneous' | 'Sequential' | 'Within-Timeframe' | undefined>(
    ucca?.temporalRelationship
  );
  const [specificCause, setSpecificCause] = useState(ucca?.specificCause || '');
  const [timingConstraints, setTimingConstraints] = useState(ucca?.timingConstraints || '');
  const [isSystematic, setIsSystematic] = useState(ucca?.isSystematic || false);
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or ucca changes
  useEffect(() => {
    if (isOpen) {
      setDescription(ucca?.description || '');
      setContext(ucca?.context || '');
      setUccaType(ucca?.uccaType || UCCAType.CrossController);
      setInvolvedControllerIds(ucca?.involvedControllerIds || []);
      setHazardIds(ucca?.hazardIds || []);
      setTemporalRelationship(ucca?.temporalRelationship);
      setSpecificCause(ucca?.specificCause || '');
      setTimingConstraints(ucca?.timingConstraints || '');
      setIsSystematic(ucca?.isSystematic || false);
      setErrors({});
    }
  }, [isOpen, ucca]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!context.trim()) {
      newErrors.context = 'Context is required';
    }
    if (involvedControllerIds.length < 2) {
      newErrors.controllers = 'At least 2 controllers must be involved in a UCCA';
    }
    if (hazardIds.length === 0) {
      newErrors.hazards = 'At least one hazard must be linked';
    }
    if (uccaType === UCCAType.Temporal && !temporalRelationship) {
      newErrors.temporal = 'Temporal relationship must be specified for temporal UCCAs';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const uccaData: Omit<UCCA, 'id' | 'code'> = {
      description,
      context,
      uccaType,
      involvedControllerIds,
      hazardIds,
      temporalRelationship: uccaType === UCCAType.Temporal ? temporalRelationship : undefined,
      specificCause: specificCause || undefined,
      timingConstraints: timingConstraints || undefined,
      isSystematic,
      involvedRoleIds: undefined,
      operationalContextId: undefined,
    };

    onSave(uccaData);
    onClose();
  };

  // Helper to get controller options for multi-select
  const controllerOptions = controllers.map(c => ({
    value: c.id,
    label: c.name,
  }));

  // Helper to get hazard options for multi-select
  const hazardOptions = hazards.map(h => ({
    value: h.id,
    label: `${h.code}: ${h.description}`,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ucca ? 'Edit' : 'Create'} Unsafe Combination of Control Actions (UCCA)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the unsafe combination of control actions..."
              className={errors.description ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Context *</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe the context in which this combination becomes hazardous..."
              className={errors.context ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.context && (
              <p className="text-sm text-destructive">{errors.context}</p>
            )}
          </div>

          {/* UCCA Type */}
          <div className="space-y-2">
            <Label htmlFor="uccaType">UCCA Type *</Label>
            <Select value={uccaType} onValueChange={(value) => setUccaType(value as UCCAType)}>
              <SelectTrigger id="uccaType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(UCCAType).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Involved Controllers */}
          <div className="space-y-2">
            <Label>Involved Controllers * (minimum 2)</Label>
            <MultiSelect
              options={controllerOptions}
              value={involvedControllerIds}
              onChange={setInvolvedControllerIds}
              placeholder="Select controllers involved in this combination..."
            />
            {errors.controllers && (
              <p className="text-sm text-destructive">{errors.controllers}</p>
            )}
            {involvedControllerIds.length === 1 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  UCCAs require at least 2 controllers. Select additional controllers to form a combination.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Linked Hazards */}
          <div className="space-y-2">
            <Label>Linked Hazards *</Label>
            <MultiSelect
              options={hazardOptions}
              value={hazardIds}
              onChange={setHazardIds}
              placeholder="Select hazards this combination could lead to..."
            />
            {errors.hazards && (
              <p className="text-sm text-destructive">{errors.hazards}</p>
            )}
          </div>

          {/* Temporal Relationship (only for Temporal type) */}
          {uccaType === UCCAType.Temporal && (
            <div className="space-y-2">
              <Label htmlFor="temporal">Temporal Relationship *</Label>
              <Select 
                value={temporalRelationship || ''} 
                onValueChange={(value) => setTemporalRelationship(value as 'Simultaneous' | 'Sequential' | 'Within-Timeframe')}
              >
                <SelectTrigger id="temporal" className={errors.temporal ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select temporal relationship..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simultaneous">Simultaneous</SelectItem>
                  <SelectItem value="Sequential">Sequential</SelectItem>
                  <SelectItem value="Within-Timeframe">Within Timeframe</SelectItem>
                </SelectContent>
              </Select>
              {errors.temporal && (
                <p className="text-sm text-destructive">{errors.temporal}</p>
              )}
            </div>
          )}

          {/* Timing Constraints (optional for Temporal) */}
          {uccaType === UCCAType.Temporal && (
            <div className="space-y-2">
              <Label htmlFor="timing">Timing Constraints (optional)</Label>
              <Input
                id="timing"
                value={timingConstraints}
                onChange={(e) => setTimingConstraints(e.target.value)}
                placeholder="e.g., within 5 seconds, before system startup..."
              />
            </div>
          )}

          {/* Specific Cause (optional) */}
          <div className="space-y-2">
            <Label htmlFor="cause">Specific Cause (optional)</Label>
            <Textarea
              id="cause"
              value={specificCause}
              onChange={(e) => setSpecificCause(e.target.value)}
              placeholder="Describe the specific cause or mechanism that leads to this combination..."
              rows={2}
            />
          </div>

          {/* Is Systematic */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="systematic"
              checked={isSystematic}
              onChange={(e) => setIsSystematic(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="systematic" className="text-sm font-normal cursor-pointer">
              This represents a systematic pattern (not a single occurrence)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {ucca ? 'Update' : 'Create'} UCCA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};