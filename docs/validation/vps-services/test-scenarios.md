# VPS Services Validation - Test Scenarios

Detailed test cases for end-to-end validation of VPS infrastructure and services.

---

## Scenario 1: System Health

### 1.1 - CPU Usage Check

**Objective**: Verify CPU usage is below critical threshold

**Command**:
```bash
ssh root@72.60.17.245 "top -bn1 | grep 'Cpu(s)' | awk '{print 100 - \$8}'"
```

**Expected Output**: Number between 0-100 (percentage)

**Pass Criteria**:
- Exit code = 0
- CPU usage < 80%
- Value is numeric

**Fail Criteria**:
- CPU usage ≥ 80%
- Command error
- Non-numeric output

**On Failure**:
1. Check what's consuming CPU:
   ```bash
   ssh root@72.60.17.245 "ps aux --sort=-%cpu | head -10"
   ```
2. Check system load:
   ```bash
   ssh root@72.60.17.245 "uptime"
   ```
3. Report: "CPU usage high ([X]%). Top processes: [list]"

---

### 1.2 - Memory Usage Check

**Objective**: Verify memory usage is below critical threshold

**Command**:
```bash
ssh root@72.60.17.245 "free | grep Mem | awk '{printf \"%.0f\", \$3/\$2 * 100}'"
```

**Expected Output**: Number between 0-100 (percentage)

**Pass Criteria**:
- Exit code = 0
- Memory usage < 85%
- Value is numeric

**Fail Criteria**:
- Memory usage ≥ 85%
- Command error

**On Failure**:
1. Check memory details:
   ```bash
   ssh root@72.60.17.245 "free -h"
   ```
2. Check top memory consumers:
   ```bash
   ssh root@72.60.17.245 "ps aux --sort=-%mem | head -10"
   ```
3. Report: "Memory usage high ([X]%). Top processes: [list]"

---

### 1.3 - Disk Usage Check

**Objective**: Verify disk usage is below critical threshold

**Command**:
```bash
ssh root@72.60.17.245 "df -h / | tail -1 | awk '{print \$5}' | sed 's/%//'"
```

**Expected Output**: Number between 0-100 (percentage)

**Pass Criteria**:
- Exit code = 0
- Disk usage < 90%
- Value is numeric

**Fail Criteria**:
- Disk usage ≥ 90%
- Command error

**On Failure**:
1. Check disk usage breakdown:
   ```bash
   ssh root@72.60.17.245 "df -h"
   ```
2. Find large directories:
   ```bash
   ssh root@72.60.17.245 "du -sh /var/log /var/www /opt 2>/dev/null"
   ```
3. Report: "Disk usage high ([X]%). Check logs and temp files."

---

### 1.4 - System Load Average

**Objective**: Verify system load is reasonable

**Command**:
```bash
ssh root@72.60.17.245 "uptime | awk -F'load average:' '{print \$2}' | awk '{print \$1}' | sed 's/,//'"
```

**Expected Output**: Load average (1 minute)

**Pass Criteria**:
- Exit code = 0
- Load < number of CPU cores × 2
- Value is numeric

**Fail Criteria**:
- Load very high (> cores × 3)
- Command error

**On Failure**:
1. Check CPU core count:
   ```bash
   ssh root@72.60.17.245 "nproc"
   ```
2. Check full load averages:
   ```bash
   ssh root@72.60.17.245 "uptime"
   ```
3. Report: "System load high ([X]). CPU cores: [Y]. Consider investigating."

**Note**: High load not always critical - depends on CPU core count.

---

## Scenario 2: Critical Services Status

### 2.1 - wa-monitor-prod Service

**Objective**: Verify production WA monitor is running

**Command**:
```bash
ssh root@72.60.17.245 "systemctl is-active wa-monitor-prod"
```

**Expected Output**: `active`

**Pass Criteria**:
- Exit code = 0
- Output = "active"

