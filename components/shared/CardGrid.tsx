import React, { useState, useMemo } from 'react';
import {
  Squares2X2Icon,
  ListBulletIcon,
  TableCellsIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/solid';
import Button from './Button';
import Select from './Select';

export type ViewMode = 'grid' | 'list' | 'compact' | 'table';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  id: string;
  label: string;
  sortFn: (a: any, b: any) => number;
}

export interface ViewSettings {
  viewMode: ViewMode;
  sortBy: string;
  sortOrder: SortOrder;
  cardsPerRow: number;
  showMetadata: boolean;
  autoExpand: boolean;
  compactMode?: boolean;
}

export interface CardGridProps<T> {
  items: T[];
  renderCard: (item: T, settings: ViewSettings) => React.ReactNode;
  getItemId: (item: T) => string;
  selectedItemId?: string;
  onItemSelect?: (item: T) => void;
  sortOptions?: SortOption[];
  defaultSort?: string;
  viewSettings?: Partial<ViewSettings>;
  onViewSettingsChange?: (settings: ViewSettings) => void;
  emptyMessage?: string;
  className?: string;
  enableViewControls?: boolean;
  enableSorting?: boolean;
  maxHeight?: string;
}

const CardGrid = <T,>({
  items,
  renderCard,
  getItemId,
  selectedItemId,
  onItemSelect,
  sortOptions = [],
  defaultSort = '',
  viewSettings: initialViewSettings = {},
  onViewSettingsChange,
  emptyMessage = 'No items to display',
  className = '',
  enableViewControls = true,
  enableSorting = true,
  maxHeight = 'none'
}: CardGridProps<T>) => {
  const defaultSettings: ViewSettings = {
    viewMode: 'grid',
    sortBy: defaultSort || sortOptions[0]?.id || '',
    sortOrder: 'asc',
    cardsPerRow: 3,
    showMetadata: true,
    autoExpand: false,
    ...initialViewSettings
  };

  const [viewSettings, setViewSettings] = useState<ViewSettings>(defaultSettings);

  const handleViewSettingsChange = (newSettings: Partial<ViewSettings>) => {
    const updatedSettings = { ...viewSettings, ...newSettings };
    setViewSettings(updatedSettings);
    if (onViewSettingsChange) {
      onViewSettingsChange(updatedSettings);
    }
  };

  // Sort items based on current settings
  const sortedItems = useMemo(() => {
    if (!viewSettings.sortBy || !sortOptions.length) {
      return items;
    }

    const sortOption = sortOptions.find(option => option.id === viewSettings.sortBy);
    if (!sortOption) {
      return items;
    }

    const sorted = [...items].sort(sortOption.sortFn);
    return viewSettings.sortOrder === 'desc' ? sorted.reverse() : sorted;
  }, [items, viewSettings.sortBy, viewSettings.sortOrder, sortOptions]);

  const getGridClasses = () => {
    const { viewMode, cardsPerRow } = viewSettings;
    
    switch (viewMode) {
      case 'grid':
        switch (cardsPerRow) {
          case 1: return 'grid grid-cols-1 gap-4';
          case 2: return 'grid grid-cols-1 md:grid-cols-2 gap-4';
          case 3: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
          case 4: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
          default: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
        }
      case 'list':
        return 'space-y-3';
      case 'compact':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2';
      case 'table':
        return 'space-y-1';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  const ViewModeButton: React.FC<{ mode: ViewMode; icon: React.ReactNode; label: string }> = ({
    mode,
    icon,
    label
  }) => (
    <Button
      onClick={() => handleViewSettingsChange({ viewMode: mode })}
      variant={viewSettings.viewMode === mode ? 'primary' : 'secondary'}
      size="sm"
      leftIcon={icon}
      title={label}
    >
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* View Controls */}
      {enableViewControls && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <div className="flex flex-wrap gap-2">
            <ViewModeButton
              mode="grid"
              icon={<Squares2X2Icon className="w-4 h-4" />}
              label="Grid"
            />
            <ViewModeButton
              mode="list"
              icon={<ListBulletIcon className="w-4 h-4" />}
              label="List"
            />
            <ViewModeButton
              mode="compact"
              icon={<TableCellsIcon className="w-4 h-4" />}
              label="Compact"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Grid Settings */}
            {viewSettings.viewMode === 'grid' && (
              <Select
                label=""
                value={viewSettings.cardsPerRow.toString()}
                onChange={(e) => handleViewSettingsChange({ cardsPerRow: parseInt(e.target.value) })}
                options={[
                  { value: '1', label: '1 per row' },
                  { value: '2', label: '2 per row' },
                  { value: '3', label: '3 per row' },
                  { value: '4', label: '4 per row' }
                ]}
                className="text-sm"
              />
            )}

            {/* Sort Controls */}
            {enableSorting && sortOptions.length > 0 && (
              <>
                <Select
                  label=""
                  value={viewSettings.sortBy}
                  onChange={(e) => handleViewSettingsChange({ sortBy: e.target.value })}
                  options={[
                    { value: '', label: 'No sorting' },
                    ...sortOptions.map(option => ({ value: option.id, label: option.label }))
                  ]}
                  className="text-sm"
                />
                
                {viewSettings.sortBy && (
                  <Button
                    onClick={() => handleViewSettingsChange({ 
                      sortOrder: viewSettings.sortOrder === 'asc' ? 'desc' : 'asc' 
                    })}
                    variant="secondary"
                    size="sm"
                    title={`Sort ${viewSettings.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {viewSettings.sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                )}
              </>
            )}

            {/* Additional Settings */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleViewSettingsChange({ showMetadata: !viewSettings.showMetadata })}
                variant={viewSettings.showMetadata ? 'primary' : 'secondary'}
                size="sm"
                leftIcon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
                title="Toggle metadata display"
              >
                <span className="hidden sm:inline">Details</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Items Display */}
      <div 
        className={`${maxHeight !== 'none' ? 'overflow-y-auto' : ''}`}
        style={maxHeight !== 'none' ? { maxHeight } : {}}
      >
        {sortedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
          </div>
        ) : (
          <div className={getGridClasses()}>
            {sortedItems.map((item) => {
              const itemId = getItemId(item);
              const isSelected = selectedItemId === itemId;
              
              // Enhance view settings for compact mode
              const enhancedSettings = {
                ...viewSettings,
                compactMode: viewSettings.viewMode === 'compact',
                showMetadata: viewSettings.viewMode !== 'compact' && viewSettings.showMetadata
              };
              
              return (
                <div
                  key={itemId}
                  onClick={() => onItemSelect?.(item)}
                  className={isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}
                >
                  {renderCard(item, enhancedSettings)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {sortedItems.length > 0 && (
        <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-2 border-t border-slate-200 dark:border-slate-700">
          Showing {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} in {viewSettings.viewMode} view
          {viewSettings.sortBy && ` • Sorted by ${sortOptions.find(o => o.id === viewSettings.sortBy)?.label || viewSettings.sortBy}`}
        </div>
      )}
    </div>
  );
};

export default CardGrid;