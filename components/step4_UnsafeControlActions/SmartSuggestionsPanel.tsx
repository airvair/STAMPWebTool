import React, { useMemo, useState } from 'react';
import { 
  LightBulbIcon, 
  PlusIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import { useAnalysis } from '@/hooks/useAnalysis';
import { generateSmartUcaSuggestions, UcaSuggestion } from '@/utils/smartUcaSuggestions';
import { UCAType } from '@/types';
import Button from '../shared/Button';

interface SmartSuggestionsPanelProps {
  onSelectSuggestion?: (suggestion: UcaSuggestion) => void;
  maxSuggestions?: number;
  compact?: boolean;
}

const SmartSuggestionsPanel: React.FC<SmartSuggestionsPanelProps> = ({ 
  onSelectSuggestion,
  maxSuggestions = 5,
  compact = false
}) => {
  const { controllers, controlActions, ucas, hazards } = useAnalysis();
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  const suggestions = useMemo(() => 
    generateSmartUcaSuggestions(controllers, controlActions, ucas, hazards)
      .slice(0, maxSuggestions),
    [controllers, controlActions, ucas, hazards, maxSuggestions]
  );

  const getPriorityIcon = (priority: UcaSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <InformationCircleIcon className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: UcaSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    }
  };

  const getUcaTypeColor = (ucaType: UCAType) => {
    const colors: Record<UCAType, string> = {
      [UCAType.NotProvided]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      [UCAType.ProvidedUnsafe]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      [UCAType.TooEarly]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      [UCAType.TooLate]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      [UCAType.WrongOrder]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
      [UCAType.TooLong]: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200',
      [UCAType.TooShort]: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200'
    };
    return colors[ucaType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
        <LightBulbIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <h4 className="font-semibold text-green-800 dark:text-green-200">
          No immediate suggestions
        </h4>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
          Your systematic analysis appears to be well underway. Continue with the guided workflow or review compliance dashboard.
        </p>
      </div>
    );
  }

  if (compact) {
    const topSuggestion = suggestions[0];
    const controller = controllers.find(c => c.id === topSuggestion.controllerId);
    const action = controlActions.find(ca => ca.id === topSuggestion.controlActionId);

    return (
      <div className={`p-3 rounded border ${getPriorityColor(topSuggestion.priority)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getPriorityIcon(topSuggestion.priority)}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                Next: {action?.verb} {action?.object}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {controller?.name} - {topSuggestion.ucaType}
              </div>
            </div>
          </div>
          {onSelectSuggestion && (
            <Button
              size="sm"
              onClick={() => onSelectSuggestion(topSuggestion)}
              leftIcon={<PlusIcon className="w-3 h-3" />}
            >
              Add
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <LightBulbIcon className="w-5 h-5 text-blue-500" />
        <h4 className="font-semibold text-slate-800 dark:text-slate-100">
          Smart Suggestions ({suggestions.length})
        </h4>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        AI-powered recommendations based on systematic analysis gaps and risk assessment.
      </p>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const controller = controllers.find(c => c.id === suggestion.controllerId);
          const action = controlActions.find(ca => ca.id === suggestion.controlActionId);
          const isExpanded = expandedSuggestion === index;

          return (
            <div 
              key={index}
              className={`border rounded-lg ${getPriorityColor(suggestion.priority)}`}
            >
              <button
                onClick={() => setExpandedSuggestion(isExpanded ? null : index)}
                className="w-full p-3 text-left hover:bg-opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getPriorityIcon(suggestion.priority)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {action?.verb} {action?.object}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getUcaTypeColor(suggestion.ucaType)}`}>
                          {suggestion.ucaType}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {controller?.name} • {suggestion.reasoning}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-slate-500">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </div>
                    <ChevronRightIcon 
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-slate-200 dark:border-slate-700 mt-2 pt-3">
                  <div className="space-y-3">
                    <div>
                      <h6 className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                        Suggested Context:
                      </h6>
                      <p className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border">
                        {suggestion.context}
                      </p>
                    </div>

                    {suggestion.suggestedHazards.length > 0 && (
                      <div>
                        <h6 className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                          Relevant Hazards:
                        </h6>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.suggestedHazards.map(hazardId => {
                            const hazard = hazards.find(h => h.id === hazardId);
                            return hazard ? (
                              <span 
                                key={hazardId}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-xs rounded"
                              >
                                {hazard.code}: {hazard.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {onSelectSuggestion && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => onSelectSuggestion(suggestion)}
                          leftIcon={<PlusIcon className="w-4 h-4" />}
                        >
                          Use This Suggestion
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {suggestions.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          Suggestions are based on MIT STPA systematic analysis requirements and risk assessment.
        </div>
      )}
    </div>
  );
};

export default SmartSuggestionsPanel;