**Fail Criteria**:
- Output ≠ "active"
- Service inactive/failed

**On Failure**:
1. Check service status:
   ```bash
   ssh root@72.60.17.245 "systemctl status wa-monitor-prod"
   ```
2. Check recent logs:
   ```bash
   ssh root@72.60.17.245 "journalctl -u wa-monitor-prod -n 50"
   ```
3. Attempt restart:
   ```bash
   ssh root@72.60.17.245 "/opt/wa-monitor/prod/restart-monitor.sh"
   ```
4. Re-test after 5 seconds

---

### 2.2 - wa-monitor-dev Service

**Objective**: Verify development WA monitor is running

**Command**:
```bash
ssh root@72.60.17.245 "systemctl is-active wa-monitor-dev"
```

**Expected Output**: `active`

**Pass Criteria**: Same as 2.1

**Fail Criteria**: Same as 2.1

**On Failure**: Similar to 2.1, but restart with:
```bash
ssh root@72.60.17.245 "systemctl restart wa-monitor-dev"
```

**Note**: Dev service less critical than prod.

---

### 2.3 - WhatsApp Bridge Process

**Objective**: Verify WhatsApp bridge is running

**Command**:
```bash
ssh root@72.60.17.245 "pgrep -f whatsapp-bridge | wc -l"
```

**Expected Output**: Number > 0

**Pass Criteria**:
- Exit code = 0
- Count ≥ 1 (at least one process)

**Fail Criteria**:
- Count = 0 (no processes)

**On Failure**:
1. Check if systemd service:
   ```bash
   ssh root@72.60.17.245 "systemctl status whatsapp-bridge 2>/dev/null || echo 'Not a systemd service'"
   ```
2. Check process details:
   ```bash
   ssh root@72.60.17.245 "ps aux | grep whatsapp-bridge | grep -v grep"
   ```
3. Report: "WhatsApp bridge not running. Manual intervention required."

**Critical**: Do NOT auto-restart (handles WhatsApp authentication).

---

### 2.4 - Nginx Web Server

**Objective**: Verify Nginx is running and serving traffic

**Command**:
```bash
ssh root@72.60.17.245 "systemctl is-active nginx"
```

**Expected Output**: `active`

**Pass Criteria**:
- Exit code = 0
- Output = "active"

**Fail Criteria**:
- Output ≠ "active"
- Service down

**On Failure**:
1. Check Nginx status:
   ```bash
   ssh root@72.60.17.245 "systemctl status nginx"
   ```
2. Test configuration:
   ```bash
   ssh root@72.60.17.245 "nginx -t"
   ```
3. Check error logs:
   ```bash
   ssh root@72.60.17.245 "tail -50 /var/log/nginx/error.log"
   ```
4. If config OK, attempt restart:
   ```bash
   ssh root@72.60.17.245 "systemctl restart nginx"
   ```
5. Re-test after 3 seconds

---

## Scenario 3: Network Connectivity

### 3.1 - Internet Connectivity

**Objective**: Verify VPS can reach external internet

**Command**:
```bash
ssh root@72.60.17.245 "ping -c 3 -W 2 8.8.8.8 | grep 'received' | awk '{print \$4}'"
```

**Expected Output**: `3` (3 packets received)

**Pass Criteria**:
- Exit code = 0
- Packets received = 3
- No packet loss

**Fail Criteria**:
- Packets received < 3
- 100% packet loss
- Timeout

**On Failure**:
1. Check network interfaces:
   ```bash
   ssh root@72.60.17.245 "ip addr show"
   ```
2. Check routing:
   ```bash
   ssh root@72.60.17.245 "ip route show"
   ```
3. Try alternative server:
   ```bash
   ssh root@72.60.17.245 "ping -c 3 1.1.1.1"
   ```
4. Report: "VPS has no internet connectivity. Check network configuration or contact VPS provider."

**Critical**: No internet = no external integrations work.

---

### 3.2 - DNS Resolution

**Objective**: Verify DNS resolution is working

**Command**:
```bash
ssh root@72.60.17.245 "nslookup google.com | grep -A1 'Name:' | tail -1 | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1"
```

**Expected Output**: IP address (e.g., 142.250.x.x)

**Pass Criteria**:
- Exit code = 0
- Output is valid IP address
- Resolution successful

**Fail Criteria**:
- No IP address returned
- Resolution failed
- Timeout

**On Failure**:
1. Check DNS servers:
   ```bash
   ssh root@72.60.17.245 "cat /etc/resolv.conf"
   ```
2. Test with specific DNS:
   ```bash
   ssh root@72.60.17.245 "nslookup google.com 8.8.8.8"
   ```
3. Report: "DNS resolution failing. Check /etc/resolv.conf or network configuration."

---

### 3.3 - HTTPS Port Accessibility

**Objective**: Verify HTTPS port is accessible externally

**Command**:
```bash
curl -s -o /dev/null -w "%{http_code}" https://app.fibreflow.app
```

**Expected Output**: `200` or `30X` (success/redirect)

**Pass Criteria**:
- HTTP status 200-399
- Site responds
- Response time < 5 seconds

**Fail Criteria**:
- Status 500+
- Connection refused
- Timeout

**On Failure**:
1. Check from VPS itself:
   ```bash
   ssh root@72.60.17.245 "curl -I localhost:3005"
   ```
2. Check Nginx status (already tested in 2.4)
3. Check firewall:
   ```bash
   ssh root@72.60.17.245 "iptables -L -n | grep 443"
   ```
4. Report: "HTTPS not accessible. App: [status], Nginx: [status], Firewall: [status]"

---

## Scenario 4: PM2 Application Health

### 4.1 - PM2 Process Manager Status

**Objective**: Verify PM2 is running and managing processes

**Command**:
```bash
ssh root@72.60.17.245 "pm2 jlist | jq 'length'"
```

**Expected Output**: Number ≥ 2 (at least prod and dev)

**Pass Criteria**:
- Exit code = 0
- At least 2 processes
- PM2 responding

**Fail Criteria**:
- PM2 not found
- No processes
- Command error

**On Failure**:
1. Check if PM2 installed:
   ```bash
   ssh root@72.60.17.245 "which pm2"
   ```
2. Try to resurrect processes:
   ```bash
   ssh root@72.60.17.245 "pm2 resurrect"
   ```
3. Report: "PM2 not managing processes. Check PM2 installation."

---

### 4.2 - FibreFlow Production App

**Objective**: Verify production app is online

**Command**:
```bash
ssh root@72.60.17.245 "pm2 jlist | jq '.[] | select(.name==\"fibreflow-prod\") | .pm2_env.status' -r"
```

**Expected Output**: `online`

**Pass Criteria**:
- Exit code = 0
- Status = "online"
- App responding

**Fail Criteria**:
- Status ≠ "online"
- App not found
- Status = "errored" or "stopped"

**On Failure**:
1. Check app details:
   ```bash
   ssh root@72.60.17.245 "pm2 show fibreflow-prod"
   ```
2. Check logs:
   ```bash
   ssh root@72.60.17.245 "pm2 logs fibreflow-prod --lines 50 --nostream"
   ```
3. Attempt restart:
   ```bash
   ssh root@72.60.17.245 "pm2 restart fibreflow-prod"
   ```
4. Wait 5 seconds and re-test

---

### 4.3 - FibreFlow Development App

**Objective**: Verify development app is online

**Command**:
```bash
ssh root@72.60.17.245 "pm2 jlist | jq '.[] | select(.name==\"fibreflow-dev\") | .pm2_env.status' -r"
```

**Expected Output**: `online`

**Pass Criteria**: Same as 4.2

**Fail Criteria**: Same as 4.2

**On Failure**: Same as 4.2, but with `fibreflow-dev`

