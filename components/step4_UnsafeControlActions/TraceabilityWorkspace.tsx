import React, { useState, useEffect, useMemo } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import TraceabilityGraph from '../shared/TraceabilityGraph';
import TraceabilityFilterPanel, { TraceabilityFilterOptions } from '../shared/TraceabilityFilterPanel';
import { TraceabilityGraph as TraceabilityGraphType, stateManager } from '@/utils/stateManagement';
import { riskScoringEngine } from '@/utils/riskScoring';
import { 
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

interface SelectedEntity {
  id: string;
  type: 'loss' | 'hazard' | 'uca' | 'ucca' | 'scenario' | 'requirement';
  data: any;
}

const TraceabilityWorkspace: React.FC = () => {
  const analysisData = useAnalysis();
  const losses = analysisData.losses || [];
  const hazards = analysisData.hazards || [];
  const unsafeControlActions = analysisData.ucas || [];
  const uccas = analysisData.uccas || [];
  const causalScenarios = analysisData.scenarios || [];
  const requirements = analysisData.requirements || [];
  const controllers = analysisData.controllers || [];
  const controlActions = analysisData.controlActions || [];

  const [graph, setGraph] = useState<TraceabilityGraphType>({ nodes: new Set(), links: [] });
  const [filterOptions, setFilterOptions] = useState<TraceabilityFilterOptions>({
    showLosses: true,
    showHazards: true,
    showUCAs: true,
    showUCCAs: true,
    showScenarios: true,
    showRequirements: true,
    minLinkStrength: 0,
    onlyHighRisk: false
  });
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  // Build traceability graph
  useEffect(() => {
    const newGraph = stateManager.buildTraceabilityGraph(
      losses,
      hazards,
      unsafeControlActions,
      uccas,
      causalScenarios,
      requirements
    );
    setGraph(newGraph);
  }, [losses, hazards, unsafeControlActions, uccas, causalScenarios, requirements]);

  // Calculate risk scores for UCAs and UCCAs
  const riskScores = useMemo(() => {
    const scores = new Map();

    // Calculate UCA risk scores
    unsafeControlActions.forEach((uca: any) => {
      const controller = controllers.find(c => c.id === uca.controllerId);
      const action = controlActions.find(a => a.id === uca.controlActionId);
      const linkedHazards = hazards.filter(h => uca.hazardIds.includes(h.id));
      const relatedScenarios = causalScenarios.filter((s: any) => s.ucaId === uca.id);

      if (controller && action) {
        const risk = riskScoringEngine.calculateUCARisk(
          uca,
          linkedHazards,
          controller,
          action,
          relatedScenarios
        );
        scores.set(uca.id, risk);
      }
    });

    // Calculate UCCA risk scores
    uccas.forEach(ucca => {
      const linkedHazards = hazards.filter(h => ucca.hazardIds.includes(h.id));
      const involvedControllers = controllers.filter(c => 
        ucca.involvedControllerIds.includes(c.id)
      );

      const risk = riskScoringEngine.calculateUCCARisk(
        ucca,
        linkedHazards,
        involvedControllers,
        controlActions
      );
      scores.set(ucca.id, risk);
    });

    return scores;
  }, [unsafeControlActions, uccas, controllers, controlActions, hazards, causalScenarios]);

  // Handle node click
  const handleNodeClick = (nodeId: string, nodeType: string) => {
    let data: any = null;

    switch (nodeType) {
      case 'loss':
        data = losses.find(l => l.id === nodeId);
        break;
      case 'hazard':
        data = hazards.find(h => h.id === nodeId);
        break;
      case 'uca':
        data = unsafeControlActions.find(u => u.id === nodeId);
        break;
      case 'ucca':
        data = uccas.find(u => u.id === nodeId);
        break;
      case 'scenario':
        data = causalScenarios.find(s => s.id === nodeId);
        break;
      case 'requirement':
        data = requirements.find(r => r.id === nodeId);
        break;
    }

    if (data) {
      setSelectedEntity({
        id: nodeId,
        type: nodeType as any,
        data
      });
      setShowDetailModal(true);
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalNodes: graph.nodes.size,
      totalLinks: graph.links.length,
      avgConnections: graph.links.length / Math.max(1, graph.nodes.size),
      strongLinks: graph.links.filter(l => l.strength >= 0.7).length,
      criticalRiskItems: Array.from(riskScores.values()).filter(r => r.category === 'Critical').length,
      highRiskItems: Array.from(riskScores.values()).filter(r => r.category === 'High').length,
      coverage: {
        hazardsWithUCAs: hazards.filter(h => 
          unsafeControlActions.some(uca => uca.hazardIds.includes(h.id))
        ).length,
        ucasWithScenarios: unsafeControlActions.filter(uca => 
          causalScenarios.some(s => s.ucaId === uca.id)
        ).length,
        scenariosWithRequirements: causalScenarios.filter(s =>
          requirements.some(r => r.linkedScenarioIds.includes(s.id))
        ).length
      }
    };

    return stats;
  }, [graph, riskScores, hazards, unsafeControlActions, causalScenarios, requirements]);

  const renderEntityDetails = () => {
    if (!selectedEntity) return null;

    const { type, data } = selectedEntity;
    const risk = riskScores.get(data.id);

    return (
      <div className="space-y-4">
        {/* Entity Type Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium text-white
            ${type === 'loss' ? 'bg-red-600' : ''}
            ${type === 'hazard' ? 'bg-amber-500' : ''}
            ${type === 'uca' ? 'bg-blue-500' : ''}
            ${type === 'ucca' ? 'bg-violet-500' : ''}
            ${type === 'scenario' ? 'bg-emerald-500' : ''}
            ${type === 'requirement' ? 'bg-indigo-500' : ''}
          `}>
            {type.toUpperCase()}
          </span>
          {data.code && (
            <span className="text-slate-600 dark:text-slate-300 font-mono">
              {data.code}
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          {type === 'loss' && (
            <>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                {data.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {data.description}
              </p>
            </>
          )}

          {type === 'hazard' && (
            <>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                {data.title}
              </h4>
              <div className="space-y-2 text-sm">
                <p><strong>Component:</strong> {data.systemComponent}</p>
                <p><strong>Condition:</strong> {data.environmentalCondition}</p>
                <p><strong>State:</strong> {data.systemState}</p>
              </div>
            </>
          )}

          {(type === 'uca' || type === 'ucca') && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                {type === 'uca' ? data.context : data.description}
              </p>
              {risk && (
                <div className="border-t pt-3 mt-3">
                  <h5 className="font-medium text-sm mb-2">Risk Assessment</h5>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium
                      ${risk.category === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : ''}
                      ${risk.category === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' : ''}
                      ${risk.category === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' : ''}
                      ${risk.category === 'Low' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : ''}
                      ${risk.category === 'Minimal' ? 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200' : ''}
                    `}>
                      {risk.category} Risk
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Score: {(risk.overall * 100).toFixed(0)}%
                    </span>
                  </div>
                  {risk.rationale.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      {risk.rationale.map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1 mr-2 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}

          {type === 'scenario' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {data.description}
            </p>
          )}

          {type === 'requirement' && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {data.text}
              </p>
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded
                  ${data.type === 'Requirement' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                  dark:bg-opacity-20
                `}>
                  {data.type}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Connections */}
        <div className="border-t pt-4">
          <h5 className="font-medium text-sm mb-2">Connections</h5>
          <div className="space-y-2">
            {graph.links
              .filter((link: any) => link.sourceId === data.id || link.targetId === data.id)
              .map((link: any, idx: number) => {
                const isSource = link.sourceId === data.id;
                // const connectedId = isSource ? link.targetId : link.sourceId;
                const direction = isSource ? '→' : '←';
                
                return (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">{direction}</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {link.targetType} ({(link.strength * 100).toFixed(0)}% strength)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  const renderStatistics = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Graph Metrics
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Total Nodes:</span>
            <span className="font-medium">{statistics.totalNodes}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Total Links:</span>
            <span className="font-medium">{statistics.totalLinks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Avg Connections:</span>
            <span className="font-medium">{statistics.avgConnections.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Strong Links:</span>
            <span className="font-medium">{statistics.strongLinks}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Risk Distribution
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Critical Risk:</span>
            <span className="font-medium text-red-600">{statistics.criticalRiskItems}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">High Risk:</span>
            <span className="font-medium text-orange-600">{statistics.highRiskItems}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 col-span-2">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Coverage Analysis
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-300">Hazards with UCAs:</span>
              <span className="font-medium">
                {statistics.coverage.hazardsWithUCAs} / {hazards.length}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(statistics.coverage.hazardsWithUCAs / Math.max(1, hazards.length)) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-300">UCAs with Scenarios:</span>
              <span className="font-medium">
                {statistics.coverage.ucasWithScenarios} / {unsafeControlActions.length}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(statistics.coverage.ucasWithScenarios / Math.max(1, unsafeControlActions.length)) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600 dark:text-slate-300">Scenarios with Requirements:</span>
              <span className="font-medium">
                {statistics.coverage.scenariosWithRequirements} / {causalScenarios.length}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(statistics.coverage.scenariosWithRequirements / Math.max(1, causalScenarios.length)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Left Panel - Filters */}
      <div className="w-80 p-4 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Traceability Analysis
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Explore connections between losses, hazards, UCAs, UCCAs, scenarios, and requirements.
          </p>
        </div>

        <TraceabilityFilterPanel
          filters={filterOptions}
          onChange={setFilterOptions}
          className="mb-4"
        />

        <Button
          onClick={() => setShowStatistics(true)}
          variant="secondary"
          className="w-full"
          leftIcon={<ChartBarIcon className="w-5 h-5" />}
        >
          View Statistics
        </Button>
      </div>

      {/* Main Content - Graph */}
      <div className="flex-1 p-4">
        <TraceabilityGraph
          graph={graph}
          losses={losses}
          hazards={hazards}
          ucas={unsafeControlActions}
          uccas={uccas}
          scenarios={causalScenarios}
          requirements={requirements}
          riskScores={riskScores}
          onNodeClick={handleNodeClick}
          highlightedNodeId={selectedEntity?.id}
          filterOptions={filterOptions}
        />
      </div>

      {/* Entity Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEntity(null);
        }}
        title="Entity Details"
      >
        {renderEntityDetails()}
      </Modal>

      {/* Statistics Modal */}
      <Modal
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        title="Traceability Statistics"
        size="lg"
      >
        {renderStatistics()}
      </Modal>
    </div>
  );
};

export default TraceabilityWorkspace;