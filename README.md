# STPA/CAST Analysis Tool

A comprehensive web-based tool for conducting System-Theoretic Process Analysis (STPA) and Causal Analysis based on System Theory (CAST).

## Overview

This tool provides a structured workflow for safety analysis using STPA methodology, helping organizations identify hazards, unsafe control actions, and develop safety requirements for complex systems.

## Features

- **5-Step STPA Process**: Complete implementation of the STPA methodology
- **Interactive Control Structure Diagrams**: Visual representation of system control structures
- **Real-time Collaboration**: Multiple users can work on the same analysis
- **Export Capabilities**: Generate reports in multiple formats
- **Audit Trail**: Track all changes and modifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
├── .claude/          # AI assistant and MCP configurations
├── .github/          # GitHub workflows and actions
├── config/           # Application configuration files
├── docs/             # Documentation and references
├── public/           # Static assets
├── scripts/          # Build and utility scripts
├── src/              # Source code
│   ├── components/   # Reusable UI components
│   ├── features/     # Feature-based modules (STAMP steps)
│   ├── hooks/        # Custom React hooks
│   ├── layouts/      # Page layouts
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript type definitions
└── tests/            # Test files
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Visualization**: D3.js, dagre
- **State Management**: React Context API
- **Code Quality**: ESLint, Prettier

## Development

### Code Quality

```bash
# Run linting
npm run lint

# Type checking
npm run typecheck

# Format code
npm run format
```

### Testing

```bash
npm run test
```

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

MIT License - see LICENSE file for details