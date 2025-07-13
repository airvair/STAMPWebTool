import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAnalysis } from '@/hooks/useAnalysis';
import { ControlPath } from '@/types';
import Button from '../../shared/Button';
import Input from '../../shared/Input';
import Select from '../../shared/Select';

const ControlPathsBuilder: React.FC = () => {
    const {
        controllers,
        systemComponents,
        controlPaths, addControlPath, updateControlPath, deleteControlPath,
        controlActions, addControlAction, updateControlAction, deleteControlAction,
    } = useAnalysis();

    const [cpSourceCtrlId, setCpSourceCtrlId] = useState('');
    const [cpTargetId, setCpTargetId] = useState('');
    const [editingCpId, setEditingCpId] = useState<string | null>(null);
    const [actionVerb, setActionVerb] = useState('');
    const [actionObject, setActionObject] = useState('');

    const controllerOptions = controllers.map(c => ({ value: c.id, label: c.name }));
    const componentOptions = systemComponents.map(sc => ({ value: sc.id, label: sc.name }));
    const pathTargetOptions = [...controllerOptions, ...componentOptions];

    const getItemName = (id: string) => {
        const ctrl = controllers.find(c => c.id === id);
        if (ctrl) return `${ctrl.name} (Controller)`;
        const comp = systemComponents.find(sc => sc.id === id);
        if (comp) return `${comp.name} (Component)`;
        return 'Unknown';
    };

    const handleSaveControlPath = () => {
        if (!cpSourceCtrlId || !cpTargetId || !actionVerb || !actionObject) {
            alert("Please define a source, target, and at least one control action.");
            return;
        }

        if (cpSourceCtrlId === cpTargetId) {
            alert("A controller cannot target itself. Please select a different target.");
            return;
        }

        const controlsString = `${actionVerb} ${actionObject}`;
        const newCpId = editingCpId || uuidv4();

        if (editingCpId) {
            const existingPath = controlPaths.find(p => p.id === editingCpId);
            const existingAction = controlActions.find(a => a.controlPathId === editingCpId);
            if (existingPath) updateControlPath(editingCpId, { sourceControllerId: cpSourceCtrlId, targetId: cpTargetId, controls: controlsString });
            if (existingAction) updateControlAction(existingAction.id, { verb: actionVerb, object: actionObject });
        } else {
            addControlPath({ id: newCpId, sourceControllerId: cpSourceCtrlId, targetId: cpTargetId, controls: controlsString });
            addControlAction({ controllerId: cpSourceCtrlId, controlPathId: newCpId, verb: actionVerb, object: actionObject, description: '', isOutOfScope: false });
        }
        resetForm();
    };

    const resetForm = () => {
        setCpSourceCtrlId('');
        setCpTargetId('');
        setEditingCpId(null);
        setActionVerb('');
        setActionObject('');
    };

    const editControlPath = (cp: ControlPath) => {
        setEditingCpId(cp.id);
        setCpSourceCtrlId(cp.sourceControllerId);
        setCpTargetId(cp.targetId);
        const relatedAction = controlActions.find(ca => ca.controlPathId === cp.id);
        if (relatedAction) {
            setActionVerb(relatedAction.verb);
            setActionObject(relatedAction.object);
        }
    };

    const handleDeleteControlPath = (pathId: string) => {
        const actionsToDelete = controlActions.filter(ca => ca.controlPathId === pathId);
        actionsToDelete.forEach(ca => deleteControlAction(ca.id));
        deleteControlPath(pathId);
    };

    return (
        <section className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Control Paths & Actions</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">How does a controller give commands? Let&apos;s draw the lines of command from a controller down to what it controls.</p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 space-y-4">
                <p className="text-md font-semibold text-slate-700 dark:text-slate-200">{editingCpId ? 'Editing Control Path' : 'Define a New Control Path'}</p>
                <Select
                    label="1. Source (Who is in control?)"
                    value={cpSourceCtrlId}
                    onChange={e => setCpSourceCtrlId(e.target.value)}
                    options={[{value: '', label: 'Select a source controller...'}, ...controllerOptions]}
                />
                <Select
                    label="2. Target (What is being controlled?)"
                    value={cpTargetId}
                    onChange={e => setCpTargetId(e.target.value)}
                    options={[{value: '', label: 'Select a controlled item...'}, ...pathTargetOptions]}
                />
                <div className="pl-4 border-l-4 border-slate-300 dark:border-slate-600">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        3. Define the Control Action
                    </label>
                    <div className="flex items-end space-x-2">
                        <Input label="Action Verb" value={actionVerb} onChange={e => setActionVerb(e.target.value)} placeholder="e.g., INCREASE" containerClassName="flex-grow !mb-0"/>
                        <Input label="Action Object" value={actionObject} onChange={e => setActionObject(e.target.value)} placeholder="e.g., PITCH" containerClassName="flex-grow !mb-0"/>
                    </div>
                </div>
                <div className="flex space-x-2 pt-4">
                    <Button onClick={handleSaveControlPath} leftIcon={<PlusIcon className="w-5 h-5" />}>
                        {editingCpId ? 'Update Path' : 'Add Path'}
                    </Button>
                    {editingCpId && <Button onClick={resetForm} variant="secondary">Cancel</Button>}
                </div>
            </div>

            <ul className="space-y-2">
                {controlPaths.map(cp => (
                    <li key={cp.id} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 shadow-sm">
                        <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200"><span className="font-semibold">{getItemName(cp.sourceControllerId)}</span> → <span className="font-semibold">{getItemName(cp.targetId)}</span></p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Action: {cp.controls}</p>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                            <Button onClick={() => editControlPath(cp)} size="sm" variant="ghost">Edit</Button>
                            <Button onClick={() => handleDeleteControlPath(cp.id)} size="sm" variant="ghost" className="text-red-500"><TrashIcon className="w-4 h-4"/></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default ControlPathsBuilder;