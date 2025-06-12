import ELK from 'elkjs/lib/elk.bundled.js';
import { Controller, SystemComponent, ControlPath, FeedbackPath } from '../types';

export interface LayoutResult {
  positions: Record<string, {x: number; y: number}>;
}

/**
 * Calculates a layout for the control structure using elkjs.
 */
export async function layoutControlStructure(
  controllers: Controller[],
  components: SystemComponent[],
  controlPaths: ControlPath[],
  feedbackPaths: FeedbackPath[]
): Promise<LayoutResult> {
  const elk = new ELK();

  const nodes = [
    ...controllers.map(c => ({ id: c.id, width: 140, height: 50 })),
    ...components.map(c => ({ id: c.id, width: 140, height: 50 }))
  ];

  const edges = [
    ...controlPaths.map(cp => ({ id: cp.id, sources: [cp.sourceControllerId], targets: [cp.targetId] })),
    ...feedbackPaths.map(fp => ({ id: fp.id, sources: [fp.sourceId], targets: [fp.targetControllerId] }))
  ];

  const graph = {
    id: 'root',
    layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'DOWN' },
    children: nodes,
    edges: edges
  };

  const layout = await elk.layout(graph as any);

  const positions: Record<string, {x: number; y: number}> = {};
  layout.children?.forEach(n => {
    positions[n.id] = { x: n.x ?? 0, y: n.y ?? 0 };
  });

  return { positions };
}
