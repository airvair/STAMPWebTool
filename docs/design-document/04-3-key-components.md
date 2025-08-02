
# 4.3 Key Component Pseudocode

This section provides detailed pseudocode for the core coI have created the `04-3-key-components.md` file with the content you requested. Let me know if you want me to do anything else.
equenceOfEventsBuilder` (Drag-and-Drop Logic)

The `SequenceOfEventsBuilder` allows users to construct a timeline of events leading to a loss scenario. It supports creating, editing, and ordering events through a drag-and-drop interface.

#### **1. Event Management**

State is managed using a React hook, holding an array of event objects.

```typescript
// State for managing the sequence of events
const [events, setEvents] = useState([
  { id: 'evt-1', timestamp: '2023-10-26T10:00:00Z', description: 'System Initialized' },
  { id: 'evt-2', timestamp: '2023-10-26T10:05:00Z', description: 'Operator issues command' },
]);

// Function to add a new event
function addEvent(description, timestamp) {
  const newEvent = {
    id: `evt-${Date.now()}`,
    timestamp,
    description,
  };
  setEvents(prevEvents => [...prevEvents, newEvent]);
}

// Function to update an existing event
function updateEvent(id, updatedFields) {
  setEvents(prevEvents =>
    prevEvents.map(event =>
      event.id === id ? { ...event, ...updatedFields } : event
    )
  );
}
```

#### **2. Drag-and-Drop Implementation**

Leverages a library like `react-beautiful-dnd` to handle reordering.

```typescript
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function onDragEnd(result) {
  // Exit if dropped outside the list
  if (!result.destination) return;

  const reorderedEvents = Array.from(events);
  const [movedEvent] = reorderedEvents.splice(result.source.index, 1);
  reorderedEvents.splice(result.destination.index, 0, movedEvent);

  setEvents(reorderedEvents);
}

