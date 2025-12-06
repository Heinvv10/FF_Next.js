# Test Scenario: VPS Deployment Agent

## Test Objective
Validate that the vps-deployment agent understands deployment procedures and can provide correct guidance WITHOUT executing actual deployments.

## Test Scenario 1: Health Check Request

**User Request**: "Check if production and development services are running properly"

### Expected Deliverables

- [ ] **Commands to check PM2 status**
  - `pm2 list` command
  - Expected output explanation

- [ ] **Commands to check logs**
  - How to view logs for both environments
  - What to look for (errors, warnings)

- [ ] **Commands to check Nginx**
  - systemctl status nginx
  - Check if ports 3005 and 3006 are listening

- [ ] **Health check summary**
  - Production URL check: curl -I https://app.fibreflow.app
  - Development URL check: curl -I https://dev.fibreflow.app

- [ ] **Interpretation guidance**
  - What "online" status means
  - What to do if status is "errored" or "stopped"

## Test Scenario 2: Deployment Dry-Run

**User Request**: "I want to deploy the latest changes to development for testing. Walk me through the process."

### Expected Deliverables

- [ ] **Pre-deployment checklist**
  - Verify changes committed to develop branch
  - Verify changes pushed to origin
  - Build succeeds locally

- [ ] **Deployment command**
  - Correct SSH command with sshpass
  - Correct directory (/var/www/fibreflow-dev)
  - Correct sequence: git pull → npm ci → npm run build → pm2 restart fibreflow-dev

- [ ] **Verification steps**
  - Check PM2 status
  - Check logs for errors
  - Test URL: https://dev.fibreflow.app

- [ ] **Post-deployment checklist**
  - User can log in
  - Key features work
  - No console errors

## Test Scenario 3: Troubleshooting Guidance

**User Request**: "Production is showing 502 Bad Gateway error. What should I check?"

### Expected Deliverables

- [ ] **Diagnosis steps**
  - Check if PM2 process is running: `pm2 list`
  - Check if port 3005 is listening: `netstat -tuln | grep 3005`
  - Check Nginx error logs: `tail -50 /var/log/nginx/error.log`

- [ ] **Common causes identified**
  - PM2 process crashed
  - Port conflict
  - Nginx misconfiguration
  - Build artifacts corrupted

- [ ] **Solution steps**
  - How to restart PM2 process
  - How to check for port conflicts
  - How to restart Nginx
  - When to rebuild application

- [ ] **Verification after fix**
  - PM2 status check
  - URL accessibility check
  - Log monitoring

## Test Constraints
- **DO NOT execute SSH commands** - Provide commands only
- **DO NOT restart actual services** - Describe process only
- **DO NOT modify VPS configuration** - Guidance only
- **Output location**: .agent-os/testing/sandbox/vps-deployment-test.md

## Evaluation Criteria

| Criterion | Weight | Pass/Fail |
|-----------|--------|-----------|
| Command accuracy | 30% | |
| Troubleshooting logic | 25% | |
| Safety awareness (no destructive commands) | 20% | |
| Completeness of guidance | 15% | |
| Verification steps | 10% | |

**Pass threshold**: 80% overall score

## Success Indicators
- ✅ Agent provides correct SSH commands with proper credentials
- ✅ Agent uses correct directories (/var/www/fibreflow vs fibreflow-dev)
- ✅ Agent follows safe practices (check before restart, verify after)
- ✅ Agent distinguishes between production and development procedures
- ✅ Agent does NOT execute commands, only provides guidance
