import React from 'react';
import { 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  SparklesIcon 
} from '@heroicons/react/24/solid';

interface FilteringSummaryProps {
  totalItems: number;
  filteredItems: number;
  searchQuery: string;
  activeFiltersCount: number;
  itemType: string;
  className?: string;
}

const FilteringSummary: React.FC<FilteringSummaryProps> = ({
  totalItems,
  filteredItems,
  searchQuery,
  activeFiltersCount,
  itemType,
  className = ''
}) => {
  const hasFiltersApplied = searchQuery.trim() || activeFiltersCount > 0;
  const filteringRate = totalItems > 0 ? (filteredItems / totalItems) * 100 : 100;

  if (!hasFiltersApplied && filteredItems === totalItems) {
    return null; // No summary needed when showing all items
  }

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Filtering Results
            </span>
          </div>
          
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Showing <span className="font-semibold">{filteredItems}</span> of{' '}
            <span className="font-semibold">{totalItems}</span> {itemType}
            {filteredItems !== totalItems && (
              <span className="ml-2 text-xs">
                ({filteringRate.toFixed(0)}% match)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-blue-600 dark:text-blue-400">
          {searchQuery.trim() && (
            <div className="flex items-center space-x-1">
              <MagnifyingGlassIcon className="w-3 h-3" />
              <span>Search active</span>
            </div>
          )}
          
          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-1">
              <SparklesIcon className="w-3 h-3" />
              <span>{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {filteredItems === 0 && totalItems > 0 && (
        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            No {itemType} match the current search and filter criteria.
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}
    </div>
  );
};

export default FilteringSummary;