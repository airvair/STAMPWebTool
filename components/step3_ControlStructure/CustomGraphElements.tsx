import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, Handle, Position, getStraightPath } from 'reactflow';

// --- CustomNode component (Unchanged) ---
export const CustomNode: React.FC<{ data: { label: string } }> = ({ data }) => {
    const handleStyle = { width: '8px', height: '8px', background: 'transparent', border: 'none' };
    return (
        <>
            <Handle type="target" position={Position.Top} id="top_left" style={{ ...handleStyle, left: '30%' }} isConnectable={false} />
            <Handle type="target" position={Position.Bottom} id="bottom_right" style={{ ...handleStyle, left: '70%' }} isConnectable={false} />
            <Handle type="source" position={Position.Bottom} id="bottom_left" style={{ ...handleStyle, left: '30%' }} isConnectable={false} />
            <Handle type="source" position={Position.Top} id="top_right" style={{ ...handleStyle, left: '70%' }} isConnectable={false} />
            <div>{data.label}</div>
        </>
    );
};

const ACTUATOR_SENSOR_BOX_SIZE = 16;
const LABEL_GAP = 4;

// --- UPDATED getBoxTransform (Unchanged) ---
const getBoxTransform = (side: Position): string => {
    switch (side) {
        case Position.Top:
            return 'translate(-50%, -101%)'; // reduced gap above the node
        case Position.Bottom:
            return 'translate(-50%, 1%)';   // reduced gap below the node
        case Position.Left:
            return 'translate(-120%, -50%)'; // reduced gap to the left of the node
        case Position.Right:
            return 'translate(20%, -50%)';   // reduced gap to the right of the node
        default:
            return 'translate(-50%, -50%)';
    }
};

// --- CustomEdge component (Unchanged) ---
export const CustomEdge: React.FC<EdgeProps> = ({
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
                                                }) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
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
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'none',
                    }}
                    className="nodrag nopan"
                >
                    {label && (
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.8)',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                fontSize: '10px',
                                backdropFilter: 'blur(1px)',
                                border: '0.5px solid #555',
                            }}
                        >
                            {label}
                        </div>
                    )}
                </div>

                {(isActuator || isSensor) && (
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(${boxX}px, ${boxY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <div
                            style={{
                                width: ACTUATOR_SENSOR_BOX_SIZE,
                                height: ACTUATOR_SENSOR_BOX_SIZE,
                                background: 'white',
                                border: `1.5px solid ${style.stroke || '#000'}`,
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                transform: getBoxTransform(boxSide),
                            }}
                        >
                            {isActuator ? 'A' : 'S'}
                        </div>
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
};

// --- NEW: CommunicationEdge component ---
export const CommunicationEdge: React.FC<EdgeProps> = ({
                                                           id,
                                                           sourceX,
                                                           sourceY,
                                                           targetX,
                                                           targetY,
                                                           sourcePosition,
                                                           targetPosition,
                                                           style = {},
                                                           label,
                                                           markerStart,
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
            <BaseEdge path={edgePath} markerStart={markerStart} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        background: '#f1f5f9', // slate-100
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: 500,
                        pointerEvents: 'all',
                        border: '1px solid #cbd5e1', // slate-300
                        zIndex: 10,
                    }}
                    className="nodrag nopan"
                >
                    {label}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};