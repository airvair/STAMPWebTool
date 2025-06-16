import React, { useState } from 'react';
import { useAnalysis } from '../../../hooks/useAnalysis';
import { Controller, ControllerType } from '../../../types';
import { CONTROLLER_TYPE_COLORS } from '../../../constants';
import Input from '../../shared/Input';
import Select from '../../shared/Select';
import Button from '../../shared/Button';

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

const ControllersBuilder: React.FC = () => {
    const { controllers, addController, updateController, deleteController } = useAnalysis();

    const [controllerName, setControllerName] = useState('');
    const [controllerType, setControllerType] = useState<ControllerType>(ControllerType.Software);
    const [editingControllerId, setEditingControllerId] = useState<string | null>(null);

    const controllerTypeOptions = Object.values(ControllerType).map(ct => ({ value: ct, label: `${ct} (${ct === 'S' ? 'Software' : ct === 'H' ? 'Human' : ct === 'T' ? 'Team' : 'Org'})`}));

    const handleSaveController = () => {
        if (!controllerName) return;
        if (editingControllerId) {
          updateController(editingControllerId, { name: controllerName, ctrlType: controllerType });
        } else {
          addController({ name: controllerName, ctrlType: controllerType });
        }
        setControllerName(''); setControllerType(ControllerType.Software); setEditingControllerId(null);
    };

    const editController = (ctrl: Controller) => {
        setEditingControllerId(ctrl.id); setControllerName(ctrl.name); setControllerType(ctrl.ctrlType);
    };

    return (
        <section>
            <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">2. Controllers (Software, Human, Team, Organization)</h3>
            <div className="p-4 bg-sky-50 border-l-4 border-sky-400 text-sky-800 rounded-r-lg mb-4 space-y-2 text-sm">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
              <Input label="Controller Name" value={controllerName} onChange={e => setControllerName(e.target.value)} placeholder="e.g., Pilot, ECU, Safety Board" />
              <Select label="Controller Type" value={controllerType} onChange={e => setControllerType(e.target.value as ControllerType)} options={controllerTypeOptions} />
              <Button onClick={handleSaveController} leftIcon={<PlaceholderPlusIcon />} className="self-end mb-4 h-10">
                {editingControllerId ? 'Update Controller' : 'Add Controller'}
              </Button>
            </div>
            <ul className="space-y-2">
              {controllers.map(ctrl => (
                  <li key={ctrl.id} className={`p-3 border rounded-md shadow-sm flex justify-between items-center ${CONTROLLER_TYPE_COLORS[ctrl.ctrlType]}`}>
                    <div><span className="font-medium">{ctrl.name}</span> <span className="text-sm">({controllerTypeOptions.find(o=>o.value === ctrl.ctrlType)?.label})</span></div>
                    <div className="space-x-2">
                      <Button
                          onClick={() => editController(ctrl)}
                          size="sm"
                          variant="ghost"
                          className="bg-white/50 hover:bg-white/70 p-1"
                          aria-label="Edit"
                      >
                        Edit
                      </Button>
                      <Button
                          onClick={() => deleteController(ctrl.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 bg-white/50 hover:bg-white/70 p-1"
                          aria-label="Delete"
                      >
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