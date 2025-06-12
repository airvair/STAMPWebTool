import React from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { ControllerType } from '../../types';
import { CONTROLLER_TYPE_COLORS } from '../../constants';

interface Position { x: number; y: number; }

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const LEVEL_HEIGHT = 120;
const SVG_WIDTH = 1000;

const ControlStructureDiagram: React.FC = () => {
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
    <svg width="100%" height={(levels.length + 1) * LEVEL_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${(levels.length + 1) * LEVEL_HEIGHT}`}>\
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="currentColor" />
        </marker>
        <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="red" />
        </marker>
      </defs>

      {/* Draw lines for control paths */}
      {controlPaths.map(cp => {
        const src = positions[cp.sourceControllerId];
        const tgt = positions[cp.targetId];
        if (!src || !tgt) return null;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        return (
          <g key={cp.id}>
            <line x1={src.x} y1={src.y + NODE_HEIGHT/2} x2={tgt.x} y2={tgt.y - NODE_HEIGHT/2}
              stroke="black" markerEnd="url(#arrow)" />
            <text x={midX} y={midY - 4} textAnchor="middle" fontSize="10">{cp.actuatorLabel || 'actuator'}</text>
          </g>
        );
      })}

      {/* Draw lines for feedback paths */}
      {feedbackPaths.map(fp => {
        const src = positions[fp.sourceId];
        const tgt = positions[fp.targetControllerId];
        if (!src || !tgt) return null;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        const stroke = fp.isMissing ? 'red' : 'black';
        const dash = fp.isMissing ? '4 2' : undefined;
        const marker = fp.isMissing ? 'url(#arrow-red)' : 'url(#arrow)';
        return (
          <g key={fp.id}>
            <line x1={src.x} y1={src.y - NODE_HEIGHT/2} x2={tgt.x} y2={tgt.y + NODE_HEIGHT/2}
              stroke={stroke} strokeDasharray={dash} markerEnd={marker} />
            <text x={midX} y={midY - 4} textAnchor="middle" fontSize="10">
              {fp.sensorLabel || 'sensor'}{fp.indirect ? ' (indirect)' : ''}{fp.isMissing ? ' MISSING' : ''}
            </text>
          </g>
        );
      })}

      {/* Draw nodes */}
      {controllers.map(ctrl => {
        const pos = positions[ctrl.id];
        const classes = CONTROLLER_TYPE_COLORS[ctrl.ctrlType];
        return (
          <g key={ctrl.id}>
            <rect x={pos.x - NODE_WIDTH/2} y={pos.y - NODE_HEIGHT/2} width={NODE_WIDTH} height={NODE_HEIGHT} className={classes} stroke="black" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="12">{ctrl.name}</text>
          </g>
        );
      })}

      {systemComponents.map(comp => {
        const pos = positions[comp.id];
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

export default ControlStructureDiagram;

