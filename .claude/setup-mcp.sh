#!/bin/bash

# Setup MCP servers for STAMP Web Tool

echo "Setting up MCP servers..."

# Install Sequential Thinking MCP
echo "Installing Sequential Thinking MCP..."
npm install -g @modelcontextprotocol/server-sequential-thinking

# Install other MCP servers mentioned in CLAUDE.md
echo "Installing Browser Tools MCP..."
npm install -g @agentdeskai/browser-tools-mcp@latest
npm install -g @agentdeskai/browser-tools-server@latest

echo "Installing Playwright MCP..."
npm install -g @playwright/mcp@latest

echo "Installing MagicUI MCP..."
npm install -g magicui-mcp

echo "Installing Puppeteer MCP..."
npm install -g @modelcontextprotocol/server-puppeteer

echo "Installing MCP Compass..."
npm install -g @liuyoshio/mcp-compass

echo "MCP servers setup complete!"
echo "You can now use the following MCP servers:"
echo "  - Sequential Thinking MCP: npx @modelcontextprotocol/server-sequential-thinking"
echo "  - Browser Tools MCP: npx @agentdeskai/browser-tools-mcp@latest"
echo "  - Playwright MCP: npx @playwright/mcp test"
echo "  - MagicUI MCP: magicui-mcp preview"
echo "  - Puppeteer MCP: npx @modelcontextprotocol/server-puppeteer"
echo "  - MCP Compass: npx @liuyoshio/mcp-compass"