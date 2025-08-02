# Chapter 2.2: Architectural Overview

## 2.2.1. Technology Stack

The STAMP Web Tool is built on a modern, robust technology stack optimized for complex data visualization, real-time interactivity, and maintainable code architecture.

### Frontend Framework

**React 18.2+ with TypeScript 5.0+**
- Component-based architecture for modular development
- Strong typing for enhanced code reliability and developer experience
- Concurrent features for improved performance
- Strict mode enabled for better development practices

### State Management

**React Context API**
- Native React solution avoiding external dependencies
- Multiple specialized contexts for separation of concerns
- Provider pattern for dependency injection
- Optimized re-render performance through context splitting

### UI Component Libraries

**Primary: shadcn/ui**
- Radix UI primitives for accessibility
- Tailwind CSS for utility-first styling
- Copy-paste component architecture
- Full customization capability

**Styling: Tailwind CSS 3.x**
- Utility-first CSS framework
- JIT compilation for optimized bundle size
- Custom design tokens for consistent theming
- Responsive design utilities

### Routing and Navigation

**React Router v6**
- Client-side routing for SPA functionality
- Nested route support for complex layouts
- Dynamic route parameters for projects and analyses
- Navigation guards for unsaved changes

### Data Visualization

**React Flow**
- Interactive control structure diagrams
- Custom node and edge types
- Automatic layout algorithms
- Pan, zoom, and selection capabilities

**Additional Visualization**
- Chart.js for metrics and reporting
- Custom SVG components for specialized diagrams
- CSS-based animations for UI feedback

### Build Tools and Development

**Vite 5.x**
- Lightning-fast HMR (Hot Module Replacement)
- Optimized production builds
- Native ES modules support
- Plugin ecosystem for extensibility

**Development Tools**
- ESLint for code quality
- Prettier for code formatting
- TypeScript compiler for type checking
- Vitest for unit testing

### Data Management

**Browser Storage**
- localStorage for persistence
- IndexedDB preparation for future scaling
- In-memory state for active sessions
- JSON serialization for data structures

**Export Formats**
- JSON for data interchange
- PDF generation via jsPDF
- DOCX creation with docx library
- CSV export for tabular data

## 2.2.2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser Client                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    React Application Shell                    │  │
│  │                         (App.tsx)                            │  │
│  └─────────────────┬───────────────────────────────────────────┘  │
│                    │                                               │
│  ┌─────────────────▼───────────────────────────────────────────┐  │
│  │                   Context Provider Layer                     │  │
│  │  ┌────────────┐ ┌────────────┐ ┌─────────────┐             │  │
│  │  │  Projects  │ │  Analysis  │ │ Navigation  │             │  │
│  │  │  Context   │ │  Context   │ │   Context   │             │  │
│  │  └────────────┘ └────────────┘ └─────────────┘             │  │
│  └─────────────────┬───────────────────────────────────────────┘  │
│                    │                                               │
│  ┌─────────────────▼───────────────────────────────────────────┐  │
│  │                     Router (React Router)                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │  │   Home   │ │ Project  │ │ Analysis │ │  Export  │      │  │
│  │  │  Route   │ │  Routes  │ │  Routes  │ │  Routes  │      │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │  │
│  └─────────────────┬───────────────────────────────────────────┘  │
│                    │                                               │
│  ┌─────────────────▼───────────────────────────────────────────┐  │
│  │                    Feature Components                        │  │
│  │  ┌────────────────────────────────────────────────────┐    │  │
│  │  │                   STAMP Features                    │    │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │    │  │
│  │  │  │ Step 1  │ │ Step 2  │ │ Step 3  │ │ Step 4  │ │    │  │
│  │  │  │ Scope & │ │Control  │ │  UCAs   │ │Scenarios│ │    │  │
│  │  │  │ Losses  │ │Structure│ │         │ │         │ │    │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │    │  │
│  │  └────────────────────────────────────────────────────┘    │  │
│  └─────────────────┬───────────────────────────────────────────┘  │
│                    │                                               │
│  ┌─────────────────▼───────────────────────────────────────────┐  │
│  │                   Shared Components Layer                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │  │  Forms   │ │  Tables  │ │ Dialogs  │ │  Charts  │      │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │  │
│  └─────────────────┬───────────────────────────────────────────┘  │
│                    │                                               │
│  ┌─────────────────▼───────────────────────────────────────────┐  │
│  │                    Data Access Layer                         │  │
│  │  ┌────────────────┐        ┌────────────────┐              │  │
│  │  │  localStorage  │        │  Export APIs   │              │  │
│  │  │   Adapter      │        │  (PDF, DOCX)   │              │  │
│  │  └────────────────┘        └────────────────┘              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

The application follows a hierarchical component structure:

1. **App Shell**: Root component managing providers and routing
2. **Context Providers**: Global state management layer
3. **Route Components**: Page-level components for each major section
4. **Feature Components**: Business logic implementation for STAMP/STPA
5. **Shared Components**: Reusable UI elements and utilities
6. **Data Layer**: Persistence and export functionality

### Data Flow Architecture

```
User Interaction
       │
       ▼
   Component
       │
   ┌───┴───┐
   │Action │
   └───┬───┘
       │
       ▼
Context Provider
       │
   ┌───┴────────┐
   │State Update│
   └───┬────────┘
       │
       ├─────────► localStorage (Persistence)
       │
       ▼
  Re-render
       │
       ▼
Updated UI
```

