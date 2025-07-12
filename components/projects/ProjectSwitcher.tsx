import React, { useState } from 'react';
import { ChevronDownIcon, PlusIcon, FolderIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useProjects } from '@/contexts/ProjectsContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Button from '@/components/shared/Button';

const ProjectSwitcher: React.FC = () => {
  const { projects, currentProject, selectProject, createProject } = useProjects();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newProjectName.trim()) {
      handleCreateProject();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton 
            size="lg" 
            className="w-full justify-between group-data-[collapsible=icon]:justify-center"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {currentProject?.name || 'Select Project'}
              </span>
            </div>
            <ChevronDownIcon className="w-4 h-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-[220px]" 
          side="right" 
          align="start"
        >
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {projects.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No projects yet
              </div>
            ) : (
              projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 truncate">
                      <FolderIcon className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="truncate">{project.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {project.analyses.length} {project.analyses.length === 1 ? 'analysis' : 'analyses'}
                        </span>
                      </div>
                    </div>
                    {currentProject?.id === project.id && (
                      <CheckIcon className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsCreateDialogOpen(true)}
            className="cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                id="project-description"
                placeholder="Enter project description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewProjectName('');
                setNewProjectDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectSwitcher;