# Chrome DevTools MCP Installation Guide

## System Requirements
- **Node.js**: 20+ (Current system has Node.js 18+ - may need upgrade)
- **Chrome/Chromium**: Latest version
- **npm**: Latest version
- **Disk Space**: 500MB for MCP server and dependencies

## Installation Steps

### 1. Verify Node.js Version
```bash
node --version
# If < 20, upgrade Node.js:
# nvm install 20
# nvm use 20
```

### 2. Install Chrome DevTools MCP Server
```bash
# Using npx (recommended for testing)
npx -y chrome-devtools-mcp@latest

# Or install globally
npm install -g chrome-devtools-mcp@latest
```

### 3. MCP Client Configuration
Add to your MCP client configuration (e.g., Claude Code):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    }
  }
}
```

### 4. Configuration Options
```bash
# Headless mode (no visible browser)
npx -y chrome-devtools-mcp@latest --headless

# Specific Chrome channel
npx -y chrome-devtools-mcp@latest --channel=dev

# Isolated environment
npx -y chrome-devtools-mcp@latest --isolated
```

## FibreFlow Application Setup

### Target Configuration
- **Application URL**: http://localhost:3005
- **Target Pages**:
  - `/contractors` - Main contractor dashboard
  - `/contractors/create` - Contractor creation form
  - `/api/contractors` - API endpoints testing

### Basic Usage Examples
```bash
# Performance analysis
"Check the performance of http://localhost:3005/contractors"

# Network monitoring
"Analyze the network requests for http://localhost:3005/api/contractors"

# Screenshot testing
"Take a screenshot of http://localhost:3005/contractors on mobile device"
```

## Verification Steps

1. **Test MCP Server Connection**
   ```bash
   npx -y chrome-devtools-mcp@latest --help
   ```

2. **Test Basic Browser Launch**
   ```bash
   npx -y chrome-devtools-mcp@latest --headless
   ```

3. **Test with FibreFlow App**
   - Ensure FibreFlow is running: `PORT=3005 npm start`
   - Use MCP client to connect to http://localhost:3005

## Troubleshooting

### Common Issues
1. **Node.js Version**: Ensure Node.js 20+
2. **Chrome Installation**: Verify Chrome/Chromium is installed
3. **Port Conflicts**: Ensure port 3005 is available
4. **Permissions**: May need sudo for global installation

### Error Messages
- `"Command failed: npx"` → Check npm and Node.js installation
- `"Browser launch failed"` → Verify Chrome installation
- `"Connection refused"` → Ensure FibreFlow app is running

## Next Steps After Installation
1. Verify MCP server connectivity
2. Test basic performance analysis on contractor dashboard
3. Setup automated testing scenarios
4. Configure continuous monitoring