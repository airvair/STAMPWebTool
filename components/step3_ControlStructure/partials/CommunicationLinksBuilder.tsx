// airvair/stampwebtool/STAMPWebTool-ec65ad6e324f19eae402e103914f6c7858ecb5c9/components/step3_ControlStructure/partials/CommunicationLinksBuilder.tsx
import React, { useState } from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { Controller, SystemComponent, CommunicationPath, ControllerType } from '../../../types';
import Select from '../../shared/Select';
import Button from '../../shared/Button';
import Textarea from '../../shared/Textarea';

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
    const selectedSourceController = controllers.find(c => c.id === commSourceId);

    // For intra-team communication
    const isIntraTeam = commSourceId && commSourceId === commTargetId && selectedSourceController?.ctrlType === ControllerType.Team;
    const memberOptions = selectedSourceController?.teamDetails?.members.map(m => ({ value: m.id, label: m.name })) || [];
    const [sourceMemberId, setSourceMemberId] = useState('');
    const [targetMemberId, setTargetMemberId] = useState('');


    const handleSaveCommunicationPath = () => {
        if (!commSourceId || !commTargetId || !commDescription) return;

        let pathData: Omit<CommunicationPath, 'id'> = {
            sourceControllerId: commSourceId,
            targetControllerId: commTargetId,
            description: commDescription,
        };

        if (isIntraTeam) {
            if (!sourceMemberId || !targetMemberId || sourceMemberId === targetMemberId) {
                alert("Please select two different members for intra-team communication.");
                return;
            }
            pathData.sourceMemberId = sourceMemberId;
            pathData.targetMemberId = targetMemberId;
        }

        if (editingCommId) {
            updateCommunicationPath(editingCommId, pathData);
        } else {
            addCommunicationPath(pathData);
        }

        // Reset form
        setCommSourceId(''); setCommTargetId(''); setCommDescription(''); setEditingCommId(null);
        setSourceMemberId(''); setTargetMemberId('');
    };

    const editCommunicationPath = (comm: CommunicationPath) => {
        setEditingCommId(comm.id);
        setCommSourceId(comm.sourceControllerId);
        setCommTargetId(comm.targetControllerId);
        setCommDescription(comm.description);
        setSourceMemberId(comm.sourceMemberId || '');
        setTargetMemberId(comm.targetMemberId || '');
    };

    const getItemName = (comm: CommunicationPath, type: 'source' | 'target'): string => {
        const id = type === 'source' ? comm.sourceControllerId : comm.targetControllerId;
        const memberId = type === 'source' ? comm.sourceMemberId : comm.targetMemberId;

        const controller = controllers.find(c => c.id === id);
        if (!controller) return 'Unknown';

        if (memberId && controller.teamDetails) {
            const member = controller.teamDetails.members.find(m => m.id === memberId);
            return member ? `${member.name} (in ${controller.name})` : `Unknown Member (in ${controller.name})`;
        }

        return `${controller.name} (Controller)`;
    };


    return (
        <section>
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">5. Communication Links (Controller ↔ Controller)</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 space-y-4">
                <Select label="Controller One" value={commSourceId} onChange={e => {setCommSourceId(e.target.value);}} options={[{value: '', label: 'Select Controller'}, ...controllerOptions]} />
                <Select label="Controller Two" value={commTargetId} onChange={e => setCommTargetId(e.target.value)} options={[{value: '', label: 'Select Controller'}, ...controllerOptions]} />

                {isIntraTeam && (
                    <div className="p-3 border-t border-dashed border-slate-400 mt-4 space-y-4">
                        <h4 className="text-sm font-semibold text-slate-700">Define Intra-Team Communication:</h4>
                        <Select label="Source Member" value={sourceMemberId} onChange={e => setSourceMemberId(e.target.value)} options={[{value: '', label: 'Select Member'}, ...memberOptions]} />
                        <Select label="Target Member" value={targetMemberId} onChange={e => setTargetMemberId(e.target.value)} options={[{value: '', label: 'Select Member'}, ...memberOptions]} />
                    </div>
                )}

                <Textarea label="Description of Communication / Control" value={commDescription} onChange={e => setCommDescription(e.target.value)} placeholder="e.g., Monitoring and callouts, Shared status reports" />
                <Button onClick={handleSaveCommunicationPath} leftIcon={<PlaceholderPlusIcon />}>
                    {editingCommId ? 'Update Communication Link' : 'Add Communication Link'}
                </Button>
            </div>
            <ul className="space-y-2">
                {communicationPaths.map(comm => (
                    <li key={comm.id} className="flex justify-between items-center p-3 border border-slate-300 rounded-md bg-white shadow-sm">
                        <div>
                            <p><span className="font-semibold">{getItemName(comm, 'source')}</span> ↔ <span className="font-semibold">{getItemName(comm, 'target')}</span></p>
                            <p className="text-sm text-slate-600">Communication: {comm.description}</p>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                            <Button onClick={() => editCommunicationPath(comm)} size="sm" variant="ghost" className="text-slate-600 hover:bg-slate-100">Edit</Button>
                            <Button onClick={() => deleteCommunicationPath(comm.id)} size="sm" variant="ghost" className="text-red-600 hover:bg-red-100" aria-label="Delete"><PlaceholderTrashIcon /></Button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default CommunicationLinksBuilder;