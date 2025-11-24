# VPS Services Validation Module

## Status: 🚧 In Development

**Started**: 2025-11-24
**Target Completion**: TBD

---

## Overview

The VPS Services validation module tests the foundational infrastructure that all FibreFlow systems depend on.

**What it validates:**
```
VPS Server (72.60.17.245)
├── System Health (CPU, Memory, Disk)
├── Critical Services
│   ├── wa-monitor-prod
│   ├── wa-monitor-dev
│   ├── whatsapp-bridge
│   ├── PM2 (fibreflow-prod, fibreflow-dev)
│   └── Nginx (web server)
├── Network Connectivity
│   ├── Internet access
│   ├── DNS resolution
│   └── Port accessibility
└── Environment Configuration
    ├── Environment variables
    ├── File permissions
    └── Directory structure
```

---

## Test Scenarios Covered

### ✅ Core Infrastructure (High Priority)
1. **VPS System Health**
   - CPU usage < 80%
   - Memory usage < 85%
   - Disk usage < 90%
   - System load reasonable

2. **Critical Services Status**
   - wa-monitor-prod: active
   - wa-monitor-dev: active
   - whatsapp-bridge: running
   - PM2 processes: fibreflow-prod, fibreflow-dev running
   - Nginx: active

3. **Network Connectivity**
   - Internet access (ping 8.8.8.8)
   - DNS resolution working
   - SSH access stable
   - HTTPS ports accessible (443)

### ✅ Application Services (Medium Priority)
4. **PM2 Process Health**
   - fibreflow-prod: online, no restarts
   - fibreflow-dev: online, no restarts
   - Memory usage reasonable
   - CPU usage reasonable

5. **Nginx Configuration**
   - Service active
   - SSL certificates valid
   - Configurations syntactically correct
   - Access logs readable

### ✅ Environment Consistency (Low Priority)
6. **Directory Structure**
   - /opt/wa-monitor/prod exists
   - /opt/wa-monitor/dev exists
   - /var/www/fibreflow exists
   - /var/www/fibreflow-dev exists
   - Log directories writable

7. **File Permissions**
   - Service files have correct permissions
   - Log files writable
   - Config files readable

### ⚠️ Not Covered (Manual Testing Required)
- SSL certificate renewal automation
- Backup systems
- Firewall rules (iptables)
- VPS provider dashboard status
- Hardware monitoring

---

## Architecture Context

### VPS Infrastructure

**Server**: Hostinger VPS (Lithuania)
- **IP**: 72.60.17.245
- **OS**: Ubuntu 24.04 LTS
- **Node.js**: v20.19.5
- **Process Manager**: PM2 v6.0.13
- **Web Server**: Nginx v1.24.0

### Critical Services

**System Services**:
```
systemd services:
├── wa-monitor-prod.service
├── wa-monitor-dev.service
├── whatsapp-bridge.service (if managed by systemd)
└── nginx.service
```

**PM2 Applications**:
```
PM2 ecosystem:
├── fibreflow-prod (port 3005)
└── fibreflow-dev (port 3006)
```

**Monitoring Services**:
```
/opt/wa-monitor/
├── prod/
│   ├── main.py
│   ├── modules/
│   └── logs/wa-monitor-prod.log
└── dev/
    ├── main.py
    ├── modules/
    └── logs/wa-monitor-dev.log
```

### Network Configuration

**Ports**:
- 22: SSH
- 80: HTTP (redirects to 443)
- 443: HTTPS
- 3005: FibreFlow Production (internal)
- 3006: FibreFlow Development (internal)

**Domains**:
- app.fibreflow.app → 3005 (production)
- dev.fibreflow.app → 3006 (development)

**SSL**:
- Let's Encrypt certificates
- Auto-renewal enabled
- Certificates for both domains

---

## Dependencies

### External Services
- **VPS Provider**: Hostinger (must be reachable)
- **DNS**: Domain resolution must work
- **Internet**: VPS must have internet access

### Credentials Required
- SSH access: root@72.60.17.245 (password in approved commands)
- No additional credentials needed (read-only checks)

### Tools Required
- sshpass (VPS access)
- ssh (remote command execution)
- Standard Linux utilities (top, df, free, etc.)

---

## Performance Expectations

### Target Metrics
- **Duration**: 2-3 minutes (faster than WA Monitor)
- **Pass Rate**: > 95% after optimization
- **Consistency**: Same results on 10 consecutive runs
- **False Positives**: 0 in last 5 runs
- **False Negatives**: 0 in last 5 runs

### Current Metrics
*Will be populated after initial runs*

---

## Test Scenarios Detail

### Scenario 1: System Health

**Tests**:
- CPU usage check
- Memory usage check
- Disk usage check
- System load average

**Pass Criteria**:
- CPU < 80%
- Memory < 85%
- Disk < 90%
- Load average reasonable (< CPU cores)

**Critical**: If system resources are exhausted, all services may fail.

---

### Scenario 2: Critical Services

**Tests**:
- systemctl status for all services
- Process existence checks
- Service restart count (should be low)

**Pass Criteria**:
- All services: active (running)
- No recent crashes
- Reasonable restart counts

**Critical**: If core services are down, applications cannot function.

---

### Scenario 3: Network Connectivity

**Tests**:
- Ping external IPs
- DNS resolution
- Port accessibility
- SSH responsiveness

**Pass Criteria**:
- Internet reachable
- DNS resolving correctly
- Ports open as expected
- SSH responds < 2 seconds

**Critical**: Network issues affect all external integrations.

---

### Scenario 4: PM2 Health

**Tests**:
- PM2 list output
- Process status
- Memory/CPU usage
- Restart counts

**Pass Criteria**:
- Both apps: online
- Memory usage reasonable
- Restart count < 5 (in 24h)

**Important**: App health affects user experience directly.

---

### Scenario 5: Nginx Health

**Tests**:
- Service status
- Configuration test
- SSL certificate validity
- Log file accessibility

**Pass Criteria**:
- Service active
- Config syntax valid
- SSL certs valid > 7 days
- Logs readable

**Important**: Web server issues affect site accessibility.

---

### Scenario 6: Directory Structure

**Tests**:
- Key directories exist
- Directories are readable
- Log directories writable

**Pass Criteria**:
- All expected directories exist
- Correct permissions
- No permission errors

**Low Priority**: Usually stable once set up.

---

### Scenario 7: File Permissions

**Tests**:
- Service files readable
- Log files writable
- Config files have correct ownership

**Pass Criteria**:
- No permission errors
- Services can write logs
- Configs readable by services

**Low Priority**: Usually stable once set up.

---

## Known Limitations

### Cannot Test (Requires Manual Intervention)
1. **SSL Certificate Renewal**
   - Automated process (certbot)
   - Check manually: `certbot certificates`

2. **Backup Systems**
   - VPS provider backups
   - Manual verification needed

3. **Firewall Configuration**
   - iptables rules
   - Security settings

4. **Hardware Health**
   - Requires VPS provider dashboard
   - Cannot check from inside VPS

---

## Success Metrics

**Production-ready when**:
- [ ] 10 successful runs completed
- [ ] Caught at least 1 issue (or tested with injected issues)
- [ ] No false positives in last 5 runs
- [ ] Completes in < 5 minutes
- [ ] All critical scenarios tested
- [ ] Documentation complete

---

## Next Steps

1. [ ] Create `/validate-vps-services` command
2. [ ] Run initial test (Run 1)
3. [ ] Document results
4. [ ] Iterate and optimize
5. [ ] Run 10 times total
6. [ ] Certify as production-ready

---

## References

- VPS Documentation: `docs/VPS/`
- WA Monitor Validation: `docs/validation/wa-monitor/` (reference implementation)
- Implementation Guide: `docs/validation/IMPLEMENTATION_GUIDE.md`
