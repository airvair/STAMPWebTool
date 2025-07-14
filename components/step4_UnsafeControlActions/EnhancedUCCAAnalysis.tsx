import { PlusIcon, BeakerIcon, CpuChipIcon } from '@heroicons/react/24/solid';
import React, { useState, useMemo } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { UCCA, UCCAType, Controller, ControlAction, ControllerType } from '@/types';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import Modal from '../shared/Modal';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';
import UCCAEnumerationEngine from './UCCAEnumerationEngine';
import AdvancedFilter, { FilterGroup, ActiveFilter } from '../shared/AdvancedFilter';
import CardGrid, { ViewSettings, SortOption } from '../shared/CardGrid';
import { UCCACard } from '../shared/CardLayouts';

interface ControlActionCombination {
  actions: ControlAction[];
  controllers: Controller[];
  riskScore: number;
  analysisReason: string;
}

interface UCCAFormState {
  uccaType: UCCAType;
  description: string;
  context: string;
  hazardIds: string[];
  involvedControllerIds: string[];
  involvedRoleIds: string[];
  temporalRelationship: 'Simultaneous' | 'Sequential' | 'Within-Timeframe';
  operationalContextId: string;
  isSystematic: boolean;
}

const EnhancedUCCAAnalysis: React.FC = () => {
  const {
    controllers,
    controlActions,
    ucas,
    uccas,
    hazards,
    addUCCA,
    updateUCCA,
    deleteUCCA
  } = useAnalysis();

  const [showUCCAModal, setShowUCCAModal] = useState(false);
  const [showSystematicAnalysis, setShowSystematicAnalysis] = useState(false);
  const [showThesisEnumeration, setShowThesisEnumeration] = useState(false);
  const [editingUccaId, setEditingUccaId] = useState<string | null>(null);
  const [systematicResults, setSystematicResults] = useState<ControlActionCombination[]>([]);
  
  // Enhanced filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const [uccaForm, setUccaForm] = useState<UCCAFormState>({
    uccaType: UCCAType.Team,
    description: '',
    context: '',
    hazardIds: [],
    involvedControllerIds: [],
    involvedRoleIds: [],
    temporalRelationship: 'Simultaneous',
    operationalContextId: '',
    isSystematic: false
  });

  // Systematic UCCA Analysis Algorithms
  const systematicAnalysis = useMemo(() => {
    
    // Algorithm 1: Generate Control Action Combinations
    const generateControlActionCombinations = (maxSize: number = 3): ControlActionCombination[] => {
      const combinations: ControlActionCombination[] = [];
      const inScopeActions = controlActions.filter(ca => !ca.isOutOfScope);
      
      // Generate combinations of size 2 to maxSize
      for (let size = 2; size <= Math.min(maxSize, inScopeActions.length); size++) {
        const sizeCombinations = generateCombinations(inScopeActions, size);
        
        for (const actionCombo of sizeCombinations) {
          const involvedControllers = actionCombo.map(action => 
            controllers.find(c => c.id === action.controllerId)
          ).filter(Boolean) as Controller[];
          
          // Filter criteria: must involve multiple controllers
          if (new Set(involvedControllers.map(c => c.id)).size > 1) {
            const riskScore = calculateRiskScore(actionCombo, involvedControllers);
            const analysisReason = generateAnalysisReason(actionCombo, involvedControllers);
            
            combinations.push({
              actions: actionCombo,
              controllers: involvedControllers,
              riskScore,
              analysisReason
            });
          }
        }
      }
      
      return combinations.sort((a, b) => b.riskScore - a.riskScore);
    };

    // Algorithm 2: Risk Scoring
    const calculateRiskScore = (actions: ControlAction[], controllers: Controller[]): number => {
      let score = 0;
      
      // Base score for multiple controllers
      score += controllers.length * 10;
      
      // Controller type diversity bonus
      const controllerTypes = new Set(controllers.map(c => c.ctrlType));
      score += controllerTypes.size * 5;
      
      // Team controller bonus (higher complexity)
      if (controllers.some(c => c.ctrlType === 'T')) {
        score += 15;
      }
      
      // Organizational controller bonus
      if (controllers.some(c => c.ctrlType === 'O')) {
        score += 20;
      }
      
      // Actions with existing UCAs get higher priority
      const actionsWithUCAs = actions.filter(action => 
        ucas.some(uca => uca.controlActionId === action.id)
      );
      score += actionsWithUCAs.length * 10;
      
      // Authority level conflicts (if available)
      const teamControllers = controllers.filter(c => c.ctrlType === 'T' && c.teamDetails);
      if (teamControllers.length > 0) {
        // Check for potential authority conflicts
        score += teamControllers.length * 8;
      }
      
      return Math.min(score, 100); // Cap at 100
    };

    // Algorithm 3: Analysis Reason Generation
    const generateAnalysisReason = (actions: ControlAction[], controllers: Controller[]): string => {
      const reasons: string[] = [];
      
      if (controllers.length > 2) {
        reasons.push(`Multiple controllers (${controllers.length}) involved`);
      }
      
      const controllerTypes = new Set(controllers.map(c => c.ctrlType));
      if (controllerTypes.has(ControllerType.Team)) {
        reasons.push('Team coordination required');
      }
      if (controllerTypes.has(ControllerType.Organisation)) {
        reasons.push('Organizational policy interaction');
      }
      if (controllerTypes.has(ControllerType.Human) && controllerTypes.has(ControllerType.Software)) {
        reasons.push('Human-software interaction');
      }
      
      const actionsWithUCAs = actions.filter(action => 
        ucas.some(uca => uca.controlActionId === action.id)
      );
      if (actionsWithUCAs.length > 0) {
        reasons.push(`${actionsWithUCAs.length} action(s) already have UCAs`);
      }
      
      return reasons.join(', ') || 'Cross-controller interaction detected';
    };

    return { generateControlActionCombinations };
  }, [controlActions, controllers, ucas]);

  // Helper function to generate combinations
  const generateCombinations = <T,>(array: T[], size: number): T[][] => {
    if (size === 1) return array.map(item => [item]);
    if (size > array.length) return [];
    
    const combinations: T[][] = [];
    for (let i = 0; i <= array.length - size; i++) {
      const smaller = generateCombinations(array.slice(i + 1), size - 1);
      combinations.push(...smaller.map(combo => [array[i], ...combo]));
    }
    return combinations;
  };

  // Role-based UCCA Templates
  const roleBasedTemplates = useMemo(() => {
    const templates: Partial<UCCAFormState>[] = [];
    
    // Team-based templates
    templates.push({
      uccaType: UCCAType.Team,
      description: 'Team members provide conflicting control actions simultaneously',
      context: 'During high workload situations when coordination breaks down',
      temporalRelationship: 'Simultaneous',
      isSystematic: true
    });
    
    templates.push({
      uccaType: UCCAType.Role,
      description: 'Higher authority role overrides lower authority role at critical moment',
      context: 'When role hierarchy conflicts with operational timing requirements',
      temporalRelationship: 'Sequential',
      isSystematic: true
    });
    
    // Organizational templates
    templates.push({
      uccaType: UCCAType.Organizational,
      description: 'Cross-departmental policies create conflicting control requirements',
      context: 'When departmental objectives conflict with system safety requirements',
      temporalRelationship: 'Within-Timeframe',
      isSystematic: true
    });
    
    // Temporal templates
    templates.push({
      uccaType: UCCAType.Temporal,
      description: 'Control actions provided in unsafe sequence or timing',
      context: 'When timing constraints are violated between related control actions',
      temporalRelationship: 'Sequential',
      isSystematic: false
    });
    
    return templates;
  }, []);

  const handleRunSystematicAnalysis = () => {
    const results = systematicAnalysis.generateControlActionCombinations();
    setSystematicResults(results.slice(0, 20)); // Limit to top 20 results
    setShowSystematicAnalysis(true);
  };

  const handleCreateUCCAFromCombination = (combination: ControlActionCombination) => {
    const actionDescriptions = combination.actions.map(a => `${a.verb} ${a.object}`).join(' + ');
    const controllerNames = combination.controllers.map(c => c.name).join(' & ');
    
    setUccaForm({
      uccaType: UCCAType.CrossController,
      description: `${controllerNames}: ${actionDescriptions}`,
      context: combination.analysisReason,
      hazardIds: [],
      involvedControllerIds: combination.controllers.map(c => c.id),
      involvedRoleIds: [],
      temporalRelationship: 'Simultaneous',
      operationalContextId: '',
      isSystematic: true
    });
    setShowUCCAModal(true);
    setShowSystematicAnalysis(false);
  };

  const handleApplyTemplate = (template: Partial<UCCAFormState>) => {
    setUccaForm(prev => ({ ...prev, ...template }));
    setShowUCCAModal(true);
  };

  const handleSaveUCCA = () => {
    if (!uccaForm.description.trim() || !uccaForm.context.trim()) {
      alert('Please provide both description and context for the UCCA.');
      return;
    }
    
    if (uccaForm.involvedControllerIds.length < 2) {
      alert('A UCCA must involve at least 2 controllers.');
      return;
    }

    const uccaData = {
      description: uccaForm.description,
      context: uccaForm.context,
      hazardIds: uccaForm.hazardIds,
      uccaType: uccaForm.uccaType,
      involvedControllerIds: uccaForm.involvedControllerIds,
      involvedRoleIds: uccaForm.involvedRoleIds.length > 0 ? uccaForm.involvedRoleIds : undefined,
      temporalRelationship: uccaForm.temporalRelationship,
      operationalContextId: uccaForm.operationalContextId || undefined,
      isSystematic: uccaForm.isSystematic
    };

    if (editingUccaId) {
      updateUCCA(editingUccaId, uccaData);
    } else {
      addUCCA(uccaData);
    }

    resetForm();
  };

  const resetForm = () => {
    setUccaForm({
      uccaType: UCCAType.Team,
      description: '',
      context: '',
      hazardIds: [],
      involvedControllerIds: [],
      involvedRoleIds: [],
      temporalRelationship: 'Simultaneous',
      operationalContextId: '',
      isSystematic: false
    });
    setEditingUccaId(null);
    setShowUCCAModal(false);
  };

  const loadUCCAForEdit = (ucca: UCCA) => {
    setUccaForm({
      uccaType: ucca.uccaType,
      description: ucca.description,
      context: ucca.context,
      hazardIds: ucca.hazardIds,
      involvedControllerIds: ucca.involvedControllerIds,
      involvedRoleIds: ucca.involvedRoleIds || [],
      temporalRelationship: ucca.temporalRelationship || 'Simultaneous',
      operationalContextId: ucca.operationalContextId || '',
      isSystematic: ucca.isSystematic || false
    });
    setEditingUccaId(ucca.id);
    setShowUCCAModal(true);
  };

  const handleControllerChange = (controllerId: string, checked: boolean) => {
    setUccaForm(prev => ({
      ...prev,
      involvedControllerIds: checked
        ? [...prev.involvedControllerIds, controllerId]
        : prev.involvedControllerIds.filter(id => id !== controllerId)
    }));
  };

  const handleHazardChange = (hazardId: string, checked: boolean) => {
    setUccaForm(prev => ({
      ...prev,
      hazardIds: checked
        ? [...prev.hazardIds, hazardId]
        : prev.hazardIds.filter(id => id !== hazardId)
    }));
  };

  // Enhanced filtering configuration
  const uccaFilterGroups: FilterGroup[] = useMemo(() => [
    {
      id: 'uccaType',
      label: 'UCCA Type',
      type: 'multiselect',
      options: Object.values(UCCAType).map(type => ({
        id: type,
        label: type,
        value: type
      }))
    },
    {
      id: 'temporalRelationship',
      label: 'Temporal Relationship',
      type: 'multiselect',
      options: [
        { id: 'simultaneous', label: 'Simultaneous', value: 'Simultaneous' },
        { id: 'sequential', label: 'Sequential', value: 'Sequential' },
        { id: 'within-timeframe', label: 'Within Timeframe', value: 'Within-Timeframe' }
      ]
    },
    {
      id: 'hasHazards',
      label: 'Hazard Links',
      type: 'select',
      options: [
        { id: 'linked', label: 'Has Hazard Links', value: true },
        { id: 'unlinked', label: 'No Hazard Links', value: false }
      ]
    },
    {
      id: 'isSystematic',
      label: 'Analysis Type',
      type: 'select',
      options: [
        { id: 'systematic', label: 'Systematic Pattern', value: true },
        { id: 'specific', label: 'Specific Occurrence', value: false }
      ]
    },
    {
      id: 'controllerCount',
      label: 'Controller Count',
      type: 'range',
      min: 2,
      max: Math.max(2, controllers.length)
    }
  ], [controllers.length]);

  // Get available roles from selected team controllers
  const availableRoles = useMemo(() => {
    const roles: { id: string; name: string; controllerId: string }[] = [];
    
    uccaForm.involvedControllerIds.forEach(controllerId => {
      const controller = controllers.find(c => c.id === controllerId);
      if (controller?.ctrlType === 'T' && controller.teamDetails) {
        controller.teamDetails.roles.forEach(role => {
          roles.push({
            id: role.id,
            name: role.name,
            controllerId: controller.id
          });
        });
      }
    });
    
    return roles;
  }, [uccaForm.involvedControllerIds, controllers]);

  // Enhanced filtering logic
  const filteredUCCAs = useMemo(() => {
    let result = [...uccas];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ucca => 
        ucca.code?.toLowerCase().includes(query) ||
        ucca.description.toLowerCase().includes(query) ||
        ucca.context.toLowerCase().includes(query) ||
        ucca.uccaType.toLowerCase().includes(query)
      );
    }

    // Apply active filters
    if (activeFilters.length > 0) {
      result = result.filter(ucca => {
        return activeFilters.every(filter => {
          switch (filter.groupId) {
            case 'uccaType':
              return ucca.uccaType === filter.value;
            case 'temporalRelationship':
              return ucca.temporalRelationship === filter.value;
            case 'hasHazards': {
              const hasHazards = ucca.hazardIds.length > 0;
              return hasHazards === filter.value;
            }
            case 'isSystematic':
              return ucca.isSystematic === filter.value;
            case 'controllerCount':
              return ucca.involvedControllerIds.length >= filter.value;
            default:
              return true;
          }
        });
      });
    }

    return result;
  }, [uccas, searchQuery, activeFilters]);

  // Sort options for UCCA display
  const uccaSortOptions: SortOption[] = useMemo(() => [
    {
      id: 'code',
      label: 'Code',
      sortFn: (a: UCCA, b: UCCA) => (a.code || '').localeCompare(b.code || '')
    },
    {
      id: 'type',
      label: 'UCCA Type',
      sortFn: (a: UCCA, b: UCCA) => a.uccaType.localeCompare(b.uccaType)
    },
    {
      id: 'controllers',
      label: 'Controller Count',
      sortFn: (a: UCCA, b: UCCA) => a.involvedControllerIds.length - b.involvedControllerIds.length
    },
    {
      id: 'systematic',
      label: 'Systematic First',
      sortFn: (a: UCCA, b: UCCA) => {
        if (a.isSystematic && !b.isSystematic) return -1;
        if (!a.isSystematic && b.isSystematic) return 1;
        return 0;
      }
    },
    {
      id: 'hazards',
      label: 'Hazard Links',
      sortFn: (a: UCCA, b: UCCA) => a.hazardIds.length - b.hazardIds.length
    }
  ], []);

  // Removed: uccaTypeOptions - now using enhanced filtering

  const temporalOptions = [
    { value: 'Simultaneous', label: 'Simultaneous' },
    { value: 'Sequential', label: 'Sequential' },
    { value: 'Within-Timeframe', label: 'Within Timeframe' }
  ];

  return (
    <div className="space-y-8">
      {/* Analysis Tools */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 flex items-center gap-2">
          <CpuChipIcon className="w-6 h-6" />
          Enhanced UCCA Analysis Tools
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleRunSystematicAnalysis}
            leftIcon={<BeakerIcon className="w-5 h-5" />}
            disabled={controlActions.filter(ca => !ca.isOutOfScope).length < 2}
          >
            Run Systematic Analysis
          </Button>
          
          <Button
            onClick={() => setShowUCCAModal(true)}
            leftIcon={<PlusIcon className="w-5 h-5" />}
          >
            Create UCCA Manually
          </Button>
          
          <Button
            onClick={() => setShowThesisEnumeration(!showThesisEnumeration)}
            leftIcon={<CpuChipIcon className="w-5 h-5" />}
            variant={showThesisEnumeration ? 'primary' : 'secondary'}
          >
            Thesis Enumeration
          </Button>
        </div>
        
        {/* UCCA Templates */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-blue-700 dark:text-blue-300 mb-3">
            Quick Templates:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {roleBasedTemplates.map((template, index) => (
              <Button
                key={index}
                onClick={() => handleApplyTemplate(template)}
                size="sm"
                variant="secondary"
                className="text-xs"
              >
                {template.uccaType}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Filter and Display */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Identified UCCAs
          </h3>
        </div>

        {/* Enhanced Search and Filtering */}
        <AdvancedFilter
          filterGroups={uccaFilterGroups}
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search UCCAs by code, description, or context..."
        />

        {/* UCCA Card Grid */}
        <CardGrid
          items={filteredUCCAs}
          renderCard={(ucca: UCCA, settings: ViewSettings) => {
            const controllerNames = ucca.involvedControllerIds.map(id =>
              controllers.find(c => c.id === id)?.name
            ).filter(Boolean) as string[];
            
            const hazardCodes = ucca.hazardIds.map(hid =>
              hazards.find(h => h.id === hid)?.code
            ).filter(Boolean) as string[];

            return (
              <UCCACard
                ucca={ucca}
                controllerNames={controllerNames}
                hazardCodes={hazardCodes}
                onEdit={() => loadUCCAForEdit(ucca)}
                onDelete={() => deleteUCCA(ucca.id)}
                compactMode={settings.compactMode}
              />
            );
          }}
          getItemId={(ucca: UCCA) => ucca.id}
          sortOptions={uccaSortOptions}
          defaultSort="systematic"
          emptyMessage="No UCCAs identified yet. Use the systematic analysis or create manually."
          enableViewControls={true}
          enableSorting={true}
        />
      </div>

      {/* Thesis Enumeration Engine */}
      {showThesisEnumeration && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <UCCAEnumerationEngine 
            onUCCAGenerated={(potentialUCCA) => {
              // Handle individual UCCA generation
              console.log('Generated UCCA:', potentialUCCA);
            }}
            onBatchGenerate={(uccas) => {
              // Handle batch UCCA generation
              console.log('Generated batch UCCAs:', uccas);
            }}
          />
        </div>
      )}

      {/* Systematic Analysis Results Modal */}
      <Modal
        isOpen={showSystematicAnalysis}
        onClose={() => setShowSystematicAnalysis(false)}
        title="Systematic UCCA Analysis Results"
        size="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Found {systematicResults.length} potential unsafe control action combinations. 
            Results are ranked by risk score.
          </p>
          
          {systematicResults.map((result, index) => (
            <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      Risk Score: {result.riskScore}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.riskScore >= 70 ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                      result.riskScore >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {result.riskScore >= 70 ? 'High' : result.riskScore >= 50 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                    <strong>Controllers:</strong> {result.controllers.map(c => c.name).join(' + ')}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                    <strong>Actions:</strong> {result.actions.map(a => `${a.verb} ${a.object}`).join(' + ')}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {result.analysisReason}
                  </p>
                </div>
                
                <Button
                  onClick={() => handleCreateUCCAFromCombination(result)}
                  size="sm"
                >
                  Create UCCA
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* UCCA Creation/Edit Modal */}
      <Modal
        isOpen={showUCCAModal}
        onClose={resetForm}
        title={editingUccaId ? 'Edit UCCA' : 'Create New UCCA'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="UCCA Type"
              value={uccaForm.uccaType}
              onChange={e => setUccaForm(prev => ({ ...prev, uccaType: e.target.value as UCCAType }))}
              options={Object.values(UCCAType).map(type => ({ value: type, label: type }))}
            />
            
            <Select
              label="Temporal Relationship"
              value={uccaForm.temporalRelationship}
              onChange={e => setUccaForm(prev => ({ ...prev, temporalRelationship: e.target.value as any }))}
              options={temporalOptions}
            />
          </div>
          
          <Textarea
            label="UCCA Description"
            value={uccaForm.description}
            onChange={e => setUccaForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the unsafe combination of control actions..."
            rows={3}
          />
          
          <Textarea
            label="Context (Why is this unsafe?)"
            value={uccaForm.context}
            onChange={e => setUccaForm(prev => ({ ...prev, context: e.target.value }))}
            placeholder="Describe the conditions under which this combination is unsafe..."
            rows={3}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Involved Controllers (select at least 2):
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
              {controllers.map(controller => (
                <Checkbox
                  key={controller.id}
                  id={`controller-${controller.id}`}
                  label={`${controller.name} (${controller.ctrlType})`}
                  checked={uccaForm.involvedControllerIds.includes(controller.id)}
                  onChange={e => handleControllerChange(controller.id, e.target.checked)}
                />
              ))}
            </div>
          </div>
          
          {availableRoles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Specific Roles (optional):
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900/50">
                {availableRoles.map(role => (
                  <Checkbox
                    key={role.id}
                    id={`role-${role.id}`}
                    label={role.name}
                    checked={uccaForm.involvedRoleIds.includes(role.id)}
                    onChange={e => setUccaForm(prev => ({
                      ...prev,
                      involvedRoleIds: e.target.checked
                        ? [...prev.involvedRoleIds, role.id]
                        : prev.involvedRoleIds.filter(id => id !== role.id)
                    }))}
                  />
                ))}
              </div>
            </div>
          )}
          
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
                    checked={uccaForm.hazardIds.includes(hazard.id)}
                    onChange={e => handleHazardChange(hazard.id, e.target.checked)}
                    containerClassName="mb-2"
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="systematic"
              label="This represents a systematic pattern (not a single occurrence)"
              checked={uccaForm.isSystematic}
              onChange={e => setUccaForm(prev => ({ ...prev, isSystematic: e.target.checked }))}
            />
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button onClick={handleSaveUCCA}>
              {editingUccaId ? 'Update' : 'Create'} UCCA
            </Button>
            <Button onClick={resetForm} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedUCCAAnalysis;