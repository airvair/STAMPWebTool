import React, { useState, useMemo } from 'react';
import { useAnalysisContext } from '@/context/AnalysisContext';
import { UnsafeControlAction, UCCA, Controller, ControlAction } from '@/types/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import UCANavigator from './UCANavigator';
import UCAWorkspace from './UCAWorkspace';
import UCAEditor from './UCAEditor';
import UCCAWorkspace from './UCCAWorkspace';

const UnsafeControlActions: React.FC = () => {
  const { controllers, controlActions, ucas, uccas } = useAnalysisContext();
  
  // UI State
  const [selectedController, setSelectedController] = useState<string | null>(null);
  const [selectedControlAction, setSelectedControlAction] = useState<string | null>(null);
  const [selectedUCA, setSelectedUCA] = useState<UnsafeControlAction | null>(null);
  const [selectedUCCA, setSelectedUCCA] = useState<UCCA | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ucas' | 'uccas'>('ucas');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleCreateUCA = () => {
    setSelectedUCA(null);
    setIsEditorOpen(true);
  };

  const handleEditUCA = (uca: UnsafeControlAction) => {
    setSelectedUCA(uca);
    setIsEditorOpen(true);
  };

  const handleCreateUCCA = () => {
    setSelectedUCCA(null);
    setIsEditorOpen(true);
  };

  const handleEditUCCA = (ucca: UCCA) => {
    setSelectedUCCA(ucca);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedUCA(null);
    setSelectedUCCA(null);
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
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Editor Sheet */}
      {activeTab === 'ucas' && (
        <UCAEditor
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          uca={selectedUCA}
          selectedController={selectedController}
          selectedControlAction={selectedControlAction}
          controllers={controllers}
          controlActions={controlActions}
        />
      )}

      {activeTab === 'uccas' && isEditorOpen && (
        <div className="w-96 border-l bg-white dark:bg-gray-950">
          {/* UCCA Editor will be implemented */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">UCCA Editor</h3>
            <p className="text-gray-500">Editor for unsafe combinations of control actions coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnsafeControlActions;