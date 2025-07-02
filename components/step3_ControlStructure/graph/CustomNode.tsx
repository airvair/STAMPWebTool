import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NODE_WIDTH } from '@/constants';
import { CustomNodeData } from '@/types'; // Import CustomNodeData interface

export const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
    const handleStyle = { width: '8px', height: '8px', background: 'transparent', border: 'none', zIndex: 10 };

    const renderDynamicHandles = (position: Position) => {
        let referenceArray: string[] = [];
        let controlPrefix: string;
        let feedbackPrefix: string;
        let controlType: 'source' | 'target';
        let feedbackType: 'source' | 'target';
        const fixedControlOffset = 0.3; // Matches static handle position

        if (position === Position.Bottom) {
            referenceArray = data.children || [];
            controlPrefix = 'bottom_control_';
            feedbackPrefix = 'bottom_feedback_';
            controlType = 'source';
            feedbackType = 'target';
        } else if (position === Position.Top) {
            referenceArray = data.parents || [];
            controlPrefix = 'top_control_';
            feedbackPrefix = 'top_feedback_';
            controlType = 'target';
            feedbackType = 'source';
        } else {
            return null; // Should not happen
        }

        const n = referenceArray.length;
        const totalWidth = data.width || NODE_WIDTH; // Fallback to NODE_WIDTH if width is not provided

        // If only one connection, place the control and feedback handles at the default static offsets
        if (n === 1) {
            return (
                <>
                    <Handle
                        type={controlType}
                        position={position}
                        id={`${controlPrefix}0`}
                        style={{ ...handleStyle, left: `${fixedControlOffset * 100}%` }}
                    />
                    <Handle
                        type={feedbackType}
                        position={position}
                        id={`${feedbackPrefix}0`}
                        style={{ ...handleStyle, left: `${(1 - fixedControlOffset) * 100}%` }}
                    />
                </>
            );
        }

        // The space between actuator and sensor handles should be 40% of a standard node's width.
        const offsetInPixels = NODE_WIDTH * 0.2;
        const offsetPercent = (offsetInPixels / totalWidth) * 100;

        return referenceArray.map((_, index) => {
            const centerPercent = ((index + 0.5) / n) * 100;
            const controlPos = centerPercent - offsetPercent;
            const feedbackPos = centerPercent + offsetPercent;

            return (
                <React.Fragment key={`dynamic-handles-${index}`}> {/* pair for connection */}
                    <Handle
                        type={controlType}
                        position={position}
                        id={`${controlPrefix}${index}`}
                        style={{ ...handleStyle, left: `${controlPos}%` }}
                    />
                    <Handle
                        type={feedbackType}
                        position={position}
                        id={`${feedbackPrefix}${index}`}
                        style={{ ...handleStyle, left: `${feedbackPos}%` }}
                    />
                </React.Fragment>
            );
        });
    };

    // Determine if dynamic handles should be rendered for top and bottom.
    // Dynamic handles for children (outgoing)
    const renderDynamicBottomHandles = (data.children && data.children.length > 0) ? renderDynamicHandles(Position.Bottom) : null;
    // Dynamic handles for parents (incoming)
    const renderDynamicTopHandles = (data.parents && data.parents.length > 0) ? renderDynamicHandles(Position.Top) : null;

    // Fallback to static handles only if no dynamic handles are needed for either top or bottom
    const renderStaticHandles = (!renderDynamicBottomHandles && !renderDynamicTopHandles) && (
        <>
            <Handle type="target" position={Position.Top} id="top_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="target" position={Position.Bottom} id="bottom_right" style={{ ...handleStyle, left: '70%' }} />
            <Handle type="source" position={Position.Bottom} id="bottom_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="source" position={Position.Top} id="top_right" style={{ ...handleStyle, left: '70%' }} />
        </>
    );


    return (
        <>
            {/* Render dynamic handles if applicable */}
            {renderDynamicTopHandles}
            {renderDynamicBottomHandles}
            {/* Render static handles only if no dynamic handles are generated */}
            {renderStaticHandles}

            <div style={{ padding: '5px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{data.label}</div>
            </div>
        </>
    );
};