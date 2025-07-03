import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NODE_WIDTH, CHILD_NODE_SPACING } from '@/constants';

interface CustomNodeData {
    label: string;
    role?: string;
    rank?: string;
    commCount: number;
    children?: string[];
    width?: number;
    grandchildren?: string[];
    parents?: string[];
    parentWidths?: number[];
}

export const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
    const handleStyle = { width: '8px', height: '8px', background: 'transparent', border: 'none', zIndex: 10 };

    const renderDynamicHandles = () => {
        if (!data.width) return null;
        
        const hasChildren = data.children && data.children.length > 0;
        const hasGrandchildren = data.grandchildren && data.grandchildren.length > 0;
        const hasMultipleParents = data.parents && data.parents.length > 1;
        
        if (!hasChildren && !hasGrandchildren && !hasMultipleParents) return null;
        if (hasChildren && data.children!.length <= 1 && !hasGrandchildren && !hasMultipleParents) return null;

        const n = hasChildren ? data.children!.length : 0;
        const totalWidth = data.width;
        
        // If we have grandchildren, reserve space on the left for their handles
        const grandchildWidth = hasGrandchildren ? NODE_WIDTH : 0;
        const availableWidthForChildren = totalWidth - grandchildWidth;

        const handles: React.ReactElement[] = [];

        // Render grandchild handles on the far left
        if (hasGrandchildren) {
            data.grandchildren!.forEach((grandchildId, index) => {
                const grandchildPos = (NODE_WIDTH * 0.3) / totalWidth * 100; // Position on left side
                handles.push(
                    <Handle 
                        key={`grandchild-${grandchildId}`}
                        type="source" 
                        position={Position.Bottom} 
                        id={`bottom_grandchild_${index}`} 
                        style={{ ...handleStyle, left: `${grandchildPos}%` }} 
                    />
                );
            });
        }

        // Render child handles in the remaining space
        if (hasChildren) {
            data.children!.forEach((childId, index) => {
            // Calculate the center position of each child accounting for spacing
            const totalSpacing = (n - 1) * CHILD_NODE_SPACING;
            const childrenOnlyWidth = availableWidthForChildren - totalSpacing;
            const childWidth = childrenOnlyWidth / n;
            const childCenterX = grandchildWidth + (index * (childWidth + CHILD_NODE_SPACING)) + (childWidth / 2);
            const childCenterPercent = (childCenterX / totalWidth) * 100;

            // The space between actuator and sensor handles should be 40% of a STANDARD node's width.
            // The offset from the center anchor point is half of that (20%).
            const offsetInPixels = NODE_WIDTH * 0.2;
            const offsetPercent = (offsetInPixels / totalWidth) * 100;

            const controlPos = childCenterPercent - offsetPercent; // Actuator (left of center)
            const feedbackPos = childCenterPercent + offsetPercent; // Sensor (right of center)

            handles.push(
                <React.Fragment key={`dynamic-handles-${childId}`}>
                    {/* Control path handles (source on bottom, target on top) - Actuator (left) */}
                    <Handle 
                        type="source" 
                        position={Position.Bottom} 
                        id={`bottom_control_${index}`} 
                        style={{ ...handleStyle, left: `${controlPos}%` }} 
                    />
                    <Handle 
                        type="target" 
                        position={Position.Top} 
                        id={`top_control_${index}`} 
                        style={{ ...handleStyle, left: `${controlPos}%` }} 
                    />

                    {/* Feedback path handles (target on bottom, source on top) - Sensor (right) */}
                    <Handle 
                        type="target" 
                        position={Position.Bottom} 
                        id={`bottom_feedback_${index}`} 
                        style={{ ...handleStyle, left: `${feedbackPos}%` }} 
                    />
                    <Handle 
                        type="source" 
                        position={Position.Top} 
                        id={`top_feedback_${index}`} 
                        style={{ ...handleStyle, left: `${feedbackPos}%` }} 
                    />
                </React.Fragment>
            );
            });
        }

        // Render multi-parent target handles
        if (hasMultipleParents) {
            data.parents!.forEach((parentId, index) => {
                // Calculate positioning based on actual parent node widths (same logic as child positioning)
                let parentWidthSum = 0;
                for (let i = 0; i < index; i++) {
                    // Use actual parent width if available, otherwise fallback to NODE_WIDTH
                    const parentWidth = data.parentWidths && data.parentWidths[i] ? data.parentWidths[i] : NODE_WIDTH;
                    parentWidthSum += parentWidth;
                    // Add spacing between parents (except after the last one)
                    if (i < data.parents!.length - 1) {
                        parentWidthSum += CHILD_NODE_SPACING;
                    }
                }
                
                // Calculate center position of this parent's allocated space
                const currentParentWidth = data.parentWidths && data.parentWidths[index] ? data.parentWidths[index] : NODE_WIDTH;
                const parentCenterX = parentWidthSum + (currentParentWidth / 2);
                const parentCenterPercent = (parentCenterX / totalWidth) * 100;

                // Apply actuator/sensor offset (same as child handles)
                const offsetInPixels = NODE_WIDTH * 0.2;
                const offsetPercent = (offsetInPixels / totalWidth) * 100;

                const actuatorPos = parentCenterPercent - offsetPercent; // Actuator (left of center)
                const sensorPos = parentCenterPercent + offsetPercent; // Sensor (right of center)

                handles.push(
                    <React.Fragment key={`multiparent-handles-${parentId}`}>
                        {/* Control path target handle - Actuator (left) */}
                        <Handle 
                            type="target" 
                            position={Position.Top} 
                            id={`top_multiparent_${index}`} 
                            style={{ ...handleStyle, left: `${actuatorPos}%` }} 
                        />
                        {/* Feedback path source handle - Sensor (right) */}
                        <Handle 
                            type="source" 
                            position={Position.Top} 
                            id={`top_multiparent_feedback_${index}`} 
                            style={{ ...handleStyle, left: `${sensorPos}%` }} 
                        />
                    </React.Fragment>
                );
            });
        }


        return handles;
    };

    const renderStaticHandles = () => (
        <>
            {/* Standard handles for simple parent-child relationships */}
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, left: '50%' }} />
            <Handle type="target" position={Position.Top} id="top" style={{ ...handleStyle, left: '50%' }} />
            
            {/* Legacy handles for backward compatibility */}
            <Handle type="target" position={Position.Top} id="top_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="target" position={Position.Bottom} id="bottom_right" style={{ ...handleStyle, left: '70%' }} />
            <Handle type="source" position={Position.Bottom} id="bottom_left" style={{ ...handleStyle, left: '30%' }} />
            <Handle type="source" position={Position.Top} id="top_right" style={{ ...handleStyle, left: '70%' }} />
        </>
    );

    return (
        <>
            {(data.children && data.children.length > 1) || (data.grandchildren && data.grandchildren.length > 0) || (data.parents && data.parents.length > 1) ? renderDynamicHandles() : renderStaticHandles()}

            <div style={{ padding: '5px', textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{data.label}</div>
            </div>
        </>
    );
};