// airvair/stampwebtool/STAMPWebTool-ec65ad6e324f19eae402e103914f6c7858ecb5c9/components/step3_ControlStructure/partials/ControllersBuilder.tsx
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { Controller, ControllerType, TeamDetails, TeamMember, TeamRole, OperationalContext } from '../../../types';
import { CONTROLLER_TYPE_COLORS } from '../../../constants';
import Input from '../../shared/Input';
import Select from '../../shared/Select';
import Button from '../../shared/Button';

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

const TeamStructureEditor: React.FC<{
    teamDetails: TeamDetails;
    onTeamDetailsChange: (details: TeamDetails) => void;
}> = ({ teamDetails, onTeamDetailsChange }) => {

    // Member state
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRank, setNewMemberRank] = useState('CM-2');
    const [numPeers, setNumPeers] = useState(2);

    // Role State
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleAuthLevel, setNewRoleAuthLevel] = useState(10);


    // Context State
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

    // Member Functions
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

    // Role Functions
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

    // Context Functions
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
        <div className="mt-4 pt-4 border-t border-dashed border-slate-400 space-y-4">
            {/* 1. Member Definition */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">1. Define Team Members</label>
                <div className="space-y-2">
                    <div className="flex items-center"><input type="radio" name="team-hierarchy" checked={!teamDetails.isHierarchical} onChange={() => handleHierarchyChange(false)} className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300"/><label className="ml-2 text-sm">Team members are peers (equal rank)</label></div>
                    <div className="flex items-center"><input type="radio" name="team-hierarchy" checked={!!teamDetails.isHierarchical} onChange={() => handleHierarchyChange(true)} className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300"/><label className="ml-2 text-sm">Team has a formal hierarchy (different ranks)</label></div>
                </div>

                <div className="p-3 bg-slate-200/50 rounded-md mt-2">
                    {teamDetails.isHierarchical ? (
                        <>
                            <ul className="my-2 space-y-1">
                                {teamDetails.members.map(m => (
                                    <li key={m.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-300">
                                        <span>{m.name} ({m.commandRank})</span>
                                        <Button onClick={() => deleteMember(m.id)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" aria-label="Delete Member"><PlaceholderTrashIcon/></Button>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex items-end space-x-2 mt-3">
                                <Input label="New Member Name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} containerClassName="flex-grow !mb-0" />
                                <Select label="Rank" value={newMemberRank} onChange={e => setNewMemberRank(e.target.value)} options={commandRankOptions} containerClassName="flex-grow !mb-0" />
                                <Button onClick={addHierarchicalMember} className="h-10">Add Member</Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-end space-x-2">
                                <Input label="Number of peer members:" type="number" min="1" value={numPeers} onChange={e => setNumPeers(parseInt(e.target.value) || 1)} containerClassName="!mb-0" />
                                <Button onClick={generatePeerMembers} className="h-10">Generate</Button>
                            </div>
                            <ul className="my-2 space-y-1">
                                {teamDetails.members.map(m => (
                                    <li key={m.id} className="flex justify-between items-center bg-white p-1 rounded border border-slate-300">
                                        <Input value={m.name} onChange={e => updateMemberName(m.id, e.target.value)} containerClassName="!mb-0 flex-grow" />
                                        <Button onClick={() => deleteMember(m.id)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 ml-2" aria-label="Delete Member"><PlaceholderTrashIcon/></Button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>

            {/* 2. Role Definition */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">2. Define Team Roles</label>
                <div className="p-3 bg-slate-200/50 rounded-md">
                    <p className="text-xs text-slate-600 mb-2">Define operational roles (e.g., "Operator", "Monitor") and their authority level for the diagram (lower number is higher).</p>
                    <ul className="my-2 space-y-1">
                        {teamDetails.roles.map(r => (
                            <li key={r.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-300">
                                <span>{r.name} (Auth: {r.authorityLevel ?? 'N/A'})</span>
                                <Button onClick={() => deleteRole(r.id)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" aria-label="Delete Role"><PlaceholderTrashIcon/></Button>
                            </li>
                        ))}
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
                <label className="block text-sm font-medium text-slate-700 mb-2">3. Define Operational Contexts & Assign Roles</label>
                <div className="p-3 bg-slate-200/50 rounded-md">
                    <p className="text-xs text-slate-600 mb-2">Define specific situations and assign a role to each member within that context.</p>
                    <ul className="my-2 space-y-2">
                        {teamDetails.contexts.map(ctx => (
                            <li key={ctx.id} className="p-3 border border-slate-300 rounded bg-white">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-medium">{ctx.name}</p>
                                    <Button onClick={() => deleteContext(ctx.id)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" aria-label="Delete Context"><PlaceholderTrashIcon/></Button>
                                </div>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {teamDetails.members.map(member => (
                                        <Select
                                            key={member.id}
                                            label={member.name}
                                            value={ctx.assignments.find(a => a.memberId === member.id)?.roleId || ''}
                                            onChange={e => handleAssignmentChange(ctx.id, member.id, e.target.value)}
                                            options={[{value: '', label: 'No Role Assigned'}, ...teamDetails.roles.map(r => ({value: r.id, label: r.name}))]}
                                            containerClassName="!mb-0"
                                        />
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-end space-x-2 mt-3">
                        <Input label="New Context Name" value={newContextName} onChange={e => setNewContextName(e.target.value)} placeholder="e.g., Autopilot ON, Captain is PF" containerClassName="!mb-0 flex-grow" />
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
        setTeamDetails({ isSingleUnit: true, isHierarchical: false, members: [], roles: [], contexts: [] });
        setEditingControllerId(null);
    }

    const controllerTypeOptions = Object.values(ControllerType).map(ct => ({ value: ct, label: `${ct} (${ct === 'S' ? 'Software' : ct === 'H' ? 'Human' : ct === 'T' ? 'Team' : 'Org'})`}));

    const handleSaveController = () => {
        if (!controllerName) return;

        let controllerData: Omit<Controller, 'id'> = { name: controllerName, ctrlType: controllerType };

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

    const handleTeamModelChange = (isSingle: boolean) => {
        setTeamDetails(prev => ({...prev, isSingleUnit: isSingle, members: []})); // Reset members when changing model type
    };

    return (
        <section>
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">2. Controllers (Software, Human, Team, Organization)</h3>
            <div className="p-4 bg-sky-50 border-l-4 border-sky-400 text-sky-800 rounded-r-lg space-y-2 mb-4">
                <h4 className="font-semibold text-base">Building Your Control Ladder</h4>
                <p className="text-sm">Think of your analysis like building a ladder. The <strong>System Components</strong> you listed in Step 1 are the ground floor. Now, you need to add the rungs of control that lead to the top.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <Input label="Controller Name" value={controllerName} onChange={e => setControllerName(e.target.value)} placeholder="e.g., Pilot, ECU, Safety Board" />
                    <Select label="Controller Type" value={controllerType} onChange={e => setControllerType(e.target.value as ControllerType)} options={controllerTypeOptions} />
                </div>

                {controllerType === ControllerType.Team && (
                    <div className="mt-4 pt-4 border-t border-slate-300">
                        <label className="block text-sm font-medium text-slate-700 mb-2">How would you like to model this team?</label>
                        <div className="space-y-2">
                            <div className="flex items-center"><input type="radio" name="team-model" checked={teamDetails.isSingleUnit} onChange={() => handleTeamModelChange(true)} className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300"/><label className="ml-2">As a single, unified group</label></div>
                            <div className="flex items-center"><input type="radio" name="team-model" checked={!teamDetails.isSingleUnit} onChange={() => handleTeamModelChange(false)} className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300"/><label className="ml-2">As a group of individual members</label></div>
                        </div>

                        {!teamDetails.isSingleUnit && (
                            <TeamStructureEditor teamDetails={teamDetails} onTeamDetailsChange={setTeamDetails} />
                        )}
                    </div>
                )}
                <div className="flex space-x-2 pt-4 mt-4 border-t border-slate-300">
                    <Button onClick={handleSaveController} leftIcon={<PlaceholderPlusIcon />}>
                        {editingControllerId ? 'Update Controller' : 'Add Controller'}
                    </Button>
                    {editingControllerId && <Button onClick={resetForm} variant="secondary">Cancel Edit</Button>}
                </div>
            </div>

            <ul className="space-y-2">
                {controllers.map(ctrl => (
                    <li key={ctrl.id} className={`p-3 border rounded-md shadow-sm ${CONTROLLER_TYPE_COLORS[ctrl.ctrlType]}`}>
                        <div className="flex justify-between items-start w-full">
                            <div>
                                <div className="flex items-center">
                                    <span className="font-medium">{ctrl.name}</span>
                                    <span className="text-sm ml-1">({controllerTypeOptions.find(o=>o.value === ctrl.ctrlType)?.label})</span>
                                </div>
                                {ctrl.ctrlType === ControllerType.Team && ctrl.teamDetails && !ctrl.teamDetails.isSingleUnit && (
                                    <div className="mt-2 text-xs text-slate-700/80 border-t border-slate-400/30 pt-2 font-mono">
                                        <p>Type: {ctrl.teamDetails.isHierarchical ? 'Hierarchical' : 'Peers'}</p>
                                        <p>Members: {ctrl.teamDetails.members.length}</p>
                                        <p>Roles: {ctrl.teamDetails.roles.length}</p>
                                        <p>Contexts: {ctrl.teamDetails.contexts.length}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
                                <Button onClick={() => editController(ctrl)} size="sm" variant="ghost" className="text-slate-600 hover:bg-slate-100">
                                    Edit
                                </Button>
                                <Button onClick={() => deleteController(ctrl.id)} size="sm" variant="ghost" className="text-red-600 hover:bg-red-100" aria-label="Delete">
                                    <PlaceholderTrashIcon />
                                </Button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default ControllersBuilder;