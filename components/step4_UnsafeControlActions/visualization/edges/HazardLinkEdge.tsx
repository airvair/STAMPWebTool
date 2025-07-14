import React from 'react';
import { getStraightPath, EdgeProps, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { AlertTriangle } from 'lucide-react';

const HazardLinkEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          strokeWidth: 2,
          cursor: 'pointer',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fef3c7',
            padding: '4px',
            borderRadius: '50%',
            border: '1px solid #f59e0b',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <AlertTriangle className="h-3 w-3 text-amber-600" />
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default HazardLinkEdge;