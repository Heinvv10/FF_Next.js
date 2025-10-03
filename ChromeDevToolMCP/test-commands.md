# Chrome DevTools MCP Test Commands

## Basic Performance Testing
```bash
# Test contractor dashboard performance
"Check the performance of http://localhost:3005/contractors"

# Analyze API performance
"Analyze the network requests for http://localhost:3005/api/contractors"

# Screenshot contractor dashboard
"Take a screenshot of http://localhost:3005/contractors"
```

## Mobile Testing
```bash
# Mobile view testing
"Take a screenshot of http://localhost:3005/contractors on mobile device"

"Test the responsive design of http://localhost:3005/contractors/create"
```

## Advanced Analysis
```bash
# Memory usage analysis
"Profile the memory usage of http://localhost:3005/contractors"

# JavaScript profiling
"Analyze JavaScript performance for http://localhost:3005/contractors"

# Network waterfall
"Show me the network waterfall for http://localhost:3005/api/contractors"
```

## Workflow Testing
```bash
# Contractor creation workflow
"Navigate to http://localhost:3005/contractors/create and test form submission"

# Document upload testing
"Test document upload functionality on contractor pages"
```

## Start Testing
1. Ensure FibreFlow is running: `PORT=3005 npm start`
2. Launch MCP server with: `npx -y chrome-devtools-mcp@latest --headless`
3. Use any of the commands above in your MCP client