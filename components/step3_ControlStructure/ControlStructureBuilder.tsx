
import React, { useState, useEffect } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { SystemComponent, Controller, ControlPath, FeedbackPath, ComponentType, ControllerType, Hazard } from '../../types';
import { CONTROLLER_TYPE_COLORS, MISSING_FEEDBACK_COLOR } from '../../constants';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import ControlStructureDiagram from './ControlStructureDiagram';

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


const ControlStructureBuilder: React.FC = () => {
  const {
    systemComponents, addSystemComponent, updateSystemComponent, deleteSystemComponent,
    controllers, addController, updateController, deleteController,
    controlPaths, addControlPath, updateControlPath, deleteControlPath,
    feedbackPaths, addFeedbackPath, updateFeedbackPath, deleteFeedbackPath,
    hazards,
  } = useAnalysis();

  // Component Form
  const [componentName, setComponentName] = useState('');
  const [componentType, setComponentType] = useState<ComponentType>(ComponentType.Physical);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);

  // Controller Form
  const [controllerName, setControllerName] = useState('');
  const [controllerType, setControllerType] = useState<ControllerType>(ControllerType.Software);
  const [editingControllerId, setEditingControllerId] = useState<string | null>(null);

  // Control Path Form
  const [cpSourceCtrlId, setCpSourceCtrlId] = useState('');
  const [cpTargetId, setCpTargetId] = useState('');
  const [cpControls, setCpControls] = useState('');
  const [cpHigherAuth, setCpHigherAuth] = useState(false);
  const [editingCpId, setEditingCpId] = useState<string | null>(null);

  // Feedback Path Form
  const [fpSourceId, setFpSourceId] = useState('');
  const [fpTargetCtrlId, setFpTargetCtrlId] = useState('');
  const [fpFeedback, setFpFeedback] = useState('');
  const [fpIsMissing, setFpIsMissing] = useState(false);
  const [fpIndirect, setFpIndirect] = useState(false);
  const [editingFpId, setEditingFpId] = useState<string | null>(null);


  const componentTypeOptions = Object.values(ComponentType).map(ct => ({ value: ct, label: ct }));
  const controllerTypeOptions = Object.values(ControllerType).map(ct => ({ value: ct, label: `${ct} (${ct === 'S' ? 'Software' : ct === 'H' ? 'Human' : ct === 'T' ? 'Team' : 'Org'})`}));
  
  const controllerOptions = controllers.map(c => ({ value: c.id, label: c.name }));
  const componentOptions = systemComponents.map(sc => ({ value: sc.id, label: sc.name }));
  const pathTargetOptions = [...controllerOptions, ...componentOptions];

  // Auto-import system components from hazards on first render
  useEffect(() => {
    if (hazards.length === 0) return;
    hazards.forEach(h => {
      const base = h.systemComponent.trim();
      if (!base) return;
      const existing = systemComponents.filter(sc => sc.name.startsWith(base));
      const existsExact = systemComponents.some(sc => sc.name === base);
      if (!existsExact) {
        const name = existing.length > 0 ? `${base} ${existing.length + 1}` : base;
        addSystemComponent({ name, type: ComponentType.Physical });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // System Component Handlers
  const handleSaveComponent = () => {
    if (!componentName) return;
    if (editingComponentId) {
      updateSystemComponent(editingComponentId, { name: componentName, type: componentType });
    } else {
      const existing = systemComponents.filter(sc => sc.name.startsWith(componentName));
      const existsExact = systemComponents.some(sc => sc.name === componentName);
      const name = existsExact ? `${componentName} ${existing.length + 1}` : componentName;
      addSystemComponent({ name, type: componentType });
    }
    setComponentName(''); setComponentType(ComponentType.Physical); setEditingComponentId(null);
  };
  const editComponent = (comp: SystemComponent) => {
    setEditingComponentId(comp.id); setComponentName(comp.name); setComponentType(comp.type);
  };

  // Controller Handlers
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

  // Control Path Handlers
  const handleSaveControlPath = () => {
    if (!cpSourceCtrlId || !cpTargetId || !cpControls) return;
    if (editingCpId) {
      updateControlPath(editingCpId, { sourceControllerId: cpSourceCtrlId, targetId: cpTargetId, controls: cpControls, higherAuthority: cpHigherAuth });
    } else {
      addControlPath({ sourceControllerId: cpSourceCtrlId, targetId: cpTargetId, controls: cpControls, higherAuthority: cpHigherAuth });
    }
    setCpSourceCtrlId(''); setCpTargetId(''); setCpControls(''); setCpHigherAuth(false); setEditingCpId(null);
  };
  const editControlPath = (cp: ControlPath) => {
    setEditingCpId(cp.id); setCpSourceCtrlId(cp.sourceControllerId); setCpTargetId(cp.targetId); setCpControls(cp.controls); setCpHigherAuth(!!cp.higherAuthority);
  };

  // Feedback Path Handlers
  const handleSaveFeedbackPath = () => {
    if (!fpSourceId || !fpTargetCtrlId || !fpFeedback) return;
    if (editingFpId) {
      updateFeedbackPath(editingFpId, { sourceId: fpSourceId, targetControllerId: fpTargetCtrlId, feedback: fpFeedback, isMissing: fpIsMissing, indirect: fpIndirect });
    } else {
      addFeedbackPath({ sourceId: fpSourceId, targetControllerId: fpTargetCtrlId, feedback: fpFeedback, isMissing: fpIsMissing, indirect: fpIndirect });
    }
    setFpSourceId(''); setFpTargetCtrlId(''); setFpFeedback(''); setFpIsMissing(false); setFpIndirect(false); setEditingFpId(null);
  };
  const editFeedbackPath = (fp: FeedbackPath) => {
    setEditingFpId(fp.id); setFpSourceId(fp.sourceId); setFpTargetCtrlId(fp.targetControllerId); setFpFeedback(fp.feedback); setFpIsMissing(fp.isMissing); setFpIndirect(!!fp.indirect);
  };
  
  const getItemName = (id: string) => {
    const ctrl = controllers.find(c=>c.id === id);
    if(ctrl) return `${ctrl.name} (Controller)`;
    const comp = systemComponents.find(sc=>sc.id === id);
    if(comp) return `${comp.name} (Component)`;
    return 'Unknown';
  };


  return (
    <div className="space-y-10">
      <p className="text-sm text-slate-600">
        Define the components and controllers in your system, and the control/feedback relationships between them. 
        This forms the basis of your hierarchical control structure.
      </p>

      {/* System Components Section */}
      <section>
        <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">1. System Components (Physical/Process)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
          <Input label="Component Name" value={componentName} onChange={e => setComponentName(e.target.value)} placeholder="e.g., Engine, Database" />
          <Select label="Component Type" value={componentType} onChange={e => setComponentType(e.target.value as ComponentType)} options={componentTypeOptions} />
          <Button onClick={handleSaveComponent} leftIcon={<PlaceholderPlusIcon />} className="self-end mb-4 h-10">
            {editingComponentId ? 'Update Component' : 'Add Component'}
          </Button>
        </div>
        <ul className="space-y-2">
          {systemComponents.map(comp => (
            <li key={comp.id} className="p-3 border border-slate-300 rounded-md bg-white shadow-sm flex justify-between items-center">
              <div><span className="font-medium">{comp.name}</span> <span className="text-sm text-slate-500">({comp.type})</span></div>
              <div className="space-x-2">
                <Button
                  onClick={() => editComponent(comp)}
                  size="sm"
                  variant="ghost"
                  className="p-1"
                  aria-label="Edit"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => deleteSystemComponent(comp.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label="Delete"
                >
                  <PlaceholderTrashIcon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Controllers Section */}
      <section>
        <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">2. Controllers (Software, Human, Team, Organization)</h3>
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

      {/* Control Paths Section */}
      <section>
        <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">3. Control Paths (Controller ➔ Target)</h3>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 space-y-4">
          <Select label="Source Controller" value={cpSourceCtrlId} onChange={e => setCpSourceCtrlId(e.target.value)} options={[{value: '', label: 'Select Source Controller'}, ...controllerOptions]} placeholder="Select Source Controller" />
          <Select label="Target (Component or Controller)" value={cpTargetId} onChange={e => setCpTargetId(e.target.value)} options={[{value: '', label: 'Select Target'}, ...pathTargetOptions]} placeholder="Select Target" />
          <Textarea label="Controls (comma-separated list of control actions)" value={cpControls} onChange={e => setCpControls(e.target.value)} placeholder="e.g., SET_SPEED, TOGGLE_POWER, SEND_DATA" />
          <Checkbox label="Target controller has higher authority?" checked={cpHigherAuth} onChange={e => setCpHigherAuth(e.target.checked)} />
          <Button onClick={handleSaveControlPath} leftIcon={<PlaceholderPlusIcon />}>
            {editingCpId ? 'Update Control Path' : 'Add Control Path'}
          </Button>
        </div>
        <ul className="space-y-2">
          {controlPaths.map(cp => (
            <li key={cp.id} className="p-3 border border-slate-300 rounded-md bg-white shadow-sm">
              <p><span className="font-semibold">{getItemName(cp.sourceControllerId)}</span> ➔ <span className="font-semibold">{getItemName(cp.targetId)}</span></p>
              <p className="text-sm text-slate-600">Controls: {cp.controls}</p>
              {cp.higherAuthority && <p className="text-xs text-slate-500">Target has higher authority</p>}
              <div className="mt-1 space-x-2">
                <Button
                  onClick={() => editControlPath(cp)}
                  size="sm"
                  variant="ghost"
                  className="p-1"
                  aria-label="Edit"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => deleteControlPath(cp.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label="Delete"
                >
                  <PlaceholderTrashIcon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Feedback Paths Section */}
      <section>
        <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">4. Feedback Paths (Source ➔ Controller)</h3>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 space-y-4">
          <Select label="Source (Component or Controller)" value={fpSourceId} onChange={e => setFpSourceId(e.target.value)} options={[{value: '', label: 'Select Source'}, ...pathTargetOptions]} placeholder="Select Source" />
          <Select label="Target Controller" value={fpTargetCtrlId} onChange={e => setFpTargetCtrlId(e.target.value)} options={[{value: '', label: 'Select Target Controller'}, ...controllerOptions]} placeholder="Select Target Controller" />
          <Textarea label="Feedback/Sensors (comma-separated list)" value={fpFeedback} onChange={e => setFpFeedback(e.target.value)} placeholder="e.g., CURRENT_SPEED, TEMP_READING, STATUS_FLAG" />
          <Checkbox label="Is this feedback path missing or inadequate?" checked={fpIsMissing} onChange={e => setFpIsMissing(e.target.checked)} />
          <Checkbox label="Is this feedback indirect via another controller?" checked={fpIndirect} onChange={e => setFpIndirect(e.target.checked)} />
          <Button onClick={handleSaveFeedbackPath} leftIcon={<PlaceholderPlusIcon />}>
            {editingFpId ? 'Update Feedback Path' : 'Add Feedback Path'}
          </Button>
        </div>
        <ul className="space-y-2">
          {feedbackPaths.map(fp => (
            <li key={fp.id} className={`p-3 border rounded-md bg-white shadow-sm ${fp.isMissing ? `${MISSING_FEEDBACK_COLOR} border-dashed` : 'border-slate-300'}`}>
              <p><span className="font-semibold">{getItemName(fp.sourceId)}</span> ➔ <span className="font-semibold">{getItemName(fp.targetControllerId)}</span> {fp.isMissing && <span className="text-sm font-bold">(MISSING/INADEQUATE)</span>}</p>
              <p className="text-sm">Feedback: {fp.feedback}</p>
              {fp.indirect && <p className="text-xs text-slate-500">Indirect feedback</p>}
              <div className="mt-1 space-x-2">
                <Button
                  onClick={() => editFeedbackPath(fp)}
                  size="sm"
                  variant="ghost"
                  className="p-1"
                  aria-label="Edit"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => deleteFeedbackPath(fp.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label="Delete"
                >
                  <PlaceholderTrashIcon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">5. Visualization</h3>
        <div className="overflow-auto border p-2">
          <ControlStructureDiagram />
        </div>
      </section>
    </div>
  );
};

export default ControlStructureBuilder;
    