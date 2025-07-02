import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NODE_WIDTH } from '@/constants';
import { CustomNodeData } from '@/types'; // Import CustomNodeData interface

export const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
    const handleStyle = { width: '8px', height: '8px', background: 'transparent', border: 'none', zIndex: 10 };

    const renderDynamicHandles = (position: Position) => {
        let referenceArray: string[] = [];
        let handlePrefix: string;
        let handleType: 'source' | 'target';
        let fixedHandleOffset: number; // Offset for single dynamic handle case

        if (position === Position.Bottom) {
            referenceArray = data.children || [];
            handlePrefix = 'bottom_control_';
            handleType = 'source';
            fixedHandleOffset = 0.3; // Matches 'bottom_left' in static handles
        } else if (position === Position.Top) {
            referenceArray = data.parents || [];
            handlePrefix = 'top_control_';
            handleType = 'target';
            fixedHandleOffset = 0.3; // Matches 'top_left' in static handles
        } else {
            return null; // Should not happen
        }

        const n = referenceArray.length;
        const totalWidth = data.width || NODE_WIDTH; // Fallback to NODE_WIDTH if width is not provided

        // If only one connection, use a fixed position for a cleaner look unless it's a special case
        if (n === 1) {
            return (
                <Handle
                    type={handleType}
                    position={position}
                    id={`${handlePrefix}0`} // Use index 0 for the single handle
                    style={{ ...handleStyle, left: `${fixedHandleOffset * 100}%` }} // Fixed percentage for single handle
                />
            );
        }

        // The space between handles is based on a proportion of a standard node's width.
        const offsetInPixels = NODE_WIDTH * 0.2; // This value is half the gap between control and feedback handles in default design
        const offsetPercent = (offsetInPixels / totalWidth) * 100;

        return referenceArray.map((_, index) => {
            const centerPercent = ((index + 0.5) / n) * 100;
            // For control paths, the handle is on the 'control' side (left of center if multiple for same child, but here simply distributed)
            // For feedback paths, the handle is on the 'feedback' side (right of center)

            // Simplification: For multiple connections to/from this node, just distribute them evenly.
            // Further refinement would involve differentiating control vs. feedback handles if both dynamic.
            const handlePosition = centerPercent;

            return (
                <Handle
                    key={`${handlePrefix}${index}`}
                    type={handleType}
                    position={position}
                    id={`${handlePrefix}${index}`}
                    style={{ ...handleStyle, left: `${handlePosition}%` }}
                />
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