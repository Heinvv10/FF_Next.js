#!/usr/bin/env node

/**
 * Warp Context Helper
 * Provides contextual information about the project for Warp agents
 * 
 * Usage:
 *   node scripts/warp-context.js [command]
 * 
 * Commands:
 *   status      - Full project status overview
 *   recent      - Recent changes and commits
 *   health      - Health check of all services
 *   env         - Environment status
 *   modules     - Available modules and their status
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class WarpContext {
  constructor() {
    this.projectRoot = process.cwd();
  }

  async execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve({ success: false, error: error.message, stdout: '', stderr });
        } else {
          resolve({ success: true, stdout, stderr });
        }
      });
    });
  }

  async getGitStatus() {
    const branch = await this.execCommand('git branch --show-current');
    const status = await this.execCommand('git status --porcelain');
    const recentCommits = await this.execCommand('git log --oneline -5');
    const stashList = await this.execCommand('git stash list');
    
    return {
      currentBranch: branch.stdout.trim(),
      hasUncommittedChanges: status.stdout.trim().length > 0,
      uncommittedFiles: status.stdout.trim().split('\n').filter(line => line),
      recentCommits: recentCommits.stdout.trim().split('\n').filter(line => line),
      stashes: stashList.stdout.trim().split('\n').filter(line => line)
    };
  }

  async getServerStatus() {
    const port3005 = await this.execCommand('lsof -i :3005');
    const nodeProcesses = await this.execCommand('ps aux | grep node | grep -v grep');
    
    return {
      port3005InUse: port3005.success && port3005.stdout.includes('node'),
      nodeProcesses: nodeProcesses.stdout.trim().split('\n').filter(line => 
        line.includes('next') || line.includes('FF_React')
      )
    };
  }

  async getProjectHealth() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasNodeModules = fs.existsSync('node_modules');
    const hasNextBuild = fs.existsSync('.next');
    const hasEnvFile = fs.existsSync('.env');
    
    // Check for critical files
    const criticalFiles = [
      'next.config.js',
      'tailwind.config.mjs',
      'tsconfig.json',
      'middleware.ts',
      'WARP.md'
    ];
    
    const missingFiles = criticalFiles.filter(file => !fs.existsSync(file));
    
    // Check module structure
    const modulesDirs = [
      'src/modules/projects',
      'src/modules/procurement', 
      'src/modules/installations',
      'src/modules/workflow',
      'src/services',
      'src/components'
    ];
    
    const moduleStatus = modulesDirs.map(dir => ({
      path: dir,
      exists: fs.existsSync(dir),
      files: fs.existsSync(dir) ? fs.readdirSync(dir).length : 0
    }));

    return {
      packageVersion: packageJson.version,
      nodeModulesInstalled: hasNodeModules,
      nextBuildExists: hasNextBuild,
      envFileExists: hasEnvFile,
      missingCriticalFiles: missingFiles,
      moduleStructure: moduleStatus
    };
  }

  async getEnvironmentInfo() {
    const nodeVersion = await this.execCommand('node --version');
    const npmVersion = await this.execCommand('npm --version');
    const gitVersion = await this.execCommand('git --version');
    
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEON_DATABASE_URL'
    ];
    
    const envStatus = requiredEnvVars.map(varName => ({
      name: varName,
      exists: !!process.env[varName],
      hasValue: !!process.env[varName] && process.env[varName].length > 0
    }));

    return {
      node: nodeVersion.stdout.trim(),
      npm: npmVersion.stdout.trim(),
      git: gitVersion.stdout.trim(),
      environmentVariables: envStatus,
      workingDirectory: process.cwd()
    };
  }

  async getRecentActivity() {
    const recentCommits = await this.execCommand('git log --oneline --since="1 week ago"');
    const modifiedFiles = await this.execCommand('find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -20 | xargs ls -lt | head -10');
    const recentLogs = this.getRecentLogs();

    return {
      commitsThisWeek: recentCommits.stdout.trim().split('\n').filter(line => line),
      recentlyModifiedFiles: modifiedFiles.stdout.trim().split('\n').slice(1, 6), // Skip header, take 5
      recentLogs: recentLogs
    };
  }

  getRecentLogs() {
    const logFiles = ['dev-cycle.log', 'server.log', 'import_output.log'];
    const logs = [];
    
    logFiles.forEach(logFile => {
      if (fs.existsSync(logFile)) {
        try {
          const content = fs.readFileSync(logFile, 'utf8');
          const lines = content.split('\n').filter(line => line).slice(-10); // Last 10 lines
          if (lines.length > 0) {
            logs.push({
              file: logFile,
              lastLines: lines
            });
          }
        } catch (error) {
          // Ignore read errors
        }
      }
    });
    
    return logs;
  }

  async generateFullStatus() {
    const [git, server, health, env, activity] = await Promise.all([
      this.getGitStatus(),
      this.getServerStatus(),
      this.getProjectHealth(),
      this.getEnvironmentInfo(),
      this.getRecentActivity()
    ]);

    const status = {
      timestamp: new Date().toISOString(),
      project: {
        name: 'FibreFlow Next.js (FF_React)',
        framework: 'Next.js 14 with App Router',
        developmentMode: 'Production mode only (no npm run dev)',
        port: 3005
      },
      git,
      server,
      health,
      environment: env,
      recentActivity: activity,
      quickCommands: {
        restart: 'node scripts/warp-dev-cycle.js restart',
        quickTest: 'node scripts/warp-dev-cycle.js quick-test',
        fullCycle: 'node scripts/warp-dev-cycle.js full-cycle',
        status: 'node scripts/warp-context.js status',
        build: 'npm run build',
        start: 'PORT=3005 npm start'
      },
      criticalInfo: [
        'NEVER use npm run dev - it will fail due to Watchpack bug',
        'Always build before starting: npm run build',
        'Server runs on PORT=3005 in production mode',
        'Use production workflow: build → start → test'
      ]
    };

    return status;
  }

  formatForConsole(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let output = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        output += `${spaces}${key}:\n`;
        output += this.formatForConsole(value, indent + 1);
      } else if (Array.isArray(value)) {
        output += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            output += this.formatForConsole(item, indent + 1);
          } else {
            output += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        output += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return output;
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || 'status';
  const context = new WarpContext();

  try {
    switch (command) {
      case 'status':
        const fullStatus = await context.generateFullStatus();
        console.log('=== FF_React Project Status ===\n');
        console.log(context.formatForConsole(fullStatus));
        break;
        
      case 'recent':
        const activity = await context.getRecentActivity();
        console.log('=== Recent Activity ===\n');
        console.log(context.formatForConsole(activity));
        break;
        
      case 'health':
        const health = await context.getProjectHealth();
        console.log('=== Project Health Check ===\n');
        console.log(context.formatForConsole(health));
        break;
        
      case 'env':
        const env = await context.getEnvironmentInfo();
        console.log('=== Environment Status ===\n');
        console.log(context.formatForConsole(env));
        break;
        
      case 'server':
        const server = await context.getServerStatus();
        console.log('=== Server Status ===\n');
        console.log(context.formatForConsole(server));
        break;
        
      case 'json':
        const jsonStatus = await context.generateFullStatus();
        console.log(JSON.stringify(jsonStatus, null, 2));
        break;
        
      default:
        console.log('Usage: node scripts/warp-context.js [status|recent|health|env|server|json]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Context check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = WarpContext;