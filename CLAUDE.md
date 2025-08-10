# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

STPA/CAST Analysis Tool - React-based safety analysis application implementing Systems-Theoretic Process Analysis (STPA) and Causal Analysis using System Theory (CAST) methodologies.

## Architecture

**Tech Stack**: React 19, TypeScript (strict), Vite, Tailwind CSS, React Router, shadcn/ui components

**Core Structure**:

- `src/features/` - Feature modules:
  - `STAMP/` - Safety analysis workflows (step1-5 for STPA/CAST process)
  - `analysis/` - Analysis workspace and session management
  - `projects/` - Project and multi-analysis management
- `src/context/` - Global state (ProjectsContext, AnalysisContext, NavigationContext)
- `src/components/` - Shared UI components (ui/, magicui/, shared/)
- `src/types/` - TypeScript type definitions
- `config/` - Vite, TypeScript, ESLint, Prettier configs

**Routing**: URL-based with pattern `/:projectName/:analysisName` using React Router

## Development Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Type-check and build to dist/
npm run quality      # Run all checks (type-check, lint, format)
npm run typecheck    # Type-check only
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format with Prettier
```

## Code Standards

- **TypeScript**: Strict mode, no implicit any
- **Components**: Function components with hooks, .tsx files
- **Naming**: PascalCase components, camelCase functions, kebab-case files
- **Imports**: Use path aliases (@/, @components/, @features/, etc.)
- **State**: Context API for global state, hooks for local state
- **Styling**: Tailwind CSS, avoid mixing CSS-in-JS with Tailwind

## Working with STPA/CAST Features

The app implements a 5-step safety analysis workflow:

1. **Step 1**: Scope, Losses, Hazards, System Constraints
2. **Step 2**: Control Structure (controllers, paths, components)
3. **Step 3**: Unsafe Control Actions (UCA) and Control Context Actions (UCCA)
4. **Step 4**: Causal Scenarios
5. **Step 5**: Requirements and Mitigations

Each step has builders in `src/features/STAMP/step{n}_*/components/`

## Component Libraries

**Primary**: shadcn/ui (Tailwind-based) - Use for new components
**Installed**: Radix UI primitives, Lucide icons, Framer Motion
**Avoid**: Mixing Material UI with Tailwind components on same page

## Testing & Quality

- No unit test framework currently configured
- Quality gate: `npm run quality` must pass
- Visual changes: Manual testing required
- Production base path: `/STAMPWebTool/` (GitHub Pages)

## Git Workflow

- Branches: `feature/<name>`, `fix/<name>`, `chore/<name>`
- Commits: Use conventional format (feat:, fix:, docs:, refactor:, chore:)
- Pre-commit: Run `npm run quality` and `npm run build`

## Key Context Files

- `src/context/AnalysisContext.tsx` - Analysis session state and operations
- `src/context/ProjectsContext.tsx` - Project and analysis management
- `src/types/types.ts` - Core type definitions for STPA/CAST entities

## Important Notes

- Router uses BrowserRouter with basename for GitHub Pages deployment
- State persistence via localStorage (see ProjectsContext)
- Complex visualizations use ReactFlow for control structure diagrams
- All file operations should use absolute paths from imports
