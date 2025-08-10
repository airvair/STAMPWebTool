import React, { useState, useMemo, useEffect } from 'react';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { UnsafeControlAction, ControlAction, UCAType } from '@/types/types';
import { UCAEditor, UCANavigator, UCAWorkspace } from '../ucas';
import { UCCAs } from '../uccas';

/**
 * Main orchestrator component for Unsafe Control Actions (UCAs) and UCCAs
 * Manages the display and interaction between UCA and UCCA subsystems
 */
const UnsafeControlActionsOrchestrator: React.FC = () => {
  const { controllers, controlActions, ucas, notApplicableStatuses } = useAnalysisContext();

  // UI State Management
  const [selectedController, setSelectedController] = useState<string | null>(null);
  const [selectedControlAction, setSelectedControlAction] = useState<string | null>(null);
  const [selectedUCA, setSelectedUCA] = useState<UnsafeControlAction | null>(null);
  const [selectedUCAType, setSelectedUCAType] = useState<UCAType | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('ucas');

  // Editor-specific state (for matrix-provided values)
  const [editorController, setEditorController] = useState<string | null>(null);
  const [editorControlAction, setEditorControlAction] = useState<string | null>(null);

  // Listen for section changes from sidebar navigation
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      setActiveSection(event.detail.section);
    };

    window.addEventListener('uca-section-change', handleSectionChange as EventListener);

    return () => {
      window.removeEventListener('uca-section-change', handleSectionChange as EventListener);
    };
  }, []);

  // Filter control actions based on selected controller
  const filteredControlActions = useMemo(() => {
    if (!selectedController) return controlActions;
    return controlActions.filter(ca => ca.controllerId === selectedController);
  }, [controlActions, selectedController]);

  // Filter UCAs based on selection criteria
  const filteredUCAs = useMemo(() => {
    let filtered = ucas;

    if (selectedController) {
      filtered = filtered.filter(uca => uca.controllerId === selectedController);
    }

    if (selectedControlAction) {
      filtered = filtered.filter(uca => uca.controlActionId === selectedControlAction);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        uca =>
          uca.description.toLowerCase().includes(query) ||
          uca.context.toLowerCase().includes(query) ||
          uca.code.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [ucas, selectedController, selectedControlAction, searchQuery]);

  // Handler for creating new UCA
  const handleCreateUCA = (ucaType?: UCAType, controllerId?: string, controlActionId?: string) => {
    setSelectedUCA(null);
    setSelectedUCAType(ucaType || null);
    setEditorController(controllerId || null);
    setEditorControlAction(controlActionId || null);
    setIsEditorOpen(true);
  };

  // Handler for editing existing UCA
  const handleEditUCA = (uca: UnsafeControlAction) => {
    setSelectedUCA(uca);
    setIsEditorOpen(true);
  };

  // Handler for closing the editor
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedUCA(null);
    setSelectedUCAType(null);
    setEditorController(null);
    setEditorControlAction(null);
  };

  // Render UCCAs component if that section is active
  if (activeSection === 'uccas') {
    return <UCCAs />;
  }

  // Render the main UCA workspace
  return (
    <div className="flex h-full">
      {/* Left Panel - Control Structure Navigator */}
      <div className="w-80 border-r bg-gray-50/50 dark:bg-gray-950/20">
        <UCANavigator
          controllers={controllers}
          controlActions={controlActions}
          selectedController={selectedController}
          selectedControlAction={selectedControlAction}
          onSelectController={setSelectedController}
          onSelectControlAction={setSelectedControlAction}
          ucaCoverage={ucas}
          notApplicableStatuses={notApplicableStatuses}
        />
      </div>

      {/* Center Panel - Main Workspace */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col">
          <div className="border-b px-3 pt-3 lg:px-6 lg:pt-6">
            <h2 className="mb-4 text-lg font-semibold">Unsafe Control Actions</h2>
          </div>

          <UCAWorkspace
            ucas={filteredUCAs}
            controllers={controllers}
            controlActions={filteredControlActions}
            selectedController={selectedController}
            selectedControlAction={selectedControlAction}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateUCA={handleCreateUCA}
            onEditUCA={handleEditUCA}
            onSelectControlAction={setSelectedControlAction}
          />
        </div>
      </div>

      {/* Right Panel - Editor Sheet */}
      {controllers && controlActions && (
        <UCAEditor
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          uca={selectedUCA}
          selectedController={editorController || selectedController}
          selectedControlAction={editorControlAction || selectedControlAction}
          preselectedUCAType={selectedUCAType}
          controllers={controllers || []}
          controlActions={controlActions || []}
        />
      )}
    </div>
  );
};

export default UnsafeControlActionsOrchestrator;