**Note**: Dev app less critical than prod.

---

### 4.4 - App Restart Counts

**Objective**: Verify apps aren't crashing repeatedly

**Command**:
```bash
ssh root@72.60.17.245 "pm2 jlist | jq '.[] | select(.name==\"fibreflow-prod\") | .pm2_env.restart_time'"
```

**Expected Output**: Number (restart count)

**Pass Criteria**:
- Exit code = 0
- Restart count < 5 (in recent time)
- Stable operation

**Fail Criteria**:
- Restart count > 10
- Frequent restarts indicate instability

**On Failure**:
1. Check when last restarted:
   ```bash
   ssh root@72.60.17.245 "pm2 show fibreflow-prod | grep 'restart time'"
   ```
2. Check logs for errors:
   ```bash
   ssh root@72.60.17.245 "pm2 logs fibreflow-prod --err --lines 100 --nostream"
   ```
3. Report: "App restarting frequently ([X] times). Check logs for errors."

**Note**: High restart count indicates app instability.

---

## Scenario 5: Nginx Configuration

### 5.1 - Nginx Configuration Syntax

**Objective**: Verify Nginx configuration files are valid

**Command**:
```bash
ssh root@72.60.17.245 "nginx -t 2>&1 | grep 'syntax is ok' | wc -l"
```

**Expected Output**: `1` (syntax OK message found)

**Pass Criteria**:
- Exit code = 0
- Syntax is OK
- Configuration valid

**Fail Criteria**:
- Syntax errors
- Configuration invalid

**On Failure**:
1. Show full test output:
   ```bash
   ssh root@72.60.17.245 "nginx -t 2>&1"
   ```
2. Report: "Nginx configuration invalid. Errors: [from test output]"

**Note**: Don't reload Nginx if config is invalid!

---

### 5.2 - SSL Certificate Validity

**Objective**: Verify SSL certificates are valid and not expiring soon

**Command**:
```bash
ssh root@72.60.17.245 "echo | openssl s_client -connect app.fibreflow.app:443 -servername app.fibreflow.app 2>/dev/null | openssl x509 -noout -dates"
```

**Expected Output**: Dates showing valid period

**Pass Criteria**:
- Certificate not expired
- Valid for > 7 days
- Certificate accessible

**Fail Criteria**:
- Certificate expired
- Expiring in < 7 days
- Certificate not found

**On Failure**:
1. Check expiry date:
   ```bash
   ssh root@72.60.17.245 "echo | openssl s_client -connect app.fibreflow.app:443 -servername app.fibreflow.app 2>/dev/null | openssl x509 -noout -enddate"
   ```
2. Check certbot status:
   ```bash
   ssh root@72.60.17.245 "certbot certificates"
   ```
3. Report: "SSL certificate issue. Expiry: [date]. Days remaining: [X]"

---

### 5.3 - Access Log Accessibility

**Objective**: Verify Nginx logs are accessible and being written

**Command**:
```bash
ssh root@72.60.17.245 "tail -1 /var/log/nginx/fibreflow-access.log 2>&1 | head -c 50"
```

**Expected Output**: Log entry content (or empty if no recent access)

**Pass Criteria**:
- Exit code = 0
- File readable
- No permission errors

**Fail Criteria**:
- Permission denied
- File not found
- Cannot read file

**On Failure**:
1. Check file permissions:
   ```bash
   ssh root@72.60.17.245 "ls -la /var/log/nginx/fibreflow-access.log"
   ```
2. Check log directory:
   ```bash
   ssh root@72.60.17.245 "ls -la /var/log/nginx/"
   ```
3. Report: "Cannot access Nginx logs. Check permissions."

---

## Scenario 6: Directory Structure

### 6.1 - Critical Directories Exist

**Objective**: Verify all expected directories exist

