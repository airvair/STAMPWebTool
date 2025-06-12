import React from "react";
import { useAnalysis } from "../../hooks/useAnalysis";
import { ControllerType } from "../../types";
import {
  CONTROLLER_TYPE_COLORS,
  CONTROL_LINE_COLOR,
  FEEDBACK_LINE_COLOR,
  MISSING_LINE_COLOR,
  CONTROLLER_TYPE_FILL_COLORS,
} from "../../constants";

interface Position {
  x: number;
  y: number;
}
interface DiagramProps {
  svgRef?: React.Ref<SVGSVGElement>;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 50;
const LEVEL_HEIGHT = 120;
const SVG_WIDTH = 1000;
const SIDE_MARGIN = 16;
const ACT_BOX_W = 44;
const ACT_BOX_H = 16;

const CastControlStructureDiagram: React.FC<DiagramProps> = ({ svgRef }) => {
  const { systemComponents, controllers, controlPaths, feedbackPaths } =
    useAnalysis();

  // Determine controller levels based on control relationships
  const ctrlLevels: Record<string, number> = {};
  controllers.forEach((c) => {
    ctrlLevels[c.id] = 0;
  });

  let updated = true;
  while (updated) {
    updated = false;
    controlPaths.forEach((cp) => {
      const targetIsController = controllers.some((c) => c.id === cp.targetId);
      if (!targetIsController) return;
      const srcLevel = ctrlLevels[cp.sourceControllerId] ?? 0;
      const newLevel = srcLevel + 1;
      if (
        ctrlLevels[cp.targetId] === undefined ||
        newLevel > ctrlLevels[cp.targetId]
      ) {
        ctrlLevels[cp.targetId] = newLevel;
        updated = true;
      }
    });
  }

  const maxCtrlLevel = Math.max(0, ...Object.values(ctrlLevels));
  const componentLevel = maxCtrlLevel + 1;

  const levelNodes: Record<
    number,
    {
      id: string;
      label: string;
      type: "controller" | "component";
      ctrlType?: ControllerType;
    }[]
  > = {};

  controllers.forEach((c) => {
    const lvl = ctrlLevels[c.id] ?? 0;
    levelNodes[lvl] = levelNodes[lvl] || [];
    levelNodes[lvl].push({
      id: c.id,
      label: c.name,
      type: "controller",
      ctrlType: c.ctrlType,
    });
  });

  systemComponents.forEach((sc) => {
    levelNodes[componentLevel] = levelNodes[componentLevel] || [];
    levelNodes[componentLevel].push({
      id: sc.id,
      label: sc.name,
      type: "component",
    });
  });

  const levels = Object.keys(levelNodes)
    .map((n) => parseInt(n))
    .sort((a, b) => a - b);

  const positions: Record<string, Position> = {};
  levels.forEach((lvl, idx) => {
    const items = levelNodes[lvl];
    const spacing = (SVG_WIDTH - 2 * SIDE_MARGIN) / (items.length + 1);
    items.forEach((n, i) => {
      positions[n.id] = {
        x: SIDE_MARGIN + spacing * (i + 1),
        y: LEVEL_HEIGHT * lvl + 40,
      };
    });
  });

  const renderControlLine = (cp: (typeof controlPaths)[number]) => {
    const src = positions[cp.sourceControllerId];
    const tgt = positions[cp.targetId];
    if (!src || !tgt) return null;
    const startX = src.x - NODE_WIDTH / 2;
    const startY = src.y;
    const endX = tgt.x - NODE_WIDTH / 2;
    const endY = tgt.y;
    const bendY = (startY + endY) / 2;
    return (
      <polyline
        key={cp.id}
        fill="none"
        stroke={CONTROL_LINE_COLOR}
        markerEnd="url(#arrow-control)"
        points={`${startX},${startY} ${startX},${bendY} ${endX},${bendY} ${endX},${endY}`}
      />
    );
  };

  const renderControlExtras = (cp: (typeof controlPaths)[number]) => {
    const src = positions[cp.sourceControllerId];
    const tgt = positions[cp.targetId];
    if (!src || !tgt) return null;
    const startX = src.x - NODE_WIDTH / 2;
    const startY = src.y;
    const endX = tgt.x - NODE_WIDTH / 2;
    const endY = tgt.y;
    const bendY = (startY + endY) / 2;
    const midX = (startX + endX) / 2;
    const verticalMid = bendY + (endY - bendY) / 2;
    return (
      <g key={cp.id} pointerEvents="none">
        <rect
          x={endX - ACT_BOX_W / 2}
          y={verticalMid - ACT_BOX_H / 2}
          width={ACT_BOX_W}
          height={ACT_BOX_H}
          fill="white"
          stroke={CONTROL_LINE_COLOR}
        />
        <text
          x={endX}
          y={verticalMid}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
        >
          actuator
        </text>
        <text x={midX} y={bendY - 8} textAnchor="middle" fontSize="10">
          {cp.controls}
        </text>
      </g>
    );
  };

  const renderFeedbackLine = (fp: (typeof feedbackPaths)[number]) => {
    const src = positions[fp.sourceId];
    const tgt = positions[fp.targetControllerId];
    if (!src || !tgt) return null;
    const startX = src.x + NODE_WIDTH / 2;
    const startY = src.y;
    const endX = tgt.x + NODE_WIDTH / 2;
    const endY = tgt.y;
    const bendY = (startY + endY) / 2;
    const stroke = fp.isMissing ? MISSING_LINE_COLOR : FEEDBACK_LINE_COLOR;
    const dash = fp.isMissing ? "4 2" : "5 5";
    const marker = fp.isMissing
      ? "url(#arrow-missing)"
      : "url(#arrow-feedback)";
    return (
      <polyline
        key={fp.id}
        fill="none"
        stroke={stroke}
        strokeDasharray={dash}
        markerEnd={marker}
        points={`${startX},${startY} ${startX},${bendY} ${endX},${bendY} ${endX},${endY}`}
      />
    );
  };

  const renderFeedbackExtras = (fp: (typeof feedbackPaths)[number]) => {
    const src = positions[fp.sourceId];
    const tgt = positions[fp.targetControllerId];
    if (!src || !tgt) return null;
    const startX = src.x + NODE_WIDTH / 2;
    const startY = src.y;
    const endX = tgt.x + NODE_WIDTH / 2;
    const endY = tgt.y;
    const bendY = (startY + endY) / 2;
    const midX = (startX + endX) / 2;
    const verticalMid = startY + (bendY - startY) / 2;
    const stroke = fp.isMissing ? MISSING_LINE_COLOR : FEEDBACK_LINE_COLOR;
    const dash = fp.isMissing ? "4 2" : "5 5";
    const marker = fp.isMissing
      ? "url(#arrow-missing)"
      : "url(#arrow-feedback)";
    return (
      <g key={fp.id} pointerEvents="none">
        <rect
          x={startX - ACT_BOX_W / 2}
          y={verticalMid - ACT_BOX_H / 2}
          width={ACT_BOX_W}
          height={ACT_BOX_H}
          fill="white"
          stroke={stroke}
        />
        <text
          x={startX}
          y={verticalMid}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
        >
          sensor
        </text>
        <text x={midX} y={bendY - 8} textAnchor="middle" fontSize="10">
          {fp.feedback} {fp.indirect ? "(indirect)" : ""}{" "}
          {fp.isMissing ? "MISSING" : ""}
        </text>
      </g>
    );
  };

  const drawNode = (
    id: string,
    name: string,
    type: "controller" | "component",
    ctrlType?: ControllerType,
  ) => {
    const pos = positions[id];
    if (!pos) return null;
    const fill =
      type === "controller" && ctrlType
        ? CONTROLLER_TYPE_FILL_COLORS[ctrlType]
        : "white";
    const classes =
      type === "controller" && ctrlType ? CONTROLLER_TYPE_COLORS[ctrlType] : "";
    return (
      <g key={id}>
        <rect
          x={pos.x - NODE_WIDTH / 2}
          y={pos.y - NODE_HEIGHT / 2}
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          fill={fill}
          stroke="black"
          className={classes}
        />
        <text
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
        >
          {name}
        </text>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={(levels.length + 1) * LEVEL_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${(levels.length + 1) * LEVEL_HEIGHT}`}
    >
      \
      <defs>
        <marker
          id="arrow-control"
          markerWidth="10"
          markerHeight="10"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={CONTROL_LINE_COLOR} />
        </marker>
        <marker
          id="arrow-feedback"
          markerWidth="10"
          markerHeight="10"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={FEEDBACK_LINE_COLOR} />
        </marker>
        <marker
          id="arrow-missing"
          markerWidth="10"
          markerHeight="10"
          refX="10"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={MISSING_LINE_COLOR} />
        </marker>
      </defs>
      {/* Lines under nodes */}
      {controlPaths.map(renderControlLine)}
      {feedbackPaths.map(renderFeedbackLine)}
      {/* Draw nodes */}
      {controllers.map((c) => drawNode(c.id, c.name, "controller", c.ctrlType))}
      {systemComponents.map((sc) => drawNode(sc.id, sc.name, "component"))}
      {/* Arrow labels and actuator/sensor boxes */}
      {controlPaths.map(renderControlExtras)}
      {feedbackPaths.map(renderFeedbackExtras)}
    </svg>
  );
};

export default CastControlStructureDiagram;
