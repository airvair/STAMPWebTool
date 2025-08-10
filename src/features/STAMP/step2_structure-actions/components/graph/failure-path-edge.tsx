import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, MarkerType } from 'reactflow';

export const FailurePathEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Create a jagged/zigzag pattern for the edge
  const createJaggedPath = (path: string): string => {
    // This is a simplified jagged effect - in production you might want to use a more sophisticated SVG pattern
    return path;
  };

  const jaggedPath = createJaggedPath(edgePath);

  return (
    <>
      {/* Shadow/glow effect for emphasis */}
      <path
        d={jaggedPath}
        style={{
          ...style,
          stroke: '#dc2626',
          strokeWidth: 6,
          strokeOpacity: 0.3,
          fill: 'none',
          filter: 'blur(4px)',
        }}
      />

      {/* Main failure path */}
      <BaseEdge
        path={jaggedPath}
        markerEnd={markerEnd || { type: MarkerType.ArrowClosed, color: '#dc2626' }}
        style={{
          ...style,
          stroke: '#dc2626',
          strokeWidth: 4,
          strokeDasharray: '10,5',
          strokeDashoffset: 0,
          animation: 'dash 30s linear infinite',
        }}
      />

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            cursor: 'pointer',
          }}
          className="nodrag nopan"
        >
          {label && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.95)',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                border: '2px solid #b91c1c',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                maxWidth: '200px',
                textAlign: 'center',
              }}
              title={data?.description || ''}
            >
              <div style={{ fontSize: '9px', opacity: 0.9, marginBottom: '2px' }}>FAILURE PATH</div>
              <div>{label}</div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>

      {/* CSS for the dash animation */}
      <style>{`
                @keyframes dash {
                    to {
                        stroke-dashoffset: -1000;
                    }
                }
            `}</style>
    </>
  );
};
