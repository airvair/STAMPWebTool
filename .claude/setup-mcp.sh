#!/bin/bash

echo "Setting up MCP servers for STAMP Web Tool..."

# Install MCP servers globally
echo "Installing Sequential Thinking MCP..."
npm install -g @modelcontextprotocol/server-sequential-thinking

echo "Installing Browser Tools MCP..."
npm install -g @agentdeskai/browser-tools-mcp@latest

echo "Installing Playwright MCP..."
npm install -g @playwright/mcp@latest

echo "Installing Figma Context MCP..."
npm install -g figma-developer-mcp

echo "Installing MCP Compass..."
npm install -g @liuyoshio/mcp-compass

echo "MCP setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy claude_desktop_config.json to your Claude Desktop configuration directory"
echo "2. Replace YOUR-FIGMA-API-KEY with your actual Figma API key"
echo "3. Restart Claude Desktop to load the MCP servers"