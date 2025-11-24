# VPS Services Validation - Known Issues

Track false positives, false negatives, flaky tests, and workarounds.

---

## False Positives

Issues where validation reports failure but system is actually healthy.

### None Yet
*Will be populated during testing*

---

## False Negatives

Issues where validation reports success but system has a problem.

### None Yet
*Will be populated during testing*

---

## Flaky Tests

Tests that sometimes pass, sometimes fail with same system state.

### None Yet
*Will be populated during testing*

---

## Known Limitations

Things validation intentionally does not test (not bugs, but scope limits).

### 1. SSL Certificate Auto-Renewal

**Why not tested**: Certbot runs automatically via cron

**Impact**: Cannot verify renewal automation works

**Manual testing required**: Check `certbot certificates` and renewal logs

**Future improvement**: Add test for certbot cron job existence

---

### 2. Backup Systems

**Why not tested**: Managed by VPS provider

**Impact**: Cannot verify backups are working

**Manual testing required**: Check VPS provider dashboard

**Future improvement**: Add backup verification if APIs available

---

### 3. Detailed Firewall Rules

**Why not tested**: Complex iptables rules, security-sensitive

**Impact**: Cannot verify all firewall rules correct

**Manual testing required**: Review `iptables -L -n` output

**Future improvement**: Add specific port accessibility tests

---

### 4. Hardware Health

**Why not tested**: Requires VPS provider access

**Impact**: Cannot detect hardware issues

**Manual testing required**: Check VPS provider dashboard

**Future improvement**: Monitor for system error logs

---

## Environment-Specific Issues

Problems that only occur in certain environments.

### None Yet
*Will be populated during testing*

---

## Timing Issues

Tests that fail due to timing, race conditions, or delays.

### None Yet
*Will be populated during testing*

---

## External Dependencies

Issues caused by external services being unavailable.

### VPS Provider Network

**Service**: Hostinger network infrastructure

**Issue**: Occasional network blips

**Impact**: Internet connectivity tests may fail transiently

**Handling**: Retry logic with 3 attempts

**Status**: Monitoring

---

### DNS External Dependency

**Service**: External DNS servers (8.8.8.8, etc.)

**Issue**: DNS queries can timeout

**Impact**: DNS resolution test may fail

**Handling**: Use multiple DNS servers for testing

**Status**: Monitoring

---

## Update Log

Track when issues are discovered, fixed, or workarounds implemented.

### 2025-11-24 - Initial Documentation

Created known-issues tracking document. Ready to capture issues during validation testing.

---

**Note**: This document will be updated after each validation run. Issues should be categorized and workarounds documented clearly.
