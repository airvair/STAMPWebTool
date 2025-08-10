# Chapter 2.1: Core Methodologies Explained

## 2.1.1. STAMP (System-Theoretic Accident Model and Processes)

### Overview

STAMP (System-Theoretic Accident Model and Processes) represents a paradigm shift in how we understand and prevent accidents in complex systems. Developed by Professor Nancy Leveson at MIT, STAMP moves beyond traditional chain-of-events accident models to embrace a systems thinking approach that views safety as an emergent property of the entire socio-technical system.

### Fundamental Concepts

**Systems Theory Foundation**
STAMP is grounded in systems theory, treating safety as a control problem rather than a failure problem. This perspective recognizes that accidents emerge from inadequate control or enforcement of safety constraints throughout the system hierarchy.

**Control Structures**
At the heart of STAMP is the concept of hierarchical control structures where:

- Higher levels impose constraints on lower levels
- Each level has controllers that enforce safety constraints
- Feedback mechanisms provide information about the controlled process state
- Control actions flow downward while feedback flows upward

**Safety as Dynamic Control**
STAMP views safety not as the absence of failures but as the continuous enforcement of constraints on system behavior. This dynamic view acknowledges that systems evolve and that safety must be actively maintained through:

- Appropriate control actions
- Accurate process models
- Timely and accurate feedback
- Constraint enforcement at all levels

### Key Principles

1. **Emergence and Hierarchy**
   - Safety properties emerge from interactions between components
   - Cannot be understood by examining components in isolation
   - Requires analysis of the entire control structure

2. **Communication and Control**
   - Accidents result from inadequate control, not just component failures
   - Control requires effective communication channels
   - Information must flow both up and down the hierarchy

3. **Process Models**
   - Controllers maintain mental or formal models of the controlled process
   - Accidents often result from incorrect process models
   - Models must be continuously updated based on feedback

4. **Constraints vs. Events**
   - Focus on why safety constraints were violated
   - Not just on the sequence of events leading to an accident
   - Proactive identification of potential constraint violations

### Differences from Traditional Models

**Chain-of-Events Models (Swiss Cheese, Domino)**

- Traditional: Linear sequence of failures
- STAMP: Non-linear interactions and emergent behavior

**Root Cause Analysis**

- Traditional: Single root cause identification
- STAMP: Multiple systemic factors and control inadequacies

**Component Reliability Focus**

- Traditional: Prevent component failures
- STAMP: Ensure adequate control even with failures

### Implementation in the Web Tool

The STAMP Web Tool implements these concepts through:

- Visual control structure builders allowing hierarchical modeling
- Control action and feedback path definitions
- Constraint specification and tracking
- Support for complex socio-technical system modeling

## 2.1.2. CAST (Causal Analysis based on STAMP)

### Purpose and Application

CAST (Causal Analysis based on STAMP) is a systematic accident analysis technique built on STAMP principles. Unlike traditional accident investigation methods that seek to assign blame or find a single root cause, CAST aims to understand why the system's control structure was unable to prevent the accident.

### Core Objectives

1. **Systemic Understanding**
   - Identify all control structure inadequacies
   - Understand why controls were ineffective
   - Examine the entire socio-technical system

2. **Learning and Improvement**
   - Generate actionable recommendations
   - Improve system resilience
   - Prevent future accidents through better control

3. **Comprehensive Analysis**
   - Include technical, organizational, and regulatory factors
   - Examine both proximate and systemic causes
   - Consider system dynamics and changes over time

### Key Steps in CAST Analysis

**Step 1: Assemble Basic Information**

- Define the system boundaries
- Identify the accident/incident timeline
- Collect relevant documentation and data
- Establish the analysis scope

**Step 2: Model the Control Structure**

- Identify all controllers at each hierarchical level
- Map control actions and feedback channels
- Document safety constraints and requirements
- Include both formal and informal control mechanisms

**Step 3: Analyze Each Component**
For each controller in the structure:

- Examine safety responsibilities and constraints
- Analyze control actions (or lack thereof)
- Evaluate process models and their accuracy
- Identify control flaws and inadequacies

**Step 4: Identify Control Structure Flaws**

- Missing feedback loops
- Inadequate control actions
- Incorrect process models
- Coordination and communication failures
- Inadequate constraint enforcement

