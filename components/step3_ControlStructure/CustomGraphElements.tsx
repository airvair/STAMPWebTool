// airvair/stampwebtool/STAMPWebTool-b000546fa5f298b66d61c62bd2d61ff4ceb6cfb3/components/step3_ControlStructure/CustomGraphElements.tsx
import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge, Handle, Position, NodeProps } from 'reactflow';

const NODE_WIDTH = 180;

interface CustomNodeData {
    label: string;
    role?: string;
    rank?: string;
    commCount: number;
    children?: string[];
    width?: number;
}

// CustomNode component
export const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
    const handleStyle = { width: '8px', height: '8px', background: 'transparent', border: 'none', zIndex: 10 };

    const renderDynamicHandles = () => {
        if (!data.children || data.children.length <= 1 || !data.width) return null;

        const n = data.children.length;
        const totalWidth = data.width;

        // The space between actuator and sensor handles should be 40% of a STANDARD node's width.
        // The offset from the center anchor point is half of that (20%).
        const offsetInPixels = NODE_WIDTH * 0.2;
        const offsetPercent = (offsetInPixels / totalWidth) * 100;

        return data.children.map((childId, index) => {
            // position = (totalWidth / n) * (i + 0.5) -> converted to percentage
            const centerPercent = ((index + 0.5) / n) * 100;

            const controlPos = centerPercent - offsetPercent;
            const feedbackPos = centerPercent + offsetPercent;

            return (
                <React.Fragment key={`dynamic-handles-${childId}`}>
                    {/* Control path handles (source on bottom, target on top) */}
                    <Handle type="source" position={Position.Bottom} id={`bottom_control_${index}`} style={{ ...handleStyle, left: `${controlPos}%` }} />
                    <Handle type="target" position={Position.Top} id={`top_control_${index}`} style={{ ...handleStyle, left: `${controlPos}%` }} />

                    {/* Feedback path handles (target on bottom, source on top) */}
                    <Handle type="target" position={Position.Bottom} id={`bottom_feedback_${index}`} style={{ ...handleStyle, left: `${feedbackPos}%` }} />
                    <Handle type="source" position={Position.Top} id={`top_feedback_${index}`} style={{ ...handleStyle, left: `${feedbackPos}%` }} />
                </React.Fragment>
            );
        });
    };

    const renderStaticHandles = () => (
        <>
            <Handle type="target" position={Position.Top} id="top_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="target" position={Position.Bottom} id="bottom_right" style={{ ...handleStyle, left: '70%' }} />
            <Handle type="source" position={Position.Bottom} id="bottom_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="source" position={Position.Top} id="top_right" style={{ ...handleStyle, left: '70%' }} />
        </>
    );

    return (
        <>
            {data.children && data.children.length > 1 ? renderDynamicHandles() : renderStaticHandles()}

            <div style={{ padding: '5px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{data.label}</div>
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

// CustomEdge component
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