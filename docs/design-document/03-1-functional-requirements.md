# 3.1 Functional RequiremenI have created the `03-1-functional-requirements.md` file in the `docs/design-document` directory with the content you requested.
 3.1.1 Step 1: Startup & Analysis Selection

*   **Purpose and Goals:** To provide a seamless entry point for users, enabling them to either start a new analysis or resume a previous one.
*   **User Interactions and Workflows:**
    *   Upon launching the tool, users are presented with a startup modal.
    *   Users can select between "STPA" or "CAST" analysis types.
    *   Users can create a new project or select an existing one from a list.
*   **Key Features and Capabilities:**
    *   Analysis type selection (STPA/CAST).
    *   Project creation and selection.
*   **Data Inputs and Outputs:**
    *   **Input:** User selection of analysis type and project.
    *   **Output:** A new or existing analysis workspace is loaded.
*   **Validation Requirements:** The system must ensure that a valid analysis type and project are selected before proceeding.

### 3.1.2 Step 2 (CAST): Scope, Events, Losses & Hazards

*   **Purpose and Goals:** To define the scope of the CAST analysis, including the system, events, losses, and hazards.
*   **User Interactions and Workflows:**
    *   Users define the system boundary and high-level goals.
    *   Users identify and list key events, potential losses, and associated hazards.
*   **Key Features and Capabilities:**
    *   Text inputs for defining scope, events, losses, and hazards.
    *   A shared component for managing losses and hazards.
*   **Data Inputs and Outputs:**
    *   **Input:** Text descriptions of scope, events, losses, and hazards.
    *   **Output:** A structured representation of the defined scope.
*   **Validation Requirements:** The system must ensure that all required fields are filled out before proceeding.

### 3.1.3 Step 2 (STPA): Scope, Losses, Hazards & Constraints

*   **Purpose and Goals:** To define the scope of the STPA analysis, including the system, losses, hazards, and safety constraints.
*   **User Interactions and Workflows:**
    *   Users define the system boundary and high-level goals.
    *   Users identify and list potential losses, associated hazards, and safety constraints.
*   **Key Features and Capabilities:**
    *   Text inputs for defining scope, losses, hazards, and constraints.
    *   A shared component for managing losses and hazards.
*   **Data Inputs and Outputs:**
    *   **Input:** Text descriptions of scope, losses, hazards, and constraints.
    *   **Output:** A structured representation of the defined scope.
*   **Validation Requirements:** The system must ensure that all required fields are filled out before proceeding.

### 3.1.4 Step 3: Control Structure Modeling

*   **Purpose and Goals:** To model the hierarchical control structure of the system.
*   **User Interactions and Workflows:**
    *   Users build a diagram representing the control relationships between system components.
    *   Users can add, edit, and connect controllers, controlled processes, sensors, and actuators.
*   **Key Features and Capabilities:**
    *   A graphical interface for building the control structure diagram.
    *   Drag-and-drop functionality for components.
    *   A dock for visualizing the control structure.
*   **Data Inputs and Outputs:**
    *   **Input:** User-created control structure diagram.
    *   **Output:** A data representation of the control structure.
*   **Validation Requirements:** The system must ensure that the control structure is valid and follows the rules of STPA.

### 3.1.5 Step 4: Control Actions (Implicit)

*   **Purpose and Goals:** To define the control actions that govern the behavior of the system. This step is implicitly handled within the control structure modeling.
*   **User Interactions and Workflows:**
    *   Control actions are defined as part of the connections between components in the control structure diagram.
*   **Key Features and Capabilities:**
    *   Control actions are automatically generated based on the control structure.
*   **Data Inputs and Outputs:**
    *   **Input:** The control structure diagram.
    *   **Output:** A list of control actions.
*   **Validation Requirements:** The system must ensure that control actions are consistent with the control structure.

### 3.1.6 Step 5: Unsafe Control Actions (UCAs)

*   **Purpose and Goals:** To identify unsafe control actions (UCAs) that could lead to hazards.
*   **User Interactions and Workflows:**
    *   Users analyze each control action to determine if it could be unsafe under certain conditions.
    *   Users create a list of UCAs and link them to the corresponding hazards.
*   **Key Features and Capabilities:**
    *   A dedicated workspace for UCA analysis.
    *   An editor for creating and managing UCAs.
    *   A matrix for visualizing the relationships between control actions, UCAs, and hazards.
*   **Data Inputs and Outputs:**
    *   **Input:** User-identified UCAs.
    *   **Output:** A list of UCAs and their associated hazards.
*   **Validation Requirements:** The system must ensure that each UCA is linked to at least one hazard.

### 3.1.7 Step 6: Causal Scenarios

*   **Purpose and Goals:** To identify the causal scenarios that could lead to the identified UCAs.
*   **User Interactions and Workflows:**
    *   For each UCA, users brainstorm and document the scenarios that could cause it to occur.
*   **Key Features and Capabilities:**
    *   A dedicated component for managing causal scenarios.
*   **Data Inputs and Outputs:**
    *   **Input:** User-defined causal scenarios.
    *   **Output:** A list of causal scenarios for each UCA.
*   **Validation Requirements:** The system must ensure that each UCA has at least one causal scenario.

### 3.1.8 Step 7: Requirements & Mitigations

*   **Purpose and Goals:** To develop safety requirements and mitigations to prevent or mitigate the identified causal scenarios.
*   **User Interactions and Workflows:**
    *   Users define safety requirements and design mitigations to address the causal scenarios.
*   **Key Features and Capabilities:**
    *   A dedicated component for managing requirements and mitigations.
*   **Data Inputs and Outputs:**
    *   **Input:** User-defined requirements and mitigations.
    *   **Output:** A list of safety requirements and mitigations.
*   **Validation Requirements:** The system must ensure that each causal scenario is addressed by at least one requirement or mitigation.

### 3.1.9 Step 8: Reporting & Data Export

*   **Purpose and Goals:** To generate comprehensive reports and export analysis data for use in other tools.
*   **User Interactions and Workflows:**
    *   Users can generate a final report summarizing the entire analysis.
    *   Users can export the analysis data in various formats (e.g., JSON, CSV).
*   **Key Features and Capabilities:**
    *   Report generation functionality.
    *   Data export in multiple formats.
*   **Data Inputs and Outputs:**
    *   **Input:** The completed analysis data.
    *   **Output:** A final report or exported data file.
*   **Validation Requirements:** The system must ensure that the generated report and exported data are accurate and complete.