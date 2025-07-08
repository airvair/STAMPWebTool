import React, { useState, ReactNode } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import Button from './Button';

export interface CardAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface CardSection {
  id: string;
  title: string;
  content: ReactNode;
  defaultExpanded?: boolean;
  badge?: {
    text: string;
    variant: 'info' | 'warning' | 'success' | 'danger' | 'neutral';
  };
}

export interface ExpandableCardProps {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  statusBadge?: {
    text: string;
    variant: 'info' | 'warning' | 'success' | 'danger' | 'neutral';
  };
  priority?: 'low' | 'medium' | 'high' | 'critical';
  isSelected?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  onClick?: () => void;
  actions?: CardAction[];
  sections?: CardSection[];
  metadata?: Array<{
    label: string;
    value: string | ReactNode;
    icon?: ReactNode;
  }>;
  className?: string;
  compactMode?: boolean;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  subtitle,
  description,
  statusBadge,
  priority,
  isSelected = false,
  isExpanded = false,
  onToggleExpand,
  onClick,
  actions = [],
  sections = [],
  metadata = [],
  className = '',
  compactMode = false
}) => {
  const [localExpanded, setLocalExpanded] = useState(isExpanded);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(s => s.defaultExpanded).map(s => s.id))
  );

  const expanded = onToggleExpand ? isExpanded : localExpanded;
  
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !expanded;
    
    if (onToggleExpand) {
      onToggleExpand(newExpanded);
    } else {
      setLocalExpanded(newExpanded);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleActionClick = (action: CardAction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!action.disabled) {
      action.onClick();
    }
  };

  const getBadgeClasses = (variant: string) => {
    switch (variant) {
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'danger':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case 'critical':
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <InformationCircleIcon className="w-4 h-4 text-blue-600" />;
      case 'low':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getPriorityBorder = () => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'medium':
        return 'border-l-4 border-blue-500';
      case 'low':
        return 'border-l-4 border-green-500';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 
        transition-all duration-200 hover:shadow-md
        ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''}
        ${getPriorityBorder()}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className={`p-4 ${expanded && (sections.length > 0 || metadata.length > 0) ? 'border-b border-slate-200 dark:border-slate-700' : ''}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {priority && getPriorityIcon()}
              <h3 className={`font-semibold text-slate-800 dark:text-slate-100 ${compactMode ? 'text-sm' : 'text-lg'}`}>
                {title}
              </h3>
              {statusBadge && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeClasses(statusBadge.variant)}`}>
                  {statusBadge.text}
                </span>
              )}
            </div>
            
            {subtitle && (
              <p className={`text-slate-600 dark:text-slate-400 ${compactMode ? 'text-xs' : 'text-sm'} mb-1`}>
                {subtitle}
              </p>
            )}
            
            {description && !compactMode && (
              <p className="text-slate-700 dark:text-slate-300 text-sm">
                {description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex gap-1">
                {actions.map(action => (
                  <Button
                    key={action.id}
                    onClick={(e) => handleActionClick(action, e)}
                    size="sm"
                    variant={action.variant || 'secondary'}
                    disabled={action.disabled}
                    leftIcon={action.icon}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Expand/Collapse Button */}
            {(sections.length > 0 || metadata.length > 0) && (
              <button
                onClick={handleToggleExpand}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? (
                  <ChevronDownIcon className="w-5 h-5 text-slate-500" />
                ) : (
                  <ChevronRightIcon className="w-5 h-5 text-slate-500" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Metadata Grid */}
          {metadata.length > 0 && (
            <div className="mb-4">
              <div className={`grid gap-3 ${metadata.length === 1 ? 'grid-cols-1' : metadata.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {metadata.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {item.icon && <div className="text-slate-500">{item.icon}</div>}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                        {item.label}:
                      </span>
                      <div className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {sections.length > 0 && (
            <div className="space-y-3">
              {sections.map(section => {
                const sectionExpanded = expandedSections.has(section.id);
                
                return (
                  <div key={section.id} className="border border-slate-200 dark:border-slate-600 rounded-md">
                    <button
                      onClick={() => handleSectionToggle(section.id)}
                      className="w-full px-3 py-2 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-t-md"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {section.title}
                        </span>
                        {section.badge && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getBadgeClasses(section.badge.variant)}`}>
                            {section.badge.text}
                          </span>
                        )}
                      </div>
                      {sectionExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    
                    {sectionExpanded && (
                      <div className="p-3 border-t border-slate-200 dark:border-slate-600">
                        {section.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandableCard;