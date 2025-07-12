import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DocumentTextIcon, 
  CubeTransparentIcon,
  ShieldExclamationIcon,
  BeakerIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  CommandLineIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { APP_TITLE, CAST_STEPS, STPA_STEPS } from '@/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useProjects } from '@/contexts/ProjectsContext';
import { AnalysisType } from '@/types';
import { FeedbackContainer } from '../shared/FeedbackNotification';
import AnalysisStatusIndicator from '../shared/AnalysisStatusIndicator';
import ProjectSwitcher from '../projects/ProjectSwitcher';
import NewAnalysisButton from '../projects/NewAnalysisButton';
import EmptyStateView from '../projects/EmptyStateView';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import Button from '../shared/Button';
import { Dock, DockIcon } from '@/src/components/magicui/dock';

const webLogo = '/weblogo.webp';

// Icon mapping for steps
const stepIcons: Record<string, React.ComponentType<any>> = {
  '/cast/step2': DocumentTextIcon,
  '/stpa/step2': DocumentTextIcon,
  '/analysis/step3': CubeTransparentIcon,
  '/analysis/step4': ShieldExclamationIcon,
  '/analysis/step5': BeakerIcon,
  '/analysis/step6': ShieldCheckIcon,
  '/analysis/step7': DocumentChartBarIcon,
};

// Dock tools configuration for each step
const dockToolsConfig: Record<string, Array<{ icon: React.ComponentType<any>; label: string; action: string }>> = {
  '/analysis/step3': [
    { icon: CubeTransparentIcon, label: 'Add Controller', action: 'add-controller' },
    { icon: ArrowPathIcon, label: 'Add Connection', action: 'add-connection' },
    { icon: DocumentTextIcon, label: 'Import', action: 'import' },
  ],
  '/analysis/step4': [
    { icon: ShieldExclamationIcon, label: 'Add UCA', action: 'add-uca' },
    { icon: BeakerIcon, label: 'Analyze', action: 'analyze' },
    { icon: DocumentChartBarIcon, label: 'Export', action: 'export' },
  ],
};

const EnterpriseLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisSession, setCurrentStep, resetAnalysis, castStep2SubStep } = useAnalysis();
  const { currentProject, deleteAnalysis, selectAnalysis, updateAnalysis } = useProjects();
  const [commandOpen, setCommandOpen] = useState(false);
  const [, setSidebarOpen] = useState(true);
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState('components');
  const [expandedAnalyses, setExpandedAnalyses] = useState<Set<string>>(new Set());
  const [renamingAnalysisId, setRenamingAnalysisId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Listen for workspace section changes to keep sidebar in sync
  useEffect(() => {
    const handleWorkspaceSectionChange = (event: CustomEvent) => {
      setActiveWorkspaceSection(event.detail.section);
    };

    window.addEventListener('workspace-section-change', handleWorkspaceSectionChange as EventListener);
    
    // Set initial state from localStorage if available
    if (location.pathname === '/analysis/step3') {
      try {
        const saved = localStorage.getItem('control-structure-workspace-state');
        if (saved) {
          const state = JSON.parse(saved);
          setActiveWorkspaceSection(state.activeSection || 'components');
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    return () => {
      window.removeEventListener('workspace-section-change', handleWorkspaceSectionChange as EventListener);
    };
  }, [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') {
          e.preventDefault();
          setCommandOpen(true);
        } else if (e.key === 'b') {
          e.preventDefault();
          setSidebarOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarOpen]);

  // No longer redirect to /start - we handle empty state in the layout itself

  const steps = analysisSession?.analysisType === AnalysisType.CAST ? CAST_STEPS : STPA_STEPS;
  const currentStepIndex = analysisSession ? steps.findIndex(step => location.pathname.startsWith(step.path)) : -1;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const dockTools = dockToolsConfig[location.pathname] || [];

  const handleDeleteAnalysis = () => {
    if (analysisSession && currentProject) {
      if (window.confirm(`Are you sure you want to delete this ${analysisSession.analysisType} analysis? This action cannot be undone.`)) {
        deleteAnalysis(currentProject.id, analysisSession.id);
        resetAnalysis();
        navigate('/');
      }
    }
  };

  const handleStepNavigation = (path: string) => {
    setCurrentStep(path);
    navigate(path);
    setCommandOpen(false);
  };

  const handleDockAction = (action: string) => {
    // Emit custom events for dock actions
    window.dispatchEvent(new CustomEvent('dock-action', { detail: { action } }));
  };

  const toggleAnalysisExpanded = (analysisId: string) => {
    setExpandedAnalyses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId);
      } else {
        newSet.add(analysisId);
      }
      return newSet;
    });
  };

  const handleRenameAnalysis = (analysisId: string, newTitle: string) => {
    if (currentProject && newTitle.trim()) {
      updateAnalysis(currentProject.id, analysisId, { title: newTitle.trim() });
      setRenamingAnalysisId(null);
      setRenameValue('');
    }
  };

  const handleDeleteAnalysisFromMenu = (analysisId: string) => {
    if (currentProject) {
      const analysis = currentProject.analyses.find(a => a.id === analysisId);
      if (analysis && window.confirm(`Are you sure you want to delete "${analysis.title}"? This action cannot be undone.`)) {
        deleteAnalysis(currentProject.id, analysisId);
        if (analysisSession?.id === analysisId) {
          resetAnalysis();
          navigate('/');
        }
      }
    }
  };

  return (
    <FeedbackContainer>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-black dark:via-neutral-950 dark:to-neutral-900">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-sky-100/10 to-transparent dark:from-sky-900/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-100/10 to-transparent dark:from-purple-900/5 rounded-full blur-3xl" />
        </div>

        <SidebarProvider>
          <div className="flex h-screen relative w-full">
            {/* Modern Sidebar */}
            <Sidebar variant="inset">
              <SidebarHeader>
                <div className="mb-2">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="lg" asChild>
                        <a href="#">
                          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                            <img src={webLogo} alt="Logo" className="h-5 w-5" />
                          </div>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{APP_TITLE}</span>
                            <span className="truncate text-xs">Created by MalmquistSafety</span>
                          </div>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </div>
                <ProjectSwitcher />
              </SidebarHeader>
              
              <SidebarContent>
                {/* Project Analyses */}
                {currentProject && (
                  <SidebarGroup>
                    <div className="flex items-center justify-between">
                      <SidebarGroupLabel>Analyses</SidebarGroupLabel>
                      <NewAnalysisButton />
                    </div>
                    <SidebarMenu>
                      {currentProject.analyses.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No analyses yet
                        </div>
                      ) : (
                        currentProject.analyses.map((analysis) => {
                          const isExpanded = expandedAnalyses.has(analysis.id);
                          const analysisSteps = analysis.analysisType === AnalysisType.CAST ? CAST_STEPS : STPA_STEPS;
                          const isSelected = analysisSession?.id === analysis.id;
                          
                          return (
                            <div key={analysis.id}>
                              <SidebarMenuItem className="group/item">
                                {renamingAnalysisId === analysis.id ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleRenameAnalysis(analysis.id, renameValue);
                                    }}
                                    className="flex items-center px-2 py-1.5 gap-2"
                                  >
                                    <input
                                      type="text"
                                      value={renameValue}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onBlur={() => {
                                        setRenamingAnalysisId(null);
                                        setRenameValue('');
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          setRenamingAnalysisId(null);
                                          setRenameValue('');
                                        }
                                      }}
                                      className="flex-1 bg-transparent border-b border-sidebar-border focus:outline-none focus:border-sidebar-accent text-sm"
                                      autoFocus
                                    />
                                  </form>
                                ) : (
                                  <>
                                    <SidebarMenuButton
                                      onClick={() => {
                                        if (!isSelected) {
                                          selectAnalysis(analysis.id);
                                          // Auto-expand when selecting
                                          if (!isExpanded) {
                                            toggleAnalysisExpanded(analysis.id);
                                          }
                                          // Navigate to the current step of the analysis
                                          navigate(analysis.currentStep || (analysis.analysisType === AnalysisType.CAST ? CAST_STEPS[0].path : STPA_STEPS[0].path));
                                        }
                                      }}
                                      isActive={isSelected}
                                      className="justify-between"
                                    >
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleAnalysisExpanded(analysis.id);
                                          }}
                                          className="p-0.5 hover:bg-sidebar-accent rounded"
                                        >
                                          {isExpanded ? (
                                            <ChevronDownIcon className="w-3 h-3" />
                                          ) : (
                                            <ChevronRightIcon className="w-3 h-3" />
                                          )}
                                        </button>
                                        <span className="truncate">
                                          {analysis.title} ({analysis.analysisType})
                                        </span>
                                      </div>
                                    </SidebarMenuButton>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <SidebarMenuAction>
                                          <EllipsisVerticalIcon className="w-4 h-4" />
                                        </SidebarMenuAction>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" side="right">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setRenamingAnalysisId(analysis.id);
                                            setRenameValue(analysis.title);
                                          }}
                                        >
                                          <PencilIcon className="w-4 h-4 mr-2" />
                                          Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDeleteAnalysisFromMenu(analysis.id)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <TrashIcon className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
                              </SidebarMenuItem>
                              
                              {isExpanded && (
                                <SidebarMenuSub>
                                  {analysisSteps.map((step, index) => {
                                    const Icon = stepIcons[step.path] || DocumentTextIcon;
                                    const isCurrent = currentStepIndex === index;
                                    const isCompleted = currentStepIndex > index;
                                    const isCastScopeAndLosses = step.path === '/cast/step2';
                                    const isStructureAndActions = step.path === '/analysis/step3';
                                    
                                    return (
                                      <div key={step.path}>
                                        <SidebarMenuSubItem>
                                          <SidebarMenuSubButton
                                            onClick={() => {
                                              if (!isSelected) {
                                                selectAnalysis(analysis.id);
                                              }
                                              handleStepNavigation(step.path);
                                            }}
                                            isActive={isCurrent && isSelected}
                                          >
                                            <Icon className="w-3 h-3" />
                                            <span>{step.shortTitle}</span>
                                            {isCompleted && isSelected && (
                                              <div className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              </div>
                                            )}
                                          </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        
                                        {/* CAST Step 2 Sub-steps */}
                                        {isCastScopeAndLosses && isCurrent && isSelected && (
                                          <div className="ml-6">
                                            {['Scope', 'Events', 'Losses', 'Hazards', 'Constraints'].map((substep, subIndex) => (
                                              <SidebarMenuSubItem key={substep}>
                                                <SidebarMenuSubButton
                                                  onClick={() => {
                                                    if (!isSelected) {
                                                      selectAnalysis(analysis.id);
                                                    }
                                                    handleStepNavigation(step.path);
                                                    window.dispatchEvent(new CustomEvent('cast-substep-change', { 
                                                      detail: { substep: subIndex } 
                                                    }));
                                                  }}
                                                  isActive={castStep2SubStep === subIndex && isSelected}
                                                  size="sm"
                                                >
                                                  {substep}
                                                </SidebarMenuSubButton>
                                              </SidebarMenuSubItem>
                                            ))}
                                          </div>
                                        )}
                                        
                                        {/* Structure & Actions Sub-steps */}
                                        {isStructureAndActions && isCurrent && isSelected && (
                                          <div className="ml-6">
                                            {[
                                              { id: 'components', title: 'Components' },
                                              { id: 'controllers', title: 'Controllers' },
                                              { id: 'control-paths', title: 'Control Paths' },
                                              { id: 'feedback-paths', title: 'Feedback Paths' },
                                              { id: 'communication', title: 'Communication' }
                                            ].map((section) => (
                                              <SidebarMenuSubItem key={section.id}>
                                                <SidebarMenuSubButton
                                                  onClick={() => {
                                                    if (!isSelected) {
                                                      selectAnalysis(analysis.id);
                                                    }
                                                    handleStepNavigation(step.path);
                                                    setActiveWorkspaceSection(section.id);
                                                    window.dispatchEvent(new CustomEvent('workspace-section-change', { 
                                                      detail: { section: section.id } 
                                                    }));
                                                  }}
                                                  isActive={activeWorkspaceSection === section.id && isSelected}
                                                  size="sm"
                                                >
                                                  {section.title}
                                                </SidebarMenuSubButton>
                                              </SidebarMenuSubItem>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </SidebarMenuSub>
                              )}
                            </div>
                          );
                        })
                      )}
                    </SidebarMenu>
                  </SidebarGroup>
                )}


                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                  <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => setCommandOpen(true)}>
                        <CommandLineIcon className="size-4" />
                        <span>Command Palette</span>
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          <span className="text-xs">⌘</span>K
                        </kbd>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
              </SidebarContent>
              
              <SidebarFooter>
                {analysisSession && (
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={handleDeleteAnalysis}
                        className="text-red-600 hover:text-red-700 data-[state=open]:bg-red-50 data-[state=open]:text-red-700 dark:data-[state=open]:bg-red-900/20"
                      >
                        <ArrowPathIcon className="size-4" />
                        <span>Delete Analysis</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                )}
              </SidebarFooter>
            </Sidebar>

            {/* Main Content */}
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {currentStep?.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Step {currentStepIndex + 1} of {steps.length}
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => setCommandOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <CommandLineIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm">⌘K</span>
                  </Button>
                </div>
              </header>
              
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Page Content */}
                {analysisSession ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={location.pathname}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex-1 bg-black overflow-auto"
                    >
                      <div className="h-full p-6 md:p-8 lg:p-10">
                        <Outlet />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="flex-1 bg-white dark:bg-neutral-950 overflow-auto">
                    <EmptyStateView />
                  </div>
                )}

              {/* Dynamic Dock */}
              {dockTools.length > 0 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
                  <Dock 
                    iconSize={48} 
                    iconMagnification={60} 
                    iconDistance={120}
                    className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl"
                  >
                    {dockTools.map((tool, index) => (
                      <DockIcon
                        key={index}
                        onClick={() => handleDockAction(tool.action)}
                        className="bg-white/50 dark:bg-neutral-800/50 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
                      >
                        <tool.icon className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                      </DockIcon>
                    ))}
                  </Dock>
                </div>
              )}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>

        {/* Command Palette */}
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Search for commands..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            {analysisSession && (
              <CommandGroup heading="Navigation">
                {steps.map((step, index) => {
                  const Icon = stepIcons[step.path] || DocumentTextIcon;
                  return (
                    <CommandItem
                      key={step.path}
                      onSelect={() => handleStepNavigation(step.path)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span>{step.title}</span>
                      <span className="ml-auto text-xs text-neutral-500">Step {index + 1}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            
            <CommandSeparator />
            
            <CommandGroup heading="Actions">
              {analysisSession && (
                <CommandItem onSelect={handleDeleteAnalysis}>
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  <span>Delete Analysis</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        {/* Analysis Status Indicator */}
        <AnalysisStatusIndicator />
      </div>
    </FeedbackContainer>
  );
};

export default EnterpriseLayout;