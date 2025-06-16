import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAnalysis } from '../../hooks/useAnalysis';
import { SystemComponent, Controller, ControlPath, FeedbackPath, ComponentType, ControllerType, CommunicationPath, AnalysisType, ControlAction } from '../../types';
import { CONTROLLER_TYPE_COLORS, MISSING_FEEDBACK_COLOR } from '../../constants';
import { GLOSSARY } from '../../constants';
import Tooltip from '../shared/Tooltip';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import Textarea from '../shared/Textarea';
import Checkbox from '../shared/Checkbox';
import CastControlStructureDiagram from './CastControlStructureDiagram';
import StpaControlStructureDiagram from './StpaControlStructureDiagram';

const downloadSvg = (svg: SVGSVGElement | null) => {
  if (!svg) return;
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);
  if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
    source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'control-structure.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

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
    analysisSession,
    systemComponents, addSystemComponent, updateSystemComponent, deleteSystemComponent,
    controllers, addController, updateController, deleteController,
    controlPaths, addControlPath, updateControlPath, deleteControlPath,
    controlActions, addControlAction, deleteControlAction, // Added controlActions context
    feedbackPaths, addFeedbackPath, updateFeedbackPath, deleteFeedbackPath,
    communicationPaths, addCommunicationPath, updateCommunicationPath, deleteCommunicationPath,
    hazards,
  } = useAnalysis();

  const svgRef = useRef<SVGSVGElement>(null);

  const handleExportSvg = () => downloadSvg(svgRef.current);

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

  // Communication Path Form
  const [commSourceId, setCommSourceId] = useState('');
  const [commTargetId, setCommTargetId] = useState('');
  const [commDescription, setCommDescription] = useState('');
  const [editingCommId, setEditingCommId] = useState<string | null>(null);


  const componentTypeOptions = Object.values(ComponentType).map(ct => ({ value: ct, label: ct }));
  const controllerTypeOptions = Object.values(ControllerType).map(ct => ({ value: ct, label: `${ct} (${ct === 'S' ? 'Software' : ct === 'H' ? 'Human' : ct === 'T' ? 'Team' : 'Org'})`}));

  const controllerOptions = controllers.map(c => ({ value: c.id, label: c.name }));
  const componentOptions = systemComponents.map(sc => ({ value: sc.id, label: sc.name }));
  const pathTargetOptions = [...controllerOptions, ...componentOptions];

  const selectedControllerForCP = controllers.find(c => c.id === cpSourceCtrlId);

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

  // Control Path & Control Action Handlers
  const handleSaveControlPath = () => {
    if (!cpSourceCtrlId || !cpTargetId || !cpControls) return;

    // Parse the control actions string into individual action objects
    const parsedActions = cpControls
        .split(',')
        .map(actionStr => actionStr.trim())
        .filter(actionStr => actionStr.length > 0)
        .map(actionStr => {
          const parts = actionStr.split(/\s+/);
          const verb = parts[0] || '';
          const object = parts.slice(1).join(' ');
          return { verb, object };
        });

    if (editingCpId) {
      // Update the existing ControlPath
      updateControlPath(editingCpId, { sourceControllerId: cpSourceCtrlId, targetId: cpTargetId, controls: cpControls, higherAuthority: cpHigherAuth });

      // Find and delete all old ControlActions linked to this ControlPath
      const oldActions = controlActions.filter(ca => ca.controlPathId === editingCpId);
      oldActions.forEach(ca => deleteControlAction(ca.id));

      // Add the new/updated ControlActions
      parsedActions.forEach(action => {
        addControlAction({
          ...action,
          controllerId: cpSourceCtrlId,
          controlPathId: editingCpId,
          description: '',
          isOutOfScope: false,
        });
      });
    } else {
      // Add a new ControlPath and its associated ControlActions
      const newCpId = uuidv4();
      addControlPath({ id: newCpId, sourceControllerId: cpSourceCtrlId, targetId: cpTargetId, controls: cpControls, higherAuthority: cpHigherAuth });

      parsedActions.forEach(action => {
        addControlAction({
          ...action,
          controllerId: cpSourceCtrlId,
          controlPathId: newCpId,
          description: '',
          isOutOfScope: false,
        });
      });
    }
    setCpSourceCtrlId(''); setCpTargetId(''); setCpControls(''); setCpHigherAuth(false); setEditingCpId(null);
  };

  const editControlPath = (cp: ControlPath) => {
    setEditingCpId(cp.id); setCpSourceCtrlId(cp.sourceControllerId); setCpTargetId(cp.targetId); setCpControls(cp.controls); setCpHigherAuth(!!cp.higherAuthority);
  };

  const handleDeleteControlPath = (pathId: string) => {
    // Cascade delete: also remove linked control actions
    const actionsToDelete = controlActions.filter(ca => ca.controlPathId === pathId);
    actionsToDelete.forEach(ca => deleteControlAction(ca.id));
    deleteControlPath(pathId);
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

  // Communication Path Handlers
  const handleSaveCommunicationPath = () => {
    if (!commSourceId || !commTargetId || !commDescription) return;
    if (commSourceId === commTargetId) {
      alert("A controller cannot communicate with itself.");
      return;
    }
    if (editingCommId) {
      updateCommunicationPath(editingCommId, { sourceControllerId: commSourceId, targetControllerId: commTargetId, description: commDescription });
    } else {
      addCommunicationPath({ sourceControllerId: commSourceId, targetControllerId: commTargetId, description: commDescription });
    }
    setCommSourceId(''); setCommTargetId(''); setCommDescription(''); setEditingCommId(null);
  };
  const editCommunicationPath = (comm: CommunicationPath) => {
    setEditingCommId(comm.id); setCommSourceId(comm.sourceControllerId); setCommTargetId(comm.targetControllerId); setCommDescription(comm.description);
  };

  const getItemName = (id: string) => {
    const ctrl = controllers.find(c=>c.id === id);
    if(ctrl) return `${ctrl.name} (Controller)`;
    const comp = systemComponents.find(sc=>sc.id === id);
    if(comp) return `${comp.name} (Component)`;
    return 'Unknown';
  };

  const renderControlActionExamples = (type: ControllerType | undefined) => {
    if (!type) return null;

    let examples: string[] = [];
    let title = '';

    switch (type) {
      case ControllerType.Human:
        title = 'Human Controller Examples:';
        examples = [
          'Physical actions: Apply brakes, Steer left, Increase throttle',
          'Verbal commands: "Request higher altitude", "Confirm system status"',
          'System interaction: Set autopilot mode, Enter data into FMS',
        ];
        break;
      case ControllerType.Software:
        title = 'Software Controller Examples:';
        examples = [
          'Commands to actuators: SEND_BRAKE_COMMAND(pressure: 50%)',
          'State changes: SET_MODE("standby")',
          'Data output: DISPLAY_WARNING("Engine Overheat")',
          'Calculations: CALCULATE_TRAJECTORY',
        ];
        break;
      case ControllerType.Organisation:
        title = 'Organization Controller Examples:';
        examples = [
          'Policies & Procedures: ISSUE_SAFETY_DIRECTIVE_123, UPDATE_MAINTENANCE_PROCEDURE_4.1',
          'Resource allocation: ALLOCATE_BUDGET_FOR_TRAINING',
          'Personnel actions: HIRE_QUALIFIED_PERSONNEL',
        ];
        break;
      case ControllerType.Team:
        title = 'Team Controller Examples:';
        examples = [
          'Coordinated procedures: EXECUTE_EMERGENCY_SHUTDOWN_CHECKLIST',
          'Formal communication: COMMUNICATE_SYSTEM_STATUS_TO_ATC',
          'Collective decisions: VOTE_TO_DIVERT_FLIGHT',
        ];
        break;
      default:
        return null;
    }

    return (
        <div className="text-xs text-slate-500 mt-1 pl-1">
          <p className="font-semibold">{title}</p>
          <p className="italic">Separate multiple actions with a comma.</p>
          <ul className="list-disc list-inside ml-2">
            {examples.map((ex, i) => <li key={i}>{ex}</li>)}
          </ul>
        </div>
    );
  };


  return (
      <div className="space-y-10">
        <div className="text-sm text-slate-600 space-y-2">
          <p>
            The goal of this analysis is to control or constrain the behavior of the system to prevent an accident or any unwanted behavior. To model this you will be creating a hierarchical control structure. This is not a schematic or organizational chart. Instead, the items on this structure are either something that is controlling something else (a controller), which can be software, human or organization, or a controlled process/item. This tool will guide you through this process.
          </p>
        </div>

        {/* System Components Section */}
        <section>
          <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">1. System Components (Physical/Process)</h3>
          <div className="text-sm text-slate-600 space-y-2 mb-4">
            <p>
              Start at the most basic component in the system you intend to control. In most systems this is the physical system, such as a vehicle, an aircraft, a satellite or similar. If you are analyzing just a component that that is the most basic, which could be something like the brakes, a steering wheel, the engine, or perhaps even a door. It can also be a process if you are analyzing an organization on how it manages a department or even a person, such as the case in health care where the patient might be the most basic process. Regardless, it is the lowest level you are analyzing.
            </p>
            <p className="font-semibold">
              Think about your system. What is the most basic component in your system?
            </p>
          </div>
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

        <div className="p-4 bg-sky-50 border-l-4 border-sky-400 text-sky-800 rounded-r-lg">
          <p className="font-semibold">Next Step: Controllers</p>
          <p className="text-sm mt-1">
            Before adding controllers, please take a moment to ensure all the basic physical and process components of your system have been defined above. A complete foundation of controlled items will make defining the controllers and their relationships more straightforward and accurate. You can return later if you need to add more components.
          </p>
        </div>

        {/* Controllers Section */}
        <section>
          <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">2. Controllers (Software, Human, Team, Organization)</h3>
          <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-4 mb-4 text-sm space-y-2">
            <h4 className="font-bold text-md">Building Your Control Ladder</h4>
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

        {/* Control Paths Section */}
        <section>
          <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">3. Control Paths & Actions</h3>
          <div className="text-sm text-slate-600 space-y-2 mb-4">
            <p>
              Define the control relationships between controllers and the components (or other controllers). Think about how commands flow downwards. For each path, list all control actions the controller can provide.
            </p>
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
                label={
                  <>
                    2. Next, select the <Tooltip content={GLOSSARY['Controller']}>controller</Tooltip> that provides the control action:
                  </>
                }
                value={cpSourceCtrlId}
                onChange={e => setCpSourceCtrlId(e.target.value)}
                options={[{value: '', label: 'Select a source controller...'}, ...controllerOptions]}
                disabled={!cpTargetId}
            />
            <div>
              <label htmlFor="cp-controls-input" className="block text-sm font-medium text-slate-700 mb-1">
                3. Describe all the <Tooltip content={GLOSSARY['Control Action']}>control action(s)</Tooltip> available to that controller (comma-separated):
              </label>
              <Textarea
                  id="cp-controls-input"
                  value={cpControls}
                  onChange={e => setCpControls(e.target.value)}
                  placeholder="e.g., INCREASE PITCH, SET ALTITUDE, DECREASE POWER"
                  disabled={!cpSourceCtrlId}
              />
            </div>
            {renderControlActionExamples(selectedControllerForCP?.ctrlType)}
            <Checkbox label="Does the item being controlled have higher authority than the controller? (This is rare and usually applies to oversight relationships)" checked={cpHigherAuth} onChange={e => setCpHigherAuth(e.target.checked)} />
            <Button onClick={handleSaveControlPath} leftIcon={<PlaceholderPlusIcon />}>
              {editingCpId ? 'Update Control Path & Actions' : 'Add Control Path & Actions'}
            </Button>
          </div>
          <ul className="space-y-2">
            {controlPaths.map(cp => (
                <li key={cp.id} className="p-3 border border-slate-300 rounded-md bg-white shadow-sm">
                  <p><span className="font-semibold">{getItemName(cp.sourceControllerId)}</span> → <span className="font-semibold">{getItemName(cp.targetId)}</span></p>
                  <p className="text-sm text-slate-600">Controls: {cp.controls}</p>
                  {cp.higherAuthority && <p className="text-xs text-slate-500">Target has higher authority</p>}
                  <div className="mt-1 space-x-2">
                    <Button onClick={() => editControlPath(cp)} size="sm" variant="ghost" className="p-1" aria-label="Edit">Edit</Button>
                    <Button onClick={() => handleDeleteControlPath(cp.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 p-1" aria-label="Delete"><PlaceholderTrashIcon /></Button>
                  </div>
                </li>
            ))}
          </ul>
        </section>

        {/* Feedback Paths Section */}
        <section>
          <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">4. Feedback Paths (Source → Controller)</h3>
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
                  <p><span className="font-semibold">{getItemName(fp.sourceId)}</span> → <span className="font-semibold">{getItemName(fp.targetControllerId)}</span> {fp.isMissing && <span className="text-sm font-bold">(MISSING/INADEQUATE)</span>}</p>
                  <p className="text-sm">Feedback: {fp.feedback}</p>
                  {fp.indirect && <p className="text-xs text-slate-500">Indirect feedback</p>}
                  <div className="mt-1 space-x-2">
                    <Button onClick={() => editFeedbackPath(fp)} size="sm" variant="ghost" className="p-1" aria-label="Edit">Edit</Button>
                    <Button onClick={() => deleteFeedbackPath(fp.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 p-1" aria-label="Delete"><PlaceholderTrashIcon /></Button>
                  </div>
                </li>
            ))}
          </ul>
        </section>

        {/* Communication Links Section */}
        <section>
          <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">5. Communication Links (Controller ↔ Controller)</h3>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 space-y-4">
            <Select label="Controller One" value={commSourceId} onChange={e => setCommSourceId(e.target.value)} options={[{value: '', label: 'Select Controller'}, ...controllerOptions]} />
            <Select label="Controller Two" value={commTargetId} onChange={e => setCommTargetId(e.target.value)} options={[{value: '', label: 'Select Controller'}, ...controllerOptions]} />
            <Textarea label="Description of Communication" value={commDescription} onChange={e => setCommDescription(e.target.value)} placeholder="e.g., Shared status reports, coordination meetings" />
            <Button onClick={handleSaveCommunicationPath} leftIcon={<PlaceholderPlusIcon />}>
              {editingCommId ? 'Update Communication Link' : 'Add Communication Link'}
            </Button>
          </div>
          <ul className="space-y-2">
            {communicationPaths.map(comm => (
                <li key={comm.id} className="p-3 border border-slate-300 rounded-md bg-white shadow-sm">
                  <p><span className="font-semibold">{getItemName(comm.sourceControllerId)}</span> ↔ <span className="font-semibold">{getItemName(comm.targetControllerId)}</span></p>
                  <p className="text-sm text-slate-600">Communication: {comm.description}</p>
                  <div className="mt-1 space-x-2">
                    <Button onClick={() => editCommunicationPath(comm)} size="sm" variant="ghost" className="p-1" aria-label="Edit">Edit</Button>
                    <Button onClick={() => deleteCommunicationPath(comm.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 p-1" aria-label="Delete"><PlaceholderTrashIcon /></Button>
                  </div>
                </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-slate-700 mb-3 border-b pb-2">6. Visualization</h3>
          <div className="mb-2">
            <Button size="sm" variant="secondary" onClick={handleExportSvg}>Download SVG</Button>
          </div>
          <div className="overflow-auto border p-2" style={{height: '70vh', minHeight: '500px'}}>
            {analysisSession?.analysisType === AnalysisType.CAST ? (
                <CastControlStructureDiagram />
            ) : (
                <StpaControlStructureDiagram />
            )}
          </div>
        </section>
      </div>
  );
};

export default ControlStructureBuilder;