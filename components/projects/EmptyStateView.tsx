import React from 'react';
import { motion } from 'motion/react';
import { PlusIcon, FolderIcon, ClipboardDocumentCheckIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import { useProjects } from '@/contexts/ProjectsContext';
import { useNavigate } from 'react-router-dom';
import { AnalysisType } from '@/types';
import { CAST_STEPS, STPA_STEPS } from '@/constants';
import Button from '@/components/shared/Button';

const EmptyStateView: React.FC = () => {
  const { projects, currentProject, createProject, createAnalysis } = useProjects();
  const navigate = useNavigate();

  const handleCreateFirstProject = () => {
    createProject('My First Project', 'Getting started with STAMP analysis');
  };

  const handleQuickStart = (type: AnalysisType) => {
    let projectToUse = currentProject;
    
    // If no project exists, create one first
    if (!projectToUse) {
      projectToUse = createProject('My First Project', 'Getting started with STAMP analysis');
    }
    
    // Create the analysis with a default name
    const defaultName = type === AnalysisType.CAST ? 'New CAST Analysis' : 'New STPA Analysis';
    createAnalysis(projectToUse.id, type, defaultName);
    
    // Navigate to the first step
    const firstStep = type === AnalysisType.CAST ? CAST_STEPS[1].path : STPA_STEPS[1].path;
    navigate(firstStep);
  };

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
              Welcome to STAMP Analysis Tool
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              Get started by creating your first project
            </p>
          </div>
          
          <Button
            onClick={handleCreateFirstProject}
            size="lg"
            className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
            leftIcon={<PlusIcon className="w-5 h-5" />}
          >
            Create First Project
          </Button>
          
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
              Or jump right in with a quick start:
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => handleQuickStart(AnalysisType.CAST)}
                variant="ghost"
                size="sm"
                leftIcon={<ClipboardDocumentCheckIcon className="w-4 h-4" />}
              >
                CAST Analysis
              </Button>
              <Button
                onClick={() => handleQuickStart(AnalysisType.STPA)}
                variant="ghost"
                size="sm"
                leftIcon={<CubeTransparentIcon className="w-4 h-4" />}
              >
                STPA Analysis
              </Button>
            </div>
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