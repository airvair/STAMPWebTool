import React from 'react';
import { motion } from 'motion/react';
import { FolderIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { useProjects } from '@/contexts/ProjectsContext';

const EmptyStateView: React.FC = () => {
  const { projects } = useProjects();


  // No projects at all
  if (projects.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-full p-8"
      >
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/20 dark:to-blue-900/20 p-5">
            <FolderIcon className="w-full h-full text-sky-600 dark:text-sky-400" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              No project selected
            </h2>
          </div>
        </div>
      </motion.div>
    );
  }

  // Has project but no analysis selected
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full p-8"
    >
      <div className="max-w-md text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/20 dark:to-blue-900/20 p-5">
          <ClipboardDocumentCheckIcon className="w-full h-full text-sky-600 dark:text-sky-400" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            No analysis selected
          </h2>
        </div>
      </div>
    </motion.div>
  );
};

export default EmptyStateView;