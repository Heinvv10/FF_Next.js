#!/usr/bin/env node

/**
 * Warp Development Cycle Automation
 * Handles the complete development workflow for FF_React project
 * 
 * Usage:
 *   node scripts/warp-dev-cycle.js [action]
 * 
 * Actions:
 *   restart    - Stop server, build, start (default)
 *   quick-test - Restart + run smoke tests  
 *   full-cycle - Restart + run all tests + lint
 *   status     - Show current server status
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  PORT: process.env.PORT || 3005,
  BUILD_TIMEOUT: 120000, // 2 minutes
  SERVER_START_TIMEOUT: 30000, // 30 seconds
  TEST_TIMEOUT: 300000, // 5 minutes
};

class WarpDevCycle {
  constructor() {
    this.logFile = path.join(__dirname, '..', 'dev-cycle.log');
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}: ${message}`;
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  async execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 30000;
      this.log(`Executing: ${command}`);
      
      const child = exec(command, {
        cwd: process.cwd(),
        env: { ...process.env, ...options.env },
        timeout
      }, (error, stdout, stderr) => {
        if (error) {
          this.log(`Command failed: ${error.message}`, 'ERROR');
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });

      if (options.showOutput) {
        child.stdout.on('data', (data) => process.stdout.write(data));
        child.stderr.on('data', (data) => process.stderr.write(data));
      }
    });
  }

  async stopServer() {
    try {
      this.log('Stopping existing server...');
      
      // Try multiple approaches to find and stop the server
      const approaches = [
        `pkill -f "next-server"`,
        `pkill -f "next start"`,
        `pkill -f "PORT=${CONFIG.PORT}"`,
        `lsof -ti :${CONFIG.PORT} | xargs -r kill`
      ];
      
      for (const command of approaches) {
        try {
          const result = await this.execCommand(`${command} || true`);
          this.log(`Tried: ${command}`);
        } catch (err) {
          // Continue trying other approaches
        }
      }
      
      // Wait a moment for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify the port is free
      const checkPort = await this.execCommand(`lsof -i :${CONFIG.PORT} || echo "Port free"`);
      if (checkPort.stdout.includes('Port free')) {
        this.log('Server stopped successfully');
        return true;
      } else {
        this.log('Warning: Port may still be in use', 'WARN');
        return false;
      }
    } catch (error) {
      this.log(`Failed to stop server: ${error.message}`, 'WARN');
      return false;
    }
  }

  async buildProject() {
    try {
      this.log('Building project...');
      const result = await this.execCommand('npm run build', {
        timeout: CONFIG.BUILD_TIMEOUT,
        showOutput: true
      });
      this.log('Build completed successfully');
      return true;
    } catch (error) {
      this.log(`Build failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.log(`Starting server on port ${CONFIG.PORT}...`);
      
      const child = spawn('npm', ['start'], {
        env: { ...process.env, PORT: CONFIG.PORT },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true
      });

      let startupComplete = false;
      const startupTimeout = setTimeout(() => {
        if (!startupComplete) {
          this.log('Server startup timeout', 'ERROR');
          child.kill();
          reject(new Error('Server startup timeout'));
        }
      }, CONFIG.SERVER_START_TIMEOUT);

      child.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
          startupComplete = true;
          clearTimeout(startupTimeout);
          this.log(`Server started successfully on port ${CONFIG.PORT}`);
          this.log(`Access at: http://localhost:${CONFIG.PORT}`);
          
          // Detach the process so it continues running
          child.unref();
          resolve(child.pid);
        }
      });

      child.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE') || error.includes('port') && error.includes('already')) {
          this.log(`Port ${CONFIG.PORT} already in use, stopping existing server first...`, 'WARN');
          this.stopServer().then(() => {
            // Retry starting
            setTimeout(() => this.startServer().then(resolve).catch(reject), 2000);
          });
        }
      });

      child.on('error', (error) => {
        clearTimeout(startupTimeout);
        this.log(`Failed to start server: ${error.message}`, 'ERROR');
        reject(error);
      });
    });
  }

  async runTests(type = 'smoke') {
    try {
      this.log(`Running ${type} tests...`);
      let command;
      
      switch (type) {
        case 'smoke':
          command = 'npm run test:e2e:smoke';
          break;
        case 'unit':
          command = 'npm test';
          break;
        case 'e2e':
          command = 'npm run test:e2e';
          break;
        case 'all':
          command = 'npm run test:e2e:smoke && npm test';
          break;
        default:
          command = 'npm run test:e2e:smoke';
      }

      const result = await this.execCommand(command, {
        timeout: CONFIG.TEST_TIMEOUT,
        showOutput: true
      });
      
      this.log(`${type} tests completed successfully`);
      return true;
    } catch (error) {
      this.log(`${type} tests failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runLinting() {
    try {
      this.log('Running linting and formatting checks...');
      await this.execCommand('npm run lint', { showOutput: true });
      await this.execCommand('npm run format:check', { showOutput: true });
      await this.execCommand('npm run antihall', { showOutput: true });
      this.log('Code quality checks passed');
      return true;
    } catch (error) {
      this.log(`Code quality checks failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async getServerStatus() {
    try {
      const { stdout } = await this.execCommand(`lsof -i :${CONFIG.PORT} || echo "No process found"`);
      if (stdout.includes('node') || stdout.includes('npm')) {
        this.log(`Server is running on port ${CONFIG.PORT}`);
        return { running: true, port: CONFIG.PORT };
      } else {
        this.log(`No server found on port ${CONFIG.PORT}`);
        return { running: false, port: CONFIG.PORT };
      }
    } catch (error) {
      this.log(`Failed to check server status: ${error.message}`, 'WARN');
      return { running: false, error: error.message };
    }
  }

  async restart() {
    this.log('=== Starting Development Cycle Restart ===');
    await this.stopServer();
    await this.buildProject();
    await this.startServer();
    this.log('=== Development Cycle Restart Complete ===');
  }

  async quickTest() {
    this.log('=== Starting Quick Test Cycle ===');
    await this.restart();
    await this.runTests('smoke');
    this.log('=== Quick Test Cycle Complete ===');
  }

  async fullCycle() {
    this.log('=== Starting Full Development Cycle ===');
    await this.runLinting();
    await this.restart();
    await this.runTests('all');
    this.log('=== Full Development Cycle Complete ===');
  }
}

// CLI Interface
async function main() {
  const action = process.argv[2] || 'restart';
  const devCycle = new WarpDevCycle();

  try {
    switch (action) {
      case 'restart':
        await devCycle.restart();
        break;
      case 'quick-test':
        await devCycle.quickTest();
        break;
      case 'full-cycle':
        await devCycle.fullCycle();
        break;
      case 'status':
        const status = await devCycle.getServerStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
      case 'stop':
        await devCycle.stopServer();
        break;
      case 'build':
        await devCycle.buildProject();
        break;
      case 'start':
        await devCycle.startServer();
        break;
      default:
        console.log('Usage: node scripts/warp-dev-cycle.js [restart|quick-test|full-cycle|status|stop|build|start]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Development cycle failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = WarpDevCycle;