## 2.2.3. State Management Philosophy

### Context-Based Architecture

The STAMP Web Tool employs a sophisticated multi-context architecture that separates concerns while maintaining cohesion:

**1. ProjectsContext**
```typescript
interface ProjectsContextType {
  projects: Project[];
  currentProject: Project | null;
  createProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
}
```
- Manages multiple projects and analyses
- Handles project-level operations
- Provides project selection and navigation

**2. AnalysisContext**
```typescript
interface AnalysisContextType {
  // Core data
  losses: Loss[];
  hazards: Hazard[];
  systemConstraints: SystemConstraint[];
  controllers: Controller[];
  controlActions: ControlAction[];
  unsafeControlActions: UnsafeControlAction[];
  
  // CRUD operations
  addLoss: (loss: Loss) => void;
  updateLoss: (id: string, updates: Partial<Loss>) => void;
  deleteLoss: (id: string) => void;
  // ... similar for all entities
  
  // Utility functions
  generateCode: (type: string, parentCode?: string) => string;
  exportData: () => AnalysisData;
  importData: (data: AnalysisData) => void;
}
```
- Central repository for all analysis data
- Implements CRUD operations for all entity types
- Handles code generation and data management

**3. NavigationContext**
```typescript
interface NavigationContextType {
  currentStep: number;
  completedSteps: Set<number>;
  canNavigateToStep: (step: number) => boolean;
  markStepComplete: (step: number) => void;
  navigateToStep: (step: number) => void;
}
```
- Manages workflow progression
- Enforces step dependencies
- Tracks analysis completion status

### State Update Patterns

**Immutable Updates**
```typescript
// Example: Adding a new hazard
const addHazard = (hazard: Hazard) => {
  setHazards(prev => [...prev, hazard]);
  saveToLocalStorage();
};

// Example: Updating a controller
const updateController = (id: string, updates: Partial<Controller>) => {
  setControllers(prev => 
    prev.map(c => c.id === id ? { ...c, ...updates } : c)
  );
  saveToLocalStorage();
};
```

**Optimistic Updates**
- State updates occur immediately for responsive UI
- Persistence happens asynchronously
- Rollback capability for failed operations

**Derived State**
- Computed values are memoized for performance
- Relationships are calculated on-demand
- Caching prevents unnecessary recalculation

## 2.2.4. Data Persistence Strategy

### localStorage Implementation

**Key Structure**
```
stamp-web-tool-project-{projectId}-analysis-{analysisId}-losses
stamp-web-tool-project-{projectId}-analysis-{analysisId}-hazards
stamp-web-tool-project-{projectId}-analysis-{analysisId}-controllers
// ... etc for each entity type
```

**Persistence Layer**
```typescript
class PersistenceManager {
  private getKey(projectId: string, analysisId: string, type: string): string {
    return `stamp-web-tool-project-${projectId}-analysis-${analysisId}-${type}`;
  }
  
  save<T>(projectId: string, analysisId: string, type: string, data: T[]): void {
    const key = this.getKey(projectId, analysisId, type);
    localStorage.setItem(key, JSON.stringify(data));
  }
  
  load<T>(projectId: string, analysisId: string, type: string): T[] {
    const key = this.getKey(projectId, analysisId, type);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  
  clear(projectId: string, analysisId: string): void {
    const prefix = `stamp-web-tool-project-${projectId}-analysis-${analysisId}`;
    Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}
```

### Auto-Save Functionality

**Debounced Persistence**
```typescript
const SAVE_DELAY = 1000; // 1 second

const debouncedSave = useMemo(
  () => debounce((data: AnalysisData) => {
    persistenceManager.saveAnalysis(projectId, analysisId, data);
  }, SAVE_DELAY),
  [projectId, analysisId]
);

// Triggered on any state change
useEffect(() => {
  debouncedSave(currentAnalysisData);
}, [currentAnalysisData, debouncedSave]);
```

### Data Export/Import

**Export Formats**

1. **JSON Export**
   - Complete data structure
   - Preserves all relationships
   - Version metadata included
   - Human-readable format

2. **PDF Generation**
   - Formatted reports
   - Diagrams and visualizations
   - Executive summaries
   - Technical appendices

3. **DOCX Creation**
   - Editable documentation
   - Structured sections
   - Table formatting
   - Embedded diagrams

### Future Scalability Considerations

**Migration Path to Backend Storage**
```typescript
interface StorageAdapter {
  save(key: string, data: any): Promise<void>;
  load(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

// Current implementation
class LocalStorageAdapter implements StorageAdapter {
  // ... localStorage implementation
}

// Future implementation
class CloudStorageAdapter implements StorageAdapter {
  // ... API-based implementation
}
```

**Progressive Enhancement Strategy**

1. **Phase 1 (Current)**: localStorage with 5-10MB limit
2. **Phase 2**: IndexedDB for 50MB+ storage
3. **Phase 3**: Optional cloud sync with conflict resolution
4. **Phase 4**: Real-time collaboration with WebSockets

**Data Migration Utilities**
- Version tracking in saved data
- Automated migration scripts
- Backward compatibility layers
- Data validation and repair

This architecture provides a solid foundation for the current single-user implementation while maintaining clear upgrade paths for future multi-user and cloud-based enhancements.