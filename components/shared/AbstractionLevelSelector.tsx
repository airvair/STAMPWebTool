import React, { useState } from 'react';
import { InformationCircleIcon, UserGroupIcon, CubeIcon } from '@heroicons/react/24/outline';
import InfoPopup from './InfoPopup';
import { AbstractionLevel } from '@/utils/uccaAlgorithms';

interface AbstractionLevelSelectorProps {
  value: AbstractionLevel;
  onChange: (level: AbstractionLevel) => void;
  showRecommendation?: boolean;
  numControllers?: number;
  numActions?: number;
  analysisGoal?: 'comprehensive' | 'focused' | 'quick';
  disabled?: boolean;
}

interface LevelInfo {
  id: AbstractionLevel;
  name: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  complexity: 'low' | 'medium' | 'high';
  bestFor: string[];
}

const ABSTRACTION_LEVELS: LevelInfo[] = [
  {
    id: AbstractionLevel.Abstraction2a,
    name: 'Team Actions (Abstraction 2a)',
    description: 'Team-level view abstracting away specific controllers',
    icon: <UserGroupIcon className="w-5 h-5" />,
    examples: [
      'Team provides navigation guidance',
      'Team does not provide collision avoidance',
      'Team coordinates emergency response'
    ],
    complexity: 'low',
    bestFor: ['Initial analysis', 'High-level system understanding', 'Team coordination issues']
  },
  {
    id: AbstractionLevel.Abstraction2b,
    name: 'Controller Actions (Abstraction 2b)',
    description: 'Controller-specific view with explicit controller combinations',
    icon: <CubeIcon className="w-5 h-5" />,
    examples: [
      'Pilot provides input while Autopilot also provides input',
      'ATC provides clearance while Ground Control does not',
      'Multiple controllers issuing conflicting commands'
    ],
    complexity: 'high',
    bestFor: ['Detailed analysis', 'Authority conflicts', 'Implementation design']
  }
];

const AbstractionLevelSelector: React.FC<AbstractionLevelSelectorProps> = ({
  value,
  onChange,
  showRecommendation = false,
  numControllers = 0,
  numActions = 0,
  analysisGoal = 'focused',
  disabled = false
}) => {
  const [, setShowInfo] = useState(false);

  const getRecommendedLevel = (): AbstractionLevel => {
    const complexity = numControllers * numActions;
    
    if (analysisGoal === 'quick' || complexity > 50) {
      return AbstractionLevel.Abstraction2a; // Team abstraction for quick analysis
    } else {
      return AbstractionLevel.Abstraction2b; // Controller-specific for detailed analysis
    }
  };

  const recommendedLevel = getRecommendedLevel();
  const selectedLevel = ABSTRACTION_LEVELS.find(level => level.id === value);

  return (
    <div className="space-y-4">
      {/* Header with info button */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          Abstraction Level
        </label>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          title="Learn about abstraction levels"
        >
          <InformationCircleIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Recommendation banner */}
      {showRecommendation && recommendedLevel !== value && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Recommendation:</strong> Based on your system complexity 
            ({numControllers} controllers × {numActions} actions) and {analysisGoal} analysis goal,
            we recommend <strong>{ABSTRACTION_LEVELS.find(l => l.id === recommendedLevel)?.name}</strong>.
          </p>
        </div>
      )}

      {/* Level selection grid */}
      <div className="grid grid-cols-2 gap-3">
        {ABSTRACTION_LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            onClick={() => onChange(level.id)}
            disabled={disabled}
            className={`
              relative p-4 rounded-lg border-2 transition-all
              ${value === level.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${recommendedLevel === level.id ? 'ring-2 ring-blue-300 dark:ring-blue-700' : ''}
            `}
          >
            {/* Recommended badge */}
            {showRecommendation && recommendedLevel === level.id && (
              <span className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                Recommended
              </span>
            )}

            <div className="flex items-start space-x-3">
              <div className={`
                p-2 rounded-lg
                ${value === level.id 
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }
              `}>
                {level.icon}
              </div>
              
              <div className="flex-1 text-left">
                <h4 className="font-medium text-slate-800 dark:text-slate-100">
                  {level.id}: {level.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {level.description}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`
                    text-xs px-2 py-0.5 rounded
                    ${level.complexity === 'low' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : level.complexity === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                      : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    }
                  `}>
                    {level.complexity} complexity
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected level details */}
      {selectedLevel && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-slate-800 dark:text-slate-100">
            Selected: {selectedLevel.name}
          </h4>
          
          <div>
            <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Best for:
            </h5>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              {selectedLevel.bestFor.map((use, idx) => (
                <li key={idx} className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                  {use}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Example UCCAs:
            </h5>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
              {selectedLevel.examples.map((example, idx) => (
                <li key={idx} className="italic">
                  &ldquo;{example}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Info popup */}
      <InfoPopup
        title="UCCA Abstraction Levels"
        content={
          <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Abstraction levels help manage the complexity of multi-controller analysis
            by focusing on different aspects of the system:
          </p>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                Team vs Controller Focus
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Levels 1a and 2a treat the team as a single entity, while 1b and 2b
                analyze specific controller interactions.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                Single vs Combined Actions
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Levels 1a and 1b focus on single actions, while 2a and 2b analyze
                combinations of multiple actions.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                Choosing the Right Level
              </h4>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>• Start with higher abstraction (2a) for initial analysis</li>
                <li>• Use controller-specific levels (1b, 2b) for detailed design</li>
                <li>• Consider system size and analysis time constraints</li>
                <li>• Iterate between levels as understanding improves</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> You can change abstraction levels at any time.
              The system will preserve your analysis and help you refine or expand
              based on the new level.
            </p>
          </div>
        </div>
        }
      />
    </div>
  );
};

export default AbstractionLevelSelector;