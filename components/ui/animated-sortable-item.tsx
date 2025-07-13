import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedSortableItemProps {
  id: string;
  children: React.ReactNode;
  isDragging?: boolean;
  index?: number;
}

export const AnimatedSortableItem: React.FC<AnimatedSortableItemProps> = ({
  id,
  children,
  isDragging = false
}) => {
  return (
    <motion.div
      key={id}
      data-id={id}
      className="sortable-analysis-item"
      layout
      layoutId={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          layout: {
            type: "spring",
            stiffness: 350,
            damping: 25
          },
          opacity: { duration: 0.2 },
          y: {
            type: "spring",
            stiffness: 350,
            damping: 30
          }
        }
      }}
      exit={{ 
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 }
      }}
      style={{
        position: 'relative',
        willChange: 'transform',
        transformOrigin: 'center center'
      }}
    >
      <motion.div
        animate={{
          backgroundColor: isDragging 
            ? 'rgba(59, 130, 246, 0.1)' // Subtle blue highlight
            : 'transparent',
          borderColor: isDragging
            ? 'rgba(59, 130, 246, 0.3)'
            : 'transparent',
        }}
        transition={{
          backgroundColor: { duration: 0.2 },
          borderColor: { duration: 0.2 }
        }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '6px',
          border: '1px solid transparent',
          padding: '1px'
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Hook to manage drag state
export const useSortableAnimation = () => {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggingId(id);
    document.body.classList.add('sortable-dragging-animated');
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    document.body.classList.remove('sortable-dragging-animated');
  };

  return {
    draggingId,
    handleDragStart,
    handleDragEnd,
    isDragging: (id: string) => draggingId === id
  };
};