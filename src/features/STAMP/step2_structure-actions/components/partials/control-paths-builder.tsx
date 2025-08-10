import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/shared';
import { Input } from '@/components/shared';
import { Select } from '@/components/shared';
import { useAnalysis } from '@/hooks/useAnalysis';
import { ControlPath, ControlAction } from '@/types/types';

interface ActionFormData {
  verb: string;
  object: string;
}

const ControlPathsBuilder: React.FC = () => {
  const {
    controllers,
    systemComponents,
    controlPaths,
    addControlPath,
    updateControlPath,
    deleteControlPath,
    controlActions,
    addControlAction,
    updateControlAction,
    deleteControlAction,
  } = useAnalysis();

  const [cpSourceCtrlId, setCpSourceCtrlId] = useState('');
  const [cpTargetId, setCpTargetId] = useState('');
  const [editingCpId, setEditingCpId] = useState<string | null>(null);
  const [controlActionsList, setControlActionsList] = useState<ActionFormData[]>([
    { verb: '', object: '' },
  ]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const controllerOptions = (controllers || []).map(c => ({ value: c.id, label: c.name }));
  const componentOptions = (systemComponents || []).map(sc => ({ value: sc.id, label: sc.name }));
  const pathTargetOptions = [...controllerOptions, ...componentOptions];

  const getItemName = (id: string) => {
    const ctrl = (controllers || []).find(c => c.id === id);
    if (ctrl) return `${ctrl.name} (Controller)`;
    const comp = (systemComponents || []).find(sc => sc.id === id);
    if (comp) return `${comp.name} (Component)`;
    return 'Unknown';
  };

  const addActionField = () => {
    setControlActionsList([...controlActionsList, { verb: '', object: '' }]);
  };

  const removeActionField = (index: number) => {
    if (controlActionsList.length > 1) {
      const newList = controlActionsList.filter((_, i) => i !== index);
      setControlActionsList(newList);
    }
  };

  const updateActionField = (index: number, field: 'verb' | 'object', value: string) => {
    const newList = [...controlActionsList];
    newList[index][field] = value;
    setControlActionsList(newList);
  };

  const handleSaveControlPath = () => {
    if (!cpSourceCtrlId || !cpTargetId) {
      alert('Please define a source and target for the control path.');
      return;
    }

    const validActions = controlActionsList.filter(a => a.verb && a.object);
    if (validActions.length === 0) {
      alert('Please define at least one control action with both verb and object.');
      return;
    }

    if (cpSourceCtrlId === cpTargetId) {
      alert('A controller cannot target itself. Please select a different target.');
      return;
    }

    const newCpId = editingCpId || uuidv4();
    const actionIds: string[] = [];

    if (editingCpId) {
      // Update existing path
      const existingPath = (controlPaths || []).find(p => p.id === editingCpId);
      if (existingPath) {
        // Delete old control actions
        const oldActions = (controlActions || []).filter(a => a.controlPathId === editingCpId);
        oldActions.forEach(a => deleteControlAction(a.id));

        // Update path with legacy controls field for backward compatibility
        const controlsString = validActions.map(a => `${a.verb} ${a.object}`).join('; ');
        updateControlPath(editingCpId, {
          sourceControllerId: cpSourceCtrlId,
          targetId: cpTargetId,
          controls: controlsString,
          controlActionIds: actionIds,
        });

        // Add new control actions
        validActions.forEach(action => {
          const actionId = uuidv4();
          actionIds.push(actionId);
          addControlAction({
            id: actionId,
            controllerId: cpSourceCtrlId,
            controlPathId: editingCpId,
            verb: action.verb,
            object: action.object,
            description: `${action.verb} ${action.object}`,
            isOutOfScope: false,
          });
        });

        // Update path with action IDs
        updateControlPath(editingCpId, { controlActionIds: actionIds });
      }
    } else {
      // Create new path
      // Add control actions first to get their IDs
      validActions.forEach(action => {
        const actionId = uuidv4();
        actionIds.push(actionId);
        addControlAction({
          id: actionId,
          controllerId: cpSourceCtrlId,
          controlPathId: newCpId,
          verb: action.verb,
          object: action.object,
          description: `${action.verb} ${action.object}`,
          isOutOfScope: false,
        });
      });

      // Create path with legacy controls field for backward compatibility
      const controlsString = validActions.map(a => `${a.verb} ${a.object}`).join('; ');
      addControlPath({
        id: newCpId,
        sourceControllerId: cpSourceCtrlId,
        targetId: cpTargetId,
        controls: controlsString,
        controlActionIds: actionIds,
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setCpSourceCtrlId('');
    setCpTargetId('');
    setEditingCpId(null);
    setControlActionsList([{ verb: '', object: '' }]);
  };

  const editControlPath = (cp: ControlPath) => {
    setEditingCpId(cp.id);
    setCpSourceCtrlId(cp.sourceControllerId);
    setCpTargetId(cp.targetId);

    // Load associated control actions
    const relatedActions = (controlActions || []).filter(ca => ca.controlPathId === cp.id);
    if (relatedActions.length > 0) {
      setControlActionsList(relatedActions.map(ra => ({ verb: ra.verb, object: ra.object })));
    } else {
      // Fallback to parsing the legacy controls field
      const controlsArray = cp.controls ? cp.controls.split(';').map(c => c.trim()) : [];
      const actions = controlsArray.map(control => {
        const parts = control.split(' ');
        return { verb: parts[0] || '', object: parts.slice(1).join(' ') || '' };
      });
      setControlActionsList(actions.length > 0 ? actions : [{ verb: '', object: '' }]);
    }
  };

  const handleDeleteControlPath = (pathId: string) => {
    const actionsToDelete = (controlActions || []).filter(ca => ca.controlPathId === pathId);
    actionsToDelete.forEach(ca => deleteControlAction(ca.id));
    deleteControlPath(pathId);
  };

  const togglePathExpansion = (pathId: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(pathId)) {
      newExpanded.delete(pathId);
    } else {
      newExpanded.add(pathId);
    }
    setExpandedPaths(newExpanded);
  };

  const getPathControlActions = (pathId: string): ControlAction[] => {
    return (controlActions || []).filter(ca => ca.controlPathId === pathId);
  };

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Control Paths & Actions
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          How does a controller give commands? Let&apos;s draw the lines of command from a
          controller down to what it controls.
        </p>
      </div>

      <div className="w-full max-w-3xl space-y-4 rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
        <p className="text-md font-semibold text-slate-700 dark:text-slate-200">
          {editingCpId ? 'Editing Control Path' : 'Define a New Control Path'}
        </p>
        <Select
          label="1. Source (Who is in control?)"
          value={cpSourceCtrlId}
          onChange={e => setCpSourceCtrlId(e.target.value)}
          options={controllerOptions}
          placeholder="Select a source controller..."
        />
        <Select
          label="2. Target (What is being controlled?)"
          value={cpTargetId}
          onChange={e => setCpTargetId(e.target.value)}
          options={pathTargetOptions}
          placeholder="Select a controlled item..."
        />
        <div className="border-l-4 border-slate-300 pl-4 dark:border-slate-600">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            3. Define Control Actions
          </label>
          <div className="space-y-2">
            {controlActionsList.map((action, index) => (
              <div key={index} className="flex items-end space-x-2">
                <Input
                  label={index === 0 ? 'Action Verb' : ''}
                  value={action.verb}
                  onChange={e => updateActionField(index, 'verb', e.target.value)}
                  placeholder="e.g., INCREASE"
                  containerClassName="flex-grow !mb-0"
                />
                <Input
                  label={index === 0 ? 'Action Object' : ''}
                  value={action.object}
                  onChange={e => updateActionField(index, 'object', e.target.value)}
                  placeholder="e.g., PITCH"
                  containerClassName="flex-grow !mb-0"
                />
                {controlActionsList.length > 1 && (
                  <Button
                    onClick={() => removeActionField(index)}
                    size="sm"
                    variant="ghost"
                    className="!mb-0 text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            onClick={addActionField}
            size="sm"
            variant="secondary"
            className="mt-2"
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            Add Another Action
          </Button>
        </div>
        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSaveControlPath} leftIcon={<PlusIcon className="h-5 w-5" />}>
            {editingCpId ? 'Update Path' : 'Add Path'}
          </Button>
          {editingCpId && (
            <Button onClick={resetForm} variant="secondary">
              Cancel
            </Button>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {(controlPaths || []).map(cp => {
          const pathActions = getPathControlActions(cp.id);
          const isExpanded = expandedPaths.has(cp.id);

          return (
            <li
              key={cp.id}
              className="rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex-grow">
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    <span className="font-semibold">{getItemName(cp.sourceControllerId)}</span> →{' '}
                    <span className="font-semibold">{getItemName(cp.targetId)}</span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {pathActions.length > 0
                      ? `${pathActions.length} control action${pathActions.length > 1 ? 's' : ''}`
                      : 'Actions: ' + cp.controls}
                  </p>
                </div>
                <div className="ml-4 flex items-center space-x-1">
                  {pathActions.length > 0 && (
                    <Button onClick={() => togglePathExpansion(cp.id)} size="sm" variant="ghost">
                      {isExpanded ? 'Hide' : 'Show'} Actions
                    </Button>
                  )}
                  <Button onClick={() => editControlPath(cp)} size="sm" variant="ghost">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteControlPath(cp.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {isExpanded && pathActions.length > 0 && (
                <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
                  <p className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Control Actions:
                  </p>
                  <ul className="space-y-1">
                    {pathActions.map((action, index) => (
                      <li
                        key={action.id}
                        className="pl-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        {index + 1}. {action.verb} {action.object}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default ControlPathsBuilder;
