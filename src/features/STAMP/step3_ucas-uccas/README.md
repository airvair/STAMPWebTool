# Step 3: UCAs and UCCAs Module

This module implements Step 3 of the STPA/CAST analysis process, focusing on identifying and analyzing Unsafe Control Actions (UCAs) and Unsafe Combinations of Control Actions (UCCAs).

## 📁 Enterprise-Grade Folder Structure

```
step3_ucas-uccas/
├── components/              # Main orchestrator components
│   ├── UnsafeControlActionsOrchestrator.tsx
│   └── index.ts
├── ucas/                    # UCA-specific module
│   ├── components/          # UCA React components
│   │   ├── uca-editor.tsx
│   │   ├── uca-navigator.tsx
│   │   ├── uca-workspace.tsx
│   │   ├── uca-analysis.tsx
│   │   └── enterprise-uca-matrix.tsx
│   ├── hooks/              # Custom React hooks for UCAs (future)
│   ├── utils/              # UCA utility functions (future)
│   └── index.ts            # UCA module exports
├── uccas/                   # UCCA-specific module (Unsafe Combinations of Control Actions)
│   ├── components/          # UCCA React components
│   │   ├── uccas.tsx       # Legacy placeholder
│   │   └── UCCAPlaceholder.tsx # Enhanced placeholder
│   ├── hooks/              # Custom React hooks for UCCAs (future)
│   ├── utils/              # UCCA utility functions (future)
│   └── index.ts            # UCCA module exports
├── shared/                  # Shared utilities and types (future)
├── index.ts                 # Module exports
└── README.md               # This file
```

## 🏗️ Architecture

### Main Orchestrator

- **UnsafeControlActionsOrchestrator**: Central component that manages the display and interaction between UCA and UCCA subsystems
- Handles section switching based on navigation events
- Manages shared state between UCA and UCCA modules

### UCA Module

The UCA module is fully implemented with the following components:

#### Components

- **uca-editor**: Modal editor for creating and editing UCAs
- **uca-navigator**: Navigation tree for controllers and control actions
- **uca-workspace**: Main workspace with table/grid views and search
- **uca-analysis**: Analysis matrix view for UCA coverage
- **enterprise-uca-matrix**: Advanced enterprise-grade matrix visualization

#### Features

- Seven types of unsafe control actions (Not Provided, Provided, Too Early, Too Late, Wrong Order, Too Long, Too Short)
- Context-based UCA definition
- Hazard linking
- Smart suggestions using AI
- Coverage analysis and reporting
- Multiple view modes (table, grid, matrix)

### UCCA Module

The UCCA module is currently under development:

#### Current Status

- Placeholder component with information about upcoming features
- Basic structure prepared for future implementation

#### Planned Features

- Detection of unsafe control action combinations
- Multi-controller coordination analysis
- Temporal sequencing and timing analysis
- Emergent hazard identification
- Integration with existing UCA analysis

## 🔄 Data Flow

1. **AnalysisContext** provides global state (controllers, control actions, UCAs)
2. **Orchestrator** manages section switching and shared state
3. **UCA/UCCA modules** handle their specific functionality independently
4. **Components** communicate through props and context

## 🚀 Usage

Import the main component in your application:

```typescript
import { UnsafeControlActions } from '@/features/STAMP/step3_ucas-uccas';

// In your component
<UnsafeControlActions />
```

For direct access to submodules:

```typescript
import { UCAEditor, UCAWorkspace } from '@/features/STAMP/step3_ucas-uccas/ucas';
import { UCCAPlaceholder } from '@/features/STAMP/step3_ucas-uccas/uccas';
```

## 🔧 Development Guidelines

### Adding New UCA Features

1. Add components to `ucas/components/`
2. Add hooks to `ucas/hooks/`
3. Add utilities to `ucas/utils/`
4. Export from `ucas/index.ts`

### Implementing UCCA Features

1. Replace placeholder with actual components in `uccas/components/`
2. Follow the same structure as UCA module
3. Ensure integration with the orchestrator

### Shared Functionality

- Place shared utilities in `shared/` directory
- Use for common types, helpers, and constants

## 📝 Type Definitions

The module uses types from `@/types/types.ts`:

- `UnsafeControlAction`
- `Controller`
- `ControlAction`
- `UCAType`
- `Hazard`

## 🎯 Future Enhancements

- [ ] Complete UCCA implementation
- [ ] Add export/import functionality
- [ ] Implement batch operations
- [ ] Add advanced filtering and sorting
- [ ] Create custom hooks for common operations
- [ ] Add unit and integration tests
- [ ] Implement real-time collaboration features
