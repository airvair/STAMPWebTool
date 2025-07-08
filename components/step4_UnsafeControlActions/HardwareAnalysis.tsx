import { PlusIcon, ExclamationTriangleIcon, CpuChipIcon, SparklesIcon } from '@heroicons/react/24/solid';
import React, { useState, useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { HardwareComponent, FailureMode, FailureType, UnsafeInteraction } from '@/types';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import Input from '../shared/Input';
import Modal from '../shared/Modal';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';
import SplitScreenLayout from '../shared/SplitScreenLayout';
import ItemListPanel from '../shared/ItemListPanel';
import FormPanel from '../shared/FormPanel';
import CardGrid, { ViewSettings, SortOption } from '../shared/CardGrid';
import { HardwareComponentCard, UnsafeInteractionCard } from '../shared/CardLayouts';

interface HardwareComponentForm {
  name: string;
  type: string;
  description: string;
  systemComponentId: string;
}

interface FailureModeForm {
  hardwareComponentId: string;
  failureType: FailureType;
  description: string;
  probabilityAssessment: string;
  severityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  detectionDifficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Very Difficult';
}

interface UnsafeInteractionForm {
  sourceComponentId: string;
  affectedComponentIds: string[];
  interactionType: 'Cascading' | 'Blocking' | 'Common Cause' | 'Environmental' | 'Other';
  description: string;
  hazardIds: string[];
}

interface HardwareTemplate {
  name: string;
  type: string;
  description: string;
  commonFailureModes: {
    type: FailureType;
    description: string;
    probability?: string;
    severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  }[];
}

interface SystemComponentTemplate {
  type: string;
  name: string;
  hardwareTemplates: HardwareTemplate[];
}

// Hardware templates for common system types
const SYSTEM_COMPONENT_TEMPLATES: SystemComponentTemplate[] = [
  {
    type: 'vehicle',
    name: 'Vehicle',
    hardwareTemplates: [
      {
        name: 'Engine',
        type: 'Mechanical',
        description: 'Primary propulsion system',
        commonFailureModes: [
          { type: FailureType.MechanicalWear, description: 'Engine failure - won\'t start', severity: 'Critical' },
          { type: FailureType.MechanicalWear, description: 'Overheating', severity: 'High' },
          { type: FailureType.MechanicalWear, description: 'Power loss/reduced performance', severity: 'Medium' }
        ]
      },
      {
        name: 'Braking System',
        type: 'Mechanical',
        description: 'Vehicle deceleration system',
        commonFailureModes: [
          { type: FailureType.MechanicalWear, description: 'Complete brake failure', severity: 'Critical' },
          { type: FailureType.MechanicalWear, description: 'Brake fade from overheating', severity: 'High' },
          { type: FailureType.ElectricalFault, description: 'ABS system malfunction', severity: 'Medium' }
        ]
      },
      {
        name: 'Steering System',
        type: 'Mechanical',
        description: 'Directional control system',
        commonFailureModes: [
          { type: FailureType.MechanicalWear, description: 'Loss of power steering', severity: 'High' },
          { type: FailureType.MechanicalWear, description: 'Steering linkage failure', severity: 'Critical' },
          { type: FailureType.MechanicalWear, description: 'Excessive play in steering', severity: 'Medium' }
        ]
      },
      {
        name: 'Vehicle ECU',
        type: 'Electrical',
        description: 'Electronic control unit',
        commonFailureModes: [
          { type: FailureType.SoftwareGlitch, description: 'Software fault/corruption', severity: 'High' },
          { type: FailureType.ElectricalFault, description: 'Sensor input error', severity: 'Medium' },
          { type: FailureType.ElectricalFault, description: 'Water damage to electronics', severity: 'Critical' }
        ]
      }
    ]
  },
  {
    type: 'traffic-light',
    name: 'Traffic Light',
    hardwareTemplates: [
      {
        name: 'LED Module',
        type: 'Electrical',
        description: 'Light emitting components',
        commonFailureModes: [
          { type: FailureType.ElectricalFault, description: 'LED burnout/failure', severity: 'High' },
          { type: FailureType.ElectricalFault, description: 'Partial illumination', severity: 'Medium' },
          { type: FailureType.Other, description: 'Weather-related degradation', severity: 'Low' }
        ]
      },
      {
        name: 'Controller Board',
        type: 'Electrical',
        description: 'Traffic light control logic',
        commonFailureModes: [
          { type: FailureType.SoftwareGlitch, description: 'Timing sequence error', severity: 'Critical' },
          { type: FailureType.ElectricalFault, description: 'Logic circuit failure', severity: 'Critical' },
          { type: FailureType.ElectricalFault, description: 'Communication interface failure', severity: 'High' }
        ]
      },
      {
        name: 'Power Supply',
        type: 'Electrical',
        description: 'Electrical power system',
        commonFailureModes: [
          { type: FailureType.ElectricalFault, description: 'Complete power loss', severity: 'Critical' },
          { type: FailureType.ElectricalFault, description: 'Voltage fluctuation/instability', severity: 'Medium' },
          { type: FailureType.ElectricalFault, description: 'Lightning strike damage', severity: 'Critical' }
        ]
      },
      {
        name: 'Housing/Enclosure',
        type: 'Mechanical',
        description: 'Protective housing',
        commonFailureModes: [
          { type: FailureType.StructuralFailure, description: 'Physical impact damage', severity: 'Medium' },
          { type: FailureType.Other, description: 'Water ingress', severity: 'High' },
          { type: FailureType.MechanicalWear, description: 'Seal degradation', severity: 'Low' }
        ]
      }
    ]
  },
  {
    type: 'aircraft',
    name: 'Aircraft',
    hardwareTemplates: [
      {
        name: 'Flight Control Computer',
        type: 'Electrical',
        description: 'Primary flight control system',
        commonFailureModes: [
          { type: FailureType.SoftwareGlitch, description: 'Flight control law error', severity: 'Critical' },
          { type: FailureType.ElectricalFault, description: 'Processor failure', severity: 'Critical' },
          { type: FailureType.ElectricalFault, description: 'Memory corruption', severity: 'High' }
        ]
      },
      {
        name: 'Hydraulic Actuator',
        type: 'Mechanical',
        description: 'Control surface actuator',
        commonFailureModes: [
          { type: FailureType.MechanicalWear, description: 'Hydraulic leak', severity: 'High' },
          { type: FailureType.MechanicalWear, description: 'Actuator seizure', severity: 'Critical' },
          { type: FailureType.MechanicalWear, description: 'Seal degradation', severity: 'Medium' }
        ]
      }
    ]
  }
];

const HardwareAnalysis: React.FC = () => {
  const {
    systemComponents,
    hardwareComponents,
    failureModes,
    unsafeInteractions,
    hazards,
    addHardwareComponent,
    updateHardwareComponent,
    deleteHardwareComponent,
    addFailureMode,
    updateFailureMode,
    deleteFailureMode,
    addUnsafeInteraction,
    updateUnsafeInteraction,
    deleteUnsafeInteraction,
  } = useAnalysis();

  // Split-screen state management
  const [currentView, setCurrentView] = useState<'components' | 'failureModes' | 'interactions'>('components');
  const [selectedComponent, setSelectedComponent] = useState<HardwareComponent | null>(null);
  const [selectedFailureMode, setSelectedFailureMode] = useState<FailureMode | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<UnsafeInteraction | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('view');
  const [isSaving, setIsSaving] = useState(false);
  const [viewType, setViewType] = useState<'list' | 'cards'>('list');
  
  // Modal states for workflows that should remain as modals (guided analysis, templates)
  const [showGuidedAnalysisModal, setShowGuidedAnalysisModal] = useState(false);
  const [showTemplateSelectionModal, setShowTemplateSelectionModal] = useState(false);
  const [selectedSystemComponents, setSelectedSystemComponents] = useState<Set<string>>(new Set());
  const [currentSystemComponentId, setCurrentSystemComponentId] = useState<string | null>(null);

  const [componentForm, setComponentForm] = useState<HardwareComponentForm>({
    name: '',
    type: '',
    description: '',
    systemComponentId: ''
  });

  const [failureModeForm, setFailureModeForm] = useState<FailureModeForm>({
    hardwareComponentId: '',
    failureType: FailureType.MechanicalWear,
    description: '',
    probabilityAssessment: '',
    severityLevel: 'Medium',
    detectionDifficulty: 'Moderate'
  });

  const [interactionForm, setInteractionForm] = useState<UnsafeInteractionForm>({
    sourceComponentId: '',
    affectedComponentIds: [],
    interactionType: 'Cascading',
    description: '',
    hazardIds: []
  });

  const hardwareComponentTypes = [
    'Motor', 'Gearbox', 'Sensor', 'Actuator', 'Controller', 'Wiring',
    'Valve', 'Pump', 'Battery', 'Circuit Board', 'Display', 'Switch'
  ];

  const failureTypeOptions = Object.values(FailureType).map(type => ({ 
    value: type, 
    label: type 
  }));

  const severityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  const detectionOptions = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Moderate', label: 'Moderate' },
    { value: 'Difficult', label: 'Difficult' },
    { value: 'Very Difficult', label: 'Very Difficult' }
  ];

  // Check for system components without hardware on mount
  useEffect(() => {
    const componentsWithoutHardware = systemComponents.filter(sc => 
      !hardwareComponents.some(hw => hw.systemComponentId === sc.id)
    );

    if (componentsWithoutHardware.length > 0 && hardwareComponents.length === 0) {
      // Only show on first load when no hardware is defined
      setShowGuidedAnalysisModal(true);
    }
  }, []);

  const interactionTypeOptions = [
    { value: 'Cascading', label: 'Cascading Failure' },
    { value: 'Blocking', label: 'Mechanical Blocking' },
    { value: 'Common Cause', label: 'Common Cause Factor' },
    { value: 'Environmental', label: 'Environmental Factor' },
    { value: 'Other', label: 'Other' }
  ];

  const handleSaveComponent = async () => {
    if (!componentForm.name.trim() || !componentForm.type.trim()) {
      alert('Please provide a name and type for the hardware component.');
      return;
    }

    setIsSaving(true);
    try {
      const componentData = {
        name: componentForm.name,
        type: componentForm.type,
        description: componentForm.description,
        systemComponentId: componentForm.systemComponentId || undefined
      };

      if (formMode === 'edit' && selectedComponent) {
        updateHardwareComponent(selectedComponent.id, componentData);
        // Update the selected component with new data
        setSelectedComponent({ ...selectedComponent, ...componentData });
      } else {
        addHardwareComponent(componentData);
        // Note: addHardwareComponent returns void, so we can't select the new component
        // The user will need to select it from the list
      }

      setFormMode('view');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFailureMode = async () => {
    if (!failureModeForm.hardwareComponentId || !failureModeForm.description.trim()) {
      alert('Please select a hardware component and provide a failure description.');
      return;
    }

    setIsSaving(true);
    try {
      const failureModeData = {
        hardwareComponentId: failureModeForm.hardwareComponentId,
        failureType: failureModeForm.failureType,
        description: failureModeForm.description,
        probabilityAssessment: failureModeForm.probabilityAssessment 
          ? parseFloat(failureModeForm.probabilityAssessment) 
          : undefined,
        severityLevel: failureModeForm.severityLevel,
        detectionDifficulty: failureModeForm.detectionDifficulty
      };

      if (formMode === 'edit' && selectedFailureMode) {
        updateFailureMode(selectedFailureMode.id, failureModeData);
        setSelectedFailureMode({ ...selectedFailureMode, ...failureModeData });
      } else {
        addFailureMode(failureModeData);
        // Note: addFailureMode returns void, so we can't select the new failure mode
        // The user will need to select it from the list
      }

      setFormMode('view');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveInteraction = async () => {
    if (!interactionForm.sourceComponentId || 
        interactionForm.affectedComponentIds.length === 0 || 
        !interactionForm.description.trim()) {
      alert('Please select source and affected components and provide a description.');
      return;
    }

    setIsSaving(true);
    try {
      const interactionData = {
        sourceComponentId: interactionForm.sourceComponentId,
        affectedComponentIds: interactionForm.affectedComponentIds,
        interactionType: interactionForm.interactionType,
        description: interactionForm.description,
        hazardIds: interactionForm.hazardIds
      };

      if (formMode === 'edit' && selectedInteraction) {
        updateUnsafeInteraction(selectedInteraction.id, interactionData);
        setSelectedInteraction({ ...selectedInteraction, ...interactionData });
      } else {
        addUnsafeInteraction(interactionData);
        // Note: addUnsafeInteraction returns void, so we can't select the new interaction
        // The user will need to select it from the list
      }

      setFormMode('view');
    } finally {
      setIsSaving(false);
    }
  };

  const resetComponentForm = () => {
    setComponentForm({ name: '', type: '', description: '', systemComponentId: '' });
    setFormMode('view');
  };

  const resetFailureModeForm = () => {
    setFailureModeForm({
      hardwareComponentId: '',
      failureType: FailureType.MechanicalWear,
      description: '',
      probabilityAssessment: '',
      severityLevel: 'Medium',
      detectionDifficulty: 'Moderate'
    });
    setFormMode('view');
  };

  const resetInteractionForm = () => {
    setInteractionForm({
      sourceComponentId: '',
      affectedComponentIds: [],
      interactionType: 'Cascading',
      description: '',
      hazardIds: []
    });
    setFormMode('view');
  };

  // Removed: loadComponentForEdit - now using handleEditComponent in split-screen

  // Removed: loadFailureModeForEdit - now using handleSelectFailureMode in split-screen

  // Removed: loadInteractionForEdit - now using handleSelectInteraction in split-screen

  const handleAffectedComponentChange = (componentId: string, checked: boolean) => {
    setInteractionForm(prev => ({
      ...prev,
      affectedComponentIds: checked
        ? [...prev.affectedComponentIds, componentId]
        : prev.affectedComponentIds.filter(id => id !== componentId)
    }));
  };

  const handleHazardChange = (hazardId: string, checked: boolean) => {
    setInteractionForm(prev => ({
      ...prev,
      hazardIds: checked
        ? [...prev.hazardIds, hazardId]
        : prev.hazardIds.filter(id => id !== hazardId)
    }));
  };

  // Helper function to find matching template for a system component
  const findTemplateForSystemComponent = (systemComponent: any): SystemComponentTemplate | null => {
    const componentName = systemComponent.name.toLowerCase();
    
    return SYSTEM_COMPONENT_TEMPLATES.find(template => 
      componentName.includes(template.type) || 
      componentName.includes(template.name.toLowerCase())
    ) || null;
  };

  // Apply hardware template to create hardware components and failure modes
  const applyHardwareTemplate = (template: HardwareTemplate, systemComponentId: string) => {
    // Create hardware component
    const hardwareData: Omit<HardwareComponent, 'id'> = {
      name: template.name,
      type: template.type,
      description: template.description,
      systemComponentId
    };
    
    // Add hardware component and then add failure modes
    // Since we can't guarantee the callback interface, we'll add the component
    // and then add failure modes using the most recently added component
    const componentsBefore = hardwareComponents.length;
    addHardwareComponent(hardwareData);
    
    // Use a timeout to allow the component to be added before adding failure modes
    setTimeout(() => {
      // Find the newly added component (assumes it's the most recent one)
      const newComponent = hardwareComponents[componentsBefore];
      if (newComponent) {
        template.commonFailureModes.forEach(failureMode => {
          const failureModeData: Omit<FailureMode, 'id'> = {
            hardwareComponentId: newComponent.id,
            failureType: failureMode.type,
            description: failureMode.description,
            probabilityAssessment: undefined, // Remove probability as it should be a number
            severityLevel: failureMode.severity || 'Medium',
            detectionDifficulty: 'Moderate'
          };
          addFailureMode(failureModeData);
        });
      }
    }, 100);
  };

  // Handle guided analysis selection
  const handleGuidedAnalysisStart = () => {
    if (selectedSystemComponents.size === 0) {
      alert('Please select at least one system component to analyze.');
      return;
    }

    setShowGuidedAnalysisModal(false);
    
    // Process each selected system component
    const selectedIds = Array.from(selectedSystemComponents);
    if (selectedIds.length > 0) {
      setCurrentSystemComponentId(selectedIds[0]);
      setShowTemplateSelectionModal(true);
    }
  };

  // Get system components without hardware
  const systemComponentsWithoutHardware = systemComponents.filter(sc => 
    !hardwareComponents.some(hw => hw.systemComponentId === sc.id)
  );

  // Create filter groups for enhanced filtering
  const componentFilterGroups = [
    {
      id: 'type',
      label: 'Component Type',
      type: 'multiselect' as const,
      options: [...new Set(hardwareComponents.map(c => c.type))].map(type => ({
        id: type,
        label: type,
        value: type
      }))
    },
    {
      id: 'hasSystemLink',
      label: 'System Link',
      type: 'select' as const,
      options: [
        { id: 'linked', label: 'Has System Link', value: true },
        { id: 'unlinked', label: 'No System Link', value: false }
      ]
    }
  ];

  const failureModeFilterGroups = [
    {
      id: 'failureType',
      label: 'Failure Type',
      type: 'multiselect' as const,
      options: [...new Set(failureModes.map(f => f.failureType))].map(type => ({
        id: type,
        label: type,
        value: type
      }))
    },
    {
      id: 'severity',
      label: 'Severity Level',
      type: 'multiselect' as const,
      options: [
        { id: 'critical', label: 'Critical', value: 'Critical' },
        { id: 'high', label: 'High', value: 'High' },
        { id: 'medium', label: 'Medium', value: 'Medium' },
        { id: 'low', label: 'Low', value: 'Low' }
      ]
    },
    {
      id: 'detection',
      label: 'Detection Difficulty',
      type: 'multiselect' as const,
      options: [
        { id: 'easy', label: 'Easy', value: 'Easy' },
        { id: 'moderate', label: 'Moderate', value: 'Moderate' },
        { id: 'difficult', label: 'Difficult', value: 'Difficult' },
        { id: 'very-difficult', label: 'Very Difficult', value: 'Very Difficult' }
      ]
    }
  ];

  const interactionFilterGroups = [
    {
      id: 'interactionType',
      label: 'Interaction Type',
      type: 'multiselect' as const,
      options: [
        { id: 'cascading', label: 'Cascading', value: 'Cascading' },
        { id: 'blocking', label: 'Blocking', value: 'Blocking' },
        { id: 'common-cause', label: 'Common Cause', value: 'Common Cause' },
        { id: 'environmental', label: 'Environmental', value: 'Environmental' },
        { id: 'other', label: 'Other', value: 'Other' }
      ]
    },
    {
      id: 'hasHazards',
      label: 'Hazard Links',
      type: 'select' as const,
      options: [
        { id: 'linked', label: 'Has Hazard Links', value: true },
        { id: 'unlinked', label: 'No Hazard Links', value: false }
      ]
    }
  ];

  // Sort options for each view
  const componentSortOptions = [
    { id: 'name', label: 'Name (A-Z)', sortFn: (a: any, b: any) => a.name.localeCompare(b.name) },
    { id: 'name-desc', label: 'Name (Z-A)', sortFn: (a: any, b: any) => b.name.localeCompare(a.name) },
    { id: 'type', label: 'Type', sortFn: (a: any, b: any) => a.type.localeCompare(b.type) }
  ];

  const failureModeSortOptions = [
    { id: 'severity', label: 'Severity', sortFn: (a: any, b: any) => {
      const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return (severityOrder[b.severityLevel as keyof typeof severityOrder] || 0) - (severityOrder[a.severityLevel as keyof typeof severityOrder] || 0);
    }},
    { id: 'type', label: 'Failure Type', sortFn: (a: any, b: any) => a.failureType.localeCompare(b.failureType) },
    { id: 'detection', label: 'Detection Difficulty', sortFn: (a: any, b: any) => {
      const detectionOrder = { 'Very Difficult': 4, 'Difficult': 3, 'Moderate': 2, 'Easy': 1 };
      return (detectionOrder[b.detectionDifficulty as keyof typeof detectionOrder] || 0) - (detectionOrder[a.detectionDifficulty as keyof typeof detectionOrder] || 0);
    }}
  ];

  const interactionSortOptions = [
    { id: 'type', label: 'Interaction Type', sortFn: (a: any, b: any) => a.interactionType.localeCompare(b.interactionType) },
    { id: 'hazards', label: 'Hazard Count', sortFn: (a: any, b: any) => b.hazardIds.length - a.hazardIds.length }
  ];

  // Sort options for card grid displays
  const hardwareCardSortOptions: SortOption[] = [
    {
      id: 'name',
      label: 'Name',
      sortFn: (a: HardwareComponent, b: HardwareComponent) => a.name.localeCompare(b.name)
    },
    {
      id: 'type',
      label: 'Type',
      sortFn: (a: HardwareComponent, b: HardwareComponent) => a.type.localeCompare(b.type)
    },
    {
      id: 'failureCount',
      label: 'Failure Modes',
      sortFn: (a: HardwareComponent, b: HardwareComponent) => {
        const aFailures = failureModes.filter(fm => fm.hardwareComponentId === a.id).length;
        const bFailures = failureModes.filter(fm => fm.hardwareComponentId === b.id).length;
        return bFailures - aFailures;
      }
    }
  ];

  const interactionCardSortOptions: SortOption[] = [
    {
      id: 'type',
      label: 'Interaction Type',
      sortFn: (a: UnsafeInteraction, b: UnsafeInteraction) => a.interactionType.localeCompare(b.interactionType)
    },
    {
      id: 'affected',
      label: 'Affected Components',
      sortFn: (a: UnsafeInteraction, b: UnsafeInteraction) => b.affectedComponentIds.length - a.affectedComponentIds.length
    },
    {
      id: 'hazards',
      label: 'Hazard Links',
      sortFn: (a: UnsafeInteraction, b: UnsafeInteraction) => b.hazardIds.length - a.hazardIds.length
    }
  ];

  // Split-screen helper functions
  const handleSelectComponent = (component: HardwareComponent) => {
    setSelectedComponent(component);
    setFormMode('view');
    setCurrentView('components');
  };

  const handleCreateNewComponent = () => {
    setSelectedComponent(null);
    setComponentForm({
      name: '',
      type: '',
      description: '',
      systemComponentId: ''
    });
    setFormMode('create');
    setCurrentView('components');
  };

  const handleEditComponent = (component?: HardwareComponent) => {
    const comp = component || selectedComponent;
    if (comp) {
      setSelectedComponent(comp);
      setComponentForm({
        name: comp.name,
        type: comp.type,
        description: comp.description || '',
        systemComponentId: comp.systemComponentId || ''
      });
      setFormMode('edit');
    }
  };

  const handleSelectFailureMode = (failureMode: FailureMode) => {
    setSelectedFailureMode(failureMode);
    setFormMode('view');
    setCurrentView('failureModes');
  };

  const handleCreateNewFailureMode = () => {
    setSelectedFailureMode(null);
    setFailureModeForm({
      hardwareComponentId: selectedComponent?.id || '',
      failureType: FailureType.MechanicalWear,
      description: '',
      probabilityAssessment: '',
      severityLevel: 'Medium',
      detectionDifficulty: 'Moderate'
    });
    setFormMode('create');
    setCurrentView('failureModes');
  };

  const handleSelectInteraction = (interaction: UnsafeInteraction) => {
    setSelectedInteraction(interaction);
    setFormMode('view');
    setCurrentView('interactions');
  };

  const handleCreateNewInteraction = () => {
    setSelectedInteraction(null);
    setInteractionForm({
      sourceComponentId: '',
      affectedComponentIds: [],
      interactionType: 'Cascading',
      description: '',
      hazardIds: []
    });
    setFormMode('create');
    setCurrentView('interactions');
  };

  const handleCancelForm = () => {
    setFormMode('view');
    if (currentView === 'components' && selectedComponent) {
      // Reset component form to current values
      setComponentForm({
        name: selectedComponent.name,
        type: selectedComponent.type,
        description: selectedComponent.description || '',
        systemComponentId: selectedComponent.systemComponentId || ''
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Hardware & Electro-Mechanical Component Analysis
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This preliminary evaluation identifies hardware/electro-mechanical failures and unsafe interactions. 
              Consider mechanical wear, electrical faults, sensor issues, and combinations of failures that can create hazards.
            </p>
          </div>
        </div>
      </div>

      {/* Guided Analysis Alert */}
      {systemComponentsWithoutHardware.length > 0 && hardwareComponents.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CpuChipIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                System Components Need Hardware Analysis
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                You have {systemComponentsWithoutHardware.length} system component{systemComponentsWithoutHardware.length > 1 ? 's' : ''} 
                without hardware defined. Would you like guided assistance to analyze their hardware?
              </p>
              <Button
                onClick={() => setShowGuidedAnalysisModal(true)}
                leftIcon={<SparklesIcon className="w-5 h-5" />}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Guided Analysis
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Split-Screen Layout */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[600px]">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
              Hardware Analysis
            </h3>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex border border-slate-300 dark:border-slate-600 rounded-md">
                <button
                  onClick={() => setViewType('list')}
                  className={`px-3 py-1 text-sm font-medium transition-colors rounded-l-md ${
                    viewType === 'list'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewType('cards')}
                  className={`px-3 py-1 text-sm font-medium transition-colors rounded-r-md ${
                    viewType === 'cards'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  Cards
                </button>
              </div>
              
              {systemComponentsWithoutHardware.length > 0 && (
                <Button
                  onClick={() => setShowGuidedAnalysisModal(true)}
                  variant="secondary"
                  leftIcon={<SparklesIcon className="w-5 h-5" />}
                >
                  Guided Analysis
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentView('components')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'components'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Components ({hardwareComponents.length})
            </button>
            <button
              onClick={() => setCurrentView('failureModes')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'failureModes'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Failure Modes ({failureModes.length})
            </button>
            <button
              onClick={() => setCurrentView('interactions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'interactions'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Unsafe Interactions ({unsafeInteractions.length})
            </button>
          </div>
        </div>

        {/* Split-Screen Content */}
        <div className="h-[500px]">
          {viewType === 'cards' ? (
            // Card Grid View
            <div className="p-4 h-full overflow-y-auto">
              {currentView === 'components' && (
                <CardGrid
                  items={hardwareComponents}
                  renderCard={(component: HardwareComponent, settings: ViewSettings) => {
                    const componentFailureModes = failureModes.filter(fm => fm.hardwareComponentId === component.id);
                    return (
                      <HardwareComponentCard
                        component={component}
                        isSelected={selectedComponent?.id === component.id}
                        onSelect={() => handleSelectComponent(component)}
                        onEdit={() => handleEditComponent(component)}
                        onDelete={() => deleteHardwareComponent(component.id)}
                        failureModes={componentFailureModes}
                        compactMode={settings.compactMode}
                      />
                    );
                  }}
                  getItemId={(component: HardwareComponent) => component.id}
                  sortOptions={hardwareCardSortOptions}
                  defaultSort="failureCount"
                  emptyMessage="No hardware components defined yet. Click 'Add Component' to get started."
                  enableViewControls={true}
                  enableSorting={true}
                  maxHeight="400px"
                />
              )}
              
              {currentView === 'interactions' && (
                <CardGrid
                  items={unsafeInteractions}
                  renderCard={(interaction: UnsafeInteraction, settings: ViewSettings) => {
                    const sourceComponent = hardwareComponents.find(c => c.id === interaction.sourceComponentId);
                    const affectedComponents = interaction.affectedComponentIds
                      .map(id => hardwareComponents.find(c => c.id === id)?.name)
                      .filter(Boolean) as string[];
                    const hazardCodes = interaction.hazardIds
                      .map(hid => hazards.find(h => h.id === hid)?.code)
                      .filter(Boolean) as string[];

                    return (
                      <UnsafeInteractionCard
                        interaction={interaction}
                        isSelected={selectedInteraction?.id === interaction.id}
                        onSelect={() => handleSelectInteraction(interaction)}
                        onEdit={() => setFormMode('edit')}
                        onDelete={() => deleteUnsafeInteraction(interaction.id)}
                        sourceComponentName={sourceComponent?.name}
                        affectedComponentNames={affectedComponents}
                        hazardCodes={hazardCodes}
                        compactMode={settings.compactMode}
                      />
                    );
                  }}
                  getItemId={(interaction: UnsafeInteraction) => interaction.id}
                  sortOptions={interactionCardSortOptions}
                  defaultSort="type"
                  emptyMessage="No unsafe interactions defined yet. Click 'Add Interaction' to get started."
                  enableViewControls={true}
                  enableSorting={true}
                  maxHeight="400px"
                />
              )}
              
              {currentView === 'failureModes' && (
                <div className="space-y-4">
                  <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                    <p>Failure modes card view coming soon!</p>
                    <p className="text-sm mt-2">Switch to list view to manage failure modes.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Traditional Split-Screen List View
            <SplitScreenLayout
            leftPanel={
              currentView === 'components' ? (
                <ItemListPanel
                  items={hardwareComponents}
                  selectedItem={selectedComponent}
                  onSelectItem={handleSelectComponent}
                  onCreateNew={handleCreateNewComponent}
                  getItemId={(item) => item.id}
                  renderItem={(item, isSelected) => (
                    <div>
                      <h4 className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {item.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.type}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.systemComponentId && (
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                          Linked to system
                        </p>
                      )}
                    </div>
                  )}
                  title="Hardware Components"
                  createButtonLabel="Add Component"
                  emptyMessage="No hardware components defined yet."
                  enableAdvancedFilter={true}
                  filterGroups={componentFilterGroups}
                  sortOptions={componentSortOptions}
                  getSearchableText={(item) => `${item.name} ${item.type} ${item.description || ''}`}
                  getCategoryFromItem={(item) => item.type}
                />
              ) : currentView === 'failureModes' ? (
                <ItemListPanel
                  items={failureModes}
                  selectedItem={selectedFailureMode}
                  onSelectItem={handleSelectFailureMode}
                  onCreateNew={handleCreateNewFailureMode}
                  getItemId={(item) => item.id}
                  renderItem={(item, isSelected) => {
                    const component = hardwareComponents.find(c => c.id === item.hardwareComponentId);
                    return (
                      <div>
                        <h4 className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                          {item.failureType}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {component?.name || 'Unknown Component'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.severityLevel === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                            item.severityLevel === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                            item.severityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          }`}>
                            {item.severityLevel}
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded text-xs">
                            {item.detectionDifficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    );
                  }}
                  title="Failure Modes"
                  createButtonLabel="Add Failure Mode"
                  emptyMessage="No failure modes defined yet."
                  enableAdvancedFilter={true}
                  filterGroups={failureModeFilterGroups}
                  sortOptions={failureModeSortOptions}
                  getSearchableText={(item) => {
                    const component = hardwareComponents.find(c => c.id === item.hardwareComponentId);
                    return `${item.failureType} ${item.description} ${component?.name || ''} ${item.severityLevel} ${item.detectionDifficulty}`;
                  }}
                  getCategoryFromItem={(item) => item.failureType}
                />
              ) : (
                <ItemListPanel
                  items={unsafeInteractions}
                  selectedItem={selectedInteraction}
                  onSelectItem={handleSelectInteraction}
                  onCreateNew={handleCreateNewInteraction}
                  getItemId={(item) => item.id}
                  renderItem={(item, isSelected) => {
                    const sourceComponent = hardwareComponents.find(c => c.id === item.sourceComponentId);
                    const affectedCount = item.affectedComponentIds.length;
                    return (
                      <div>
                        <h4 className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>
                          {item.interactionType}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          From: {sourceComponent?.name || 'Unknown'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded text-xs">
                            Affects {affectedCount} component{affectedCount !== 1 ? 's' : ''}
                          </span>
                          {item.hazardIds.length > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded text-xs">
                              {item.hazardIds.length} hazard{item.hazardIds.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    );
                  }}
                  title="Unsafe Interactions"
                  createButtonLabel="Add Interaction"
                  emptyMessage="No unsafe interactions defined yet."
                  enableAdvancedFilter={true}
                  filterGroups={interactionFilterGroups}
                  sortOptions={interactionSortOptions}
                  getSearchableText={(item) => {
                    const sourceComponent = hardwareComponents.find(c => c.id === item.sourceComponentId);
                    const affectedComponents = item.affectedComponentIds.map(id => 
                      hardwareComponents.find(c => c.id === id)?.name || 'Unknown'
                    ).join(' ');
                    return `${item.interactionType} ${item.description} ${sourceComponent?.name || ''} ${affectedComponents}`;
                  }}
                  getCategoryFromItem={(item) => item.interactionType}
                />
              )
            }
            rightPanel={
              formMode === 'view' ? (
                <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <div className="text-center">
                    <p className="mb-4">
                      {currentView === 'components' && 'Select a component to view details or create a new one'}
                      {currentView === 'failureModes' && 'Select a failure mode to view details or create a new one'}
                      {currentView === 'interactions' && 'Select an interaction to view details or create a new one'}
                    </p>
                    <Button
                      onClick={() => {
                        if (currentView === 'components') handleCreateNewComponent();
                        else if (currentView === 'failureModes') handleCreateNewFailureMode();
                        else handleCreateNewInteraction();
                      }}
                      leftIcon={<PlusIcon className="w-4 h-4" />}
                    >
                      Create New
                    </Button>
                  </div>
                </div>
              ) : currentView === 'components' ? (
                <FormPanel
                  title={formMode === 'edit' ? 'Edit Hardware Component' : 'Create Hardware Component'}
                  onSave={handleSaveComponent}
                  onCancel={handleCancelForm}
                  onDelete={formMode === 'edit' && selectedComponent ? () => {
                    if (selectedComponent && window.confirm('Are you sure you want to delete this component?')) {
                      deleteHardwareComponent(selectedComponent.id);
                      setSelectedComponent(null);
                      setFormMode('view');
                    }
                  } : undefined}
                  isEditing={formMode === 'edit'}
                  isSaving={isSaving}
                >
                  <div className="space-y-4">
                    <Input
                      label="Component Name"
                      value={componentForm.name}
                      onChange={e => setComponentForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Main Engine, Landing Gear Motor"
                    />
                    
                    <Select
                      label="Component Type"
                      value={componentForm.type}
                      onChange={e => setComponentForm(prev => ({ ...prev, type: e.target.value }))}
                      options={hardwareComponentTypes.map(type => ({ value: type, label: type }))}
                    />
                    
                    <Textarea
                      label="Description"
                      value={componentForm.description}
                      onChange={e => setComponentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the component's function and role..."
                      rows={3}
                    />
                    
                    <Select
                      label="Linked System Component (Optional)"
                      value={componentForm.systemComponentId}
                      onChange={e => setComponentForm(prev => ({ ...prev, systemComponentId: e.target.value }))}
                      options={[
                        { value: '', label: 'No system link' },
                        ...systemComponents.map(sc => ({ value: sc.id, label: sc.name }))
                      ]}
                    />
                  </div>
                </FormPanel>
              ) : currentView === 'failureModes' ? (
                <FormPanel
                  title={formMode === 'edit' ? 'Edit Failure Mode' : 'Create Failure Mode'}
                  onSave={handleSaveFailureMode}
                  onCancel={handleCancelForm}
                  onDelete={formMode === 'edit' && selectedFailureMode ? () => {
                    if (selectedFailureMode && window.confirm('Are you sure you want to delete this failure mode?')) {
                      deleteFailureMode(selectedFailureMode.id);
                      setSelectedFailureMode(null);
                      setFormMode('view');
                    }
                  } : undefined}
                  isEditing={formMode === 'edit'}
                  isSaving={isSaving}
                >
                  <div className="space-y-4">
                    <Select
                      label="Hardware Component"
                      value={failureModeForm.hardwareComponentId}
                      onChange={e => setFailureModeForm(prev => ({ ...prev, hardwareComponentId: e.target.value }))}
                      options={hardwareComponents.map(comp => ({ value: comp.id, label: comp.name }))}
                    />
                    
                    <Select
                      label="Failure Type"
                      value={failureModeForm.failureType}
                      onChange={e => setFailureModeForm(prev => ({ ...prev, failureType: e.target.value as FailureType }))}
                      options={failureTypeOptions}
                    />
                    
                    <Textarea
                      label="Failure Description"
                      value={failureModeForm.description}
                      onChange={e => setFailureModeForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what happens when this failure occurs..."
                      rows={3}
                    />
                    
                    <Input
                      label="Probability Assessment (Optional)"
                      value={failureModeForm.probabilityAssessment}
                      onChange={e => setFailureModeForm(prev => ({ ...prev, probabilityAssessment: e.target.value }))}
                      placeholder="e.g., 0.001, 1e-6"
                    />
                    
                    <Select
                      label="Severity Level"
                      value={failureModeForm.severityLevel}
                      onChange={e => setFailureModeForm(prev => ({ ...prev, severityLevel: e.target.value as any }))}
                      options={severityOptions}
                    />
                    
                    <Select
                      label="Detection Difficulty"
                      value={failureModeForm.detectionDifficulty}
                      onChange={e => setFailureModeForm(prev => ({ ...prev, detectionDifficulty: e.target.value as any }))}
                      options={detectionOptions}
                    />
                  </div>
                </FormPanel>
              ) : (
                <FormPanel
                  title={formMode === 'edit' ? 'Edit Unsafe Interaction' : 'Create Unsafe Interaction'}
                  onSave={handleSaveInteraction}
                  onCancel={handleCancelForm}
                  onDelete={formMode === 'edit' && selectedInteraction ? () => {
                    if (selectedInteraction && window.confirm('Are you sure you want to delete this interaction?')) {
                      deleteUnsafeInteraction(selectedInteraction.id);
                      setSelectedInteraction(null);
                      setFormMode('view');
                    }
                  } : undefined}
                  isEditing={formMode === 'edit'}
                  isSaving={isSaving}
                >
                  <div className="space-y-4">
                    <Select
                      label="Source Component"
                      value={interactionForm.sourceComponentId}
                      onChange={e => setInteractionForm(prev => ({ ...prev, sourceComponentId: e.target.value }))}
                      options={hardwareComponents.map(comp => ({ value: comp.id, label: comp.name }))}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Affected Components:
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-md p-3">
                        {hardwareComponents.filter(c => c.id !== interactionForm.sourceComponentId).map(component => (
                          <Checkbox
                            key={component.id}
                            id={`affected-${component.id}`}
                            label={component.name}
                            checked={interactionForm.affectedComponentIds.includes(component.id)}
                            onChange={e => setInteractionForm(prev => ({
                              ...prev,
                              affectedComponentIds: e.target.checked
                                ? [...prev.affectedComponentIds, component.id]
                                : prev.affectedComponentIds.filter(id => id !== component.id)
                            }))}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <Select
                      label="Interaction Type"
                      value={interactionForm.interactionType}
                      onChange={e => setInteractionForm(prev => ({ ...prev, interactionType: e.target.value as any }))}
                      options={interactionTypeOptions}
                    />
                    
                    <Textarea
                      label="Interaction Description"
                      value={interactionForm.description}
                      onChange={e => setInteractionForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe how this interaction creates an unsafe condition..."
                      rows={3}
                    />
                    
                    {hazards.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Link to Hazards (Optional):
                        </label>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-md p-3">
                          {hazards.map(hazard => (
                            <Checkbox
                              key={hazard.id}
                              id={`hazard-${hazard.id}`}
                              label={`${hazard.code}: ${hazard.title}`}
                              checked={interactionForm.hazardIds.includes(hazard.id)}
                              onChange={e => setInteractionForm(prev => ({
                                ...prev,
                                hazardIds: e.target.checked
                                  ? [...prev.hazardIds, hazard.id]
                                  : prev.hazardIds.filter(id => id !== hazard.id)
                              }))}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </FormPanel>
              )
            }
            leftWidth="md"
            rightWidth="md"
          />
          )}
        </div>
      </div>

      {/* Hardware Component Modal - DISABLED: Now using split-screen */}
      <Modal
        isOpen={false}
        onClose={resetComponentForm}
        title={'Hardware Component Form (Legacy Modal)'}
      >
        <div className="space-y-4">
          <Input
            label="Component Name"
            value={componentForm.name}
            onChange={e => setComponentForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Main Engine, Landing Gear Motor"
          />
          
          <Select
            label="Component Type"
            value={componentForm.type}
            onChange={e => setComponentForm(prev => ({ ...prev, type: e.target.value }))}
            options={hardwareComponentTypes.map(type => ({ value: type, label: type }))}
            placeholder="Select component type"
          />
          
          <Textarea
            label="Description (Optional)"
            value={componentForm.description}
            onChange={e => setComponentForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Additional details about the component"
            rows={3}
          />
          
          <Select
            label="Link to System Component (Optional)"
            value={componentForm.systemComponentId}
            onChange={e => setComponentForm(prev => ({ ...prev, systemComponentId: e.target.value }))}
            options={[
              { value: '', label: 'No link' },
              ...systemComponents.map(sc => ({ value: sc.id, label: sc.name }))
            ]}
          />
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveComponent}>
              Save Component
            </Button>
            <Button onClick={resetComponentForm} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Failure Mode Modal - DISABLED: Now using split-screen */}
      <Modal
        isOpen={false}
        onClose={resetFailureModeForm}
        title={'Failure Mode Form (Legacy Modal)'}
      >
        <div className="space-y-4">
          <Select
            label="Hardware Component"
            value={failureModeForm.hardwareComponentId}
            onChange={e => setFailureModeForm(prev => ({ ...prev, hardwareComponentId: e.target.value }))}
            options={hardwareComponents.map(c => ({ value: c.id, label: `${c.name} (${c.type})` }))}
            placeholder="Select hardware component"
          />
          
          <Select
            label="Failure Type"
            value={failureModeForm.failureType}
            onChange={e => setFailureModeForm(prev => ({ ...prev, failureType: e.target.value as FailureType }))}
            options={failureTypeOptions}
          />
          
          <Textarea
            label="Failure Description"
            value={failureModeForm.description}
            onChange={e => setFailureModeForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe how the component fails and its effects"
            rows={3}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Severity Level"
              value={failureModeForm.severityLevel}
              onChange={e => setFailureModeForm(prev => ({ ...prev, severityLevel: e.target.value as any }))}
              options={severityOptions}
            />
            
            <Select
              label="Detection Difficulty"
              value={failureModeForm.detectionDifficulty}
              onChange={e => setFailureModeForm(prev => ({ ...prev, detectionDifficulty: e.target.value as any }))}
              options={detectionOptions}
            />
          </div>
          
          <Input
            label="Probability Assessment (0-1, optional)"
            value={failureModeForm.probabilityAssessment}
            onChange={e => setFailureModeForm(prev => ({ ...prev, probabilityAssessment: e.target.value }))}
            placeholder="e.g., 0.01 for 1% probability"
            type="number"
            min="0"
            max="1"
            step="0.001"
          />
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveFailureMode}>
              Save Failure Mode
            </Button>
            <Button onClick={resetFailureModeForm} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unsafe Interaction Modal - DISABLED: Now using split-screen */}
      <Modal
        isOpen={false}
        onClose={resetInteractionForm}
        title={'Unsafe Interaction Form (Legacy Modal)'}
      >
        <div className="space-y-4">
          <Select
            label="Source Component (fails first)"
            value={interactionForm.sourceComponentId}
            onChange={e => setInteractionForm(prev => ({ ...prev, sourceComponentId: e.target.value }))}
            options={hardwareComponents.map(c => ({ value: c.id, label: `${c.name} (${c.type})` }))}
            placeholder="Select source component"
          />
          
          <Select
            label="Interaction Type"
            value={interactionForm.interactionType}
            onChange={e => setInteractionForm(prev => ({ ...prev, interactionType: e.target.value as any }))}
            options={interactionTypeOptions}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Affected Components (select at least one):
            </label>
            <div className="max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
              {hardwareComponents
                .filter(c => c.id !== interactionForm.sourceComponentId)
                .map(component => (
                  <Checkbox
                    key={component.id}
                    id={`affected-${component.id}`}
                    label={`${component.name} (${component.type})`}
                    checked={interactionForm.affectedComponentIds.includes(component.id)}
                    onChange={e => handleAffectedComponentChange(component.id, e.target.checked)}
                    containerClassName="mb-2"
                  />
                ))}
            </div>
          </div>
          
          <Textarea
            label="Interaction Description"
            value={interactionForm.description}
            onChange={e => setInteractionForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe how the failure spreads or creates unsafe conditions"
            rows={3}
          />
          
          {hazards.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Link to Hazards (optional):
              </label>
              <div className="max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
                {hazards.map(hazard => (
                  <Checkbox
                    key={hazard.id}
                    id={`hazard-${hazard.id}`}
                    label={`${hazard.code}: ${hazard.title}`}
                    checked={interactionForm.hazardIds.includes(hazard.id)}
                    onChange={e => handleHazardChange(hazard.id, e.target.checked)}
                    containerClassName="mb-2"
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveInteraction}>
              Save Interaction
            </Button>
            <Button onClick={resetInteractionForm} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Guided Analysis Modal */}
      <Modal
        isOpen={showGuidedAnalysisModal}
        onClose={() => setShowGuidedAnalysisModal(false)}
        title="Guided Hardware Analysis"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              System Component Hardware Analysis
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Select system components to analyze their hardware. We&apos;ll suggest common hardware templates 
              based on component types to speed up your analysis.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              System Components Without Hardware ({systemComponentsWithoutHardware.length}):
            </label>
            <div className="max-h-60 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
              {systemComponentsWithoutHardware.map(component => (
                <div key={component.id} className="flex items-center justify-between mb-3 p-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={`system-${component.id}`}
                      label=""
                      checked={selectedSystemComponents.has(component.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedSystemComponents(prev => new Set([...prev, component.id]));
                        } else {
                          setSelectedSystemComponents(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(component.id);
                            return newSet;
                          });
                        }
                      }}
                    />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {component.name}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        Type: {component.type}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {findTemplateForSystemComponent(component) ? (
                      <span className="text-green-600 dark:text-green-400">✓ Template available</span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400">Manual setup needed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleGuidedAnalysisStart} disabled={selectedSystemComponents.size === 0}>
              Start Hardware Analysis
            </Button>
            <Button onClick={() => setShowGuidedAnalysisModal(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        isOpen={showTemplateSelectionModal}
        onClose={() => {
          setShowTemplateSelectionModal(false);
          setCurrentSystemComponentId(null);
        }}
        title="Select Hardware Template"
      >
        <div className="space-y-4">
          {currentSystemComponentId && (() => {
            const currentSystemComponent = systemComponents.find(sc => sc.id === currentSystemComponentId);
            const suggestedTemplate = findTemplateForSystemComponent(currentSystemComponent);
            
            return (
              <>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                    Analyzing: {currentSystemComponent?.name}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Choose a hardware template to quickly add common components and failure modes.
                  </p>
                </div>

                <div className="space-y-3">
                  {suggestedTemplate ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                        ✓ Recommended Template: {suggestedTemplate.name}
                      </h5>
                      <div className="space-y-2">
                        {suggestedTemplate.hardwareTemplates.map((template, index) => (
                          <div key={index} className="bg-white dark:bg-green-800/30 border border-green-300 dark:border-green-700 rounded p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-grow">
                                <h6 className="font-medium text-green-800 dark:text-green-200">
                                  {template.name} ({template.type})
                                </h6>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                  {template.description}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  {template.commonFailureModes.length} failure modes included
                                </p>
                              </div>
                              <Button
                                onClick={() => {
                                  applyHardwareTemplate(template, currentSystemComponentId);
                                  
                                  // Process next component or close
                                  const selectedIds = Array.from(selectedSystemComponents);
                                  const currentIndex = selectedIds.indexOf(currentSystemComponentId);
                                  
                                  if (currentIndex < selectedIds.length - 1) {
                                    setCurrentSystemComponentId(selectedIds[currentIndex + 1]);
                                  } else {
                                    setShowTemplateSelectionModal(false);
                                    setCurrentSystemComponentId(null);
                                    setSelectedSystemComponents(new Set());
                                  }
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Apply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        No Specific Template Found
                      </h5>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        No pre-defined template matches "{currentSystemComponent?.name}". 
                        You can manually add hardware components or choose from available templates:
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h5 className="font-medium text-slate-800 dark:text-slate-100 mb-3">
                      All Available Templates:
                    </h5>
                    <div className="grid gap-3">
                      {SYSTEM_COMPONENT_TEMPLATES.map((template, index) => (
                        <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-grow">
                              <h6 className="font-medium text-slate-800 dark:text-slate-100">
                                {template.name}
                              </h6>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                {template.hardwareTemplates.length} hardware components
                              </p>
                            </div>
                            <Button
                              onClick={() => {
                                // Apply all templates from this system template
                                template.hardwareTemplates.forEach(hwTemplate => {
                                  applyHardwareTemplate(hwTemplate, currentSystemComponentId!);
                                });
                                
                                // Process next component or close
                                const selectedIds = Array.from(selectedSystemComponents);
                                const currentIndex = selectedIds.indexOf(currentSystemComponentId!);
                                
                                if (currentIndex < selectedIds.length - 1) {
                                  setCurrentSystemComponentId(selectedIds[currentIndex + 1]);
                                } else {
                                  setShowTemplateSelectionModal(false);
                                  setCurrentSystemComponentId(null);
                                  setSelectedSystemComponents(new Set());
                                }
                              }}
                              size="sm"
                              variant="secondary"
                            >
                              Use Template
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      // Skip this component and move to next
                      const selectedIds = Array.from(selectedSystemComponents);
                      const currentIndex = selectedIds.indexOf(currentSystemComponentId);
                      
                      if (currentIndex < selectedIds.length - 1) {
                        setCurrentSystemComponentId(selectedIds[currentIndex + 1]);
                      } else {
                        setShowTemplateSelectionModal(false);
                        setCurrentSystemComponentId(null);
                        setSelectedSystemComponents(new Set());
                      }
                    }}
                    variant="secondary"
                  >
                    Skip This Component
                  </Button>
                  <Button
                    onClick={() => {
                      setShowTemplateSelectionModal(false);
                      setCurrentSystemComponentId(null);
                      setSelectedSystemComponents(new Set());
                    }}
                    variant="secondary"
                  >
                    Cancel Analysis
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
};

export default HardwareAnalysis;