import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CubeTransparentIcon,
  ShieldExclamationIcon,
  BeakerIcon,
  ShieldCheckIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { ChevronsUpDown } from 'lucide-react';
import Sortable from 'sortablejs';
import { AnimatedCollapsible, AnimatedCollapsibleItem, AnimatedChevron } from '@/components/ui/animated-collapsible';
import { APP_TITLE } from '@/utils/constants';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useProjects } from '@/context/ProjectsContext';
import { useNavigation, AnalysisStep } from '@/context/NavigationContext';
import { AnalysisType } from '@/types/types';
import { FeedbackContainer } from '@/components/shared/FeedbackNotification';
import { ProjectSwitcher, NewAnalysisButton, EmptyStateView } from '@/features/projects';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { exportAnalysisAsJSON, exportAnalysisAsPDF, exportAnalysisAsDOCX } from '@/utils/reportExport';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
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
import { Skeleton } from '@/components/ui/skeleton';

import webLogo from '@/assets/weblogo.webp';

// Icon mapping for steps
const stepIcons: Record<AnalysisStep, React.ComponentType<any>> = {
  'scope': DocumentTextIcon,
  'control-structure': CubeTransparentIcon,
  'uca': ShieldExclamationIcon,
  'scenarios': BeakerIcon,
  'requirements': ShieldCheckIcon,
};

// Step definitions for clean URLs
const ANALYSIS_STEPS: { step: AnalysisStep; title: string; shortTitle: string }[] = [
  { step: 'scope', title: 'Scope, Losses, Hazards & Constraints', shortTitle: 'Scope & Losses' },
  { step: 'control-structure', title: 'Control Structure & Actions', shortTitle: 'Structure & Actions' },
  { step: 'uca', title: 'Unsafe Control Actions (UCAs)', shortTitle: 'UCAs/UCCAs' },
  { step: 'scenarios', title: 'Causal Scenarios', shortTitle: 'Scenarios' },
  { step: 'requirements', title: 'Requirements / Mitigations', shortTitle: 'Reqs/Mitigs' },
];

const CleanEnterpriseLayout: React.FC = () => {
  const analysisData = useAnalysis();
  const { analysisSession, resetAnalysis, castStep2SubStep, setCastStep2SubStep, updateAnalysisSession } = analysisData;
  const { 
    currentProject, 
    deleteAnalysis, 
    selectAnalysis, 
    updateAnalysis,
    reorderAnalyses
  } = useProjects();
  const { currentStep, navigateToStep, resetNavigation } = useNavigation();
  const navigate = useNavigate();
  
  const [expandedAnalyses, setExpandedAnalyses] = useState<Set<string>>(new Set());
  const [renamingAnalysisId, setRenamingAnalysisId] = useState<string | null>(null);
  const analysesListRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteAnalysisDialog, setDeleteAnalysisDialog] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<{id: string, title: string} | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState('components');
  const [activeUCASection, setActiveUCASection] = useState('ucas');
  const expandedAnalysesRef = useRef<Set<string>>(expandedAnalyses);

  // Keep ref in sync with state
  useEffect(() => {
    expandedAnalysesRef.current = expandedAnalyses;
  }, [expandedAnalyses]);

  // Automatically expand the analysis dropdown when a new analysis is selected
  useEffect(() => {
    if (analysisSession?.id && !expandedAnalyses.has(analysisSession.id)) {
      setExpandedAnalyses(prev => new Set(prev).add(analysisSession.id));
    }
  }, [analysisSession?.id]);


  // Listen for workspace section changes
  useEffect(() => {
    const handleWorkspaceSectionChange = (event: CustomEvent) => {
      setActiveWorkspaceSection(event.detail.section);
    };

    const handleUCASectionChange = (event: CustomEvent) => {
      setActiveUCASection(event.detail.section);
    };

    window.addEventListener('workspace-section-change', handleWorkspaceSectionChange as EventListener);
    window.addEventListener('uca-section-change', handleUCASectionChange as EventListener);
    
    return () => {
      window.removeEventListener('workspace-section-change', handleWorkspaceSectionChange as EventListener);
      window.removeEventListener('uca-section-change', handleUCASectionChange as EventListener);
    };
  }, []);

  // Initialize Sortable for analyses list
  useEffect(() => {
    if (!analysesListRef.current || !currentProject?.analyses?.length) return;

    sortableRef.current = Sortable.create(analysesListRef.current, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      disabled: renamingAnalysisId !== null || isReordering,
      handle: '[data-sidebar="menu-button"]',
      filter: '.dropdown-trigger, .chevron-button, [data-sidebar="menu-action"]',
      preventOnFilter: false,
      onStart: (evt) => {
        document.body.classList.add('sortable-dragging');
        const draggedId = evt.item.getAttribute('data-id');
        if (draggedId && expandedAnalysesRef.current.has(draggedId)) {
          setExpandedAnalyses(prev => {
            const newSet = new Set(prev);
            newSet.delete(draggedId);
            return newSet;
          });
        }
      },
      onEnd: async (evt) => {
        document.body.classList.remove('sortable-dragging');
        
        if (evt.oldIndex === undefined || evt.newIndex === undefined || evt.oldIndex === evt.newIndex) return;
        
        setIsReordering(true);
        
        try {
          const newOrder = Array.from(analysesListRef.current!.children)
            .map(child => child.getAttribute('data-id'))
            .filter(Boolean) as string[];
          
          if (currentProject?.id) {
            await reorderAnalyses(currentProject.id, newOrder);
          }
        } finally {
          setIsReordering(false);
        }
      },
    });

    return () => {
      sortableRef.current?.destroy();
    };
  }, [currentProject?.analyses?.length, reorderAnalyses, renamingAnalysisId, isReordering]);

  const currentStepData = ANALYSIS_STEPS.find(s => s.step === currentStep);
  const currentStepIndex = ANALYSIS_STEPS.findIndex(s => s.step === currentStep);

  const handleDeleteAnalysis = () => {
    if (analysisSession && currentProject) {
      deleteAnalysis(currentProject.id, analysisSession.id);
      resetAnalysis();
      resetNavigation();
    }
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
      
      // If renaming current analysis, update URL
      if (analysisId === analysisSession?.id) {
        const projectSlug = encodeURIComponent(currentProject.name.toLowerCase().replace(/\s+/g, '-'));
        const analysisSlug = encodeURIComponent(newTitle.trim().toLowerCase().replace(/\s+/g, '-'));
        navigate(`/${projectSlug}/${analysisSlug}`);
      }
      
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
        resetNavigation();
      }
      setAnalysisToDelete(null);
    }
  };

  // Handle analysis selection with navigation
  const handleAnalysisSelect = (analysisId: string) => {
    const analysis = currentProject?.analyses.find(a => a.id === analysisId);
    if (analysis && currentProject) {
      selectAnalysis(analysisId);
      // Navigate to URL with project and analysis names
      const projectSlug = encodeURIComponent(currentProject.name.toLowerCase().replace(/\s+/g, '-'));
      const analysisSlug = encodeURIComponent(analysis.title.toLowerCase().replace(/\s+/g, '-'));
      navigate(`/${projectSlug}/${analysisSlug}`);
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
                          {currentProject.analyses.map((analysis) => {
                            const isExpanded = expandedAnalyses.has(analysis.id);
                            const isSelected = analysisSession?.id === analysis.id;
                            
                            return (
                              <div key={analysis.id} data-id={analysis.id} data-expanded={isExpanded.toString()} className="sortable-analysis-item">
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
                                            handleAnalysisSelect(analysis.id);
                                            navigateToStep('scope');
                                          }
                                        }}
                                        isActive={isSelected}
                                        className="flex items-center py-2 h-auto min-h-[2rem] group"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleAnalysisExpanded(analysis.id);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleAnalysisExpanded(analysis.id);
                                              }
                                            }}
                                            className="chevron-button p-0.5 hover:bg-sidebar-accent rounded transition-colors cursor-pointer"
                                            aria-label={isExpanded ? "Collapse" : "Expand"}
                                          >
                                            <AnimatedChevron isOpen={isExpanded} className="w-3 h-3" />
                                          </div>
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
                                                exportAnalysisAsJSON(analysisData);
                                              } else {
                                                handleAnalysisSelect(analysis.id);
                                                setTimeout(() => {
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
                                                handleAnalysisSelect(analysis.id);
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
                                                handleAnalysisSelect(analysis.id);
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
                                
                                <AnimatedCollapsible isOpen={isExpanded} className="ml-3.5">
                                  <SidebarMenuSub
                                    showProgress={isSelected}
                                    useAbsoluteProgress={true}
                                    targetStepIndex={isSelected ? currentStepIndex : -1}
                                  >
                                    {ANALYSIS_STEPS.map((step, index) => {
                                      const Icon = stepIcons[step.step] || DocumentTextIcon;
                                      const isCurrent = currentStep === step.step && isSelected;
                                      const isCompleted = currentStepIndex > index && isSelected;
                                      const isScopeStep = step.step === 'scope' && analysis.analysisType === AnalysisType.CAST;
                                      const isStructureStep = step.step === 'control-structure';
                                      const isUCAStep = step.step === 'uca';
                                      
                                      return (
                                        <AnimatedCollapsibleItem key={step.step}>
                                          <SidebarMenuSubItem data-step-index={index}>
                                            <SidebarMenuSubButton
                                              onClick={() => {
                                                if (!isSelected) {
                                                  handleAnalysisSelect(analysis.id);
                                                }
                                                navigateToStep(step.step);
                                              }}
                                              isActive={isCurrent}
                                              className="flex items-center gap-2 w-full"
                                            >
                                              <Icon className={`w-3 h-3 shrink-0 ${isCompleted ? 'text-green-600 dark:text-green-400' : ''}`} />
                                              <div className="flex-1 whitespace-nowrap">
                                                <span>{step.shortTitle}</span>
                                              </div>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                          
                                          {/* CAST Scope & Losses Sub-steps */}
                                          <AnimatedCollapsible isOpen={isScopeStep && isCurrent && isSelected} className="ml-3">
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
                                                        setCastStep2SubStep(subIndex);
                                                        window.dispatchEvent(new CustomEvent('cast-substep-change', { 
                                                          detail: { substep: subIndex } 
                                                        }));
                                                      }}
                                                      isActive={castStep2SubStep === subIndex}
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
                                          <AnimatedCollapsible isOpen={isStructureStep && isCurrent && isSelected} className="ml-3">
                                            <SidebarMenuSub
                                              showProgress={true}
                                              totalSteps={6}
                                              completedSteps={activeWorkspaceSection === 'components' ? 1 :
                                                            activeWorkspaceSection === 'controllers' ? 2 :
                                                            activeWorkspaceSection === 'control-paths' ? 3 :
                                                            activeWorkspaceSection === 'feedback-paths' ? 4 :
                                                            activeWorkspaceSection === 'failure-paths' ? 5 :
                                                            activeWorkspaceSection === 'communication' ? 6 : 0}
                                              currentStep={activeWorkspaceSection === 'components' ? 0 :
                                                          activeWorkspaceSection === 'controllers' ? 1 :
                                                          activeWorkspaceSection === 'control-paths' ? 2 :
                                                          activeWorkspaceSection === 'feedback-paths' ? 3 :
                                                          activeWorkspaceSection === 'failure-paths' ? 4 :
                                                          activeWorkspaceSection === 'communication' ? 5 : -1}
                                            >
                                              {[
                                                { id: 'components', title: 'Components' },
                                                { id: 'controllers', title: 'Controllers' },
                                                { id: 'control-paths', title: 'Control Paths' },
                                                { id: 'feedback-paths', title: 'Feedback Paths' },
                                                { id: 'failure-paths', title: 'Failure Paths' },
                                                { id: 'communication', title: 'Communication' }
                                              ].map((section) => (
                                                <AnimatedCollapsibleItem key={section.id}>
                                                  <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                      onClick={() => {
                                                        setActiveWorkspaceSection(section.id);
                                                        window.dispatchEvent(new CustomEvent('workspace-section-change', { 
                                                          detail: { section: section.id } 
                                                        }));
                                                      }}
                                                      isActive={activeWorkspaceSection === section.id}
                                                      size="sm"
                                                    >
                                                      {section.title}
                                                    </SidebarMenuSubButton>
                                                  </SidebarMenuSubItem>
                                                </AnimatedCollapsibleItem>
                                              ))}
                                            </SidebarMenuSub>
                                          </AnimatedCollapsible>
                                          
                                          {/* UCAs/UCCAs Sub-steps */}
                                          <AnimatedCollapsible isOpen={isUCAStep && isCurrent && isSelected} className="ml-3">
                                            <SidebarMenuSub
                                              showProgress={true}
                                              totalSteps={2}
                                              completedSteps={activeUCASection === 'ucas' ? 1 :
                                                            activeUCASection === 'uccas' ? 2 : 0}
                                              currentStep={activeUCASection === 'ucas' ? 0 :
                                                          activeUCASection === 'uccas' ? 1 : -1}
                                            >
                                              {[
                                                { id: 'ucas', title: 'UCAs' },
                                                { id: 'uccas', title: 'UCCAs' }
                                              ].map((section) => (
                                                <AnimatedCollapsibleItem key={section.id}>
                                                  <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                      onClick={() => {
                                                        setActiveUCASection(section.id);
                                                        window.dispatchEvent(new CustomEvent('uca-section-change', { 
                                                          detail: { section: section.id } 
                                                        }));
                                                      }}
                                                      isActive={activeUCASection === section.id}
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </SidebarMenu>
                  </SidebarGroup>
                )}

              </SidebarContent>
              
              <SidebarFooter>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton 
                          size="lg"
                          className="w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex flex-col items-start space-y-1">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                          <ChevronsUpDown className="ml-auto h-4 w-4" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="start"
                        className="w-[--radix-dropdown-menu-trigger-width]"
                      >
                        <DropdownMenuItem>
                          <CreditCardIcon className="mr-2 h-4 w-4" />
                          <span>Billing</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BellIcon className="mr-2 h-4 w-4" />
                          <span>Notifications</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </Sidebar>

            {/* Main Content */}
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {currentStepData?.title || 'Analysis'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Step {currentStepIndex + 1} of {ANALYSIS_STEPS.length}
                    </p>
                  </div>
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
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>


        
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

export default CleanEnterpriseLayout;