// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step3_ControlStructure/partials/CommunicationLinksBuilder.tsx
import React, { useState } from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { CommunicationPath } from '../../../types';
import Select from '../../shared/Select';
import Button from '../../shared/Button';
import Textarea from '../../shared/Textarea';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

const CommunicationLinksBuilder: React.FC = () => {
    const {
        controllers,
        communicationPaths, addCommunicationPath, updateCommunicationPath, deleteCommunicationPath,
    } = useAnalysis();

    const [commSourceId, setCommSourceId] = useState('');
    const [commTargetId, setCommTargetId] = useState('');
    const [commDescription, setCommDescription] = useState('');
    const [editingCommId, setEditingCommId] = useState<string | null>(null);

    const controllerOptions = controllers.map(c => ({ value: c.id, label: c.name }));

    const getItemName = (id: string): string => {
        return controllers.find(c => c.id === id)?.name || 'Unknown';
    };

    const resetForm = () => {
        setCommSourceId('');
        setCommTargetId('');
        setCommDescription('');
        setEditingCommId(null);
    }

    const handleSaveCommunicationPath = () => {
        if (!commSourceId || !commTargetId || !commDescription || commSourceId === commTargetId) {
            alert("Please select two different controllers and provide a description.")
            return;
        };

        const pathData: Omit<CommunicationPath, 'id'> = {
            sourceControllerId: commSourceId,
            targetControllerId: commTargetId,
            description: commDescription,
        };

        if (editingCommId) {
            updateCommunicationPath(editingCommId, pathData);
        } else {
            addCommunicationPath(pathData);
        }
        resetForm();
    };

    const editCommunicationPath = (comm: CommunicationPath) => {
        setEditingCommId(comm.id);
        setCommSourceId(comm.sourceControllerId);
        setCommTargetId(comm.targetControllerId);
        setCommDescription(comm.description);
    };

    return (
        <section className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Communication Links</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Sometimes controllers talk to each other. Define these peer-to-peer links for coordination and information sharing.</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 space-y-4">
                <p className="text-md font-semibold text-slate-700 dark:text-slate-200">{editingCommId ? 'Editing Communication Link' : 'Define a New Link'}</p>
                <Select label="Controller One" value={commSourceId} onChange={e => {setCommSourceId(e.target.value);}} options={[{value: '', label: 'Select Controller'}, ...controllerOptions]} />
                <Select label="Controller Two" value={commTargetId} onChange={e => setCommTargetId(e.target.value)} options={[{value: '', label: 'Select Controller'}, ...controllerOptions]} />
                <Textarea label="Description of Communication" value={commDescription} onChange={e => setCommDescription(e.target.value)} placeholder="e.g., Shared status reports" containerClassName="!mb-0" />
                <div className="flex space-x-2 pt-4">
                    <Button onClick={handleSaveCommunicationPath} leftIcon={<PlusIcon className="w-5 h-5" />}>
                        {editingCommId ? 'Update Link' : 'Add Link'}
                    </Button>
                    {editingCommId && <Button onClick={resetForm} variant="secondary">Cancel</Button>}
                </div>
            </div>
            <ul className="space-y-2">
                {communicationPaths.map(comm => (
                    <li key={comm.id} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 shadow-sm">
                        <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200"><span className="font-semibold">{getItemName(comm.sourceControllerId)}</span> ↔ <span className="font-semibold">{getItemName(comm.targetControllerId)}</span></p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Via: {comm.description}</p>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                            <Button onClick={() => editCommunicationPath(comm)} size="sm" variant="ghost">Edit</Button>
                            <Button onClick={() => deleteCommunicationPath(comm.id)} size="sm" variant="ghost" className="text-red-500"><TrashIcon className="w-4 h-4"/></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default CommunicationLinksBuilder;