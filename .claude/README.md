# Claude MCP Configuration

This directory contains Model Context Protocol (MCP) configuration for enhancing Claude AI's capabilities when working with the STAMP Web Tool project.

## Quick Start

1. Run the setup script:
   ```bash
   ./setup-mcp.sh
   ```

2. Configure your environment:
   - Add your Figma API key to `.env.local`
   - Install Browser Tools Chrome extension

3. Configure your Claude client to use `mcp_config.json`

## Files

- `mcp_config.json` - MCP server configuration
- `setup-mcp.sh` - Automated setup script
- `README.md` - This file

## Available MCP Servers

1. **Sequential Thinking** - Structured problem-solving
2. **Browser Tools** - Browser automation and testing
3. **Figma Context** - Design integration
4. **Playwright** - E2E testing automation

See `/CLAUDE.md` for detailed usage instructions.