// JSX Structure
<DragDropContext onDragEnd={onDragEnd}>
  <Droppable droppableId="timeline">
    {(provided) => (
      <div {...provided.droppableProps} ref={provided.innerRef}>
        {events.map((event, index) => (
          <Draggable key={event.id} draggableId={event.id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {event.description}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

#### **3. Timeline Visualization**

The timeline is rendered as a vertical list, with timestamps and descriptions. Events are sorted by their timestamp for initial display.

```typescript
// Sort events by timestamp before rendering
const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

// Render logic
<div className="timeline-container">
  {sortedEvents.map(event => (
    <div className="timeline-event" key={event.id}>
      <span className="timestamp">{format(new Date(event.timestamp), 'HH:mm:ss')}</span>
      <p className="description">{event.description}</p>
    </div>
  ))}
</div>
```

---

### 4.3.2 `ControlStructureGraph` (Data Transformation & Layout)

This component is responsible for rendering the system's control structure as an interactive graph using `React Flow`.

#### **1. Node and Edge Data Structures**

Defines the shape of data for controllers, controlled processes, sensors, and actuators.

```typescript
// Node structure
interface ControlNode {
  id: string;
  type: 'controller' | 'process' | 'sensor' | 'actuator';
  position: { x: number; y: number };
  data: { label: string; properties: Record<string, any> };
}

// Edge structure for control actions and feedback
interface ControlEdge {
  id: string;
  source: string; // ID of the source node
  target: string; // ID of the target node
  label: string; // e.g., 'Control Action' or 'Feedback'
  animated: boolean;
}
```

#### **2. Layout Algorithm**

Uses a hierarchical layout algorithm (e.g., Dagre) to automatically position nodes.

```typescript
import dagre from 'dagre';

function getLayoutedElements(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 100 }); // Top-to-bottom layout

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return { ...node, position: { x: nodeWithPosition.x, y: nodeWithPosition.y } };
  });

  return { nodes: layoutedNodes, edges };
}
```

#### **3. Interaction Handling**

Manages user interactions like selecting a node to view its details.

```typescript
import { ReactFlow, useOnSelectionChange } from '@react-flow/core';

const [selectedNode, setSelectedNode] = useState(null);

useOnSelectionChange({
  onChange: ({ nodes }) => {
    const selected = nodes.length > 0 ? nodes[0] : null;
    setSelectedNode(selected);
  },
});

// In JSX
<ReactFlow nodes={layoutedNodes} edges={edges} />
{selectedNode && <DetailsPanel node={selectedNode} />}
```

---

### 4.3.3 `UnsafeControlActions` (Form State & UCA Generation)

This component provides a structured way to define Unsafe Control Actions (UCAs) based on control actions and context variables.

#### **1. UCA Form Management**

Manages the state of the UCA definition form.

```typescript
// State for a single UCA entry
const [uca, setUca] = useState({
  controlAction: null, // Selected control action
  type: 'NOT_PROVIDING', // 'NOT_PROVIDING', 'PROVIDING', 'TOO_EARLY_LATE', 'WRONG_ORDER'
  context: '', // Description of the hazardous context
  reason: '', // Rationale for why it's unsafe
});

function handleInputChange(field, value) {
  setUca(prev => ({ ...prev, [field]: value }));
}
```

#### **2. Matrix View Logic**

The UI displays a matrix where rows are control actions and columns are UCA types. This logic determines the content of each cell.

```typescript
const controlActions = fetchControlActions(); // From analysis data
const ucaTypes = ['Not Providing', 'Providing', 'Too Early/Late', 'Wrong Order'];

// Render logic for the matrix
<table>
  <thead>
    <tr>
      <th>Control Action</th>
      {ucaTypes.map(type => <th key={type}>{type}</th>)}
    </tr>
  </thead>
  <tbody>
    {controlActions.map(ca => (
      <tr key={ca.id}>
        <td>{ca.name}</td>
        {ucaTypes.map(type => {
          // Find the UCA that matches the control action and type
          const matchingUca = findUca(ca.id, type);
          return (
            <td onClick={() => openUcaModal(ca, type)}>
              {matchingUca ? 'Defined' : '+'}
            </td>
          );
        })}
      </tr>
    ))}
  </tbody>
</table>
```

#### **3. Validation Logic**

Ensures that a UCA cannot be saved without a control action, type, and context.

```typescript
function isUcaValid(uca) {
  if (!uca.controlAction) return { valid: false, message: 'Control Action is required.' };
  if (!uca.type) return { valid: false, message: 'UCA Type is required.' };
  if (uca.context.trim() === '') return { valid: false, message: 'Context cannot be empty.' };
  return { valid: true };
}

function onSave() {
  const validation = isUcaValid(uca);
  if (validation.valid) {
    saveUcaToDatabase(uca);
  } else {
    showError(validation.message);
  }
}
```

---

### 4.3.4 `CausalScenarios` (Conditional Logic)

This component helps generate causal scenarios by providing templates based on the type of controller involved in a UCA.

#### **1. Scenario Templates**

Stores predefined templates for different causal factors.

```typescript
const SCENARIO_TEMPLATES = {
  HUMAN_ERROR: [
    'Inadequate training or experience',
    'Flawed mental model of the system state',
    'High workload or stress',
  ],
  COMPONENT_FAILURE: [
    'Hardware failure (e.g., sensor malfunction)',
    'Software bug in the control algorithm',
    'Communication link failure',
  ],
  EXTERNAL_EVENT: [
    'Unexpected environmental changes',
    'Interference from another system',
  ],
};
```

#### **2. Controller-Specific Logic**

The system suggests relevant scenario templates based on the controller type (e.g., Human, Automated).

```typescript
function getSuggestedScenarios(controllerType) {
  switch (controllerType) {
    case 'HUMAN_OPERATOR':
      return [...SCENARIO_TEMPLATES.HUMAN_ERROR, ...SCENARIO_TEMPLATES.EXTERNAL_EVENT];
    case 'AUTOMATED_CONTROLLER':
      return [...SCENARIO_TEMPLATES.COMPONENT_FAILURE, ...SCENARIO_TEMPLATES.EXTERNAL_EVENT];
    default:
      return [];
  }
}

// Usage
const controller = getControllerForUca(selectedUca);
const suggestions = getSuggestedScenarios(controller.type);
// Display suggestions to the user
```

#### **3. Causal Factor Management**

Manages the state of causal factors linked to a scenario.

```typescript
const [scenario, setScenario] = useState({
  ucaId: selectedUca.id,
  description: '',
  causalFactors: [], // Array of strings
});

function addCausalFactor(factor) {
  setScenario(prev => ({
    ...prev,
    causalFactors: [...prev.causalFactors, factor],
  }));
}

function removeCausalFactor(index) {
  setScenario(prev => ({
    ...prev,
    causalFactors: prev.causalFactors.filter((_, i) => i !== index),
  }));
}
```
