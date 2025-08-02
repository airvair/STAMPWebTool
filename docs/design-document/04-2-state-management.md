Loaded cached credentials.
Of course. Here is Chapter 4.2 (State Management) for the STAMP Web Tool design document, based on the provided `AnalysisContext.tsx` file.

***

# 4.2 State Management

State management for an active analysis session in the STAMP Web Tool is centralized using React's Context API. This approach provides a single, coherent, and predictable container for all analysis data, including losses, hazards, control actions, and their complex interrelationships. The core of this system is the `AnalysisContext`, which encapsulates the data and the logic required to manipulate it.

This design avoids prop-drilling and provides a clean, decoupled interface for components to consume and modify analysis state. By centralizing data manipulation logic within the context provider, we ensure that business rules, such as generating hierarchical codes and managing cascading deletes, are applied consistently throughout the application.

The primary implementation can be found in `src/context/AnalysisContext.tsx`.

---

### 4.2.1. Provider Logic

The `AnalysisProvider` is the component responsible for holding the state and making it available to all child components in the component tree.

#### **Context Initialization**

The context is first initialized with a `null` or `undefined` default value. This shell is then used to create the Provider component that will supply the actual state and dispatch functions.

**Pseudocode:**

```typescript
// Define the shape of the context's value
interface AnalysisContextState {
  // State properties (e.g., losses, hazards)
  losses: Loss[];
  hazards: Hazard[];
  // ... other entities

  // State manipulation functions (e.g., addLoss, deleteHazard)
  addLoss: (loss: NewLoss) => void;
  deleteHazard: (hazardId: string) => void;
  // ... other functions
}

// Create the context with an undefined initial value
const AnalysisContext = createContext<AnalysisContextState | undefined>(undefined);
```

#### **State Setup**

Within the `AnalysisProvider`, React's `useState` hook is used to manage the state for each primary entity of the STAMP analysis (e.g., Losses, Hazards, System Constraints, Control Actions, etc.). Each piece of state is managed independently, allowing for granular updates.

**Implementation Pattern:**

```typescript
// Inside the AnalysisProvider component
const AnalysisProvider = ({ children, initialAnalysis }) => {
  const [losses, setLosses] = useState<Loss[]>(initialAnalysis?.losses || []);
  const [hazards, setHazards] = useState<Hazard[]>(initialAnalysis?.hazards || []);
  const [systemConstraints, setSystemConstraints] = useState<SystemConstraint[]>(initialAnalysis?.systemConstraints || []);
  const [controlActions, setControlActions] = useState<ControlAction[]>(initialAnalysis?.controlActions || []);
  const [unsafeControlActions, setUnsafeControlActions] = useState<UnsafeControlAction[]>(initialAnalysis?.unsafeControlActions || []);
  // ... and so on for all other entities
```

#### **Provider Composition**

All state variables and the functions that modify them are bundled into a single `value` object. This object is passed to the `AnalysisContext.Provider` component, making the entire state and its manipulation logic available to any component that consumes the context.

**Implementation Pattern:**

```typescript
// Inside the AnalysisProvider, after state and functions are defined
const contextValue = {
  losses,
  hazards,
  systemConstraints,
  controlActions,
  unsafeControlActions,
  // ... other state arrays

  addLoss,
  updateLoss,
  deleteLoss,
  addHazard,
  updateHazard,
  deleteHazard,
  // ... all other CRUD functions
};

return (
  <AnalysisContext.Provider value={contextValue}>
    {children}
  </AnalysisContext.Provider>
);
```

---

### 4.2.2. CRUD Operations Logic

The context provides a stable API for performing Create, Read, Update, and Delete (CRUD) operations on the analysis data. The "Read" operation is implicitly handled by components consuming the state directly from the context.

#### **Create Operations**

Create operations involve adding a new entity to its respective state array. The function typically takes the necessary data for the new entity, generates a unique ID and a hierarchical code, and then adds the new object to the state.

**Pseudocode for `addHazard`:**

```typescript
function addHazard(newHazardData: Omit<Hazard, 'id' | 'code'>):
  // 1. Generate a unique internal ID (e.g., using a UUID library)
  const newId = generateUUID();

  // 2. Generate the next sequential code for this entity type
  const newCode = `H-${hazards.length + 1}`;

  // 3. Create the full entity object
  const newHazardObject = {
    id: newId,
    code: newCode,
    ...newHazardData
  };

  // 4. Update the state by appending the new object
  setHazards([...hazards, newHazardObject]);
```

#### **Update Mechanisms**

Updates are handled immutably. To update an entity, a new array is created by mapping over the existing one. The entity to be updated is identified by its `id`, and a new object with the updated values is returned in its place.

**Pseudocode for `updateControlAction`:**

```typescript
function updateControlAction(updatedControlAction: ControlAction):
  // Use map to create a new array
  const updatedActions = controlActions.map(action =>
    // If the ID matches, return the updated object
    if action.id === updatedControlAction.id:
      return updatedControlAction;
    // Otherwise, return the original object
    else:
      return action;
  );

  // Set the state to the new, updated array
  setControlActions(updatedActions);
```

#### **Delete with Cascading**

Deletion involves filtering an entity out of its state array by `id`. A critical feature of the state logic is handling **cascading deletes** to maintain data integrity. When a parent entity is deleted, all its dependent child entities must also be deleted.

**Pseudocode for `deleteControlAction` (with cascading):**

```typescript
function deleteControlAction(controlActionId: string):
  // 1. Delete the primary entity
  const remainingControlActions = controlActions.filter(ca => ca.id !== controlActionId);
  setControlActions(remainingControlActions);

  // 2. Cascade delete to dependent Unsafe Control Actions (UCAs)
  const remainingUCAs = unsafeControlActions.filter(uca => uca.controlActionId !== controlActionId);
  setUnsafeControlActions(remainingUCAs);

  // 3. (If applicable) Cascade delete to linked Scenarios, etc.
  // ... filter and set state for other dependent entities
```

#### **Relationship Management**

Relationships between entities (e.g., a Hazard is linked to multiple Losses, a UCA is linked to one Control Action) are managed through unique ID references. For example, the `UnsafeControlAction` object contains a `controlActionId` field that stores the `id` of its parent `ControlAction`. This is a standard and efficient way to represent relational data in a document-based state structure.

---

### 4.2.3. Logic for Generating Codes (e.g., L-1, H-1.1)

A key responsibility of the `AnalysisContext` is the algorithmic generation of human-readable, hierarchical codes. These codes provide essential context and traceability within the analysis.

#### **Code Generation Algorithms**

The algorithm varies based on the entity's position in the hierarchy.

1.  **Top-Level Entities (e.g., Losses, Hazards):** These use a simple prefix and a sequential number. The number is derived from the current length of the entity array.
    *   `L-1`, `L-2`, ...
    *   `H-1`, `H-2`, ...

2.  **Hierarchical Entities (e.g., Unsafe Control Actions, Sub-System Constraints):** These entities derive their code from their parent. The code is a composite of the parent's code and a new sequential index within the scope of that parent.

**Pseudocode for Top-Level Code Generation (`addLoss`):**

```typescript
function addLoss(newLossData):
  // Code is based on the number of items that will be in the array
  const newCode = `L-${losses.length + 1}`;
  // ... create new loss object and update state
```

#### **Hierarchical Numbering**

This is the most complex case. To generate a code for a child, the logic must first identify the parent and then count how many other children already exist for that parent.

**Pseudocode for Hierarchical Code Generation (`addUnsafeControlAction`):**

```typescript
function addUnsafeControlAction(controlActionId: string, newUCAData):
  // 1. Find the parent Control Action to get its code (e.g., "CA-1")
  const parentAction = controlActions.find(ca => ca.id === controlActionId);
  if !parentAction:
    throw new Error("Parent Control Action not found");

  // 2. Find all existing UCAs for this specific parent
  const childrenOfParent = unsafeControlActions.filter(uca => uca.controlActionId === controlActionId);

  // 3. The new index is the count of existing children plus one
  const newChildIndex = childrenOfParent.length + 1;

  // 4. Construct the new hierarchical code
  // Example: "UCA-1" (from parent) + ".1" (from index) -> "UCA-1.1"
  const newCode = `${parentAction.code.replace('CA', 'UCA')}.${newChildIndex}`;

  // ... create new UCA object with newCode and update state
```

#### **Uniqueness Guarantees**

Uniqueness is guaranteed by the generation algorithm itself:
*   **Internal IDs (`uuid`):** Universally unique.
*   **Codes (`H-1`, `UCA-1.1`):** Uniqueness is scoped. `H-1` is unique among hazards. `UCA-1.1` is unique because it's tied to the unique parent `CA-1`. The combination of the parent's unique code and the sequential child index ensures the hierarchical code is also unique. The calculation is performed atomically at the time of creation, preventing race conditions in a single-user session.

#### **Parent-Child Relationships**

The logic for creating child entities is always initiated with the parent's unique `id`. This direct linkage is the foundation upon which hierarchical code generation and cascading deletes are built, ensuring the integrity of the analysis structure.
