import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NODE_WIDTH } from '@/constants';

interface CustomNodeData {
    label: string;
    role?: string;
    rank?: string;
    commCount: number;
    children?: string[];
    width?: number;
}

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