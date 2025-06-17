import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, Handle, Position } from 'reactflow';

interface CustomNodeData {
    label: string;
    role?: string;
    rank?: string;
    commCount: number;
}

// --- CustomNode component ---
export const CustomNode: React.FC<{ data: CustomNodeData }> = ({ data }) => {
    const handleStyle = { width: '8px', height: '8px', background: 'transparent', border: 'none', zIndex: 10 };

    // Dynamically generate handle positions based on the number of connections for a side
    const getPositions = (count: number) => {
        if (count === 0) return [];
        // Creates an array of percentage strings for positioning, e.g., ["33.33%", "66.67%"] for 2 handles
        return Array.from({ length: count }, (_, i) => `${((i + 1) * 100) / (count + 1)}%`);
    };

    const commHandlePositions = getPositions(data.commCount || 0);

    return (
        <>
            {/* Handles for vertical Control/Feedback Paths (Unchanged) */}
            <Handle type="target" position={Position.Top} id="top_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="target" position={Position.Bottom} id="bottom_right" style={{ ...handleStyle, left: '70%' }} />
            <Handle type="source" position={Position.Bottom} id="bottom_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="source" position={Position.Top} id="top_right" style={{ ...handleStyle, left: '70%' }} />

            {/* --- UPDATED --- Create both Source and Target handles on both LEFT and RIGHT sides */}
            {commHandlePositions.map((top, index) => (
                <React.Fragment key={`L_handles_${index}`}>
                    <Handle type="source" position={Position.Left} id={`comm_left_S_${index}`} style={{ ...handleStyle, top }} />
                    <Handle type="target" position={Position.Left} id={`comm_left_T_${index}`} style={{ ...handleStyle, top }} />
                </React.Fragment>
            ))}
            {commHandlePositions.map((top, index) => (
                <React.Fragment key={`R_handles_${index}`}>
                    <Handle type="source" position={Position.Right} id={`comm_right_S_${index}`} style={{ ...handleStyle, top }} />
                    <Handle type="target" position={Position.Right} id={`comm_right_T_${index}`} style={{ ...handleStyle, top }} />
                </React.Fragment>
            ))}

            <div style={{ padding: '5px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>
                    {data.label} {data.rank && data.rank !== 'GR' && `(${data.rank})`}
                </div>
                {data.role && (
                    <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '2px' }}>
                        {data.role}
                    </div>
                )}
            </div>
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