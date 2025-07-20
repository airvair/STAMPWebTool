import React, { useState, useMemo } from 'react';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { UnsafeControlAction, UCCA, Controller, ControlAction, UCAType } from '@/types/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import UCANavigator from './UCANavigator';
import UCAWorkspace from './UCAWorkspace';
import UCAEditor from './UCAEditor';
import UCCAWorkspace from './UCCAWorkspace';
import { UCCAEditor } from './UCCAEditor';
import { UCCAAlgorithmDialog } from './UCCAAlgorithmDialog';

const UnsafeControlActions: React.FC = () => {
  const { controllers, controlActions, ucas, uccas, addUCCA, updateUCCA, notApplicableStatuses } = useAnalysisContext();
  
  // UI State
  const [selectedController, setSelectedController] = useState<string | null>(null);
  const [selectedControlAction, setSelectedControlAction] = useState<string | null>(null);
  const [selectedUCA, setSelectedUCA] = useState<UnsafeControlAction | null>(null);
  const [selectedUCCA, setSelectedUCCA] = useState<UCCA | null>(null);
  const [selectedUCAType, setSelectedUCAType] = useState<UCAType | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUCCAEditorOpen, setIsUCCAEditorOpen] = useState(false);
  const [isAlgorithmDialogOpen, setIsAlgorithmDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ucas' | 'uccas'>('ucas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Store matrix-provided values separately to avoid changing navigation
  const [editorController, setEditorController] = useState<string | null>(null);
  const [editorControlAction, setEditorControlAction] = useState<string | null>(null);
  
  // Pre-selected data for UCCA creation
  const [preSelectedControllerIds, setPreSelectedControllerIds] = useState<string[]>([]);
  const [preSelectedUCCAType, setPreSelectedUCCAType] = useState<UCCAType | undefined>();

  // Filter control actions based on selected controller
  const filteredControlActions = useMemo(() => {
    if (!selectedController) return controlActions;
    return controlActions.filter(ca => ca.controllerId === selectedController);
  }, [controlActions, selectedController]);

  // Filter UCAs based on selected controller and control action
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
      filtered = filtered.filter(uca => 
        uca.description.toLowerCase().includes(query) ||
        uca.context.toLowerCase().includes(query) ||
        uca.code.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [ucas, selectedController, selectedControlAction, searchQuery]);

  // Filter UCCAs based on selected controllers
  const filteredUCCAs = useMemo(() => {
    if (!selectedController) return uccas;
    return uccas.filter(ucca => 
      ucca.involvedControllerIds.includes(selectedController)
    );
  }, [uccas, selectedController]);

  const handleCreateUCA = (ucaType?: UCAType, controllerId?: string, controlActionId?: string) => {
    setSelectedUCA(null);
    setSelectedUCAType(ucaType || null);
    // Store matrix-provided values separately without changing navigation selections
    setEditorController(controllerId || null);
    setEditorControlAction(controlActionId || null);
    setIsEditorOpen(true);
  };

  const handleEditUCA = (uca: UnsafeControlAction) => {
    setSelectedUCA(uca);
    setIsEditorOpen(true);
  };

  const handleCreateUCCA = () => {
    setSelectedUCCA(null);
    setPreSelectedControllerIds([]);
    setPreSelectedUCCAType(undefined);
    setIsUCCAEditorOpen(true);
  };

  const handleEditUCCA = (ucca: UCCA) => {
    setSelectedUCCA(ucca);
    setPreSelectedControllerIds([]);
    setPreSelectedUCCAType(undefined);
    setIsUCCAEditorOpen(true);
  };

  const handleSaveUCCA = (uccaData: Omit<UCCA, 'id' | 'code'>) => {
    if (selectedUCCA) {
      updateUCCA(selectedUCCA.id, uccaData);
    } else {
      addUCCA(uccaData);
    }
    setIsUCCAEditorOpen(false);
    setSelectedUCCA(null);
  };

  const handleImportUCCAs = (uccas: Omit<UCCA, 'id' | 'code'>[]) => {
    uccas.forEach(ucca => addUCCA(ucca));
    setIsAlgorithmDialogOpen(false);
  };

  const handleSelectUCCAFromAlgorithm = (controllerIds: string[], uccaType: UCCAType, description?: string) => {
    setSelectedUCCA(null);
    setPreSelectedControllerIds(controllerIds);
    setPreSelectedUCCAType(uccaType);
    setIsAlgorithmDialogOpen(false);
    setIsUCCAEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedUCA(null);
    setSelectedUCCA(null);
    setSelectedUCAType(null);
    setEditorController(null);
    setEditorControlAction(null);
  };

  return (
    <div className="h-full flex">
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
          uccaCoverage={uccas}
          notApplicableStatuses={notApplicableStatuses}
        />
      </div>

      {/* Center Panel - Main Workspace */}
      <div className="flex-1 flex flex-col">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'ucas' | 'uccas')}
          className="flex-1 flex flex-col"
        >
          <div className="border-b px-6 pt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="ucas" className="px-6">
                Unsafe Control Actions
              </TabsTrigger>
              <TabsTrigger value="uccas" className="px-6">
                Unsafe Combinations of Control Actions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ucas" className="flex-1 p-0 mt-0">
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
          </TabsContent>

          <TabsContent value="uccas" className="flex-1 p-0 mt-0">
            <UCCAWorkspace
              uccas={filteredUCCAs}
              controllers={controllers}
              controlActions={controlActions}
              selectedController={selectedController}
              onCreateUCCA={handleCreateUCCA}
              onEditUCCA={handleEditUCCA}
              onOpenAlgorithm={() => setIsAlgorithmDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Editor Sheet */}
      {activeTab === 'ucas' && controllers && controlActions && (
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

      {activeTab === 'uccas' && (
        <>
          <UCCAEditor
            isOpen={isUCCAEditorOpen}
            onClose={() => setIsUCCAEditorOpen(false)}
            onSave={handleSaveUCCA}
            ucca={selectedUCCA}
            preSelectedControllerIds={preSelectedControllerIds}
            preSelectedUCCAType={preSelectedUCCAType}
          />
          <UCCAAlgorithmDialog
            isOpen={isAlgorithmDialogOpen}
            onClose={() => setIsAlgorithmDialogOpen(false)}
            onImport={handleImportUCCAs}
            onSelectUCCA={handleSelectUCCAFromAlgorithm}
          />
        </>
      )}
    </div>
  );
};

export default UnsafeControlActions;