import { PlusIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentCheckIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/shared';
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarGroupAction } from '@/components/ui/sidebar';
import { useProjects } from '@/context/ProjectsContext';
import { AnalysisType } from '@/types/types';

const NewAnalysisButton: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, createAnalysis } = useProjects();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<AnalysisType | null>(null);
  const [analysisName, setAnalysisName] = useState('');

  const handleSelectType = (type: AnalysisType) => {
    setSelectedType(type);
    setAnalysisName('');
    setIsDialogOpen(true);
  };

  const handleCreateAnalysis = () => {
    if (!currentProject || !selectedType || !analysisName.trim()) {
      return;
    }

    const newAnalysis = createAnalysis(currentProject.id, selectedType, analysisName.trim());

    // Navigate to the new analysis URL
    const projectSlug = encodeURIComponent(currentProject.name.toLowerCase().replace(/\s+/g, '-'));
    const analysisSlug = encodeURIComponent(newAnalysis.title.toLowerCase().replace(/\s+/g, '-'));
    navigate(`/${projectSlug}/${analysisSlug}`);

    // Reset state
    setIsDialogOpen(false);
    setSelectedType(null);
    setAnalysisName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && analysisName.trim()) {
      handleCreateAnalysis();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarGroupAction title="New Analysis">
            <PlusIcon />
            <span className="sr-only">New Analysis</span>
          </SidebarGroupAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-[280px]">
          <DropdownMenuLabel>Choose Analysis Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleSelectType(AnalysisType.CAST)}
            className="cursor-pointer p-3"
            disabled={!currentProject}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 p-2">
                <ClipboardDocumentCheckIcon className="h-full w-full text-white" />
              </div>
              <div className="space-y-1">
                <div className="font-medium">CAST Analysis</div>
                <div className="text-muted-foreground text-xs">
                  Analyze past events to identify systemic causal factors
                </div>
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSelectType(AnalysisType.STPA)}
            className="cursor-pointer p-3"
            disabled={!currentProject}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 p-2">
                <CubeTransparentIcon className="h-full w-full text-white" />
              </div>
              <div className="space-y-1">
                <div className="font-medium">STPA Analysis</div>
                <div className="text-muted-foreground text-xs">
                  Proactively identify hazards for system design
                </div>
              </div>
            </div>
          </DropdownMenuItem>
          {!currentProject && (
            <>
              <DropdownMenuSeparator />
              <div className="text-muted-foreground px-3 py-2 text-xs">
                Please create or select a project first
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your {selectedType} Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="analysis-name" className="text-sm font-medium">
                Analysis Name
              </label>
              <Input
                id="analysis-name"
                placeholder="e.g., Traffic Incident, System Redesign"
                value={analysisName}
                onChange={e => setAnalysisName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedType(null);
                setAnalysisName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAnalysis} disabled={!analysisName.trim()}>
              Create Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewAnalysisButton;
