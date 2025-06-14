import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, Handle, Position } from 'reactflow';

interface CustomNodeData {
    label: string;
    sourceCommCount: number;
    targetCommCount: number;
}

// --- CustomNode component ---
export const CustomNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
    const handleStyle = { width: '8px', height: '8px', background: 'transparent', border: 'none', zIndex: 10 };

    // Dynamically generate handle positions based on the number of connections
    const getPositions = (count: number) => {
        if (count === 0) return [];
        return Array.from({ length: count }, (_, i) => `${((i + 1) * 100) / (count + 1)}%`);
    };

    const sourceHandlePositions = getPositions(data.sourceCommCount || 0);
    const targetHandlePositions = getPositions(data.targetCommCount || 0);

    return (
        <>
            {/* Handles for vertical Control/Feedback Paths */}
            <Handle type="target" position={Position.Top} id="top_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="target" position={Position.Bottom} id="bottom_right" style={{ ...handleStyle, left: '70%' }} />
            <Handle type="source" position={Position.Bottom} id="bottom_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="source" position={Position.Top} id="top_right" style={{ ...handleStyle, left: '70%' }} />

            {/* --- UPDATED --- Dynamically rendered handles */}
            {sourceHandlePositions.map((top, index) => (
                <Handle key={`source_comm_${index}`} type="source" position={Position.Right} id={`right_comm_${index}`} style={{ ...handleStyle, top }} />
            ))}
            {targetHandlePositions.map((top, index) => (
                <Handle key={`target_comm_${index}`} type="target" position={Position.Left} id={`left_comm_${index}`} style={{ ...handleStyle, top }} />
            ))}

            <div>{data.label}</div>
        </>
    );
};

const ACTUATOR_SENSOR_BOX_SIZE = 16;

const getBoxTransform = (side: Position): string => {
    switch (side) {
        case Position.Top: return 'translate(-50%, -101%)';
        case Position.Bottom: return 'translate(-50%, 1%)';
        case Position.Left: return 'translate(-120%, -50%)';
        case Position.Right: return 'translate(20%, -50%)';
        default: return 'translate(-50%, -50%)';
    }
};

// --- CustomEdge component (unchanged) ---
export const CustomEdge: React.FC<EdgeProps> = ({
                                                    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, label,
                                                }) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });
    const isActuator = id.startsWith('cp-');
    const isSensor = id.startsWith('fp-');
    const boxX = sourceX;
    const boxY = sourceY;
    const boxSide = sourcePosition;

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'none' }} className="nodrag nopan">
                    {label && (
                        <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '2px 4px', borderRadius: '3px', fontSize: '10px', backdropFilter: 'blur(1px)', border: '0.5px solid #555' }}>
                            {label}
                        </div>
                    )}
                </div>
                {(isActuator || isSensor) && (
                    <div style={{ position: 'absolute', transform: `translate(${boxX}px, ${boxY}px)`, pointerEvents: 'all' }} className="nodrag nopan">
                        <div style={{ width: ACTUATOR_SENSOR_BOX_SIZE, height: ACTUATOR_SENSOR_BOX_SIZE, background: 'white', border: `1.5px solid ${style.stroke || '#000'}`, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', transform: getBoxTransform(boxSide) }}>
                            {isActuator ? 'A' : 'S'}
                        </div>
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
};