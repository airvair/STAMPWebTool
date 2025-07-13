import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAnalysis } from '@/hooks/useAnalysis';
import { transformDataToFlowElements } from './utils/dataTransformation';
import { applyLayout, LayoutType } from './utils/layoutEngine';
import VisualizationControlPanel from './controls/VisualizationControlPanel';
import UCANode from './nodes/UCANode';
import UCCANode from './nodes/UCCANode';
import ControllerNode from './nodes/ControllerNode';
import HazardNode from './nodes/HazardNode';
import RelationshipEdge from './edges/RelationshipEdge';
import HazardLinkEdge from './edges/HazardLinkEdge';
import Card from '@/components/shared/Card';
import { Loader2 } from 'lucide-react';

const nodeTypes = {
  uca: UCANode,
  ucca: UCCANode,
  controller: ControllerNode,
  hazard: HazardNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
  hazardLink: HazardLinkEdge,
};

export interface VisualizationFilters {
  showUCAs: boolean;
  showUCCAs: boolean;
  showControllers: boolean;
  showHazards: boolean;
  selectedControllers: string[];
  selectedHazards: string[];
  ucaTypes: string[];
  uccaTypes: string[];
  searchTerm: string;
}

interface UCAUCCAVisualizationProps {
  className?: string;
}

const UCAUCCAVisualization: React.FC<UCAUCCAVisualizationProps> = ({ className = '' }) => {
  const { ucas, uccas, controllers, hazards, controlActions } = useAnalysis();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('hierarchical');
  
  const [filters, setFilters] = useState<VisualizationFilters>({
    showUCAs: true,
    showUCCAs: true,
    showControllers: true,
    showHazards: true,
    selectedControllers: [],
    selectedHazards: [],
    ucaTypes: [],
    uccaTypes: [],
    searchTerm: '',
  });

  // Transform data to ReactFlow elements
  useEffect(() => {
    const loadVisualization = async () => {
      setIsLoading(true);
      try {
        const { nodes: flowNodes, edges: flowEdges } = transformDataToFlowElements({
          ucas,
          uccas,
          controllers,
          hazards,
          controlActions,
          filters,
        });

        // Apply layout
        const layoutedElements = await applyLayout(flowNodes, flowEdges, layoutType);
        setNodes(layoutedElements.nodes);
        setEdges(layoutedElements.edges);
      } catch (error) {
        console.error('Error loading visualization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVisualization();
  }, [ucas, uccas, controllers, hazards, controlActions, filters, layoutType]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    setLayoutType(newLayout);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<VisualizationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const proOptions = { hideAttribution: true };

  if (isLoading) {
    return (
      <Card className={`flex items-center justify-center h-[600px] ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </Card>
    );
  }

  return (
    <ReactFlowProvider>
      <Card className={`relative h-[800px] ${className}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          proOptions={proOptions}
          fitView
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap 
            className="!bg-slate-100 dark:!bg-slate-800"
            nodeColor={(node) => {
              switch (node.type) {
                case 'uca': return '#ef4444';
                case 'ucca': return '#f97316';
                case 'controller': return '#3b82f6';
                case 'hazard': return '#eab308';
                default: return '#94a3b8';
              }
            }}
          />
          <Panel position="top-left" className="space-y-2">
            <VisualizationControlPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onLayoutChange={handleLayoutChange}
              currentLayout={layoutType}
              controllers={controllers}
              hazards={hazards}
            />
          </Panel>
          {selectedNode && (
            <Panel position="bottom-right" className="max-w-md">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">{selectedNode.data.label}</h3>
                <div className="text-sm text-slate-600 space-y-1">
                  {selectedNode.data.description && (
                    <p>{selectedNode.data.description}</p>
                  )}
                  {selectedNode.data.context && (
                    <p><span className="font-medium">Context:</span> {selectedNode.data.context}</p>
                  )}
                  {selectedNode.data.hazards && selectedNode.data.hazards.length > 0 && (
                    <p><span className="font-medium">Hazards:</span> {selectedNode.data.hazards.join(', ')}</p>
                  )}
                </div>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </Card>
    </ReactFlowProvider>
  );
};

export default UCAUCCAVisualization;