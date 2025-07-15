import React, { useState } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon, 
  ChevronDownIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/solid';
import Button from './Button';

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
  color?: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'text' | 'date';
  options?: FilterOption[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface ActiveFilter {
  groupId: string;
  optionId?: string;
  value?: any;
  label: string;
}

interface AdvancedFilterProps {
  filterGroups: FilterGroup[];
  activeFilters: ActiveFilter[];
  onFilterChange: (filters: ActiveFilter[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  filterGroups,
  activeFilters,
  onFilterChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  className = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const addFilter = (groupId: string, optionId?: string, value?: any, label?: string) => {
    const newFilter: ActiveFilter = {
      groupId,
      optionId,
      value,
      label: label || ''
    };
    
    // Remove existing filter for this group if it's not multiselect
    const group = filterGroups.find(g => g.id === groupId);
    const filteredExisting = group?.type === 'multiselect' 
      ? activeFilters 
      : activeFilters.filter(f => f.groupId !== groupId);
    
    onFilterChange([...filteredExisting, newFilter]);
  };

  const removeFilter = (filterToRemove: ActiveFilter) => {
    onFilterChange(activeFilters.filter(f => 
      !(f.groupId === filterToRemove.groupId && 
        f.optionId === filterToRemove.optionId &&
        f.value === filterToRemove.value)
    ));
  };

  const clearAllFilters = () => {
    onFilterChange([]);
    onSearchChange('');
  };

  const renderFilterGroup = (group: FilterGroup) => {
    const isExpanded = expandedGroups.has(group.id);
    const groupFilters = activeFilters.filter(f => f.groupId === group.id);

    return (
      <div key={group.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
        <button
          onClick={() => toggleGroup(group.id)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {group.label}
            {groupFilters.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full text-xs">
                {groupFilters.length}
              </span>
            )}
          </span>
          <ChevronDownIcon 
            className={`w-4 h-4 text-slate-500 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isExpanded && (
          <div className="px-3 pb-3">
            {group.type === 'select' || group.type === 'multiselect' ? (
              <div className="space-y-2">
                {group.options?.map(option => {
                  const isActive = groupFilters.some(f => f.optionId === option.id);
                  return (
                    <label
                      key={option.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type={group.type === 'multiselect' ? 'checkbox' : 'radio'}
                        name={group.id}
                        checked={isActive}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addFilter(group.id, option.id, option.value, option.label);
                          } else {
                            const filterToRemove = groupFilters.find(f => f.optionId === option.id);
                            if (filterToRemove) removeFilter(filterToRemove);
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {option.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : group.type === 'text' ? (
              <input
                type="text"
                placeholder={group.placeholder}
                value={groupFilters[0]?.value || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    addFilter(group.id, undefined, e.target.value, e.target.value);
                  } else {
                    groupFilters.forEach(removeFilter);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm"
              />
            ) : group.type === 'range' ? (
              <div className="space-y-2">
                <input
                  type="range"
                  min={group.min}
                  max={group.max}
                  value={groupFilters[0]?.value || group.min}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    addFilter(group.id, undefined, value, `${value}`);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{group.min}</span>
                  <span className="font-medium">{groupFilters[0]?.value || group.min}</span>
                  <span>{group.max}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="secondary"
          leftIcon={<FunnelIcon className="w-4 h-4" />}
          size="sm"
        >
          Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
        </Button>

        {(activeFilters.length > 0 || searchQuery) && (
          <Button
            onClick={clearAllFilters}
            variant="secondary"
            size="sm"
            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <span
              key={`${filter.groupId}-${filter.optionId}-${index}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
            >
              {filter.label}
              <button
                onClick={() => removeFilter(filter)}
                className="ml-2 hover:text-blue-600 dark:hover:text-blue-200"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <h4 className="font-medium text-slate-700 dark:text-slate-300">Filter Options</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filterGroups.map(renderFilterGroup)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;