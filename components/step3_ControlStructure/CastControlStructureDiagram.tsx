import React from 'react';
import { useAnalysis } from '../../hooks/useAnalysis'; // Assuming this hook provides the data
import { ControllerType } from '../../types'; // Assuming this defines the controller types

// --- Constants for Diagram Styling ---
const NODE_WIDTH = 160;
const NODE_HEIGHT = 50;
const LEVEL_HEIGHT = 150;
const SVG_WIDTH = 1200;
const SIDE_MARGIN = 20;
const ACTUATOR_SENSOR_BOX_SIZE = 18; // Size for the square 'A' and 'S' boxes
const CONTROL_LINE_COLOR = '#000000';
const FEEDBACK_LINE_COLOR = '#000000';
const MISSING_LINE_COLOR = '#FF0000';
const TEXT_OFFSET_VERTICAL = 5; // Pixels to offset text from the arrow line
const PATH_OFFSET = 15;

const CONTROLLER_TYPE_FILL_COLORS: Record<ControllerType, string> = {
    S: '#d1e7dd', // Software: Green
    H: '#cff4fc', // Human: Blue
    T: '#fff3cd', // Team: Yellow
    O: '#f8d7da', // Organization: Red
};

// --- Type Definitions ---
interface Position { x: number; y: number; }
interface NodeData { id: string; label: string; type: 'controller' | 'component'; ctrlType?: ControllerType; }
interface Layout { positions: Record<string, Position>; height: number; }

// --- Layout Calculation Hook (Unchanged) ---
const useControlStructureLayout = (analysisData: {
    controllers: any[];
    systemComponents: any[];
    controlPaths: any[];
}): Layout => {
    const { controllers, systemComponents, controlPaths } = analysisData;
    return React.useMemo(() => {
        const ctrlLevels: Record<string, number> = {};
        controllers.forEach(c => { ctrlLevels[c.id] = 0; });

        let updated = true;
        while (updated) {
            updated = false;
            controlPaths.forEach(cp => {
                const isTargetController = controllers.some(c => c.id === cp.targetId);
                if (!isTargetController) return;
                const sourceLevel = ctrlLevels[cp.sourceControllerId] ?? 0;
                const newTargetLevel = sourceLevel + 1;
                if ((ctrlLevels[cp.targetId] ?? -1) < newTargetLevel) {
                    ctrlLevels[cp.targetId] = newTargetLevel;
                    updated = true;
                }
            });
        }

        const maxCtrlLevel = Math.max(0, ...Object.values(ctrlLevels));
        const componentLevel = maxCtrlLevel + 1;
        const levelNodes: Record<number, NodeData[]> = {};

        controllers.forEach(c => {
            const level = ctrlLevels[c.id] ?? 0;
            levelNodes[level] = levelNodes[level] || [];
            levelNodes[level].push({ id: c.id, label: c.name, type: 'controller', ctrlType: c.ctrlType });
        });

        systemComponents.forEach(sc => {
            levelNodes[componentLevel] = levelNodes[componentLevel] || [];
            levelNodes[componentLevel].push({ id: sc.id, label: sc.name, type: 'component' });
        });

        const levels = Object.keys(levelNodes).map(n => parseInt(n)).sort((a, b) => a - b);
        const positions: Record<string, Position> = {};
        levels.forEach(level => {
            const itemsOnLevel = levelNodes[level];
            const totalWidth = SVG_WIDTH - 2 * SIDE_MARGIN;
            const spacing = itemsOnLevel.length > 1 ? totalWidth / (itemsOnLevel.length - 1) : 0;
            itemsOnLevel.forEach((node, i) => {
                let xPos = SIDE_MARGIN + spacing * i;
                if (itemsOnLevel.length === 1) xPos = SVG_WIDTH / 2;
                positions[node.id] = { x: xPos, y: LEVEL_HEIGHT * level + NODE_HEIGHT };
            });
        });

        const height = (levels.length + 1) * LEVEL_HEIGHT;
        return { positions, height };
    }, [controllers, systemComponents, controlPaths]);
};


// --- Presentational Components (with fixes) ---

