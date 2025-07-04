// airvair/stampwebtool/STAMPWebTool-a2dc94729271b2838099dd63a9093c4d/components/step3_ControlStructure/partials/ControllersBuilder.tsx
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Controller, ControllerType, TeamDetails, TeamMember, TeamRole, OperationalContext } from '@/types';
import { CONTROLLER_TYPE_COLORS } from '@/constants';
import Input from '@/components/shared/Input';
import Select from '@/components/shared/Select';
import Button from '@/components/shared/Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

// The rest of the file remains the same as the last version I provided.
// The key change is correcting the import paths at the top of the file.

const TeamStructureEditor: React.FC<{
    teamDetails: TeamDetails;
    onTeamDetailsChange: (details: TeamDetails) => void;
}> = ({ teamDetails, onTeamDetailsChange }) => {
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRank, setNewMemberRank] = useState('CM-2');
    const [numPeers, setNumPeers] = useState(2);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleAuthLevel, setNewRoleAuthLevel] = useState(10);
    const [newContextName, setNewContextName] = useState('');

    const commandRankOptions = [
        {value: 'CM-1', label: 'CM-1 (Highest Authority)'},
        {value: 'CM-2', label: 'CM-2'},
        {value: 'CM-3', label: 'CM-3'},
        {value: 'CM-4', label: 'CM-4'},
        {value: 'CM-5', label: 'CM-5'},
        {value: 'GR', label: 'GR (Grouped Team)'},
    ];

    const handleHierarchyChange = (isHierarchy: boolean) => {
        onTeamDetailsChange({...teamDetails, isHierarchical: isHierarchy, members: []});
    };

    const addHierarchicalMember = () => {
        if (!newMemberName) return;
        const newMember: TeamMember = { id: uuidv4(), name: newMemberName, commandRank: newMemberRank };
        onTeamDetailsChange({ ...teamDetails, members: [...teamDetails.members, newMember] });
        setNewMemberName('');
    };

    const generatePeerMembers = () => {
        const newMembers: TeamMember[] = Array.from({ length: numPeers }, (_, i) => ({
            id: uuidv4(),
            name: `Member ${i + 1}`,
            commandRank: 'GR'
        }));
        onTeamDetailsChange({...teamDetails, members: newMembers});
    };

    const deleteMember = (id: string) => {
        const remainingMembers = teamDetails.members.filter(m => m.id !== id);
        const updatedContexts = teamDetails.contexts.map(ctx => ({
            ...ctx,
            assignments: ctx.assignments.filter(a => a.memberId !== id)
        }));
        onTeamDetailsChange({ ...teamDetails, members: remainingMembers, contexts: updatedContexts });
    };

    const updateMemberName = (id: string, name: string) => {
        const updatedMembers = teamDetails.members.map(m => m.id === id ? {...m, name} : m);
        onTeamDetailsChange({...teamDetails, members: updatedMembers});
    }

    const addRole = () => {
        if (!newRoleName) return;
        const newRole: TeamRole = { id: uuidv4(), name: newRoleName, authorityLevel: newRoleAuthLevel };
        onTeamDetailsChange({ ...teamDetails, roles: [...teamDetails.roles, newRole] });
        setNewRoleName('');
        setNewRoleAuthLevel(10);
    };

    const deleteRole = (id: string) => {
        const remainingRoles = teamDetails.roles.filter(r => r.id !== id);
        const updatedContexts = teamDetails.contexts.map(ctx => ({
            ...ctx,
            assignments: ctx.assignments.filter(a => a.roleId !== id)
        }));
        onTeamDetailsChange({ ...teamDetails, roles: remainingRoles, contexts: updatedContexts });
    };

    const addContext = () => {
        if(!newContextName) return;
        const newContext: OperationalContext = {id: uuidv4(), name: newContextName, assignments: []};
        onTeamDetailsChange({...teamDetails, contexts: [...teamDetails.contexts, newContext]});
        setNewContextName('');
    }

    const deleteContext = (id: string) => {
        onTeamDetailsChange({...teamDetails, contexts: teamDetails.contexts.filter(c => c.id !== id)});
    }

    const handleAssignmentChange = (contextId: string, memberId: string, roleId: string) => {
        const newContexts = teamDetails.contexts.map(ctx => {
            if (ctx.id === contextId) {
                const newAssignments = [...ctx.assignments];
                const existingAssignmentIndex = newAssignments.findIndex(a => a.memberId === memberId);
                if (roleId) {
                    if (existingAssignmentIndex > -1) newAssignments[existingAssignmentIndex].roleId = roleId;
                    else newAssignments.push({memberId, roleId});
                } else {
                    if(existingAssignmentIndex > -1) newAssignments.splice(existingAssignmentIndex, 1);
                }
                return { ...ctx, assignments: newAssignments };
            }
            return ctx;
        });
        onTeamDetailsChange({ ...teamDetails, contexts: newContexts });
    };

    return (
        <div className="mt-4 pt-4 border-t border-slate-300 dark:border-neutral-700 space-y-6">
            {/* 1. Member Definition */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">1. Define Team Members</label>
                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <div className="space-y-2">
                        <div className="flex items-center"><input type="radio" name="team-hierarchy" checked={!teamDetails.isHierarchical} onChange={() => handleHierarchyChange(false)} className="h-4 w-4 text-sky-600 border-neutral-600 focus:ring-sky-500"/><label className="ml-2 text-sm text-slate-700 dark:text-slate-300">Team members are peers (equal rank)</label></div>
                        <div className="flex items-center"><input type="radio" name="team-hierarchy" checked={!!teamDetails.isHierarchical} onChange={() => handleHierarchyChange(true)} className="h-4 w-4 text-sky-600 border-neutral-600 focus:ring-sky-500"/><label className="ml-2 text-sm text-slate-700 dark:text-slate-300">Team has a formal hierarchy (different ranks)</label></div>
                    </div>
                    <div className="mt-4">
                        {teamDetails.isHierarchical ? (
                            <div className="space-y-2">
                                <ul className="space-y-1">
                                    {teamDetails.members.map(m => ( <li key={m.id} className="flex justify-between items-center bg-white dark:bg-neutral-900 p-2 rounded border border-slate-300 dark:border-neutral-700 text-sm"><span>{m.name} ({m.commandRank})</span><Button onClick={() => deleteMember(m.id)} size="sm" variant="ghost" className="text-red-500"><TrashIcon className="h-4 w-4"/></Button></li> ))}
                                </ul>
                                <div className="flex items-end space-x-2 pt-2">
                                    <Input label="New Member Name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} containerClassName="flex-grow !mb-0" />
                                    <Select label="Rank" value={newMemberRank} onChange={e => setNewMemberRank(e.target.value)} options={commandRankOptions} containerClassName="flex-grow !mb-0" />
                                    <Button onClick={addHierarchicalMember} className="h-10">Add</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-end space-x-2">
                                    <Input label="Number of peer members:" type="number" min="1" value={numPeers} onChange={e => setNumPeers(parseInt(e.target.value) || 1)} containerClassName="!mb-0" />
                                    <Button onClick={generatePeerMembers} className="h-10">Generate</Button>
                                </div>
                                <ul className="space-y-1 pt-2">
                                    {teamDetails.members.map(m => (<li key={m.id} className="flex justify-between items-center bg-white dark:bg-neutral-900 p-1 rounded border border-slate-300 dark:border-neutral-700"><Input value={m.name} onChange={e => updateMemberName(m.id, e.target.value)} containerClassName="!mb-0 flex-grow" /><Button onClick={() => deleteMember(m.id)} variant="ghost" size="sm" className="text-red-500 ml-2"><TrashIcon className="h-4 w-4"/></Button></li>))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Role Definition */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">2. Define Team Roles</label>
                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Define operational roles (e.g., "Pilot Flying", "Surgeon on Call") and their authority level for the diagram (lower number is higher).</p>
                    <ul className="my-2 space-y-1">
                        {teamDetails.roles.map(r => ( <li key={r.id} className="flex justify-between items-center bg-white dark:bg-neutral-900 p-2 rounded border border-slate-300 dark:border-neutral-700 text-sm"><span>{r.name} (Auth: {r.authorityLevel ?? 'N/A'})</span><Button onClick={() => deleteRole(r.id)} variant="ghost" size="sm" className="text-red-500"><TrashIcon className="h-4 w-4"/></Button></li>))}
                    </ul>
                    <div className="flex items-end space-x-2 mt-3">
                        <Input label="New Role Name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g., Pilot Flying" containerClassName="!mb-0 flex-grow" />
                        <Input label="Authority Level" type="number" value={newRoleAuthLevel} onChange={e => setNewRoleAuthLevel(parseInt(e.target.value))} placeholder="e.g., 10" containerClassName="!mb-0 w-32" />
                        <Button onClick={addRole} className="h-10">Add Role</Button>
                    </div>
                </div>
            </div>

            {/* 3. Contexts and Assignments */}
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">3. Define Operational Contexts & Assign Roles</label>
                <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Define specific situations (e.g., "Takeoff Phase", "Emergency Shutdown") and assign a role to each member within that context.</p>
                    <ul className="my-2 space-y-2">
                        {teamDetails.contexts.map(ctx => (
                            <li key={ctx.id} className="p-3 border border-slate-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900">
                                <div className="flex justify-between items-center mb-2"><p className="font-medium text-slate-800 dark:text-slate-100">{ctx.name}</p><Button onClick={() => deleteContext(ctx.id)} variant="ghost" size="sm" className="text-red-500"><TrashIcon className="h-4 w-4"/></Button></div>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {teamDetails.members.map(member => ( <Select key={member.id} label={member.name} value={ctx.assignments.find(a => a.memberId === member.id)?.roleId || ''} onChange={e => handleAssignmentChange(ctx.id, member.id, e.target.value)} options={[{value: '', label: 'No Role Assigned'}, ...teamDetails.roles.map(r => ({value: r.id, label: r.name}))]} containerClassName="!mb-0"/>))}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-end space-x-2 mt-3">
                        <Input label="New Context Name" value={newContextName} onChange={e => setNewContextName(e.target.value)} placeholder="e.g., Takeoff Phase" containerClassName="!mb-0 flex-grow" />
                        <Button onClick={addContext} className="h-10">Add Context</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ControllersBuilder: React.FC = () => {
    const { controllers, addController, updateController, deleteController } = useAnalysis();

    const [controllerName, setControllerName] = useState('');
    const [controllerType, setControllerType] = useState<ControllerType>(ControllerType.Software);
    const [editingControllerId, setEditingControllerId] = useState<string | null>(null);
    const [teamDetails, setTeamDetails] = useState<TeamDetails>({ isSingleUnit: true, isHierarchical: false, members: [], roles: [], contexts: [] });

    useEffect(() => {
        if (editingControllerId) {
            const ctrl = controllers.find(c => c.id === editingControllerId);
            if (ctrl) {
                setControllerName(ctrl.name);
                setControllerType(ctrl.ctrlType);
                if (ctrl.ctrlType === ControllerType.Team) {
                    setTeamDetails(ctrl.teamDetails || { isSingleUnit: true, isHierarchical: false, members: [], roles: [], contexts: [] });
                }
            }
        } else {
            resetForm();
        }
    }, [editingControllerId, controllers]);

    const resetForm = () => {
        setControllerName('');
        setControllerType(ControllerType.Software);
        setEditingControllerId(null);
        setTeamDetails({ isSingleUnit: true, isHierarchical: false, members: [], roles: [], contexts: [] });
    }

    const handleSaveController = () => {
        if (!controllerName) return;
        const controllerData: Omit<Controller, 'id'> = { name: controllerName, ctrlType: controllerType };

        if(controllerType === ControllerType.Team) {
            controllerData.teamDetails = teamDetails;
        }

        if (editingControllerId) {
            updateController(editingControllerId, controllerData);
        } else {
            addController(controllerData);
        }
        resetForm();
    };

    const editController = (ctrl: Controller) => {
        setEditingControllerId(ctrl.id);
    };

    const controllerTypeOptions = Object.values(ControllerType).map(ct => ({ value: ct, label: `${ct} - ${ct === 'S' ? 'Software' : ct === 'H' ? 'Human' : ct === 'T' ? 'Team' : 'Organization'}`}));


    return (
        <section className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Controllers</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Now, who or what pulls the levers? Add the controllers that manage your components. This can be a person, software, a team, or even an entire organization.</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <Input label="Controller Name" value={controllerName} onChange={e => setControllerName(e.target.value)} placeholder="e.g., Pilot, ECU, Safety Board" />
                    <Select label="Controller Type" value={controllerType} onChange={e => setControllerType(e.target.value as ControllerType)} options={controllerTypeOptions} />
                </div>

                {controllerType === ControllerType.Team && (
                    <div className="mt-4 pt-4 border-t border-slate-300 dark:border-neutral-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">How would you like to model this team?</label>
                        <div className="space-y-2">
                            <div className="flex items-center"><input type="radio" name="team-model" checked={teamDetails.isSingleUnit} onChange={() => setTeamDetails(d => ({...d, isSingleUnit: true}))} className="h-4 w-4 text-sky-600 border-neutral-600 focus:ring-sky-500"/><label className="ml-2 text-sm text-slate-700 dark:text-slate-300">As a single, unified group</label></div>
                            <div className="flex items-center"><input type="radio" name="team-model" checked={!teamDetails.isSingleUnit} onChange={() => setTeamDetails(d => ({...d, isSingleUnit: false}))} className="h-4 w-4 text-sky-600 border-neutral-600 focus:ring-sky-500"/><label className="ml-2 text-sm text-slate-700 dark:text-slate-300">As a group of individual members with roles/contexts</label></div>
                        </div>

                        {!teamDetails.isSingleUnit && (
                            <TeamStructureEditor teamDetails={teamDetails} onTeamDetailsChange={setTeamDetails} />
                        )}
                    </div>
                )}
                <div className="flex space-x-2 pt-4 mt-4 border-t border-slate-300 dark:border-neutral-700">
                    <Button onClick={handleSaveController} leftIcon={<PlusIcon className="w-5 h-5"/>}>
                        {editingControllerId ? 'Update Controller' : 'Add Controller'}
                    </Button>
                    {editingControllerId && <Button onClick={resetForm} variant="secondary">Cancel</Button>}
                </div>
            </div>

            <ul className="space-y-2">
                {controllers.map(ctrl => (
                    <li key={ctrl.id} className={`p-3 border rounded-md shadow-sm ${CONTROLLER_TYPE_COLORS[ctrl.ctrlType]}`}>
                        <div className="flex justify-between items-start w-full">
                            <div>
                                <p className="font-medium">{ctrl.name} <span className="text-xs font-mono opacity-80">({ctrl.ctrlType})</span></p>
                                {ctrl.ctrlType === ControllerType.Team && !ctrl.teamDetails?.isSingleUnit && (
                                    <p className="text-xs opacity-90 mt-1">{ctrl.teamDetails?.members.length || 0} members defined</p>
                                )}
                            </div>
                            <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                                <Button onClick={() => editController(ctrl)} size="sm" variant="ghost">Edit</Button>
                                <Button onClick={() => deleteController(ctrl.id)} size="sm" variant="ghost" className="text-red-500"><TrashIcon className="w-4 h-4"/></Button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default ControllersBuilder;