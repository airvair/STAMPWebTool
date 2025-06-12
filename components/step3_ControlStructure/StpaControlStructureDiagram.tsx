import React from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { ControllerType } from '../../types';
import { CONTROLLER_TYPE_COLORS, CONTROL_LINE_COLOR, FEEDBACK_LINE_COLOR, MISSING_LINE_COLOR, CONTROLLER_TYPE_FILL_COLORS } from '../../constants';

interface Position { x: number; y: number; }
interface DiagramProps { svgRef?: React.Ref<SVGSVGElement>; }

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const LEVEL_HEIGHT = 120;
const SVG_WIDTH = 1000;

const StpaControlStructureDiagram: React.FC<DiagramProps> = ({ svgRef }) => {
  const { systemComponents, controllers, controlPaths, feedbackPaths } = useAnalysis();

  // Determine controller levels based on control relationships
  const ctrlLevels: Record<string, number> = {};
  controllers.forEach(c => { ctrlLevels[c.id] = 0; });

  let updated = true;
  while (updated) {
    updated = false;
    controlPaths.forEach(cp => {
      const targetIsController = controllers.some(c => c.id === cp.targetId);
      if (!targetIsController) return;
      const srcLevel = ctrlLevels[cp.sourceControllerId] ?? 0;
      const newLevel = srcLevel + 1;
      if (ctrlLevels[cp.targetId] === undefined || newLevel > ctrlLevels[cp.targetId]) {
        ctrlLevels[cp.targetId] = newLevel;
        updated = true;
      }
    });
  }

  const maxCtrlLevel = Math.max(0, ...Object.values(ctrlLevels));
  const componentLevel = maxCtrlLevel + 1;

  const levelNodes: Record<number, { id: string; label: string; type: 'controller' | 'component'; ctrlType?: ControllerType }[]> = {};

  controllers.forEach(c => {
    const lvl = ctrlLevels[c.id] ?? 0;
    levelNodes[lvl] = levelNodes[lvl] || [];
    levelNodes[lvl].push({ id: c.id, label: c.name, type: 'controller', ctrlType: c.ctrlType });
  });

  systemComponents.forEach(sc => {
    levelNodes[componentLevel] = levelNodes[componentLevel] || [];
    levelNodes[componentLevel].push({ id: sc.id, label: sc.name, type: 'component' });
  });

  const levels = Object.keys(levelNodes).map(n => parseInt(n)).sort((a, b) => a - b);

  const positions: Record<string, Position> = {};
  levels.forEach((lvl, idx) => {
    const items = levelNodes[lvl];
    const spacing = SVG_WIDTH / (items.length + 1);
    items.forEach((n, i) => {
      positions[n.id] = { x: spacing * (i + 1), y: LEVEL_HEIGHT * idx + 40 };
    });
  });

  return (
    <svg ref={svgRef} width="100%" height={(levels.length + 1) * LEVEL_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${(levels.length + 1) * LEVEL_HEIGHT}`}>\
      <defs>
        <marker id="arrow-control" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={CONTROL_LINE_COLOR} />
        </marker>
        <marker id="arrow-feedback" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={FEEDBACK_LINE_COLOR} />
        </marker>
        <marker id="arrow-missing" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill={MISSING_LINE_COLOR} />
        </marker>
      </defs>

      {/* Draw lines for control paths */}
      {controlPaths.map(cp => {
        const src = positions[cp.sourceControllerId];
        const tgt = positions[cp.targetId];
        if (!src || !tgt) return null;
        const startX = src.x;
        const startY = src.y + NODE_HEIGHT / 2;
        const endX = tgt.x;
        const endY = tgt.y - NODE_HEIGHT / 2;
        const midY = (startY + endY) / 2;
        const pathData = `${startX},${startY} ${startX},${midY} ${endX},${midY} ${endX},${endY}`;
        const midX = (startX + endX) / 2;
        return (
          <g key={cp.id}>
            <polyline
              fill="none"
              stroke={CONTROL_LINE_COLOR}
              points={pathData}
              markerEnd="url(#arrow-control)"
            />
            <text x={midX} y={midY - 4} textAnchor="middle" fontSize="10">
              {cp.controls || cp.actuatorLabel || 'actuator'}
            </text>
          </g>
        );
      })}

      {/* Draw lines for feedback paths */}
      {feedbackPaths.map(fp => {
        const src = positions[fp.sourceId];
        const tgt = positions[fp.targetControllerId];
        if (!src || !tgt) return null;
        const startX = src.x;
        const startY = src.y - NODE_HEIGHT / 2;
        const endX = tgt.x;
        const endY = tgt.y + NODE_HEIGHT / 2;
        const midY = (startY + endY) / 2;
        const pathData = `${startX},${startY} ${startX},${midY} ${endX},${midY} ${endX},${endY}`;
        const midX = (startX + endX) / 2;
        const stroke = fp.isMissing ? MISSING_LINE_COLOR : FEEDBACK_LINE_COLOR;
        const dash = fp.isMissing ? '4 2' : undefined;
        const marker = fp.isMissing ? 'url(#arrow-missing)' : 'url(#arrow-feedback)';
        return (
          <g key={fp.id}>
            <polyline
              fill="none"
              stroke={stroke}
              strokeDasharray={dash}
              markerEnd={marker}
              points={pathData}
            />
            <text x={midX} y={midY - 4} textAnchor="middle" fontSize="10">
              {fp.feedback || fp.sensorLabel || 'sensor'}
              {fp.indirect ? ' (indirect)' : ''}
              {fp.isMissing ? ' MISSING' : ''}
            </text>
          </g>
        );
      })}

      {/* Draw nodes */}
      {controllers.map(ctrl => {
        const pos = positions[ctrl.id];
        if (!pos) return null;
        const classes = CONTROLLER_TYPE_COLORS[ctrl.ctrlType];
        const fill = CONTROLLER_TYPE_FILL_COLORS[ctrl.ctrlType];
        return (
          <g key={ctrl.id}>
            <rect x={pos.x - NODE_WIDTH/2} y={pos.y - NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} className={classes} fill={fill} stroke="black" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="12">{ctrl.name}</text>
          </g>
        );
      })}

      {systemComponents.map(comp => {
        const pos = positions[comp.id];
        if (!pos) return null;
        return (
          <g key={comp.id}>
            <rect x={pos.x - NODE_WIDTH/2} y={pos.y - NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} fill="white" stroke="black" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="12">{comp.name}</text>
          </g>
        );
      })}

    </svg>
  );
};

export default StpaControlStructureDiagram;

