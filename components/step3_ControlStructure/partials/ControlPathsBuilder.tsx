// airvair/stampwebtool/STAMPWebTool-ec65ad6e324f19eae402e103914f6c7858ecb5c9/components/step3_ControlStructure/partials/ControlPathsBuilder.tsx
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { Controller, ControlPath, ControllerType, ControlAction, SystemComponent } from '../../../types';
import { GLOSSARY } from '../../../constants';
import Tooltip from '../../shared/Tooltip';
import Input from '../../shared/Input';
import Select from '../../shared/Select';
import Button from '../../shared/Button';
import Textarea from '../../shared/Textarea';
import Checkbox from '../../shared/Checkbox';

const PlaceholderPlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const PlaceholderTrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const ControlPathsBuilder: React.FC = () => {
    const {
        controllers,
        systemComponents,
        controlPaths, addControlPath, updateControlPath, deleteControlPath,
        controlActions, addControlAction, deleteControlAction,
    } = useAnalysis();

    const [cpSourceCtrlId, setCpSourceCtrlId] = useState('');
    const [cpTargetId, setCpTargetId] = useState('');
    const [cpHigherAuth, setCpHigherAuth] = useState(false);
    const [editingCpId, setEditingCpId] = useState<string | null>(null);
    const [currentActions, setCurrentActions] = useState<Omit<ControlAction, 'id' | 'controllerId' | 'controlPathId' | 'description' | 'isOutOfScope'>[]>([]);
    const [actionVerb, setActionVerb] = useState('');
    const [actionObject, setActionObject] = useState('');

    const controllerOptions = controllers.map(c => ({ value: c.id, label: c.name }));
    const componentOptions = systemComponents.map(sc => ({ value: sc.id, label: sc.name }));
    const pathTargetOptions = [...controllerOptions, ...componentOptions];
    const selectedControllerForCP = controllers.find(c => c.id === cpSourceCtrlId);

    const getItemName = (id: string) => {
        const ctrl = controllers.find(c => c.id === id);
        if (ctrl) return `${ctrl.name} (Controller)`;
        const comp = systemComponents.find(sc => sc.id === id);
        if (comp) return `${comp.name} (Component)`;
        return 'Unknown';
    };

    const handleAddAction = () => {
        if (!actionVerb.trim() || !actionObject.trim()) return;
        setCurrentActions([...currentActions, { verb: actionVerb, object: actionObject }]);
        setActionVerb('');
        setActionObject('');
    };

    const handleDeleteAction = (index: number) => {
        setCurrentActions(currentActions.filter((_, i) => i !== index));
    };

    const handleSaveControlPath = () => {
        if (!cpSourceCtrlId || !cpTargetId || currentActions.length === 0) {
            alert("Please define a source, target, and at least one control action.");
            return;
        }

        const controlsString = currentActions.map(a => `${a.verb} ${a.object}`).join(', ');

        if (editingCpId) {
            updateControlPath(editingCpId, { sourceControllerId: cpSourceCtrlId, targetId: cpTargetId, controls: controlsString, higherAuthority: cpHigherAuth });
            const oldActions = controlActions.filter(ca => ca.controlPathId === editingCpId);
            oldActions.forEach(ca => deleteControlAction(ca.id));
            currentActions.forEach(action => {
                addControlAction({ ...action, controllerId: cpSourceCtrlId, controlPathId: editingCpId, description: '', isOutOfScope: false });
            });
        } else {
            const newCpId = uuidv4();
            addControlPath({ id: newCpId, sourceControllerId: cpSourceCtrlId, targetId: cpTargetId, controls: controlsString, higherAuthority: cpHigherAuth });
            currentActions.forEach(action => {
                addControlAction({ ...action, controllerId: cpSourceCtrlId, controlPathId: newCpId, description: '', isOutOfScope: false });
            });
        }
        setCpSourceCtrlId('');
        setCpTargetId('');
        setCpHigherAuth(false);
        setEditingCpId(null);
        setCurrentActions([]);
    };

    const editControlPath = (cp: ControlPath) => {
        setEditingCpId(cp.id);
        setCpSourceCtrlId(cp.sourceControllerId);
        setCpTargetId(cp.targetId);
        setCpHigherAuth(!!cp.higherAuthority);
        const relatedActions = controlActions.filter(ca => ca.controlPathId === cp.id).map(({ verb, object }) => ({ verb, object }));
        setCurrentActions(relatedActions);
    };

    const handleDeleteControlPath = (pathId: string) => {
        const actionsToDelete = controlActions.filter(ca => ca.controlPathId === pathId);
        actionsToDelete.forEach(ca => deleteControlAction(ca.id));
        deleteControlPath(pathId);
    };

    const renderControlActionExamples = (type: ControllerType | undefined) => {
        if (!type) return null;
        let examples: string[] = [];
        let title = '';
        switch (type) {
            case ControllerType.Human:
                title = 'Human Controller Examples:';
                examples = ['Verb: "Apply", Object: "brakes"', 'Verb: "Steer", Object: "left"', 'Verb: "Request", Object: "higher altitude"'];
                break;
            case ControllerType.Software:
                title = 'Software Controller Examples:';
                examples = ['Verb: "SEND_BRAKE_COMMAND", Object: "pressure: 50%"', 'Verb: "SET_MODE", Object: "standby"', 'Verb: "DISPLAY_WARNING", Object: "Engine Overheat"'];
                break;
            case ControllerType.Organisation:
                title = 'Organization Controller Examples:';
                examples = ['Verb: "ISSUE", Object: "SAFETY_DIRECTIVE_123"', 'Verb: "UPDATE", Object: "MAINTENANCE_PROCEDURE_4.1"'];
                break;
            case ControllerType.Team:
                title = 'Team Controller Examples:';
                examples = ['Verb: "EXECUTE", Object: "EMERGENCY_SHUTDOWN_CHECKLIST"', 'Verb: "COMMUNICATE", Object: "SYSTEM_STATUS_TO_ATC"'];
                break;
            default: return null;
        }
        return (
            <div className="text-xs text-slate-500 mt-1 pl-1">
                <p className="font-semibold">{title}</p>
                <ul className="list-disc list-inside ml-2">
                    {examples.map((ex, i) => <li key={i}>{ex}</li>)}
                </ul>
            </div>
        );
    };

    return (
        <section>
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">3. Control Paths & Actions</h3>
            <div className="p-4 bg-sky-50 border-l-4 border-sky-400 text-sky-800 rounded-r-lg text-sm space-y-2 mb-4">
                <p>Define the control relationships between controllers and the components (or other controllers). Think about how commands flow downwards. For each path, list all control actions the controller can provide.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 space-y-4">
                <p className="text-md font-semibold text-slate-700">Define a new control path:</p>
                <Select
                    label="1. First, select the item that is being controlled:"
                    value={cpTargetId}
                    onChange={e => setCpTargetId(e.target.value)}
                    options={[{value: '', label: 'Select a controlled item...'}, ...pathTargetOptions]}
                />
                <Select
                    label={<>2. Next, select the <Tooltip content={GLOSSARY['Controller']}>controller</Tooltip> that provides the control action:</>}
                    value={cpSourceCtrlId}
                    onChange={e => setCpSourceCtrlId(e.target.value)}
                    options={[{value: '', label: 'Select a source controller...'}, ...controllerOptions]}
                    disabled={!cpTargetId}
                />
                <div className={`pl-4 border-l-4 border-slate-300 ${!cpSourceCtrlId ? 'opacity-50' : ''}`}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        3. Describe all the <Tooltip content={GLOSSARY['Control Action']}>control action(s)</Tooltip> available to that controller:
                    </label>
                    <div className="flex items-end space-x-2">
                        <Input label="Action Verb" value={actionVerb} onChange={e => setActionVerb(e.target.value)} placeholder="e.g., INCREASE, MAINTAIN" disabled={!cpSourceCtrlId} containerClassName="flex-grow !mb-0"/>
                        <Input label="Action Object" value={actionObject} onChange={e => setActionObject(e.target.value)} placeholder="e.g., PITCH" disabled={!cpSourceCtrlId} containerClassName="flex-grow !mb-0"/>
                        <Button onClick={handleAddAction} leftIcon={<PlaceholderPlusIcon/>} disabled={!cpSourceCtrlId || !actionVerb || !actionObject} className="h-10">Add Action</Button>
                    </div>
                    {renderControlActionExamples(selectedControllerForCP?.ctrlType)}
                    {currentActions.length > 0 && (
                        <div className="mt-2 space-y-1">
                            <h4 className="text-sm font-medium text-slate-600">Actions for this path:</h4>
                            <ul className="bg-white p-2 rounded-md border border-slate-200 divide-y divide-slate-200">
                                {currentActions.map((action, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm py-2">
                                        <span>{action.verb} {action.object}</span>
                                        <Button onClick={() => handleDeleteAction(index)} size="sm" variant="ghost" className="text-red-600 hover:bg-red-100" aria-label="Delete Action"><PlaceholderTrashIcon /></Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <Checkbox label="Does the item being controlled have higher authority than the controller? (This is rare and usually applies to oversight relationships)" checked={cpHigherAuth} onChange={e => setCpHigherAuth(e.target.checked)} />
                <Button onClick={handleSaveControlPath} leftIcon={<PlaceholderPlusIcon />}>
                    {editingCpId ? 'Update Control Path & Actions' : 'Add Control Path & Actions'}
                </Button>
            </div>
            <ul className="space-y-2">
                {controlPaths.map(cp => (
                    <li key={cp.id} className="flex justify-between items-center p-3 border border-slate-300 rounded-md bg-white shadow-sm">
                        <div>
                            <p><span className="font-semibold">{getItemName(cp.sourceControllerId)}</span> → <span className="font-semibold">{getItemName(cp.targetId)}</span></p>
                            <p className="text-sm text-slate-600">Controls: {cp.controls}</p>
                            {cp.higherAuthority && <p className="text-xs text-slate-500">Target has higher authority</p>}
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                            <Button onClick={() => editControlPath(cp)} size="sm" variant="ghost" className="text-slate-600 hover:bg-slate-100">Edit</Button>
                            <Button onClick={() => handleDeleteControlPath(cp.id)} size="sm" variant="ghost" className="text-red-600 hover:bg-red-100" aria-label="Delete"><PlaceholderTrashIcon /></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default ControlPathsBuilder;