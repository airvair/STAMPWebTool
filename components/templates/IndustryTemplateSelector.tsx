/**
 * Industry Template Selector Component
 * UI for browsing and applying industry-specific STPA templates
 */

import React, { useState, useMemo } from 'react';
import {
  CubeIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TagIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  industryTemplatesManager,
  IndustryTemplate,
  Industry,
  TemplateCustomization
} from '@/utils/industryTemplates';
import { useAnalysis } from '@/hooks/useAnalysis';
import Card from '../shared/Card';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Modal from '../shared/Modal';
import Checkbox from '../shared/Checkbox';
import RadioGroup from '../shared/RadioGroup';
import Tabs from '../shared/Tabs';

interface IndustryTemplateSelectorProps {
  onTemplateApply?: (template: IndustryTemplate) => void;
  onClose?: () => void;
}

const IndustryTemplateSelector: React.FC<IndustryTemplateSelectorProps> = ({
  onTemplateApply,
  onClose
}) => {
  const analysisData = useAnalysis();
  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Customization options
  const [includeRegulations, setIncludeRegulations] = useState(true);
  const [includeIndustryHazards, setIncludeIndustryHazards] = useState(true);
  const [includeBestPractices, setIncludeBestPractices] = useState(true);
  const [customizationLevel, setCustomizationLevel] = useState<'minimal' | 'standard' | 'comprehensive'>('standard');

  // Get all templates
  const allTemplates = industryTemplatesManager.getTemplates();

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = allTemplates;

    // Filter by industry
    if (selectedIndustry !== 'all') {
      templates = templates.filter(t => t.industry === selectedIndustry);
    }

    // Filter by search query
    if (searchQuery) {
      templates = industryTemplatesManager.searchTemplates({
        searchText: searchQuery
      });
    }

    return templates;
  }, [allTemplates, selectedIndustry, searchQuery]);

  // Group templates by industry
  const templatesByIndustry = useMemo(() => {
    const grouped = new Map<Industry, IndustryTemplate[]>();
    
    filteredTemplates.forEach(template => {
      if (!grouped.has(template.industry)) {
        grouped.set(template.industry, []);
      }
      grouped.get(template.industry)!.push(template);
    });

    return grouped;
  }, [filteredTemplates]);

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    const customization: TemplateCustomization = {
      includeRegulations,
      includeIndustryHazards,
      includeBestPractices,
      customizationLevel
    };

    try {
      const result = industryTemplatesManager.applyTemplate(
        selectedTemplate.id,
        customization
      );

      // Apply to analysis context
      result.losses.forEach(loss => analysisData.addLoss?.(loss));
      result.hazards.forEach(hazard => analysisData.addHazard?.(hazard));
      result.controllers.forEach(controller => analysisData.addController?.(controller));
      result.controlActions.forEach(action => analysisData.addControlAction?.(action));
      
      if (customizationLevel !== 'minimal') {
        result.ucas.forEach(uca => analysisData.addUCA?.(uca));
      }
      
      if (customizationLevel === 'comprehensive') {
        result.uccas.forEach(ucca => analysisData.addUCCA?.(ucca));
        result.scenarios.forEach(scenario => analysisData.addCausalScenario?.(scenario));
        result.requirements.forEach(req => analysisData.addRequirement?.(req));
      }

      if (onTemplateApply) {
        onTemplateApply(selectedTemplate);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
    }
  };

  const getIndustryIcon = (industry: Industry): string => {
    const icons: Record<Industry, string> = {
      [Industry.AEROSPACE]: '✈️',
      [Industry.AUTOMOTIVE]: '🚗',
      [Industry.MEDICAL_DEVICES]: '💉',
      [Industry.NUCLEAR]: '☢️',
      [Industry.RAIL]: '🚂',
      [Industry.MARITIME]: '🚢',
      [Industry.CHEMICAL]: '⚗️',
      [Industry.ENERGY]: '⚡',
      [Industry.MANUFACTURING]: '🏭',
      [Industry.ROBOTICS]: '🤖',
      [Industry.SOFTWARE]: '💻',
      [Industry.INFRASTRUCTURE]: '🏗️'
    };
    return icons[industry] || '📦';
  };

  const getIndustryName = (industry: Industry): string => {
    return industry.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CubeIcon className="w-6 h-6" />
          Industry Templates
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Start with pre-configured templates for your industry
        </p>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 space-y-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedIndustry('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedIndustry === 'all'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Industries
          </button>
          {Object.values(Industry).map(industry => (
            <button
              key={industry}
              onClick={() => setSelectedIndustry(industry)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedIndustry === industry
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {getIndustryIcon(industry)} {getIndustryName(industry)}
            </button>
          ))}
        </div>
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <CubeIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No templates found matching your criteria
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(templatesByIndustry.entries()).map(([industry, templates]) => (
              <div key={industry}>
                <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <span className="text-lg">{getIndustryIcon(industry)}</span>
                  {getIndustryName(industry)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(template => (
                    <Card
                      key={template.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate?.id === template.id
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <span className="text-2xl">{template.icon}</span>
                          {template.name}
                        </h4>
                        {selectedTemplate?.id === template.id && (
                          <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {template.description}
                      </p>

                      <div className="space-y-2">
                        {/* Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {template.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs"
                            >
                              <TagIcon className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-xs text-slate-500">
                              +{template.tags.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Regulations */}
                        {template.regulations.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span>{template.regulations.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template);
                            setShowDetails(true);
                          }}
                        >
                          View Details
                        </Button>
                        
                        {selectedTemplate?.id === template.id && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCustomization(true);
                            }}
                          >
                            Customize
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {selectedTemplate ? (
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              {selectedTemplate.name} selected
            </span>
          ) : (
            <span>Select a template to continue</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            onClick={() => selectedTemplate && setShowCustomization(true)}
            disabled={!selectedTemplate}
            leftIcon={<SparklesIcon className="w-4 h-4" />}
          >
            Apply Template
          </Button>
        </div>
      </div>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title={`${selectedTemplate.icon} ${selectedTemplate.name}`}
          size="xl"
        >
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'content', label: 'Template Content' },
              { id: 'compliance', label: 'Compliance' }
            ]}
          >
            {(activeTab) => (
              <>
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {selectedTemplate.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Applicable Systems</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.applicableSystems.map(system => (
                          <span
                            key={system}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                          >
                            {system}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Best Practices</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedTemplate.bestPractices.map((practice, idx) => (
                          <li key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                            {practice}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedTemplate.riskMatrix && (
                      <div>
                        <h3 className="font-semibold mb-2">Risk Matrix Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Likelihood Levels</h4>
                            <div className="space-y-1">
                              {selectedTemplate.riskMatrix.likelihood.map(level => (
                                <div key={level.level} className="text-xs">
                                  <span className="font-medium">{level.label}:</span>{' '}
                                  <span className="text-slate-600 dark:text-slate-400">
                                    {level.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-1">Severity Levels</h4>
                            <div className="space-y-1">
                              {selectedTemplate.riskMatrix.severity.map(level => (
                                <div key={level.level} className="text-xs">
                                  <span className="font-medium">{level.label}:</span>{' '}
                                  <span className="text-slate-600 dark:text-slate-400">
                                    {level.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Losses</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedTemplate.template.losses.length}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Hazards</h4>
                        <p className="text-2xl font-bold text-orange-600">
                          {selectedTemplate.template.hazards.length}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Controllers</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedTemplate.template.controllers.length}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Control Actions</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedTemplate.template.controlActions.length}
                        </p>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      {selectedTemplate.template.losses.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Sample Losses</h4>
                          <div className="space-y-2">
                            {selectedTemplate.template.losses.slice(0, 3).map((loss, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                                <p className="font-medium text-sm">{loss.code}: {loss.title}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                  {loss.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedTemplate.template.hazards.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Sample Hazards</h4>
                          <div className="space-y-2">
                            {selectedTemplate.template.hazards.slice(0, 3).map((hazard, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                                <p className="font-medium text-sm">{hazard.code}: {hazard.title}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                  {hazard.systemCondition}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'compliance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Applicable Regulations</h3>
                      <div className="space-y-3">
                        {selectedTemplate.regulations.map(regulation => (
                          <Card key={regulation} className="p-4">
                            <h4 className="font-medium flex items-center gap-2">
                              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                              {regulation}
                            </h4>
                            <div className="mt-2 space-y-1">
                              {industryTemplatesManager.getComplianceChecklist(selectedTemplate.id)
                                .find(c => c.regulation === regulation)
                                ?.requirements.slice(0, 3).map((req, idx) => (
                                  <p key={idx} className="text-sm text-slate-600 dark:text-slate-400 pl-7">
                                    • {req}
                                  </p>
                                ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Tabs>
        </Modal>
      )}

      {/* Customization Modal */}
      {selectedTemplate && (
        <Modal
          isOpen={showCustomization}
          onClose={() => setShowCustomization(false)}
          title="Customize Template"
          size="md"
        >
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Customization Level</h3>
              <RadioGroup
                value={customizationLevel}
                onChange={setCustomizationLevel}
                options={[
                  {
                    value: 'minimal',
                    label: 'Minimal',
                    description: 'Only losses, hazards, and control structure'
                  },
                  {
                    value: 'standard',
                    label: 'Standard',
                    description: 'Includes common UCAs and UCCAs'
                  },
                  {
                    value: 'comprehensive',
                    label: 'Comprehensive',
                    description: 'Full template with scenarios and requirements'
                  }
                ]}
              />
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">Additional Options</h3>
              
              <Checkbox
                id="include-regulations"
                label="Include regulatory requirements"
                checked={includeRegulations}
                onChange={(e) => setIncludeRegulations(e.target.checked)}
              />
              
              <Checkbox
                id="include-hazards"
                label="Include industry-specific hazards"
                checked={includeIndustryHazards}
                onChange={(e) => setIncludeIndustryHazards(e.target.checked)}
              />
              
              <Checkbox
                id="include-practices"
                label="Include best practice recommendations"
                checked={includeBestPractices}
                onChange={(e) => setIncludeBestPractices(e.target.checked)}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                What will be created:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• {selectedTemplate.template.losses.length} losses</li>
                <li>• {selectedTemplate.template.hazards.length} hazards</li>
                <li>• {selectedTemplate.template.controllers.length} controllers</li>
                <li>• {selectedTemplate.template.controlActions.length} control actions</li>
                {customizationLevel !== 'minimal' && (
                  <>
                    <li>• {selectedTemplate.template.commonUCAs.length} common UCAs</li>
                    <li>• {selectedTemplate.template.commonUCCAs.length} common UCCAs</li>
                  </>
                )}
                {customizationLevel === 'comprehensive' && (
                  <>
                    <li>• {selectedTemplate.template.typicalScenarios.length} typical scenarios</li>
                    <li>• {selectedTemplate.template.standardRequirements.length} standard requirements</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowCustomization(false)}
              >
                Back
              </Button>
              <Button
                onClick={handleApplyTemplate}
                leftIcon={<DocumentDuplicateIcon className="w-4 h-4" />}
              >
                Apply Template
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default IndustryTemplateSelector;