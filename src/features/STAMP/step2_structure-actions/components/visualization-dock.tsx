import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  LockClosedIcon,
  LockOpenIcon,
  Squares2X2Icon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useReactFlow } from 'reactflow';
import { Dock, DockIcon } from '@/components/magicui/dock';

interface VisualizationDockProps {
  onLayout: () => void;
  className?: string;
}

const VisualizationDock: React.FC<VisualizationDockProps> = ({ onLayout, className }) => {
  const { zoomIn, zoomOut, fitView, setNodes, setEdges } = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
  };

  const handleFitView = () => {
    fitView({ duration: 500, padding: 0.1 });
  };

  const toggleLock = () => {
    const newLockState = !isLocked;
    setIsLocked(newLockState);

    // Update all nodes to be draggable or not based on lock state
    setNodes(nodes =>
      nodes.map(node => ({
        ...node,
        draggable: !newLockState,
      }))
    );

    // Update all edges to be updatable or not based on lock state
    setEdges(edges =>
      edges.map(edge => ({
        ...edge,
        updatable: !newLockState,
      }))
    );
  };

  return (
    <Dock
      className={`absolute bottom-6 left-1/2 z-10 -translate-x-1/2 border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 ${className}`}
      iconSize={36}
      iconMagnification={48}
      iconDistance={100}
    >
      <DockIcon
        onClick={handleZoomIn}
        className="bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
        title="Zoom In"
      >
        <MagnifyingGlassPlusIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
      </DockIcon>

      <DockIcon
        onClick={handleZoomOut}
        className="bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
        title="Zoom Out"
      >
        <MagnifyingGlassMinusIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
      </DockIcon>

      <DockIcon
        onClick={handleFitView}
        className="bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
        title="Fit to View"
      >
        <ArrowsPointingInIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
      </DockIcon>

      <DockIcon
        onClick={toggleLock}
        className="bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
        title={isLocked ? 'Unlock Diagram' : 'Lock Diagram'}
      >
        {isLocked ? (
          <LockClosedIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        ) : (
          <LockOpenIcon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
        )}
      </DockIcon>

      <DockIcon
        onClick={onLayout}
        className="bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
        title="Organize Layout"
      >
        <Squares2X2Icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
      </DockIcon>
    </Dock>
  );
};

export default VisualizationDock;
