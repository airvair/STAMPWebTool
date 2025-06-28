import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, Position } from 'reactflow';
import { ACTUATOR_SENSOR_BOX_SIZE } from '@/constants';


const getBoxTransform = (side: Position): string => {
    switch (side) {
        case Position.Top: return 'translate(-50%, -101%)';
        case Position.Bottom: return 'translate(-50%, 1%)';
        case Position.Left: return 'translate(-120%, -50%)';
        case Position.Right: return 'translate(20%, -50%)';
        default: return 'translate(-50%, -50%)';
    }
};

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
                        <div style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#000000', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', border: '0.5px solid #bbb' }}>
                            {label}
                        </div>
                    )}
                </div>
                {(isActuator || isSensor) && (
                    <div style={{ position: 'absolute', transform: `translate(${boxX}px, ${boxY}px)`, pointerEvents: 'all' }} className="nodrag nopan">
                        <div style={{ width: ACTUATOR_SENSOR_BOX_SIZE, height: ACTUATOR_SENSOR_BOX_SIZE, background: 'white', border: `1.5px solid #333`, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', transform: getBoxTransform(boxSide), color: '#000000' }}>
                            {isActuator ? 'A' : 'S'}
                        </div>
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
};