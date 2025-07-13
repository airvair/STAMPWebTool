import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CubeTransparentIcon,
  ShieldExclamationIcon,
  BeakerIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  CommandLineIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import Sortable from 'sortablejs';
import { AnimatedCollapsible, AnimatedCollapsibleItem, AnimatedChevron } from '@/components/ui/animated-collapsible';
import { AnimatedSortableItem, useSortableAnimation } from '@/components/ui/animated-sortable-item';
import { APP_TITLE, CAST_STEPS, STPA_STEPS } from '@/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useProjects } from '@/contexts/ProjectsContext';
import { AnalysisType } from '@/types';
import { FeedbackContainer } from '../shared/FeedbackNotification';
import AnalysisStatusIndicator from '../shared/AnalysisStatusIndicator';
import ProjectSwitcher from '../projects/ProjectSwitcher';
import NewAnalysisButton from '../projects/NewAnalysisButton';
import EmptyStateView from '../projects/EmptyStateView';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { exportAnalysisAsJSON, exportAnalysisAsPDF, exportAnalysisAsDOCX } from '@/utils/reportExport';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
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
  const analysisData = useAnalysis();
  const { analysisSession, setCurrentStep, resetAnalysis, castStep2SubStep } = analysisData;
  const { 
    currentProject, 
    deleteAnalysis, 
    selectAnalysis, 
    updateAnalysis,
    reorderAnalyses
  } = useProjects();
  const [commandOpen, setCommandOpen] = useState(false);
  const [, setSidebarOpen] = useState(true);
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState('components');
  const [expandedAnalyses, setExpandedAnalyses] = useState<Set<string>>(new Set());
  const [renamingAnalysisId, setRenamingAnalysisId] = useState<string | null>(null);
  const analysesListRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteAnalysisDialog, setDeleteAnalysisDialog] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<{id: string, title: string} | null>(null);
  const { handleDragStart, handleDragEnd, isDragging } = useSortableAnimation();


  // Automatically expand the analysis dropdown when a new analysis is selected
  useEffect(() => {
    if (analysisSession?.id && !expandedAnalyses.has(analysisSession.id)) {
      setExpandedAnalyses(prev => new Set(prev).add(analysisSession.id));
    }
  }, [analysisSession?.id]);

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

  // Initialize Sortable for analyses list
  useEffect(() => {
    if (!analysesListRef.current || !currentProject?.analyses?.length) return;

    sortableRef.current = Sortable.create(analysesListRef.current, {
      animation: 0, // Disable built-in animation - we use framer-motion
      ghostClass: 'sortable-ghost', // Style ghost element
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag', // Keep visible during drag
      forceFallback: true, // Use custom drag implementation
      fallbackClass: 'sortable-fallback',
      fallbackOnBody: false,
      fallbackTolerance: 0,
      disabled: renamingAnalysisId !== null,
      filter: '.dropdown-trigger, .chevron-button, [data-sidebar="menu-action"]',
      preventOnFilter: false,
      onStart: (evt) => {
        const draggedId = evt.item.getAttribute('data-id');
        if (draggedId) {
          handleDragStart(draggedId);
          if (expandedAnalyses.has(draggedId)) {
            // Collapse the dragged item if it's expanded
            setExpandedAnalyses(prev => {
              const newSet = new Set(prev);
              newSet.delete(draggedId);
              return newSet;
            });
          }
        }
      },
      onEnd: (evt) => {
        handleDragEnd();
        
        if (evt.oldIndex === undefined || evt.newIndex === undefined || evt.oldIndex === evt.newIndex) return;
        
        // Get all analysis IDs in their new order
        const newOrder = Array.from(analysesListRef.current!.children)
          .map(child => child.getAttribute('data-id'))
          .filter(Boolean) as string[];
        
        // Call the reorder function
        if (currentProject?.id) {
          reorderAnalyses(currentProject.id, newOrder);
        }
      },
    });

    return () => {
      sortableRef.current?.destroy();
    };
  }, [currentProject?.analyses?.length, expandedAnalyses, reorderAnalyses, renamingAnalysisId, handleDragStart, handleDragEnd]);

  // No longer redirect to /start - we handle empty state in the layout itself

  const steps = analysisSession?.analysisType === AnalysisType.CAST ? CAST_STEPS : STPA_STEPS;
  const currentStepIndex = analysisSession ? steps.findIndex(step => location.pathname.startsWith(step.path)) : -1;
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const dockTools = dockToolsConfig[location.pathname] || [];

  const handleDeleteAnalysis = () => {
    if (analysisSession && currentProject) {
      deleteAnalysis(currentProject.id, analysisSession.id);
      resetAnalysis();
      navigate('/');
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
      if (analysis) {
        setAnalysisToDelete({ id: analysisId, title: analysis.title });
        setDeleteAnalysisDialog(true);
      }
    }
  };

  const confirmDeleteAnalysis = () => {
    if (currentProject && analysisToDelete) {
      deleteAnalysis(currentProject.id, analysisToDelete.id);
      if (analysisSession?.id === analysisToDelete.id) {
        resetAnalysis();
        navigate('/');
      }
      setAnalysisToDelete(null);
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
                          </div> C
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
                        <div ref={analysesListRef} className="analyses-sortable-container">
                          {/* Render all analyses */}
                          {currentProject.analyses.map((analysis) => {
                            const isExpanded = expandedAnalyses.has(analysis.id);
                            const analysisSteps = analysis.analysisType === AnalysisType.CAST ? CAST_STEPS : STPA_STEPS;
                            const isSelected = analysisSession?.id === analysis.id;
                            
                            return (
                              <AnimatedSortableItem 
                                key={analysis.id}
                                id={analysis.id}
                                index={currentProject.analyses.indexOf(analysis)}
                                isDragging={isDragging(analysis.id)}
                              >
                              <ContextMenu>
                                <ContextMenuTrigger asChild>
                                  <SidebarMenuItem>
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
                                          // Navigate to the current step of the analysis
                                          navigate(analysis.currentStep || (analysis.analysisType === AnalysisType.CAST ? CAST_STEPS[0].path : STPA_STEPS[0].path));
                                        }
                                      }}
                                      isActive={isSelected}
                                      className="flex items-center py-2 h-auto min-h-[2rem] group"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleAnalysisExpanded(analysis.id);
                                          }}
                                          className="chevron-button p-0.5 hover:bg-sidebar-accent rounded transition-colors"
                                        >
                                          <AnimatedChevron isOpen={isExpanded} className="w-3 h-3" />
                                        </button>
                                        <div className="flex-1">
                                          <span className="block line-clamp-2 py-0.5">
                                            {analysis.title}
                                          </span>
                                        </div>
                                      </div>
                                      <span className={`text-xs font-bold ml-2 flex-shrink-0 ${
                                        analysis.analysisType === AnalysisType.CAST ? 'text-pink-500' : 'text-blue-400'
                                      }`}>{analysis.analysisType}</span>
                                    </SidebarMenuButton>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <SidebarMenuAction className="!top-1/2 !-translate-y-1/2 dropdown-trigger">
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
                                          onClick={() => {
                                            if (isSelected) {
                                              // If this analysis is already selected, export it
                                              exportAnalysisAsJSON(analysisData);
                                            } else {
                                              // Otherwise, select it first, then export after a delay
                                              selectAnalysis(analysis.id);
                                              setTimeout(() => {
                                                // The analysis data will be loaded after selection
                                                exportAnalysisAsJSON(analysisData);
                                              }, 500);
                                            }
                                          }}
                                        >
                                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                          Download as JSON
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            if (!isSelected) {
                                              selectAnalysis(analysis.id);
                                            }
                                            exportAnalysisAsPDF();
                                          }}
                                        >
                                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                          Download as PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            if (!isSelected) {
                                              selectAnalysis(analysis.id);
                                            }
                                            exportAnalysisAsDOCX();
                                          }}
                                        >
                                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                          Download as DOCX
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
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem
                                    onClick={() => {
                                      setRenamingAnalysisId(analysis.id);
                                      setRenameValue(analysis.title);
                                    }}
                                  >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Rename
                                  </ContextMenuItem>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem
                                    onClick={() => {
                                      if (isSelected) {
                                        exportAnalysisAsJSON(analysisData);
                                      } else {
                                        selectAnalysis(analysis.id);
                                        setTimeout(() => {
                                          exportAnalysisAsJSON(analysisData);
                                        }, 500);
                                      }
                                    }}
                                  >
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                    Download as JSON
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => {
                                      if (!isSelected) {
                                        selectAnalysis(analysis.id);
                                      }
                                      exportAnalysisAsPDF();
                                    }}
                                  >
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                    Download as PDF
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => {
                                      if (!isSelected) {
                                        selectAnalysis(analysis.id);
                                      }
                                      exportAnalysisAsDOCX();
                                    }}
                                  >
                                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                    Download as DOCX
                                  </ContextMenuItem>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem
                                    onClick={() => handleDeleteAnalysisFromMenu(analysis.id)}
                                    variant="destructive"
                                  >
                                    <TrashIcon className="w-4 h-4 mr-2" />
                                    Delete
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                              
                              <AnimatedCollapsible isOpen={isExpanded} className="ml-3.5">
                                <SidebarMenuSub
                                  showProgress={isSelected}
                                  useAbsoluteProgress={true}
                                  targetStepIndex={isSelected ? currentStepIndex : -1}
                                >
                                  {analysisSteps.map((step, index) => {
                                    const Icon = stepIcons[step.path] || DocumentTextIcon;
                                    const isCurrent = currentStepIndex === index;
                                    const isCompleted = currentStepIndex > index;
                                    const isCastScopeAndLosses = step.path === '/cast/step2';
                                    const isStructureAndActions = step.path === '/analysis/step3';
                                    
                                    return (
                                      <AnimatedCollapsibleItem key={step.path}>
                                        <SidebarMenuSubItem data-step-index={index}>
                                          {isCompleted && isSelected ? (
                                            <SidebarMenuSubButton
                                              onClick={() => {
                                                if (!isSelected) {
                                                  selectAnalysis(analysis.id);
                                                }
                                                handleStepNavigation(step.path);
                                              }}
                                              isActive={isCurrent && isSelected}
                                              className="flex items-center gap-2 w-full"
                                            >
                                              <Icon className="w-3 h-3 shrink-0 text-green-600 dark:text-green-400" />
                                              <div className="flex-1 whitespace-nowrap"><span>{step.shortTitle}</span></div>
                                            </SidebarMenuSubButton>
                                          ) : (
                                            <SidebarMenuSubButton
                                              onClick={() => {
                                                if (!isSelected) {
                                                  selectAnalysis(analysis.id);
                                                }
                                                handleStepNavigation(step.path);
                                              }}
                                              isActive={isCurrent && isSelected}
                                              className="flex items-center gap-2 w-full"
                                            >
                                              <Icon className="w-3 h-3 shrink-0" />
                                              <div className="flex-1 whitespace-nowrap"><span>{step.shortTitle}</span></div>
                                            </SidebarMenuSubButton>
                                          )}
                                        </SidebarMenuSubItem>
                                        
                                        {/* CAST Step 2 Sub-steps */}
                                        <AnimatedCollapsible isOpen={isCastScopeAndLosses && isCurrent && isSelected} className="ml-3">
                                          <SidebarMenuSub
                                            showProgress={true}
                                            totalSteps={5}
                                            completedSteps={castStep2SubStep + 1}
                                            currentStep={castStep2SubStep}
                                          >
                                            {['Scope', 'Events', 'Losses', 'Hazards', 'Constraints'].map((substep, subIndex) => (
                                              <AnimatedCollapsibleItem key={substep}>
                                                <SidebarMenuSubItem>
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
                                              </AnimatedCollapsibleItem>
                                            ))}
                                          </SidebarMenuSub>
                                        </AnimatedCollapsible>
                                        
                                        {/* Structure & Actions Sub-steps */}
                                        <AnimatedCollapsible isOpen={isStructureAndActions && isCurrent && isSelected} className="ml-3">
                                          <SidebarMenuSub
                                            showProgress={true}
                                            totalSteps={5}
                                            completedSteps={activeWorkspaceSection === 'components' ? 1 :
                                                          activeWorkspaceSection === 'controllers' ? 2 :
                                                          activeWorkspaceSection === 'control-paths' ? 3 :
                                                          activeWorkspaceSection === 'feedback-paths' ? 4 :
                                                          activeWorkspaceSection === 'communication' ? 5 : 0}
                                            currentStep={activeWorkspaceSection === 'components' ? 0 :
                                                        activeWorkspaceSection === 'controllers' ? 1 :
                                                        activeWorkspaceSection === 'control-paths' ? 2 :
                                                        activeWorkspaceSection === 'feedback-paths' ? 3 :
                                                        activeWorkspaceSection === 'communication' ? 4 : -1}
                                          >
                                            {[
                                              { id: 'components', title: 'Components' },
                                              { id: 'controllers', title: 'Controllers' },
                                              { id: 'control-paths', title: 'Control Paths' },
                                              { id: 'feedback-paths', title: 'Feedback Paths' },
                                              { id: 'communication', title: 'Communication' }
                                            ].map((section) => (
                                              <AnimatedCollapsibleItem key={section.id}>
                                                <SidebarMenuSubItem>
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
                                              </AnimatedCollapsibleItem>
                                            ))}
                                          </SidebarMenuSub>
                                        </AnimatedCollapsible>
                                      </AnimatedCollapsibleItem>
                                    );
                                  })}
                                </SidebarMenuSub>
                              </AnimatedCollapsible>
                              </AnimatedSortableItem>
                            );
                          })}
                        </div>
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
                  <div className="flex-1 bg-white dark:bg-neutral-950 overflow-auto">
                    <div className="h-full p-6 md:p-8 lg:p-10">
                      <Outlet />
                    </div>
                  </div>
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
        
        <ConfirmationDialog
          open={deleteAnalysisDialog}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteAnalysisDialog(false);
              setAnalysisToDelete(null);
            }
          }}
          title="Confirm Analysis Deletion"
          description={analysisToDelete ? `You are about to permanently delete the analysis "${analysisToDelete.title}". This action cannot be undone and all associated data will be permanently removed from the system.` : ''}
          confirmText="Delete Analysis"
          cancelText="Cancel"
          onConfirm={confirmDeleteAnalysis}
          variant="destructive"
        />
        
      </div>
    </FeedbackContainer>
  );
};

export default EnterpriseLayout;