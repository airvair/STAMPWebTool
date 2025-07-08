import React, { useState, useMemo } from 'react';
import { 
  ClockIcon, 
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
  TemporalFormula,
  TimingConstraint,
  ViolationScenario,
  TimedEvent,
  temporalLogicEngine,
  TemporalOperator
} from '@/utils/temporalLogic';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Modal from '../shared/Modal';

interface TemporalLogicAnalyzerProps {
  selectedControllers: string[];
  selectedActions: string[];
}

const TemporalLogicAnalyzer: React.FC<TemporalLogicAnalyzerProps> = ({
  selectedControllers,
  selectedActions
}) => {
  const { controllers, controlActions } = useAnalysis();
  const [selectedConstraint, setSelectedConstraint] = useState<TimingConstraint>(TimingConstraint.TooEarly);
  const [generatedFormulas, setGeneratedFormulas] = useState<TemporalFormula[]>([]);
  const [selectedFormula, setSelectedFormula] = useState<TemporalFormula | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulationEvents, setSimulationEvents] = useState<TimedEvent[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<Map<string, { satisfied: boolean; violations: ViolationScenario[] }>>(new Map());

  // Filter controllers and actions based on selection
  const relevantControllers = useMemo(() =>
    controllers.filter(c => selectedControllers.includes(c.id)),
    [controllers, selectedControllers]
  );

  const relevantActions = useMemo(() =>
    controlActions.filter(a => selectedActions.includes(a.id)),
    [controlActions, selectedActions]
  );

  // Generate formulas based on selected constraint
  const handleGenerateFormulas = () => {
    const formulas = temporalLogicEngine.generateTemporalFormulas(
      relevantControllers,
      relevantActions,
      selectedConstraint
    );
    setGeneratedFormulas(formulas);
    setEvaluationResults(new Map());
  };

  // Evaluate all formulas against simulation
  const handleEvaluateFormulas = () => {
    const results = new Map<string, { satisfied: boolean; violations: ViolationScenario[] }>();
    
    generatedFormulas.forEach(formula => {
      const result = temporalLogicEngine.evaluateFormula(formula, simulationEvents);
      results.set(formula.id, result);
    });
    
    setEvaluationResults(results);
  };

  // Add event to simulation
  const addSimulationEvent = (controllerId: string, actionId: string, provided: boolean) => {
    const newEvent: TimedEvent = {
      timestamp: Date.now(),
      controllerId,
      actionId,
      provided
    };
    setSimulationEvents([...simulationEvents, newEvent]);
  };

  // Clear simulation
  const clearSimulation = () => {
    setSimulationEvents([]);
    setEvaluationResults(new Map());
  };

  // Render operator symbol
  const renderOperatorSymbol = (operator: TemporalOperator): string => {
    const symbols: Record<TemporalOperator, string> = {
      [TemporalOperator.Next]: '○',
      [TemporalOperator.Eventually]: '◇',
      [TemporalOperator.Always]: '□',
      [TemporalOperator.Until]: 'U',
      [TemporalOperator.WeakUntil]: 'W',
      [TemporalOperator.Release]: 'R'
    };
    return symbols[operator] || operator;
  };

  // Render formula visualization
  const renderFormula = (formula: TemporalFormula) => {
    const result = evaluationResults.get(formula.id);
    const hasViolations = result && result.violations.length > 0;
    const isSatisfied = result?.satisfied;

    return (
      <div
        key={formula.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          selectedFormula?.id === formula.id
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        } ${
          hasViolations ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''
        } ${
          isSatisfied === true && !hasViolations ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
        }`}
        onClick={() => setSelectedFormula(formula)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
              {renderOperatorSymbol(formula.operator)}
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {formula.constraint.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          {result && (
            <div className="flex items-center gap-1">
              {isSatisfied && !hasViolations ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
          {formula.description}
        </p>

        {formula.timebound && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ClockIcon className="w-4 h-4" />
            <span>
              {formula.timebound.min && `Min: ${formula.timebound.min}ms`}
              {formula.timebound.min && formula.timebound.max && ' | '}
              {formula.timebound.max && `Max: ${formula.timebound.max}ms`}
            </span>
          </div>
        )}

        {hasViolations && (
          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
            <p className="text-xs text-red-600 dark:text-red-400">
              {result.violations.length} violation{result.violations.length > 1 ? 's' : ''} detected
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render simulation timeline
  const renderSimulationTimeline = () => {
    if (simulationEvents.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No events in simulation</p>
          <p className="text-sm">Add events to test temporal formulas</p>
        </div>
      );
    }

    const startTime = simulationEvents[0].timestamp;

    return (
      <div className="space-y-2">
        {simulationEvents.map((event, idx) => {
          const controller = controllers.find(c => c.id === event.controllerId);
          const action = controlActions.find(a => a.id === event.actionId);
          const relativeTime = event.timestamp - startTime;

          return (
            <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded">
              <div className="text-xs font-mono text-slate-500 w-20">
                +{relativeTime}ms
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">{controller?.name}</span>
                <span className="mx-2 text-slate-400">→</span>
                <span className="text-sm">
                  {event.provided ? 'Provides' : 'Does not provide'} {action?.verb} {action?.object}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
        <h3 className="font-semibold text-violet-800 dark:text-violet-200 mb-2">
          Temporal Logic Analysis for Type 3-4 UCCAs
        </h3>
        <p className="text-sm text-violet-700 dark:text-violet-300">
          Generate and evaluate Linear Temporal Logic (LTL) formulas to identify timing-related
          unsafe control action combinations.
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Timing Constraint Type
          </label>
          <Select
            value={selectedConstraint}
            onChange={(e) => setSelectedConstraint(e.target.value as TimingConstraint)}
            options={[
              { value: TimingConstraint.TooEarly, label: 'Too Early' },
              { value: TimingConstraint.TooLate, label: 'Too Late' },
              { value: TimingConstraint.TooLong, label: 'Too Long (Duration)' },
              { value: TimingConstraint.TooShort, label: 'Too Short (Duration)' },
              { value: TimingConstraint.WrongOrder, label: 'Wrong Order' }
            ]}
          />
        </div>
        <Button
          onClick={handleGenerateFormulas}
          leftIcon={<BeakerIcon className="w-5 h-5" />}
        >
          Generate Formulas
        </Button>
        <Button
          onClick={() => setShowSimulator(true)}
          variant="secondary"
          leftIcon={<PlayIcon className="w-5 h-5" />}
        >
          Open Simulator
        </Button>
      </div>

      {/* Generated Formulas */}
      {generatedFormulas.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-slate-800 dark:text-slate-100">
              Generated Temporal Formulas ({generatedFormulas.length})
            </h4>
            {simulationEvents.length > 0 && (
              <Button
                onClick={handleEvaluateFormulas}
                size="sm"
                leftIcon={<ChevronRightIcon className="w-4 h-4" />}
              >
                Evaluate All
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {generatedFormulas.map(formula => renderFormula(formula))}
          </div>
        </div>
      )}

      {/* Selected Formula Details */}
      {selectedFormula && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-3">
            Formula Details
          </h4>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">ID:</span>
              <span className="ml-2 font-mono text-xs">{selectedFormula.id}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">Natural Language:</span>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {temporalLogicEngine.describeFormula(selectedFormula)}
              </p>
            </div>
            {evaluationResults.has(selectedFormula.id) && (
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Evaluation:</span>
                <div className="mt-1">
                  {evaluationResults.get(selectedFormula.id)!.violations.map((violation, idx) => (
                    <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/20 rounded mt-1">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                        {violation.description}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Severity: {violation.severity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      <Modal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        title="Temporal Event Simulator"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Add timed events to simulate control action sequences and test temporal formulas.
          </p>

          {/* Event Controls */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h5 className="font-medium text-slate-800 dark:text-slate-100 mb-3">
              Add Event
            </h5>
            <div className="grid grid-cols-3 gap-3">
              {relevantControllers.map(controller => (
                <div key={controller.id}>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {controller.name}
                  </p>
                  <div className="space-y-1">
                    {relevantActions
                      .filter(a => a.controllerId === controller.id)
                      .map(action => (
                        <div key={action.id} className="flex gap-1">
                          <button
                            onClick={() => addSimulationEvent(controller.id, action.id, true)}
                            className="flex-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/40"
                          >
                            ✓ {action.verb}
                          </button>
                          <button
                            onClick={() => addSimulationEvent(controller.id, action.id, false)}
                            className="flex-1 text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/40"
                          >
                            ✗ {action.verb}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h5 className="font-medium text-slate-800 dark:text-slate-100">
                Event Timeline
              </h5>
              <Button
                onClick={clearSimulation}
                size="sm"
                variant="secondary"
              >
                Clear
              </Button>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
              {renderSimulationTimeline()}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                handleEvaluateFormulas();
                setShowSimulator(false);
              }}
              disabled={simulationEvents.length === 0}
            >
              Evaluate Formulas
            </Button>
            <Button
              onClick={() => setShowSimulator(false)}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TemporalLogicAnalyzer;