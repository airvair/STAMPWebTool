import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import Checkbox from './Checkbox';
import Select from './Select';

export interface TraceabilityFilterOptions {
  showLosses: boolean;
  showHazards: boolean;
  showUCAs: boolean;
  showUCCAs: boolean;
  showScenarios: boolean;
  showRequirements: boolean;
  minLinkStrength: number;
  onlyHighRisk: boolean;
}

interface TraceabilityFilterPanelProps {
  filters: TraceabilityFilterOptions;
  onChange: (filters: TraceabilityFilterOptions) => void;
  className?: string;
}

const TraceabilityFilterPanel: React.FC<TraceabilityFilterPanelProps> = ({
  filters,
  onChange,
  className = ''
}) => {
  const handleToggle = (key: keyof TraceabilityFilterOptions) => {
    onChange({
      ...filters,
      [key]: !filters[key]
    });
  };

  const handleLinkStrengthChange = (value: string) => {
    onChange({
      ...filters,
      minLinkStrength: parseFloat(value)
    });
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FunnelIcon className="w-5 h-5 text-slate-500" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Filter Graph</h3>
      </div>

      <div className="space-y-4">
        {/* Entity Type Filters */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Show Entities
          </h4>
          <div className="space-y-2">
            <Checkbox
              id="show-losses"
              label="Losses"
              checked={filters.showLosses}
              onChange={() => handleToggle('showLosses')}
            />
            <Checkbox
              id="show-hazards"
              label="Hazards"
              checked={filters.showHazards}
              onChange={() => handleToggle('showHazards')}
            />
            <Checkbox
              id="show-ucas"
              label="UCAs"
              checked={filters.showUCAs}
              onChange={() => handleToggle('showUCAs')}
            />
            <Checkbox
              id="show-uccas"
              label="UCCAs"
              checked={filters.showUCCAs}
              onChange={() => handleToggle('showUCCAs')}
            />
            <Checkbox
              id="show-scenarios"
              label="Causal Scenarios"
              checked={filters.showScenarios}
              onChange={() => handleToggle('showScenarios')}
            />
            <Checkbox
              id="show-requirements"
              label="Requirements"
              checked={filters.showRequirements}
              onChange={() => handleToggle('showRequirements')}
            />
          </div>
        </div>

        {/* Link Strength Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Minimum Link Strength
          </label>
          <Select
            value={filters.minLinkStrength.toString()}
            onChange={(e) => handleLinkStrengthChange(e.target.value)}
            options={[
              { value: '0', label: 'Show All Links' },
              { value: '0.3', label: 'Weak+ (30%)' },
              { value: '0.5', label: 'Medium+ (50%)' },
              { value: '0.7', label: 'Strong+ (70%)' },
              { value: '0.9', label: 'Very Strong (90%)' }
            ]}
          />
        </div>

        {/* Risk Filter */}
        <div>
          <Checkbox
            id="only-high-risk"
            label="Only show high-risk items"
            checked={filters.onlyHighRisk}
            onChange={() => handleToggle('onlyHighRisk')}
          />
        </div>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Quick Presets
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChange({
                showLosses: true,
                showHazards: true,
                showUCAs: true,
                showUCCAs: true,
                showScenarios: true,
                showRequirements: true,
                minLinkStrength: 0,
                onlyHighRisk: false
              })}
              className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Show All
            </button>
            <button
              onClick={() => onChange({
                showLosses: true,
                showHazards: true,
                showUCAs: true,
                showUCCAs: true,
                showScenarios: false,
                showRequirements: false,
                minLinkStrength: 0.5,
                onlyHighRisk: true
              })}
              className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              High Risk Only
            </button>
            <button
              onClick={() => onChange({
                showLosses: false,
                showHazards: false,
                showUCAs: true,
                showUCCAs: true,
                showScenarios: false,
                showRequirements: false,
                minLinkStrength: 0,
                onlyHighRisk: false
              })}
              className="text-xs px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded hover:bg-violet-100 dark:hover:bg-violet-900/30"
            >
              UCAs/UCCAs
            </button>
            <button
              onClick={() => onChange({
                showLosses: true,
                showHazards: true,
                showUCAs: false,
                showUCCAs: false,
                showScenarios: false,
                showRequirements: false,
                minLinkStrength: 0,
                onlyHighRisk: false
              })}
              className="text-xs px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              L&H Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceabilityFilterPanel;