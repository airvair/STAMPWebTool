import React, { useState, useMemo } from 'react';
import {
  PlayIcon,
  AdjustmentsHorizontalIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';
import { useAnalysis } from '@/hooks/useAnalysis';
import { 
  EnhancedUCCAEnumerator, 
  UCCAEnumerationConfig, 
  EnumerationResult,
  createAuthorityTuple,
  getAviationSafetyConfig 
} from '@/utils/enhancedUccaAlgorithms';
import { PotentialUCCA, UCCAAlgorithmType, AbstractionLevel } from '@/utils/uccaAlgorithms';
import { UCCAType } from '@/types';
import Button from '../shared/Button';
import Checkbox from '../shared/Checkbox';
import { useErrorHandler } from '@/utils/errorHandling';

interface UCCAEnumerationEngineProps {
  onUCCAGenerated?: (ucca: PotentialUCCA) => void;
  onBatchGenerate?: (uccas: PotentialUCCA[]) => void;
}

const UCCAEnumerationEngine: React.FC<UCCAEnumerationEngineProps> = ({
  onUCCAGenerated,
  onBatchGenerate
}) => {
  const { controllers, controlActions, uccas, hazards, addUCCA } = useAnalysis();
  const { showSuccess, showInfo, handleError } = useErrorHandler();

  const [config, setConfig] = useState<UCCAEnumerationConfig>(getAviationSafetyConfig());
  const [isEnumerating, setIsEnumerating] = useState(false);
  const [result, setResult] = useState<EnumerationResult | null>(null);
  const [selectedUCCAs, setSelectedUCCAs] = useState<Set<number>>(new Set());
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  // Create enumeration context
  const enumerationContext = useMemo(() => {
    const authorityTuple = createAuthorityTuple(controllers, controlActions);
    
    return {
      authorityTuple,
      hazards,
      existingUCCAs: uccas,
      interchangeableControllers: { groups: [] }, // Could be enhanced based on controller types
      specialInteractions: {
        mandatoryUCCAs: [],
        excludedUCCAs: [],
        priorityAdjustments: new Map()
      }
    };
  }, [controllers, controlActions, uccas, hazards]);

  const enumerator = useMemo(() => new EnhancedUCCAEnumerator(config), [config]);

  const handleEnumerate = async () => {
    if (controllers.length === 0 || controlActions.length === 0) {
      showInfo('Please ensure controllers and control actions are defined before enumeration');
      return;
    }

    setIsEnumerating(true);
    try {
      const enumerationResult = await enumerator.enumerateUCCAs(enumerationContext);
      setResult(enumerationResult);
      setSelectedUCCAs(new Set());

      showSuccess(
        `Enumerated ${enumerationResult.potentialUCCAs.length} potential UCCAs in ${enumerationResult.processingTime.toFixed(1)}ms`,
        'Enumeration Complete'
      );
    } catch (error) {
      handleError(error as Error, 'UCCAEnumerationEngine', 'handleEnumerate');
    } finally {
      setIsEnumerating(false);
    }
  };

  const handleConfigChange = (key: keyof UCCAEnumerationConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setResult(null); // Clear results when config changes
  };

  const handleSelectUCCA = (index: number, selected: boolean) => {
    setSelectedUCCAs(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  };

  const handleGenerateSelected = async () => {
    if (!result || selectedUCCAs.size === 0) return;

    const selectedPotentialUCCAs = Array.from(selectedUCCAs).map(index => result.potentialUCCAs[index]);
    
    try {
      for (const potentialUCCA of selectedPotentialUCCAs) {
        const uccaData = {
          description: potentialUCCA.description,
          context: `Generated from thesis algorithm: ${potentialUCCA.enumerationReason}`,
          hazardIds: [], // Could be enhanced to auto-link relevant hazards
          uccaType: UCCAType.Team,
          involvedControllerIds: [...new Set(potentialUCCA.combinations.map(c => c.controllerId))]
        };

        await addUCCA(uccaData);
        
        if (onUCCAGenerated) {
          onUCCAGenerated(potentialUCCA);
        }
      }

      if (onBatchGenerate) {
        onBatchGenerate(selectedPotentialUCCAs);
      }

      showSuccess(`Generated ${selectedPotentialUCCAs.length} UCCAs from enumeration`);
      setSelectedUCCAs(new Set());
    } catch (error) {
      handleError(error as Error, 'UCCAEnumerationEngine', 'handleGenerateSelected');
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/20';
    if (riskScore >= 0.6) return 'text-orange-600 bg-orange-50 dark:text-orange-300 dark:bg-orange-900/20';
    if (riskScore >= 0.4) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/20';
    return 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20';
  };

  const getAlgorithmTypeLabel = (type: UCCAAlgorithmType) => {
    switch (type) {
      case UCCAAlgorithmType.Type1_2:
        return 'Type 1-2 (Provide/Not Provide)';
      case UCCAAlgorithmType.Type3_4:
        return 'Type 3-4 (Temporal)';
      default:
        return 'Unknown';
    }
  };

  const getAbstractionLabel = (abstraction: AbstractionLevel) => {
    switch (abstraction) {
      case AbstractionLevel.Abstraction2a:
        return 'Team Level';
      case AbstractionLevel.Abstraction2b:
        return 'Controller Level';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            UCCA Enumeration Engine
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Systematic enumeration based on UCCA thesis algorithms
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
            variant="secondary"
            leftIcon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
          >
            Configure
          </Button>
          
          <Button
            onClick={handleEnumerate}
            disabled={isEnumerating || controllers.length === 0}
            leftIcon={isEnumerating ? <ClockIcon className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}
          >
            {isEnumerating ? 'Enumerating...' : 'Start Enumeration'}
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showAdvancedConfig && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Enumeration Configuration
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Max Combination Size
              </label>
              <input
                type="number"
                min="2"
                max="6"
                value={config.maxCombinationSize}
                onChange={(e) => handleConfigChange('maxCombinationSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Risk Threshold
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.riskThreshold}
                onChange={(e) => handleConfigChange('riskThreshold', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900"
              />
            </div>
            
            <div className="space-y-2">
              <Checkbox
                id="enableType1_2"
                label="Enable Type 1-2 (Provide/Not Provide)"
                checked={config.enableType1_2}
                onChange={(e) => handleConfigChange('enableType1_2', e.target.checked)}
              />
              <Checkbox
                id="enableType3_4"
                label="Enable Type 3-4 (Temporal)"
                checked={config.enableType3_4}
                onChange={(e) => handleConfigChange('enableType3_4', e.target.checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Checkbox
                id="enableAbstraction2a"
                label="Enable Team-level Analysis"
                checked={config.enableAbstraction2a}
                onChange={(e) => handleConfigChange('enableAbstraction2a', e.target.checked)}
              />
              <Checkbox
                id="enableAbstraction2b"
                label="Enable Controller-level Analysis"
                checked={config.enableAbstraction2b}
                onChange={(e) => handleConfigChange('enableAbstraction2b', e.target.checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Checkbox
                id="prioritizeByHazards"
                label="Prioritize by Hazard Relevance"
                checked={config.prioritizeByHazards}
                onChange={(e) => handleConfigChange('prioritizeByHazards', e.target.checked)}
              />
              <Checkbox
                id="includeTemporalAnalysis"
                label="Include Temporal Analysis"
                checked={config.includeTemporalAnalysis}
                onChange={(e) => handleConfigChange('includeTemporalAnalysis', e.target.checked)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {result && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <ChartBarIcon className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-slate-800 dark:text-slate-100">
              Enumeration Statistics
            </h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {result.statistics.totalEnumerated}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Total UCCAs</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.statistics.type1_2Count}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Type 1-2</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {result.statistics.type3_4Count}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Type 3-4</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {result.statistics.highRiskCount}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">High Risk</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {result.statistics.averageRiskScore.toFixed(2)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Avg Risk</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {result.processingTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Process Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result && result.recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <LightBulbIcon className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
              Analysis Recommendations
            </h4>
          </div>
          
          <ul className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start">
                <span className="mr-2 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Results */}
      {result && result.potentialUCCAs.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                Enumerated UCCAs ({result.potentialUCCAs.length})
              </h4>
              
              {selectedUCCAs.size > 0 && (
                <Button
                  onClick={handleGenerateSelected}
                  leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                  size="sm"
                >
                  Generate Selected ({selectedUCCAs.size})
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {result.potentialUCCAs.map((ucca, index) => (
              <div 
                key={index}
                className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={`ucca-${index}`}
                    label=""
                    checked={selectedUCCAs.has(index)}
                    onChange={(e) => handleSelectUCCA(index, e.target.checked)}
                    containerClassName="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(ucca.riskScore)}`}>
                        Risk: {(ucca.riskScore * 100).toFixed(0)}%
                      </span>
                      
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                        {getAlgorithmTypeLabel(ucca.type)}
                      </span>
                      
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                        {getAbstractionLabel(ucca.abstraction)}
                      </span>
                    </div>
                    
                    <h5 className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                      {ucca.description}
                    </h5>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                      {ucca.enumerationReason}
                    </p>
                    
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Involves: {ucca.combinations.map(c => {
                        const controller = controllers.find(ctrl => ctrl.id === c.controllerId);
                        const action = controlActions.find(act => act.id === c.actionId);
                        return `${controller?.name || 'Unknown'}: ${c.provided ? 'Provides' : 'Does not provide'} ${action?.verb} ${action?.object}${c.timing ? ` (${c.timing})` : ''}`;
                      }).join('; ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {result && result.potentialUCCAs.length === 0 && (
        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
            No New UCCAs Found
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            The enumeration completed but found no new UCCA patterns above the risk threshold.
            Consider adjusting the configuration or reviewing existing UCCAs.
          </p>
        </div>
      )}
    </div>
  );
};

export default UCCAEnumerationEngine;