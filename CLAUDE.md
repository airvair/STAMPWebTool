# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The STPA/CAST Analysis Tool is a React-based web application for safety engineering that implements two STAMP methodologies:

- **CAST (Causal Analysis based on STAMP)**: For investigating past incidents or accidents to uncover systemic causal factors
- **STPA (System-Theoretic Process Analysis)**: For proactively designing and analyzing systems to identify potential hazards and prevent accidents

## Development Commands

```bash
# Start development server (with real-time type checking)
npm run dev

# Build for production (includes type checking)
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check           # One-time type check
npm run type-check:watch     # Watch mode type checking

# Code linting and formatting
npm run lint                 # Check for linting issues
npm run lint:fix             # Auto-fix linting issues
npm run format               # Format code with Prettier
npm run format:check         # Check if code is formatted

# Combined quality checks
npm run quality              # Run all checks (type-check + lint + format:check)
npm run quality:fix          # Run type-check + lint:fix + format
```

**Development Experience**: 
- Real-time type checking via `vite-plugin-checker` (non-blocking)
- ESLint with modern flat config for React + TypeScript
- Prettier with TailwindCSS class sorting
- VS Code integration for automatic formatting and linting

## Architecture Overview

### Multi-Step Wizard Flow
The application uses a step-based workflow with methodology-specific paths:
- CAST: `/cast/step2` → `/analysis/step3` → `/analysis/step4` → `/analysis/step5` → `/analysis/step6` → `/analysis/step7`
- STPA: `/stpa/step2` → `/analysis/step3` → `/analysis/step4` → `/analysis/step5` → `/analysis/step6` → `/analysis/step7`

### State Management
- **Global State**: Managed via React Context (`AnalysisContext`) and custom `useAnalysis` hook
- **Persistence**: All state is automatically persisted to LocalStorage
- **CRUD Operations**: Generic `createCrudOperations` factory provides consistent entity management patterns

### Key Components Organization
Components are organized in numbered directories corresponding to analysis steps:
- `components/step1_Startup/`: Initial analysis type selection
- `components/step2_CAST/` & `components/step2_STPA/`: Methodology-specific setup
- `components/step3_ControlStructure/`: Interactive control structure diagrams
- `components/step4_UnsafeControlActions/`: UCA identification and analysis
- `components/step5_CausalScenarios/`: Causal scenario development
- `components/step6_RequirementsMitigations/`: Requirements and mitigations
- `components/step7_Reporting/`: Report generation and export

### Visualization System
- **ReactFlow 11.11.4**: Interactive control structure diagrams
- **Dagre 0.8.5**: Automatic graph layout with collision detection
- **Custom Nodes**: Specialized nodes for different controller types (Software, Human, Team, Organization)
- **Team Visualization**: Advanced team structures with hierarchical roles and operational contexts

## Technology Stack

- **React 19.1.0** with TypeScript
- **Vite** for build tooling
- **ReactFlow 11.11.4** for diagrams
- **Dagre 0.8.5** for graph layout
- **TailwindCSS** for styling
- **React Router DOM** for navigation
- **UUID** for unique identifiers

## Key Data Models

The application uses comprehensive TypeScript interfaces defined in `types.ts`:

```typescript
interface AnalysisSession {
  id: string;
  analysisType: 'CAST' | 'STPA';
  title: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentStep: string;
  scope?: string;
}

interface Controller {
  id: string;
  name: string;
  ctrlType: 'S' | 'H' | 'T' | 'O'; // Software, Human, Team, Organization
  description?: string;
  responsibilities?: string;
  teamDetails?: TeamDetails; // For team controllers
  fiveFactorArchetype?: FiveFactorArchetype; // For human controllers
  // ... positioning and hierarchy fields
}

interface UnsafeControlAction {
  id: string;
  controllerId: string;
  controlActionId: string;
  ucaType: UCAType; // 7 different types
  context: string;
  hazardIds: string[];
  code: string; // Auto-generated (UCA-1, UCA-2, etc.)
}
```

## Development Patterns & Best Practices

### Path Aliases
Always use the `@/` prefix for internal imports:
```typescript
import { useAnalysis } from '@/hooks/useAnalysis';
import { AnalysisType } from '@/types';
```

### State Updates
Use the AnalysisContext dispatch methods for all state changes:
```typescript
const { addController, updateController, deleteController } = useAnalysis();
```

### TypeScript Standards
- **Strict Mode**: Enabled with comprehensive linting rules
- **Explicit Types**: Prefer `interface` for object shapes
- **Enums**: Used for controlled vocabularies (UCAType, ControllerType, etc.)

### CRUD Operations
Use the generic `createCrudOperations` factory for consistent entity management:
```typescript
const componentOps = createCrudOperations(setSystemComponents, systemComponents);
```

### Visualization Updates
When modifying ReactFlow diagrams:
1. Update data transformation in `graphUtils/dataTransformation.ts`
2. Ensure layout recalculation using Dagre-based layout engine
3. Handle collision detection for complex team structures

## Project Structure

```
/
├── components/
│   ├── layout/              # Main layout and stepper
│   ├── shared/              # Reusable UI components
│   ├── step1_Startup/       # Analysis type selection
│   ├── step2_CAST/          # CAST-specific setup
│   ├── step2_STPA/          # STPA-specific setup
│   ├── step3_ControlStructure/ # Control structure builder
│   ├── step5_UnsafeControlActions/ # UCA analysis
│   ├── step6_CausalScenarios/   # Scenario development
│   ├── step7_RequirementsMitigations/ # Requirements
│   └── step8_Reporting/     # Report generation
├── contexts/
│   └── AnalysisContext.tsx  # Global state management
├── hooks/
│   └── useAnalysis.ts       # Analysis state hook
├── types.ts                 # TypeScript type definitions
├── constants.ts             # Application constants and configurations
└── App.tsx                  # Main application routing
```

## Safety Engineering Context

### STPA (System-Theoretic Process Analysis)
1. **Define Purpose**: Identify unacceptable losses and system-level hazards
2. **Model Control Structure**: Create hierarchical control structure diagrams
3. **Identify UCAs**: Systematically identify unsafe control actions
4. **Identify Loss Scenarios**: Analyze causal scenarios for each UCA

### CAST (Causal Analysis based on STAMP)
1. **Define System & Losses**: Establish scope and sequence of events
2. **Model Safety Control Structure**: Reconstruct control structure at time of incident
3. **Analyze Control Flaws**: Identify why safety controls failed
4. **Generate Recommendations**: Develop specific mitigation strategies

Both methodologies share common steps 3-8 in the application workflow, with methodology-specific variations in analysis approach and data interpretation.