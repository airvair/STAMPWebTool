import React, { useState, useMemo, useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { UCCA, UCCAType, Controller, ControlAction, UnsafeControlAction } from '@/types';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import Modal from '../shared/Modal';
import { PlusIcon, TrashIcon, BeakerIcon, CpuChipIcon } from '@heroicons/react/24/solid';

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
  const [editingUccaId, setEditingUccaId] = useState<string | null>(null);
  const [selectedUCCAType, setSelectedUCCAType] = useState<UCCAType | 'All'>('All');
  const [systematicResults, setSystematicResults] = useState<ControlActionCombination[]>([]);

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
      if (controllerTypes.has('T')) {
        reasons.push('Team coordination required');
      }
      if (controllerTypes.has('O')) {
        reasons.push('Organizational policy interaction');
      }
      if (controllerTypes.has('H') && controllerTypes.has('S')) {
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

  const filteredUCCAs = uccas.filter(ucca => 
    selectedUCCAType === 'All' || ucca.uccaType === selectedUCCAType
  );

  const uccaTypeOptions = [
    { value: 'All', label: 'All Types' },
    ...Object.values(UCCAType).map(type => ({ value: type, label: type }))
  ];

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={handleRunSystematicAnalysis}
            leftIcon={<BeakerIcon className="w-5 h-5" />}
            disabled={controlActions.filter(ca => !ca.isOutOfScope).length < 2}
          >
            Run Systematic UCCA Analysis
          </Button>
          
          <Button
            onClick={() => setShowUCCAModal(true)}
            leftIcon={<PlusIcon className="w-5 h-5" />}
          >
            Create UCCA Manually
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

      {/* Filter and Display */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Identified UCCAs
          </h3>
          <Select
            value={selectedUCCAType}
            onChange={e => setSelectedUCCAType(e.target.value as UCCAType | 'All')}
            options={uccaTypeOptions}
            className="w-48"
          />
        </div>

        {filteredUCCAs.length > 0 ? (
          <div className="grid gap-4">
            {filteredUCCAs.map(ucca => {
              const involvedControllers = ucca.involvedControllerIds.map(id =>
                controllers.find(c => c.id === id)?.name
              ).filter(Boolean);
              
              return (
                <div key={ucca.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                          {ucca.code}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ucca.uccaType === UCCAType.Team ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' :
                          ucca.uccaType === UCCAType.Role ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                          ucca.uccaType === UCCAType.Organizational ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                          ucca.uccaType === UCCAType.Temporal ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300'
                        }`}>
                          {ucca.uccaType}
                        </span>
                        {ucca.isSystematic && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                            Systematic
                          </span>
                        )}
                      </div>
                      
                      <p className="text-slate-700 dark:text-slate-300 mb-2">
                        {ucca.description}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Context: {ucca.context}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Controllers: </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {involvedControllers.join(', ')}
                          </span>
                        </div>
                        
                        {ucca.temporalRelationship && (
                          <div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Timing: </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {ucca.temporalRelationship}
                            </span>
                          </div>
                        )}
                        
                        {ucca.hazardIds.length > 0 && (
                          <div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Hazards: </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {ucca.hazardIds.map(hid => 
                                hazards.find(h => h.id === hid)?.code
                              ).filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => loadUCCAForEdit(ucca)}
                        size="sm"
                        variant="secondary"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => deleteUCCA(ucca.id)}
                        size="sm"
                        variant="secondary"
                        className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No UCCAs identified yet. Use the systematic analysis or create manually.
          </p>
        )}
      </div>

      {/* Systematic Analysis Results Modal */}
      <Modal
        isOpen={showSystematicAnalysis}
        onClose={() => setShowSystematicAnalysis(false)}
        title="Systematic UCCA Analysis Results"
        size="large"
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
        size="large"
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