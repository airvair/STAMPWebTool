# Software Design Document - STAMP Web Tool

## Table of Contents

### 1. Introduction

- [1.1. Purpose of this Document](./01-introduction.md#11-purpose-of-this-document)
- [1.2. Scope of the Application](./01-introduction.md#12-scope-of-the-application)
- [1.3. Target Audience](./01-introduction.md#13-target-audience)
- [1.4. Source Documents & References](./01-introduction.md#14-source-documents--references)

### 2. Part 1: Foundational Ideas & System Architecture

#### 2.1. Core Methodologies Explained

- [2.1.1. STAMP (System-Theoretic Accident Model and Processes)](./02-1-core-methodologies.md#211-stamp-system-theoretic-accident-model-and-processes)
- [2.1.2. CAST (Causal Analysis based on STAMP)](./02-1-core-methodologies.md#212-cast-causal-analysis-based-on-stamp)
- [2.1.3. STPA (System-Theoretic Process Analysis)](./02-1-core-methodologies.md#213-stpa-system-theoretic-process-analysis)

#### 2.2. Architectural Overview

- [2.2.1. Technology Stack](./02-2-architectural-overview.md#221-technology-stack)
- [2.2.2. High-Level Architecture Diagram](./02-2-architectural-overview.md#222-high-level-architecture-diagram)
- [2.2.3. State Management Philosophy](./02-2-architectural-overview.md#223-state-management-philosophy)
- [2.2.4. Data Persistence Strategy](./02-2-architectural-overview.md#224-data-persistence-strategy)

#### 2.3. UI/UX Design Principles

- [2.3.1. Visual Identity & Theme](./02-3-ui-ux-design.md#231-visual-identity--theme)
- [2.3.2. Component Design Philosophy](./02-3-ui-ux-design.md#232-component-design-philosophy)
- [2.3.3. Interaction & Usability Goals](./02-3-ui-ux-design.md#233-interaction--usability-goals)

### 3. Part 2: System Requirements

#### 3.1. Functional Requirements

- [3.1.1. Step 1: Startup & Analysis Selection](./03-1-functional-requirements.md#311-step-1-startup--analysis-selection)
- [3.1.2. Step 2 (CAST): Scope, Events, Losses & Hazards](./03-1-functional-requirements.md#312-step-2-cast-scope-events-losses--hazards)
- [3.1.3. Step 2 (STPA): Scope, Losses, Hazards & Constraints](./03-1-functional-requirements.md#313-step-2-stpa-scope-losses-hazards--constraints)
- [3.1.4. Step 3: Control Structure Modeling](./03-1-functional-requirements.md#314-step-3-control-structure-modeling)
- [3.1.5. Step 4: Control Actions (Implicit)](./03-1-functional-requirements.md#315-step-4-control-actions-implicit)
- [3.1.6. Step 5: Unsafe Control Actions (UCAs)](./03-1-functional-requirements.md#316-step-5-unsafe-control-actions-ucas)
- [3.1.7. Step 6: Causal Scenarios](./03-1-functional-requirements.md#317-step-6-causal-scenarios)
- [3.1.8. Step 7: Requirements & Mitigations](./03-1-functional-requirements.md#318-step-7-requirements--mitigations)
- [3.1.9. Step 8: Reporting & Data Export](./03-1-functional-requirements.md#319-step-8-reporting--data-export)

#### 3.2. Non-Functional Requirements

- [3.2.1. Usability](./03-2-non-functional-requirements.md#321-usability)
- [3.2.2. Performance](./03-2-non-functional-requirements.md#322-performance)
- [3.2.3. Data Integrity & Persistence](./03-2-non-functional-requirements.md#323-data-integrity--persistence)
- [3.2.4. Maintainability](./03-2-non-functional-requirements.md#324-maintainability)

### 4. Part 3: Detailed Design & Pseudocode

#### 4.1. Data Structures (Data Models)

- [4.1.1. AnalysisSession](./04-1-data-structures.md#411-analysissession)
- [4.1.2. Core Analysis Artifacts (Loss, Hazard, SystemConstraint)](./04-1-data-structures.md#412-core-analysis-artifacts-loss-hazard-systemconstraint)
- [4.1.3. Control Structure Elements (SystemComponent, Controller, ControlPath, FeedbackPath)](./04-1-data-structures.md#413-control-structure-elements-systemcomponent-controller-controlpath-feedbackpath)
- [4.1.4. UCA & Scenario Elements (ControlAction, UnsafeControlAction, CausalScenario)](./04-1-data-structures.md#414-uca--scenario-elements-controlaction-unsafecontrolaction-causalscenario)
- [4.1.5. Entity Relationship Diagram](./04-1-data-structures.md#415-entity-relationship-diagram)

#### 4.2. State Management (AnalysisContext)

- [4.2.1. Provider Logic Pseudocode](./04-2-state-management.md#421-provider-logic-pseudocode)
- [4.2.2. CRUD Operations Logic](./04-2-state-management.md#422-crud-operations-logic)
- [4.2.3. Logic for Generating Codes (e.g., L-1, H-1.1)](./04-2-state-management.md#423-logic-for-generating-codes-eg-l-1-h-11)

#### 4.3. Key Component Pseudocode

- [4.3.1. SequenceOfEventsBuilder (Drag-and-Drop Logic)](./04-3-key-components.md#431-sequenceofeventsbuilder-drag-and-drop-logic)
- [4.3.2. ControlStructureGraph (Data Transformation & Layout Algorithm)](./04-3-key-components.md#432-controlstructuregraph-data-transformation--layout-algorithm)
- [4.3.3. UnsafeControlActions (Form State & UCA Generation)](./04-3-key-components.md#433-unsafecontrolactions-form-state--uca-generation)
- [4.3.4. CausalScenarios (Conditional Logic based on Controller Type)](./04-3-key-components.md#434-causalscenarios-conditional-logic-based-on-controller-type)

### 5. Appendices

- [A. Glossary of Terms](./05-appendices.md#a-glossary-of-terms)
- [B. Requirements Traceability Matrix](./05-appendices.md#b-requirements-traceability-matrix)

---

## Document Status

This document is being actively developed. Each chapter is being written by independent analysis agents to ensure comprehensive coverage and accuracy.

Last Updated: ${new Date().toISOString()}
