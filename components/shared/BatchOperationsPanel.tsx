import React, { useState, useMemo } from 'react';
import {
  BoltIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAnalysis } from '@/hooks/useAnalysis';
import {
  batchOperationsManager,
  BatchResult,
  UCAbatchCreateOptions,
  UCCAbatchCreateOptions
} from '@/utils/batchOperations';
import { UCAType, UCCAType } from '@/types';
import Button from './Button';
import Modal from './Modal';
// import Select from './Select';
import Checkbox from './Checkbox';
import Textarea from './Textarea';

interface BatchOperationsPanelProps {
  mode: 'uca' | 'ucca';
  selectedItems?: any[];
  onOperationComplete?: () => void;
}

const BatchOperationsPanel: React.FC<BatchOperationsPanelProps> = ({
  mode,
  selectedItems = [],
  onOperationComplete
}) => {
  const {
    controllers,
    controlActions,
    ucas,
    uccas,
    hazards,
    addUCA,
    addUCCA,
    updateUCA,
    // updateUCCA,
    deleteUCA,
    deleteUCCA
  } = useAnalysis();

  const [showModal, setShowModal] = useState(false);
  const [operation, setOperation] = useState<'create' | 'update' | 'delete'>('create');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchResult<any> | null>(null);

  // Batch create options
  const [selectedControllers, setSelectedControllers] = useState<string[]>([]);
  const [_selectedControlActions, _setSelectedControlActions] = useState<string[]>([]);
  const [selectedUCATypes, setSelectedUCATypes] = useState<UCAType[]>([]);
  const [selectedUCCATypes, setSelectedUCCATypes] = useState<UCCAType[]>([]);
  const [_selectedHazards, _setSelectedHazards] = useState<string[]>([]);
  const [contextTemplate, setContextTemplate] = useState('');
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);

  // Batch update options
  const [updateFields, setUpdateFields] = useState({
    context: '',
    hazardIds: [] as string[]
  });

  // Filter control actions based on selected controllers
  const availableControlActions = useMemo(() => {
    if (selectedControllers.length === 0) return controlActions;
    return controlActions.filter(ca => selectedControllers.includes(ca.controllerId));
  }, [selectedControllers, controlActions]);

  // Calculate expected items for creation
  const expectedItemCount = useMemo(() => {
    if (mode === 'uca') {
      const actionCount = _selectedControlActions.length || availableControlActions.length;
      const typeCount = selectedUCATypes.length;
      return actionCount * typeCount;
    } else {
      // UCCA: Calculate controller pairs
      const pairs = selectedControllers.length * (selectedControllers.length - 1) / 2;
      return pairs * selectedUCCATypes.length;
    }
  }, [
    mode,
    _selectedControlActions,
    availableControlActions,
    selectedUCATypes,
    selectedUCCATypes,
    selectedControllers
  ]);

  const handleBatchCreate = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      if (mode === 'uca') {
        const options: UCAbatchCreateOptions = {
          controllers: controllers.filter(c => selectedControllers.includes(c.id)),
          controlActions: _selectedControlActions.length > 0
            ? controlActions.filter(ca => _selectedControlActions.includes(ca.id))
            : availableControlActions,
          ucaTypes: selectedUCATypes,
          hazardIds: _selectedHazards,
          contextTemplate,
          autoGenerateCode,
          skipExisting
        };

        const batchResult = await batchOperationsManager.batchCreateUCAs(options, ucas);
        setResult(batchResult);

        // Add successful items to context
        batchResult.results
          .filter(r => r.success)
          .forEach(r => addUCA(r.item));

      } else {
        // UCCA batch creation
        const controllerPairs: Array<{ controller1Id: string; controller2Id: string }> = [];
        
        for (let i = 0; i < selectedControllers.length; i++) {
          for (let j = i + 1; j < selectedControllers.length; j++) {
            controllerPairs.push({
              controller1Id: selectedControllers[i],
              controller2Id: selectedControllers[j]
            });
          }
        }

        const options: UCCAbatchCreateOptions = {
          controllerPairs,
          uccaTypes: selectedUCCATypes,
          hazardIds: _selectedHazards,
          contextTemplate,
          autoGenerateCode
        };

        const batchResult = await batchOperationsManager.batchCreateUCCAs(options, uccas);
        setResult(batchResult);

        // Add successful items to context
        batchResult.results
          .filter(r => r.success)
          .forEach(r => addUCCA(r.item));
      }

    } catch (error) {
      console.error('Batch create failed:', error);
    } finally {
      setIsProcessing(false);
      if (onOperationComplete) onOperationComplete();
    }
  };

  const handleBatchUpdate = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const updates: any = {};
      if (updateFields.context) updates.context = updateFields.context;
      if (updateFields.hazardIds.length > 0) updates.hazardIds = updateFields.hazardIds;

      if (mode === 'uca') {
        const batchResult = await batchOperationsManager.batchUpdateUCAs(selectedItems, updates);
        setResult(batchResult);

        // Update successful items in context
        batchResult.results
          .filter(r => r.success)
          .forEach(r => updateUCA(r.item.id, r.item));
      } else {
        // UCCA update - similar logic
        console.log('UCCA batch update not yet implemented');
      }

    } catch (error) {
      console.error('Batch update failed:', error);
    } finally {
      setIsProcessing(false);
      if (onOperationComplete) onOperationComplete();
    }
  };

  const handleBatchDelete = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const batchResult = await batchOperationsManager.batchDelete(selectedItems);
      setResult(batchResult);

      // Delete successful items from context
      batchResult.results
        .filter(r => r.success)
        .forEach(r => {
          if (mode === 'uca') {
            deleteUCA(r.item.id);
          } else {
            deleteUCCA(r.item.id);
          }
        });

    } catch (error) {
      console.error('Batch delete failed:', error);
    } finally {
      setIsProcessing(false);
      if (onOperationComplete) onOperationComplete();
    }
  };

  const handleExecute = () => {
    switch (operation) {
      case 'create':
        handleBatchCreate();
        break;
      case 'update':
        handleBatchUpdate();
        break;
      case 'delete':
        handleBatchDelete();
        break;
    }
  };

  const exportResults = () => {
    if (!result) return;
    
    const filename = `batch-${operation}-${mode}-results-${new Date().toISOString().split('T')[0]}.csv`;
    batchOperationsManager.exportBatchResultsToCSV(result, filename);
  };

  const renderOperationForm = () => {
    switch (operation) {
      case 'create':
        return (
          <div className="space-y-4">
            {mode === 'uca' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Controllers
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md">
                    {controllers.map(controller => (
                      <Checkbox
                        key={controller.id}
                        id={`ctrl-${controller.id}`}
                        label={controller.name}
                        checked={selectedControllers.includes(controller.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedControllers([...selectedControllers, controller.id]);
                          } else {
                            setSelectedControllers(selectedControllers.filter(id => id !== controller.id));
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    UCA Types to Generate
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(UCAType).map(type => (
                      <Checkbox
                        key={type}
                        id={`type-${type}`}
                        label={type}
                        checked={selectedUCATypes.includes(type)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedUCATypes([...selectedUCATypes, type]);
                          } else {
                            setSelectedUCATypes(selectedUCATypes.filter(t => t !== type));
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Controllers (pairs will be generated)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md">
                    {controllers.map(controller => (
                      <Checkbox
                        key={controller.id}
                        id={`ctrl-${controller.id}`}
                        label={controller.name}
                        checked={selectedControllers.includes(controller.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedControllers([...selectedControllers, controller.id]);
                          } else {
                            setSelectedControllers(selectedControllers.filter(id => id !== controller.id));
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    UCCA Types to Generate
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(UCCAType).map(type => (
                      <Checkbox
                        key={type}
                        id={`type-${type}`}
                        label={type}
                        checked={selectedUCCATypes.includes(type)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedUCCATypes([...selectedUCCATypes, type]);
                          } else {
                            setSelectedUCCATypes(selectedUCCATypes.filter(t => t !== type));
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <Textarea
              label="Context Template (optional)"
              value={contextTemplate}
              onChange={e => setContextTemplate(e.target.value)}
              placeholder="Use {controller}, {action}, {ucaType} as placeholders"
              rows={2}
            />

            <div className="space-y-2">
              <Checkbox
                id="auto-code"
                label="Auto-generate codes"
                checked={autoGenerateCode}
                onChange={e => setAutoGenerateCode(e.target.checked)}
              />
              {mode === 'uca' && (
                <Checkbox
                  id="skip-existing"
                  label="Skip existing UCAs"
                  checked={skipExisting}
                  onChange={e => setSkipExisting(e.target.checked)}
                />
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This will create approximately <strong>{expectedItemCount}</strong> {mode === 'uca' ? 'UCAs' : 'UCCAs'}
              </p>
            </div>
          </div>
        );

      case 'update':
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Update {selectedItems.length} selected {mode === 'uca' ? 'UCAs' : 'UCCAs'}
            </p>

            <Textarea
              label="New Context (leave empty to keep existing)"
              value={updateFields.context}
              onChange={e => setUpdateFields({ ...updateFields, context: e.target.value })}
              rows={3}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Update Hazard Links
              </label>
              <div className="max-h-40 overflow-y-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md">
                {hazards.map(hazard => (
                  <Checkbox
                    key={hazard.id}
                    id={`hazard-${hazard.id}`}
                    label={`${hazard.code}: ${hazard.title}`}
                    checked={updateFields.hazardIds.includes(hazard.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setUpdateFields({
                          ...updateFields,
                          hazardIds: [...updateFields.hazardIds, hazard.id]
                        });
                      } else {
                        setUpdateFields({
                          ...updateFields,
                          hazardIds: updateFields.hazardIds.filter(id => id !== hazard.id)
                        });
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'delete':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Delete {selectedItems.length} {mode === 'uca' ? 'UCAs' : 'UCCAs'}?
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This action cannot be undone. All selected items will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setOperation('create');
            setShowModal(true);
          }}
          leftIcon={<DocumentDuplicateIcon className="w-5 h-5" />}
          size="sm"
        >
          Batch Create
        </Button>
        
        {selectedItems.length > 0 && (
          <>
            <Button
              onClick={() => {
                setOperation('update');
                setShowModal(true);
              }}
              leftIcon={<ArrowPathIcon className="w-5 h-5" />}
              variant="secondary"
              size="sm"
            >
              Batch Update ({selectedItems.length})
            </Button>
            
            <Button
              onClick={() => {
                setOperation('delete');
                setShowModal(true);
              }}
              leftIcon={<TrashIcon className="w-5 h-5" />}
              variant="secondary"
              size="sm"
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Batch Delete ({selectedItems.length})
            </Button>
          </>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setResult(null);
        }}
        title={`Batch ${operation.charAt(0).toUpperCase() + operation.slice(1)} ${mode.toUpperCase()}s`}
        size="lg"
      >
        {result ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                )}
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    Batch {operation} completed
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Processed: {result.processed} | Failed: {result.failed}
                  </p>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-800 dark:text-red-200">Errors:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-red-600 dark:text-red-400">
                      Item {error.itemIndex + 1}: {error.error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={exportResults}
                leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
                variant="secondary"
              >
                Export Results
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  setResult(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {renderOperationForm()}

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={handleExecute}
                leftIcon={<BoltIcon className="w-5 h-5" />}
                disabled={isProcessing || (
                  operation === 'create' && (
                    (mode === 'uca' && (selectedControllers.length === 0 || selectedUCATypes.length === 0)) ||
                    (mode === 'ucca' && (selectedControllers.length < 2 || selectedUCCATypes.length === 0))
                  )
                )}
              >
                {isProcessing ? 'Processing...' : `Execute Batch ${operation}`}
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                variant="secondary"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default BatchOperationsPanel;