# STAMP Web Tool - Claude AI Integration Guide

This document outlines the Model Context Protocol (MCP) integrations for the STAMP Web Tool project, providing enhanced AI capabilities for development, testing, and design integration.

## Project Overview

STAMP Web Tool is a web-based implementation of the Systems-Theoretic Process Analysis (STPA) methodology for safety analysis. This React-based application guides users through the STPA process with interactive components and visualizations.

## MCP Server Integrations

### 1. Sequential Thinking MCP

**Purpose**: Provides structured thinking framework for complex problem-solving in safety analysis workflows.

**Installation**:
```bash
# Using NPX (recommended)
npx @smithery/mcp-reference-sequential-thinking

# Or using Docker
docker run -i --rm mcp/sequential-thinking
```

**Configuration**: Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["@smithery/mcp-reference-sequential-thinking"]
    }
  }
}
```

**Use Cases**:
- Breaking down complex STPA analysis steps
- Structuring safety requirement derivation
- Organizing causal scenario analysis

### 2. Browser Tools MCP

**Purpose**: Enables browser automation and testing for the STAMP Web Tool interface.

**Installation**:
```bash
# Install Chrome extension first (from Chrome Web Store)
# Then install MCP server
npx @agentdeskai/browser-tools-mcp@latest

# Install local Node server
npx @agentdeskai/browser-tools-server@latest
```

**Configuration**: Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "npx",
      "args": ["@agentdeskai/browser-tools-mcp@latest"]
    }
  }
}
```

**Use Cases**:
- Automated testing of STPA workflow steps
- Capturing control structure diagrams
- Performance monitoring of visualization components
- Accessibility audits for safety-critical interfaces

### 3. Playwright MCP

**Purpose**: Advanced browser automation for testing STPA workflows and control structure interactions.

**Installation**:
```bash
npx @playwright/mcp@latest
```

**Configuration**: Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Use Cases**:
- End-to-end testing of STPA workflow
- Testing control structure diagram interactions
- Validating data persistence across steps
- Cross-browser compatibility testing

### 4. MagicUI MCP

**Purpose**: Provides access to MagicUI component library for building animated UI components and effects in React applications.

**Installation**:
```bash
# Install globally
npm install -g magicui-mcp

# Or use with npx
npx magicui-mcp@latest
```

**Configuration**: Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "magicui": {
      "command": "npx",
      "args": ["magicui-mcp@latest"]
    }
  }
}
```

**Use Cases**:
- Access to animated UI components for STPA visualizations
- Enhanced user interface elements for safety analysis workflows
- Modern design patterns for control structure displays
- Interactive components for hazard and loss presentations

**Website**: https://magicui.design/

### 5. Puppeteer MCP

**Purpose**: Provides direct Puppeteer browser automation capabilities for advanced testing and web scraping scenarios.

**Installation**:
```bash
npm install -g @modelcontextprotocol/server-puppeteer
```

**Configuration**: Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**Use Cases**:
- Direct browser automation with Puppeteer API
- Advanced web scraping for safety documentation
- Performance testing with Chrome DevTools Protocol
- Generating PDFs of safety analysis reports
- Automated screenshot capture of control structures

### 6. MCP Compass

**Purpose**: Discovery and recommendation service for Model Context Protocol (MCP) servers. Helps find and understand available MCP services using natural language queries.

**Installation**:
```bash
npm install -g @liuyoshio/mcp-compass
```

**Configuration**: Add to your MCP client configuration:
```json
{
  "mcpServers": {
    "mcp-compass": {
      "command": "npx",
      "args": ["-y", "@liuyoshio/mcp-compass"]
    }
  }
}
```

**Use Cases**:
- Smart search for MCP services
- Discover new MCP servers for specific tasks
- Get recommendations for MCP integrations
- Access rich metadata about available services
- Real-time updates on MCP ecosystem

**Website**: https://mcphub.io/

## Development Workflow Integration

### Testing Commands

Always run these commands after making changes:
```bash
npm run lint
npm run typecheck
npm run test
```

### Key Project Structure

- `/components/step1_Startup/` - Initial project setup
- `/components/step2_CAST/` - CAST analysis components
- `/components/step2_STPA/` - STPA analysis components
- `/components/step3_ControlStructure/` - Control structure visualization
- `/components/step4_UnsafeControlActions/` - UCA analysis with UCCA integration
- `/components/step5_CausalScenarios/` - Causal scenario development
- `/components/step6_RequirementsMitigations/` - Safety requirements
- `/components/step7_Reporting/` - Report generation

### MCP Usage Guidelines

1. **Sequential Thinking**: Use for complex analysis tasks requiring step-by-step breakdown
2. **Browser Tools**: Use for UI testing and capturing visual states
3. **Playwright**: Use for comprehensive end-to-end testing
4. **MagicUI**: Use for accessing animated UI components and modern design patterns
5. **Puppeteer**: Use for direct browser automation and advanced web scraping
6. **MCP Compass**: Use to discover and find appropriate MCP servers for specific tasks

### Environment Setup

Ensure the following are installed:
- Node.js 18+ (for Playwright MCP) - ✅ Current: v22.13.0
- Chrome browser (for Browser Tools MCP)
- Docker (optional, for Sequential Thinking Docker deployment)

### MCP Server Status

✅ **Sequential Thinking MCP** - @modelcontextprotocol/server-sequential-thinking
✅ **Browser Tools MCP** - @agentdeskai/browser-tools-mcp@latest  
✅ **Playwright MCP** - @playwright/mcp@latest
✅ **MagicUI MCP** - magicui-mcp@latest
✅ **Puppeteer MCP** - @modelcontextprotocol/server-puppeteer
✅ **MCP Compass** - @liuyoshio/mcp-compass

### Quick Setup

Run the automated setup:
```bash
npm run mcp:setup
```

Or manually install:
```bash
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @agentdeskai/browser-tools-mcp@latest
npm install -g @playwright/mcp@latest
npm install -g magicui-mcp
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @liuyoshio/mcp-compass
```

### Security Considerations

- Store sensitive configuration in environment variables
- Use `.env.local` for local development configuration
- All MCP servers operate locally - no data is transmitted to third parties

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**: Ensure all required services are running
2. **Browser Tools Not Working**: Check Chrome extension is installed and enabled
3. **Playwright Timeouts**: Increase timeout values for complex interactions

### Getting Help

- Check individual MCP repository issues for specific problems
- Review MCP client logs for detailed error messages
- Ensure all dependencies are up to date

## Best Practices

1. **Sequential Thinking MCP**: Use for planning complex STPA analysis workflows
2. **Browser Tools**: Run automated tests before committing UI changes
3. **Playwright**: Write comprehensive tests for critical user workflows
4. **Code Quality**: Always run `npm run test` before committing
5. **Documentation**: Keep MCP configurations documented and version controlled

## Development Workflow

1. **Before coding**: Use Sequential Thinking MCP to plan complex features
2. **Testing**: Use Browser Tools and Playwright for comprehensive testing
3. **Before commit**: Run `npm run test` to ensure code quality

## Future Enhancements

Consider adding:
- Custom MCP servers for STPA-specific operations
- Integration with safety analysis databases
- Automated report generation MCPs
- Real-time collaboration MCPs for team analysis