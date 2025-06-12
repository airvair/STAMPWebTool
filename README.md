# STPA/CAST Analysis Tool

A web application that guides you through System-Theoretic Process Analysis (STPA) and Causal Analysis based on STAMP (CAST). The tool provides a step-by-step workflow to document losses, hazards, control structures, causal scenarios and mitigation requirements.

## Features

- Multi-step wizard for STPA and CAST methodologies
- Visual control structure builder
- Enumeration of Unsafe Control Actions and scenario generation
- Reporting module for creating analysis summaries
- Built with React, TypeScript and Vite

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 16 or higher

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

### Development
Run the app with hot reloading:
```bash
npm run dev
```

### Production Build
Create an optimized build in the `dist` directory:
```bash
npm run build
```
You can preview the production build locally with:
```bash
npm run preview
```

## Project Structure
- `components/` – page and UI components for each analysis step
- `contexts/` – React context for shared state
- `hooks/` – custom hooks used by the application
- `constants.ts` and `types.ts` – shared types and configuration values

## License
This project is provided without a specific license. Use at your own discretion.
