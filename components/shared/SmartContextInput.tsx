import React, { useState, useEffect, useRef } from 'react';
import {
  LightBulbIcon,
  SparklesIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import {
  ContextSuggestion,
  ContextCategory,
  SuggestionSource,
  smartContextBuilder
} from '@/utils/smartContextBuilder';
import { Controller, ControlAction, Hazard, UnsafeControlAction, UCCA, UCAType } from '@/types';

interface SmartContextInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  rows?: number;
  
  // For UCA context
  ucaType?: UCAType;
  controller?: Controller;
  controlAction?: ControlAction;
  
  // For UCCA context
  controllers?: Controller[];
  temporalRelationship?: string;
  uccaType?: string;
  
  // Common data
  hazards?: Hazard[];
  existingUCAs?: UnsafeControlAction[];
  
  // UI options
  showSuggestions?: boolean;
  maxSuggestions?: number;
  className?: string;
}

const SmartContextInput: React.FC<SmartContextInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Describe the context or conditions...',
  rows = 3,
  ucaType,
  controller,
  controlAction,
  controllers,
  temporalRelationship,
  uccaType,
  hazards = [],
  existingUCAs = [],
  showSuggestions = true,
  maxSuggestions = 5,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<ContextSuggestion[]>([]);
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate suggestions when relevant props change
  useEffect(() => {
    if (!showSuggestions) return;

    const generateSuggestions = async () => {
      setIsGenerating(true);
      
      try {
        let newSuggestions: ContextSuggestion[] = [];

        if (controller && controlAction) {
          // UCA context suggestions
          newSuggestions = smartContextBuilder.generateUCASuggestions(
            { ucaType, hazardIds: [] },
            controller,
            controlAction,
            hazards,
            existingUCAs
          );
        } else if (controllers && controllers.length > 0) {
          // UCCA context suggestions
          newSuggestions = smartContextBuilder.generateUCCASuggestions(
            { temporalRelationship, uccaType, hazardIds: [] },
            controllers,
            hazards
          );
        }

        setSuggestions(newSuggestions.slice(0, maxSuggestions));
      } finally {
        setIsGenerating(false);
      }
    };

    generateSuggestions();
  }, [
    ucaType, 
    controller, 
    controlAction, 
    controllers, 
    temporalRelationship, 
    uccaType, 
    hazards, 
    existingUCAs, 
    showSuggestions, 
    maxSuggestions
  ]);

  // Handle suggestion selection
  const selectSuggestion = (suggestion: ContextSuggestion) => {
    const currentValue = value.trim();
    const newValue = currentValue
      ? `${currentValue} ${suggestion.text}`
      : suggestion.text;
    
    onChange(newValue);
    smartContextBuilder.recordSelection(suggestion.id, true);
    setShowSuggestionPanel(false);
    setSelectedSuggestionIndex(-1);
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestionPanel || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;
      
      case 'Escape':
        setShowSuggestionPanel(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Get icon for suggestion source
  const getSourceIcon = (source: SuggestionSource) => {
    switch (source) {
      case SuggestionSource.PATTERN:
        return '📋';
      case SuggestionSource.SIMILAR_UCA:
        return '🔄';
      case SuggestionSource.HAZARD_BASED:
        return '⚠️';
      case SuggestionSource.DOMAIN_KNOWLEDGE:
        return '🧠';
      case SuggestionSource.TEMPORAL_LOGIC:
        return '⏱️';
      default:
        return '💡';
    }
  };

  // Get category color
  const getCategoryColor = (category: ContextCategory) => {
    const colors: Record<ContextCategory, string> = {
      [ContextCategory.TEMPORAL]: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
      [ContextCategory.MODAL]: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
      [ContextCategory.ENVIRONMENTAL]: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      [ContextCategory.SYSTEM_STATE]: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
      [ContextCategory.COORDINATION]: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20',
      [ContextCategory.FAILURE_MODE]: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
      [ContextCategory.OPERATIONAL]: 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/20'
    };
    return colors[category] || colors[ContextCategory.OPERATIONAL];
  };

  return (
    <div className="relative">
      {/* Main textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-3 py-2 pr-10 text-sm border border-slate-300 dark:border-slate-600 rounded-md 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500 ${className}`}
        />
        
        {/* AI suggestion toggle button */}
        {showSuggestions && suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSuggestionPanel(!showSuggestionPanel)}
            className={`absolute right-2 top-2 p-1.5 rounded-md transition-colors ${
              showSuggestionPanel 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
            title="AI-powered context suggestions"
          >
            {isGenerating ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Suggestion panel */}
      {showSuggestions && showSuggestionPanel && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <LightBulbIcon className="w-4 h-4" />
                <span>AI Context Suggestions</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSuggestionPanel(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className={`w-full px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 
                  transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 ${
                  selectedSuggestionIndex === index ? 'bg-slate-50 dark:bg-slate-700/50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5" title={suggestion.source}>
                    {getSourceIcon(suggestion.source)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {suggestion.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(suggestion.category)}`}>
                        {suggestion.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  <CheckIcon className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>

          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Press ↑↓ to navigate, Enter to select, Esc to close
            </p>
          </div>
        </div>
      )}

      {/* Learning feedback (appears briefly after selection) */}
      {false && ( // This would be shown temporarily after selection
        <div className="absolute -bottom-8 left-0 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckIcon className="w-3 h-3" />
          <span>Thanks! This helps improve future suggestions.</span>
        </div>
      )}
    </div>
  );
};

export default SmartContextInput;