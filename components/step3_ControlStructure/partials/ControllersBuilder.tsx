// airvair/stampwebtool/STAMPWebTool-ec65ad6e324f19eae402e103914f6c7858ecb5c9/components/step3_ControlStructure/partials/ControllersBuilder.tsx
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { Controller, ControllerType, TeamDetails, TeamMember, TeamRole, OperationalContext, RoleAssignment } from '../../../types';
import { CONTROLLER_TYPE_COLORS } from '../../../constants';
import Input from '../../shared/Input';
import Select from '../../shared/Select';
import Button from '../../shared/Button';
import Checkbox from '../../shared/Checkbox';
import Textarea from '../../shared/Textarea';

const PlaceholderPlusIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const PlaceholderTrashIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
        />
    </svg>
);

const TeamDetailsEditor: React.FC<{
    teamDetails: TeamDetails;
    onTeamDetailsChange: (details: TeamDetails) => void;
}> = ({ teamDetails, onTeamDetailsChange }) => {
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRank, setNewMemberRank] = useState('CM-2');
    const [newRoleName, setNewRoleName] = useState('');
    const [newContextName, setNewContextName] = useState('');
    const commandRankOptions = [
        {value: 'CM-1', label: 'CM-1 (Highest Authority)'},
        {value: 'CM-2', label: 'CM-2'},
        {value: 'CM-3', label: 'CM-3'},
        {value: 'CM-4', label: 'CM-4'},
        {value: 'CM-5', label: 'CM-5'},
        {value: 'GR', label: 'GR (Grouped Team)'},
    ];

    const addMember = () => {
        if (!newMemberName) return;
        const newMember: TeamMember = { id: uuidv4(), name: newMemberName, commandRank: newMemberRank };
        onTeamDetailsChange({ ...teamDetails, members: [...teamDetails.members, newMember] });
        setNewMemberName('');
    };

    const deleteMember = (id: string) => {
        const remainingMembers = teamDetails.members.filter(m => m.id !== id);
        // Also remove assignments for the deleted member from all contexts
        const updatedContexts = teamDetails.contexts.map(ctx => ({
            ...ctx,
            assignments: ctx.assignments.filter(a => a.memberId !== id)
        }));
        onTeamDetailsChange({ ...teamDetails, members: remainingMembers, contexts: updatedContexts });
    };

    const addRole = () => {
        if (!newRoleName) return;
        const newRole: TeamRole = { id: uuidv4(), name: newRoleName };
        onTeamDetailsChange({ ...teamDetails, roles: [...teamDetails.roles, newRole] });
        setNewRoleName('');
    };

    const deleteRole = (id: string) => {
        const remainingRoles = teamDetails.roles.filter(r => r.id !== id);
        // Also remove assignments for the deleted role from all contexts
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
                if (roleId) { // if a role is selected
                    if (existingAssignmentIndex > -1) {
                        newAssignments[existingAssignmentIndex].roleId = roleId;
                    } else {
                        newAssignments.push({memberId, roleId});
                    }
                } else { // if placeholder is selected (to remove assignment)
                    if(existingAssignmentIndex > -1) {
                        newAssignments.splice(existingAssignmentIndex, 1);
                    }
                }
                return { ...ctx, assignments: newAssignments };
            }
            return ctx;
        });
        onTeamDetailsChange({ ...teamDetails, contexts: newContexts });
    };

    return (
        <div className="mt-4 space-y-6 p-4 border-t border-slate-300">
            {/* Members */}
            <div className="p-3 bg-slate-200/50 rounded-md">
                <h4 className="font-semibold text-slate-700 mb-2">Team Members</h4>
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
                    <Button onClick={addMember} className="h-10">Add</Button>
                </div>
            </div>
            {/* Roles */}
            <div className="p-3 bg-slate-200/50 rounded-md">
                <h4 className="font-semibold text-slate-700 mb-2">Team Roles</h4>
                <ul className="my-2 space-y-1">
                    {teamDetails.roles.map(r => (
                        <li key={r.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-300">
                            <span>{r.name}</span>
                            <Button onClick={() => deleteRole(r.id)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-100" aria-label="Delete Role"><PlaceholderTrashIcon/></Button>
                        </li>
                    ))}
                </ul>
                <div className="flex items-end space-x-2 mt-3">
                    <Input label="New Role Name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g., Pilot Flying" containerClassName="!mb-0 flex-grow" />
                    <Button onClick={addRole} className="h-10">Add</Button>
                </div>
            </div>
            {/* Contexts */}
            <div className="p-3 bg-slate-200/50 rounded-md">
                <h4 className="font-semibold text-slate-700">Operational Contexts & Role Assignments</h4>
                <p className="text-xs text-slate-600 mb-2">Define different situations (contexts) and assign roles to members for each one.</p>
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
                    <Button onClick={addContext} className="h-10">Add</Button>
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
    const [teamDetails, setTeamDetails] = useState<TeamDetails>({ isSingleUnit: true, members: [], roles: [], contexts: [] });

    useEffect(() => {
        if (editingControllerId) {
            const ctrl = controllers.find(c => c.id === editingControllerId);
            if (ctrl) {
                setControllerName(ctrl.name);
                setControllerType(ctrl.ctrlType);
                if (ctrl.ctrlType === ControllerType.Team) {
                    setTeamDetails(ctrl.teamDetails || { isSingleUnit: true, members: [], roles: [], contexts: [] });
                }
            }
        } else {
            resetForm();
        }
    }, [editingControllerId, controllers]);

    const resetForm = () => {
        setControllerName('');
        setControllerType(ControllerType.Software);
        setTeamDetails({ isSingleUnit: true, members: [], roles: [], contexts: [] });
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

    return (
        <section>
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">2. Controllers (Software, Human, Team, Organization)</h3>
            <div className="p-4 bg-sky-50 border-l-4 border-sky-400 text-sky-800 rounded-r-lg text-sm space-y-2 mb-4">
                <p className="font-semibold">Building Your Control Ladder</p>
                <p>Think of your analysis like building a ladder. The <strong>System Components</strong> you listed in Step 1 are the ground floor. Now, you need to add the rungs of control that lead to the top.</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                    <li>
                        <strong>Add the First Rung:</strong> What directly controls your basic components? This could be a person (a Pilot), a piece of software (an Autopilot), or a team. Add these as your first layer of controllers.
                    </li>
                    <li>
                        <strong>Climb to the Next Rung:</strong> Here's the key step. Look at the new controllers you just added. What controls <em>them</em>? For example, <strong>Airline Policies</strong> (a higher-level controller) guide the <strong>Pilot</strong>. The Pilot, in turn, controls the <strong>Autopilot</strong>.
                    </li>
                </ol>
                <p>
                    Keep asking the question, <em>"What controls this new controller?"</em> and add layers until you reach the top level or the boundary of your analysis.
                </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <Input label="Controller Name" value={controllerName} onChange={e => setControllerName(e.target.value)} placeholder="e.g., Pilot, ECU, Safety Board" />
                    <Select label="Controller Type" value={controllerType} onChange={e => setControllerType(e.target.value as ControllerType)} options={controllerTypeOptions} />
                </div>

                {controllerType === ControllerType.Team && (
                    <div className="mt-4 pt-4 border-t border-slate-300">
                        <h4 className="text-md font-semibold text-slate-800">Team Configuration</h4>
                        <Checkbox
                            label="Consider this team as a single unit (no internal structure)"
                            checked={teamDetails.isSingleUnit}
                            onChange={(e) => setTeamDetails(prev => ({ ...prev, isSingleUnit: e.target.checked }))}
                        />
                        {!teamDetails.isSingleUnit && (
                            <TeamDetailsEditor teamDetails={teamDetails} onTeamDetailsChange={setTeamDetails} />
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
                    <li key={ctrl.id} className={`flex justify-between items-center p-3 border rounded-md shadow-sm ${CONTROLLER_TYPE_COLORS[ctrl.ctrlType]}`}>
                        <div>
                            <span className="font-medium">{ctrl.name}</span>
                            <span className="text-sm"> ({controllerTypeOptions.find(o=>o.value === ctrl.ctrlType)?.label})</span>
                        </div>
                        <div className="flex items-center space-x-1 ml-4">
                            <Button onClick={() => editController(ctrl)} size="sm" variant="ghost" className="text-slate-600 hover:bg-slate-100">
                                Edit
                            </Button>
                            <Button onClick={() => deleteController(ctrl.id)} size="sm" variant="ghost" className="text-red-600 hover:bg-red-100" aria-label="Delete">
                                <PlaceholderTrashIcon />
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default ControllersBuilder;