**Step 5: Generate Recommendations**

- Propose control structure improvements
- Suggest new or modified constraints
- Recommend process model updates
- Address systemic and organizational factors

### Relationship to STAMP

CAST operationalizes STAMP principles for accident investigation:

- Uses STAMP's control structure concept as the analysis framework
- Applies systems thinking to understand emergent accident properties
- Focuses on control inadequacies rather than component failures
- Generates systemic rather than symptomatic recommendations

### Implementation in the Web Tool

The CAST module in the STAMP Web Tool provides:

- Structured workflow following CAST steps
- Timeline and event sequence builders
- Control structure modeling specific to accident analysis
- Systematic analysis templates for each controller
- Recommendation tracking and management

## 2.1.3. STPA (System-Theoretic Process Analysis)

### Purpose and Application

STPA (System-Theoretic Process Analysis) is a proactive hazard analysis technique based on STAMP. While CAST analyzes past accidents, STPA identifies potential accidents before they occur by systematically examining how control might be inadequate in a system.

### Core Objectives

1. **Proactive Hazard Identification**
   - Identify hazards before system deployment
   - Find potential control inadequacies
   - Enable prevention rather than reaction

2. **Requirements Generation**
   - Derive safety requirements from identified hazards
   - Ensure comprehensive constraint coverage
   - Guide safe system design

3. **Systematic Analysis**
   - Methodical examination of all control actions
   - Consideration of all hazardous scenarios
   - Complete coverage of the control structure

### Four Main Steps of STPA

**Step 1: Define Purpose of Analysis**

- Identify system-level losses to prevent
- Define system-level hazards
- Establish system safety constraints
- Determine analysis boundaries and scope

**Step 2: Model the Control Structure**

- Identify controllers and controlled processes
- Define control actions and feedback
- Document process models and control algorithms
- Include human controllers and automated systems

**Step 3: Identify Unsafe Control Actions (UCAs)**
For each control action, identify cases where:

1. **Not Provided** - Control action required but not given
2. **Provided Unsafe** - Control action leads to hazard
3. **Wrong Timing** - Too early, too late, wrong order
4. **Wrong Duration** - Applied too long or stopped too soon

**Step 4: Identify Loss Scenarios**
For each UCA, determine how it could occur:

- Unsafe controller behavior
- Inadequate feedback and sensor operation
- Inadequate control path operation
- Unsafe controlled process behavior
- Process model inconsistencies

### Identifying Unsafe Control Actions (UCAs)

**Systematic UCA Analysis**
The Web Tool implements a structured approach:

1. List all control actions from the control structure
2. For each control action and system state combination
3. Evaluate four UCA types systematically
4. Document context and rationale
5. Link UCAs to hazards they could cause

**UCA Context Factors**

- System mode or state
- Environmental conditions
- Other concurrent control actions
- Process state variables
- Time constraints

### Developing Safety Requirements

**From UCAs to Requirements**
Each identified UCA leads to safety requirements:

- Prevent the UCA from occurring
- Mitigate consequences if it occurs
- Detect and respond to the condition
- Ensure robust control implementation

**From Scenarios to Requirements**
Each causal scenario generates requirements addressing:

- Controller algorithm improvements
- Feedback and sensor enhancements
- Control path reliability
- Process behavior constraints
- Process model accuracy

### Implementation in the Web Tool

The STPA module provides comprehensive support:

**Structured Workflow**

- Step-by-step STPA process guidance
- Progress tracking and validation
- Context-sensitive help and examples

**UCA Management**

- Matrix view for systematic UCA identification
- UCA editor with guided analysis
- Automatic hazard linking
- Context and assumption tracking

**Scenario Development**

- Causal factor templates
- Scenario builder interface
- Requirements generation assistance
- Traceability from scenarios to requirements

**Integration Features**

- Reuse control structures across analyses
- Import/export for collaboration
- Comprehensive reporting
- Safety requirement tracking

### Relationship to System Design

STPA in the Web Tool supports iterative design:

- Early hazard identification informs architecture
- Requirements guide detailed design
- Analysis updates as design evolves
- Continuous safety assessment throughout development

The tool's implementation ensures that safety analysis is not a one-time activity but an integral part of the system development lifecycle, with STPA providing the systematic framework for identifying and addressing potential safety issues before they manifest in the operational system.
