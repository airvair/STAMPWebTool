import {
  ChevronDownIcon,
  PlusIcon,
  FolderIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useProjects } from '@/context/ProjectsContext';

const ProjectSwitcher: React.FC = () => {
  const {
    projects,
    currentProject,
    currentAnalysis,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsCreateDialogOpen(false);

      // Navigate to the new project (it won't have analyses yet)
      navigate('/');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newProjectName.trim()) {
      handleCreateProject();
    }
  };

  const handleRenameProject = () => {
    if (renamingProjectId && renameValue.trim()) {
      updateProject(renamingProjectId, { name: renameValue.trim() });

      // If renaming current project, update URL
      if (renamingProjectId === currentProject?.id) {
        const projectSlug = encodeURIComponent(
          renameValue.trim().toLowerCase().replace(/\s+/g, '-')
        );

        // Check if there's a selected analysis to include in URL
        if (currentAnalysis) {
          const analysisSlug = encodeURIComponent(
            currentAnalysis.title.toLowerCase().replace(/\s+/g, '-')
          );
          navigate(`/${projectSlug}/${analysisSlug}`);
        } else {
          navigate(`/${projectSlug}`);
        }
      }

      setRenamingProjectId(null);
      setRenameValue('');
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && renameValue.trim()) {
      handleRenameProject();
    } else if (e.key === 'Escape') {
      setRenamingProjectId(null);
      setRenameValue('');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      selectProject(projectId);

      // Navigate to project URL (without analysis)
      const projectSlug = encodeURIComponent(project.name.toLowerCase().replace(/\s+/g, '-'));
      navigate(`/${projectSlug}`);
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
              <FolderIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{currentProject?.name || 'Select Project'}</span>
            </div>
            <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[220px]" side="right" align="start">
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {projects.length === 0 ? (
              <div className="text-muted-foreground px-2 py-1.5 text-sm">No projects yet</div>
            ) : (
              projects.map(project => (
                <div key={project.id} className="group relative">
                  {renamingProjectId === project.id ? (
                    <div className="flex items-center gap-2 p-2">
                      <FolderIcon className="h-4 w-4 shrink-0" />
                      <Input
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={handleRenameProject}
                        className="h-6 text-sm"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleProjectSelect(project.id)}
                        className={`cursor-pointer pr-8 ${
                          currentProject?.id === project.id ? 'bg-accent/50 hover:bg-accent/70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FolderIcon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="truncate">{project.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {project.analyses.length}{' '}
                              {project.analyses.length === 1 ? 'analysis' : 'analyses'}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="hover:bg-accent absolute top-1/2 right-1 -translate-y-1/2 rounded-sm p-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="right">
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              setRenamingProjectId(project.id);
                              setRenameValue(project.name);
                            }}
                          >
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)} className="cursor-pointer">
            <PlusIcon className="mr-2 h-4 w-4" />
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
                onChange={e => setNewProjectName(e.target.value)}
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
                onChange={e => setNewProjectDescription(e.target.value)}
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
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDeleteProject}
        variant="destructive"
      />
    </>
  );
};

export default ProjectSwitcher;