// NEW: A component to render text with a white background for legibility
const TextWithBackground: React.FC<{
    x: number;
    y: number;
    textAnchor?: "start" | "middle" | "end";
    dominantBaseline?: string;
    children: React.ReactNode;
}> = ({ x, y, children, textAnchor, dominantBaseline }) => {
    const textRef = React.useRef<SVGTextElement>(null);
    const [bbox, setBbox] = React.useState<DOMRect | null>(null);

    // This effect measures the text's bounding box after it renders
    React.useLayoutEffect(() => {
        if (textRef.current) {
            setBbox(textRef.current.getBBox());
        }
    }, [children]);

    return (
        <g>
            {/* Draw the white background rectangle behind the text */}
            {bbox && (
                <rect
                    x={bbox.x - 2}
                    y={bbox.y - 1}
                    width={bbox.width + 4}
                    height={bbox.height + 2}
                    fill="white"
                    rx="1"
                />
            )}
            <text
                ref={textRef}
                x={x}
                y={y}
                textAnchor={textAnchor}
                dominantBaseline={dominantBaseline}
                fontSize="10"
                fontFamily="sans-serif"
            >
                {children}
            </text>
        </g>
    );
};

const Node: React.FC<{ node: NodeData; pos: Position }> = ({ node, pos }) => (
    <g>
        <rect
            x={pos.x - NODE_WIDTH / 2}
            y={pos.y - NODE_HEIGHT / 2}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            fill={node.type === 'controller' && node.ctrlType ? CONTROLLER_TYPE_FILL_COLORS[node.ctrlType] : '#FFFFFF'}
            stroke="#333"
            rx="5"
            ry="5"
        />
        <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontFamily="sans-serif"
        >
            {node.label}
        </text>
    </g>
);

const ControlPath: React.FC<{ path: any; positions: Record<string, Position>; offset?: number }> = ({ path, positions, offset = 0 }) => {
    const srcPos = positions[path.sourceControllerId];
    const tgtPos = positions[path.targetId];
    if (!srcPos || !tgtPos) return null;

    const startX = srcPos.x - NODE_WIDTH / 4;
    const startY = srcPos.y + NODE_HEIGHT / 2;
    const endX = tgtPos.x - NODE_WIDTH / 4;
    const endY = tgtPos.y - NODE_HEIGHT / 2;
    const bendY = (startY + endY) / 2 + offset;
    const actuatorY = startY + (bendY - startY) / 2;
    const midX = (startX + endX) / 2;

    return (
        <g>
            {/* Control Path Line */}
            <polyline
                fill="none"
                stroke={CONTROL_LINE_COLOR}
                strokeWidth="1.5"
                markerEnd="url(#arrow-control)"
                points={`${startX},${startY} ${startX},${bendY} ${endX},${bendY} ${endX},${endY}`}
            />
            {/* MODIFIED: Use TextWithBackground for control label */}
            <TextWithBackground
                x={midX}
                y={bendY + TEXT_OFFSET_VERTICAL}
                textAnchor="middle"
                dominantBaseline="hanging"
            >
                {path.controls}
            </TextWithBackground>
            {/* Actuator Box */}
            <rect
                x={startX - ACTUATOR_SENSOR_BOX_SIZE / 2}
                y={actuatorY - ACTUATOR_SENSOR_BOX_SIZE / 2}
                width={ACTUATOR_SENSOR_BOX_SIZE}
                height={ACTUATOR_SENSOR_BOX_SIZE}
                fill="white"
                stroke={CONTROL_LINE_COLOR}
            />
            <text x={startX} y={actuatorY} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold" fontFamily="sans-serif">A</text>
        </g>
    );
};

const FeedbackPath: React.FC<{ path: any; positions: Record<string, Position>; offset?: number }> = ({ path, positions, offset = 0 }) => {
    const srcPos = positions[path.sourceId];
    const tgtPos = positions[path.targetControllerId];
    if (!srcPos || !tgtPos) return null;

    const startX = srcPos.x + NODE_WIDTH / 4;
    const startY = srcPos.y - NODE_HEIGHT / 2;
    const endX = tgtPos.x + NODE_WIDTH / 4;
    const endY = tgtPos.y + NODE_HEIGHT / 2;
    const bendY = (startY + endY) / 2 + offset;
    const sensorY = startY + (bendY - startY) / 2;
    const midX = (startX + endX) / 2;

    const stroke = path.isMissing ? MISSING_LINE_COLOR : FEEDBACK_LINE_COLOR;
    const marker = path.isMissing ? 'url(#arrow-missing)' : 'url(#arrow-feedback)';

    return (
        <g>
            {/* Feedback Path Line */}
            <polyline
                fill="none"
                stroke={stroke}
                strokeWidth="1.5"
                strokeDasharray={path.isMissing ? '4 2' : 'none'}
                markerEnd={marker}
                points={`${startX},${startY} ${startX},${bendY} ${endX},${bendY} ${endX},${endY}`}
            />
            {/* MODIFIED: Use TextWithBackground for feedback label */}
            <TextWithBackground
                x={midX}
                y={bendY - TEXT_OFFSET_VERTICAL}
                textAnchor="middle"
                dominantBaseline="auto"
            >
                {path.isMissing ? 'MISSING ' : ''}{path.feedback}
            </TextWithBackground>
            {/* Sensor Box */}
            <rect
                x={startX - ACTUATOR_SENSOR_BOX_SIZE / 2}
                y={sensorY - ACTUATOR_SENSOR_BOX_SIZE / 2}
                width={ACTUATOR_SENSOR_BOX_SIZE}
                height={ACTUATOR_SENSOR_BOX_SIZE}
                fill="white"
                stroke={stroke}
            />
            <text x={startX} y={sensorY} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="bold" fontFamily="sans-serif">S</text>
        </g>
    );
};


// --- Main Diagram Component ---
const CastControlStructureDiagram: React.FC<{ svgRef?: React.Ref<SVGSVGElement> }> = ({ svgRef }) => {
    const analysisData = useAnalysis();
    const { positions, height } = useControlStructureLayout(analysisData);

    const cpGroups: Record<string, string[]> = {};
    analysisData.controlPaths.forEach(cp => {
        const src = positions[cp.sourceControllerId];
        const tgt = positions[cp.targetId];
        if (!src || !tgt) return;
        const key = `${src.y}-${tgt.y}`;
        cpGroups[key] = cpGroups[key] || [];
        cpGroups[key].push(cp.id);
    });
    const cpOffsets: Record<string, number> = {};
    Object.values(cpGroups).forEach(ids => {
        ids.forEach((id, idx) => {
            cpOffsets[id] = (idx - (ids.length - 1) / 2) * PATH_OFFSET;
        });
    });

    const fpGroups: Record<string, string[]> = {};
    analysisData.feedbackPaths.forEach(fp => {
        const src = positions[fp.sourceId];
        const tgt = positions[fp.targetControllerId];
        if (!src || !tgt) return;
        const key = `${src.y}-${tgt.y}`;
        fpGroups[key] = fpGroups[key] || [];
        fpGroups[key].push(fp.id);
    });
    const fpOffsets: Record<string, number> = {};
    Object.values(fpGroups).forEach(ids => {
        ids.forEach((id, idx) => {
            fpOffsets[id] = (idx - (ids.length - 1) / 2) * PATH_OFFSET;
        });
    });

    const allNodes = [
        ...analysisData.controllers.map(c => ({ id: c.id, label: c.name, type: 'controller' as const, ctrlType: c.ctrlType })),
        ...analysisData.systemComponents.map(sc => ({ id: sc.id, label: sc.name, type: 'component' as const })),
    ];

    return (
        <svg ref={svgRef} width="100%" height={height} viewBox={`0 0 ${SVG_WIDTH} ${height}`}>
            <defs>
                <marker id="arrow-control" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={CONTROL_LINE_COLOR} /></marker>
                <marker id="arrow-feedback" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={FEEDBACK_LINE_COLOR} /></marker>
                <marker id="arrow-missing" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={MISSING_LINE_COLOR} /></marker>
            </defs>

            {/* Render all paths first, so they appear underneath the nodes and text backgrounds. */}
            {analysisData.controlPaths.map(path => (
                <ControlPath key={path.id} path={path} positions={positions} offset={cpOffsets[path.id]} />
            ))}
            {analysisData.feedbackPaths.map(path => (
                <FeedbackPath key={path.id} path={path} positions={positions} offset={fpOffsets[path.id]} />
            ))}

            {/* Nodes are rendered last, ensuring they are drawn on top of all paths and their labels. */}
            {allNodes.map(node => {
                const pos = positions[node.id];
                return pos ? <Node key={node.id} node={node} pos={pos} /> : null;
            })}
        </svg>
    );
};

export default CastControlStructureDiagram;