**Command**:
```bash
ssh root@72.60.17.245 "test -d /opt/wa-monitor/prod && test -d /opt/wa-monitor/dev && test -d /var/www/fibreflow && test -d /var/www/fibreflow-dev && echo 'OK' || echo 'MISSING'"
```

**Expected Output**: `OK`

**Pass Criteria**:
- Exit code = 0
- All directories exist
- Output = "OK"

**Fail Criteria**:
- Any directory missing
- Output = "MISSING"

**On Failure**:
1. Check which directories are missing:
   ```bash
   ssh root@72.60.17.245 "ls -ld /opt/wa-monitor/prod /opt/wa-monitor/dev /var/www/fibreflow /var/www/fibreflow-dev 2>&1"
   ```
2. Report: "Missing directories: [list]. Check deployment."

---

### 6.2 - Log Directories Writable

**Objective**: Verify services can write to log directories

**Command**:
```bash
ssh root@72.60.17.245 "touch /opt/wa-monitor/prod/logs/test.tmp && rm /opt/wa-monitor/prod/logs/test.tmp && echo 'OK' || echo 'FAIL'"
```

**Expected Output**: `OK`

**Pass Criteria**:
- Exit code = 0
- Can create and delete test file
- Output = "OK"

**Fail Criteria**:
- Cannot write
- Permission denied
- Output = "FAIL"

**On Failure**:
1. Check directory permissions:
   ```bash
   ssh root@72.60.17.245 "ls -ld /opt/wa-monitor/prod/logs"
   ```
2. Check ownership:
   ```bash
   ssh root@72.60.17.245 "stat /opt/wa-monitor/prod/logs | grep 'Uid'"
   ```
3. Report: "Log directory not writable. Permissions: [details]"

---

## Scenario 7: Service Restart Counts

### 7.1 - Service Stability

**Objective**: Verify services haven't crashed/restarted recently

**Command**:
```bash
ssh root@72.60.17.245 "systemctl show wa-monitor-prod -p NRestarts --value"
```

**Expected Output**: Number (restart count)

**Pass Criteria**:
- Restart count < 5
- Service stable
- Low restart frequency

**Fail Criteria**:
- Restart count > 10
- Frequent restarts

**On Failure**:
1. Check when last restarted:
   ```bash
   ssh root@72.60.17.245 "systemctl show wa-monitor-prod -p ActiveEnterTimestamp --value"
   ```
2. Check journal for crash reasons:
   ```bash
   ssh root@72.60.17.245 "journalctl -u wa-monitor-prod -n 100 | grep -E 'Failed|Error|Killed'"
   ```
3. Report: "Service restarting frequently. Check logs for crash causes."

---

## Summary

**Total Scenarios**: 7 major scenarios
**Total Individual Tests**: 20+ tests

**Coverage**:
- ✅ System health (4 tests)
- ✅ Critical services (4 tests)
- ✅ Network connectivity (3 tests)
- ✅ PM2 applications (4 tests)
- ✅ Nginx configuration (3 tests)
- ✅ Directory structure (2 tests)
- ✅ Service stability (1 test)

**Not Covered** (manual required):
- SSL certificate renewal automation
- Backup systems
- Firewall rules detailed analysis
- Hardware monitoring

---

## Test Execution Order

**Recommended order** (fail fast on critical issues):

1. **Network First** (Scenario 3)
   - Internet connectivity
   - DNS resolution
   - HTTPS accessibility

2. **System Health** (Scenario 1)
   - CPU, Memory, Disk usage
   - System load

3. **Critical Services** (Scenario 2)
   - wa-monitor services
   - WhatsApp bridge
   - Nginx

4. **Applications** (Scenario 4)
   - PM2 health
   - App status
   - Restart counts

5. **Configuration** (Scenario 5)
   - Nginx config
   - SSL certificates
   - Log accessibility

6. **Infrastructure** (Scenarios 6-7)
   - Directory structure
   - Service stability

**Total estimated duration**: 2-3 minutes for all tests
