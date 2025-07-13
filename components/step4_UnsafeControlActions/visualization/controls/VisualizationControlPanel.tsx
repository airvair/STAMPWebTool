import React, { useState } from 'react';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import Switch from '@/components/shared/Switch';
import Input from '@/components/shared/Input';
import Select from '@/components/shared/Select';
import { 
  Settings2, 
  Filter, 
  Layout, 
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Eye
} from 'lucide-react';
import { Controller, Hazard, UCAType, UCCAType } from '@/types';
import { VisualizationFilters } from '../UCAUCCAVisualization';
import { LayoutType } from '../utils/layoutEngine';

interface VisualizationControlPanelProps {
  filters: VisualizationFilters;
  onFiltersChange: (filters: Partial<VisualizationFilters>) => void;
  onLayoutChange: (layout: LayoutType) => void;
  currentLayout: LayoutType;
  controllers: Controller[];
  hazards: Hazard[];
}

const VisualizationControlPanel: React.FC<VisualizationControlPanelProps> = ({
  filters,
  onFiltersChange,
  onLayoutChange,
  currentLayout,
  controllers,
  hazards,
}) => {
  const [displayExpanded, setDisplayExpanded] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  const ucaTypes = Object.values(UCAType);
  const uccaTypes = Object.values(UCCAType);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export visualization');
  };

  const layoutOptions = [
    { value: 'hierarchical', label: 'Hierarchical' },
    { value: 'circular', label: 'Circular' },
    { value: 'force', label: 'Force-Directed' },
    { value: 'grid', label: 'Grid' },
  ];

  const controllerOptions = [
    { value: 'all', label: 'All Controllers' },
    ...controllers.map(c => ({ value: c.id, label: c.name }))
  ];

  const hazardOptions = [
    { value: 'all', label: 'All Hazards' },
    ...hazards.map(h => ({ value: h.id, label: `${h.code} - ${h.title}` }))
  ];

  const ucaTypeOptions = [
    { value: 'all', label: 'All UCA Types' },
    ...ucaTypes.map(type => ({ value: type, label: type }))
  ];

  const uccaTypeOptions = [
    { value: 'all', label: 'All UCCA Types' },
    ...uccaTypes.map(type => ({ value: type, label: type }))
  ];

  const hasActiveFilters = filters.selectedControllers.length > 0 || 
    filters.selectedHazards.length > 0 ||
    filters.ucaTypes.length > 0 ||
    filters.uccaTypes.length > 0;

  return (
    <Card className="w-80 p-4 space-y-4 bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Visualization Controls
        </h3>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleExport}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search nodes..."
          value={filters.searchTerm}
          onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
          className="pl-8"
        />
      </div>

      {/* Layout Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium flex items-center gap-1">
          <Layout className="h-3 w-3" />
          Layout
        </label>
        <Select 
          value={currentLayout} 
          onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
          options={layoutOptions}
        />
      </div>

      {/* Display Toggles */}
      <div className="space-y-2">
        <button
          onClick={() => setDisplayExpanded(!displayExpanded)}
          className="flex items-center justify-between w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Display Options
          </span>
          {displayExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {displayExpanded && (
          <div className="space-y-2 pl-6">
            <Switch
              label="Controllers"
              checked={filters.showControllers}
              onChange={(checked: boolean) => onFiltersChange({ showControllers: checked })}
            />
            <Switch
              label="UCAs"
              checked={filters.showUCAs}
              onChange={(checked: boolean) => onFiltersChange({ showUCAs: checked })}
            />
            <Switch
              label="UCCAs"
              checked={filters.showUCCAs}
              onChange={(checked: boolean) => onFiltersChange({ showUCCAs: checked })}
            />
            <Switch
              label="Hazards"
              checked={filters.showHazards}
              onChange={(checked: boolean) => onFiltersChange({ showHazards: checked })}
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="flex items-center justify-between w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Active
              </span>
            )}
          </span>
          {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {filtersExpanded && (
          <div className="space-y-3 pt-2">
            {/* Controller Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Controllers</label>
              <Select
                value={filters.selectedControllers[0] || 'all'}
                onChange={(e) => {
                  onFiltersChange({
                    selectedControllers: e.target.value === 'all' ? [] : [e.target.value]
                  });
                }}
                options={controllerOptions}
              />
            </div>

            {/* Hazard Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Hazards</label>
              <Select
                value={filters.selectedHazards[0] || 'all'}
                onChange={(e) => {
                  onFiltersChange({
                    selectedHazards: e.target.value === 'all' ? [] : [e.target.value]
                  });
                }}
                options={hazardOptions}
              />
            </div>

            {/* UCA Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium">UCA Types</label>
              <Select
                value={filters.ucaTypes[0] || 'all'}
                onChange={(e) => {
                  onFiltersChange({
                    ucaTypes: e.target.value === 'all' ? [] : [e.target.value]
                  });
                }}
                options={ucaTypeOptions}
              />
            </div>

            {/* UCCA Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium">UCCA Types</label>
              <Select
                value={filters.uccaTypes[0] || 'all'}
                onChange={(e) => {
                  onFiltersChange({
                    uccaTypes: e.target.value === 'all' ? [] : [e.target.value]
                  });
                }}
                options={uccaTypeOptions}
              />
            </div>

            {/* Clear Filters */}
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                onFiltersChange({
                  selectedControllers: [],
                  selectedHazards: [],
                  ucaTypes: [],
                  uccaTypes: [],
                  searchTerm: '',
                });
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VisualizationControlPanel;