import React, { useState, useEffect, useMemo } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import Button from './Button';
import AdvancedFilter, { FilterGroup, ActiveFilter } from './AdvancedFilter';

export interface ItemListPanelProps<T> {
  items: T[];
  selectedItem?: T | null;
  onSelectItem: (item: T) => void;
  onCreateNew: () => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  getItemId: (item: T) => string;
  title: string;
  createButtonLabel: string;
  emptyMessage: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  className?: string;
  maxHeight?: string;
  // Enhanced filtering props
  enableAdvancedFilter?: boolean;
  filterGroups?: FilterGroup[];
  onFilter?: (items: T[]) => T[];
  getSearchableText?: (item: T) => string;
  getCategoryFromItem?: (item: T) => string;
  sortOptions?: Array<{
    id: string;
    label: string;
    sortFn: (a: T, b: T) => number;
  }>;
}

const ItemListPanel = <T,>({
  items,
  selectedItem,
  onSelectItem,
  onCreateNew,
  renderItem,
  getItemId,
  title,
  createButtonLabel,
  emptyMessage,
  searchPlaceholder = 'Search...',
  onSearch,
  searchQuery = '',
  className = '',
  maxHeight = '500px',
  enableAdvancedFilter = false,
  filterGroups = [],
  onFilter,
  getSearchableText,
  getCategoryFromItem,
  sortOptions = []
}: ItemListPanelProps<T>) => {
  const selectedId = selectedItem ? getItemId(selectedItem) : null;
  
  // Local state for advanced filtering
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortBy, setSortBy] = useState<string>(sortOptions[0]?.id || '');

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Handle search change
  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Apply smart filtering if enabled
    if (enableAdvancedFilter && getSearchableText) {
      // Text search
      if (localSearchQuery.trim()) {
        const query = localSearchQuery.toLowerCase();
        result = result.filter(item => 
          getSearchableText(item).toLowerCase().includes(query)
        );
      }

      // Apply active filters
      if (activeFilters.length > 0) {
        result = result.filter(item => {
          return activeFilters.every(filter => {
            const group = filterGroups.find(g => g.id === filter.groupId);
            if (!group) return true;

            // Apply different filter types
            switch (group.id) {
              case 'category':
                return getCategoryFromItem ? getCategoryFromItem(item) === filter.value : true;
              case 'type':
                return (item as any).type === filter.value;
              case 'severity':
                return (item as any).severity === filter.value || (item as any).severityLevel === filter.value;
              case 'status':
                return (item as any).status === filter.value;
              default:
                return true;
            }
          });
        });
      }
    }

    // Apply custom filter function
    if (onFilter) {
      result = onFilter(result);
    }

    // Apply sorting
    if (sortBy && sortOptions.length > 0) {
      const sortOption = sortOptions.find(option => option.id === sortBy);
      if (sortOption) {
        result.sort(sortOption.sortFn);
      }
    }

    return result;
  }, [items, localSearchQuery, activeFilters, sortBy, onFilter, getSearchableText, getCategoryFromItem, filterGroups, sortOptions, enableAdvancedFilter]);

  const displayedItems = filteredAndSortedItems;
  const totalCount = items.length;
  const filteredCount = displayedItems.length;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
            {enableAdvancedFilter && filteredCount !== totalCount && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredCount} of {totalCount} items
              </p>
            )}
          </div>
          <Button
            onClick={onCreateNew}
            leftIcon={<PlusIcon className="w-4 h-4" />}
            size="sm"
          >
            {createButtonLabel}
          </Button>
        </div>
        
        {/* Enhanced Search and Filters */}
        {enableAdvancedFilter ? (
          <div className="space-y-3">
            <AdvancedFilter
              filterGroups={filterGroups}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              searchQuery={localSearchQuery}
              onSearchChange={handleSearchChange}
              searchPlaceholder={searchPlaceholder}
            />
            
            {/* Sort Options */}
            {sortOptions.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800"
                >
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          /* Basic Search */
          onSearch && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )
        )}
      </div>

      {/* Item List */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ maxHeight }}
      >
        {displayedItems.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {totalCount === 0 ? emptyMessage : 'No items match the current filters.'}
            </p>
            {totalCount > 0 && filteredCount === 0 && (
              <button
                onClick={() => {
                  setActiveFilters([]);
                  setLocalSearchQuery('');
                  if (onSearch) onSearch('');
                }}
                className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {displayedItems.map((item) => {
              const itemId = getItemId(item);
              const isSelected = selectedId === itemId;
              
              return (
                <div
                  key={itemId}
                  onClick={() => onSelectItem(item)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {renderItem(item, isSelected)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemListPanel;