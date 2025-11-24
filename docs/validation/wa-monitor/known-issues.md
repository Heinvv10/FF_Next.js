# WA Monitor Validation - Known Issues

Track false positives, false negatives, flaky tests, and workarounds.

---

## False Positives

Issues where validation reports failure but system is actually healthy.

### None Yet
*Will be populated during testing*

**Template for new issues:**
```markdown
### [Issue Title] - [Date]

**Description**: What the validation reports as failing

**Why it's false**: Why this is not actually a problem

**Frequency**: How often it occurs (always/sometimes/rare)

**Workaround**: How to work around this issue

**Fix needed**: What needs to change in validation logic
```

---

## False Negatives

Issues where validation reports success but system has a problem.

### None Yet
*Will be populated during testing*

**Template:**
```markdown
### [Issue Title] - [Date]

**Description**: What validation reports as passing

**Actual problem**: What is actually broken

**How we discovered**: How the issue was found (manual testing, production bug, etc.)

**Frequency**: How often validation misses this

**Fix needed**: What needs to change in validation logic to catch this
```

---

## Flaky Tests

Tests that sometimes pass, sometimes fail with same system state.

### None Yet
*Will be populated during testing*

**Template:**
```markdown
### [Test Name] - [Date]

**Scenario**: Which test scenario is flaky (e.g., 3.2 - API Returns Drop)

**Behavior**: What happens (intermittent timeout, race condition, etc.)

**Frequency**: How often it fails (10%, 50%, etc.)

**Root cause**: Why it's flaky (if known)

**Attempted fixes**: What we've tried

**Current workaround**: How we work around it (retry logic, increased timeout, etc.)

**Status**: Fixed / Workaround in place / Under investigation
```

---

## Known Limitations

Things validation intentionally does not test (not bugs, but scope limits).

### 1. SharePoint Sync

**Why not tested**: Requires waiting for nightly 8pm SAST job

**Impact**: Cannot validate end-to-end data flow to SharePoint automatically

**Manual testing required**: Check SharePoint morning after validation run

**Future improvement**: Consider creating SharePoint sync API endpoint that can be triggered manually for testing

---

### 2. WhatsApp Message Capture

**Why not tested**: Cannot automate posting to WhatsApp groups via API

**Impact**: Cannot test message capture from WhatsApp → SQLite flow

**Manual testing required**: Post test drop to group and verify capture in SQLite

**Future improvement**: Mock WhatsApp messages by inserting directly into SQLite for testing

---

### 3. Python Cache Bug Reproduction

**Why not tested**: Requires intentionally introducing bugs and using wrong restart method

**Impact**: Cannot verify cache clearing prevention works

**Manual testing required**: Deploy buggy code, use `systemctl restart` (not safe script), verify bug persists

**Future improvement**: Create dedicated test for cache clearing mechanism

---

### 4. Service Crash Recovery

**Why not tested**: Would intentionally disrupt production monitoring

**Impact**: Cannot verify services restart cleanly after crash

**Manual testing required**: Test in dev environment only by killing process

**Future improvement**: Add dev-only test that kills dev service and verifies recovery

---

## Environment-Specific Issues

Problems that only occur in certain environments.

### None Yet
*Will be populated during testing*

**Template:**
```markdown
### [Issue Title] - [Date]

**Environment**: Where it occurs (local / dev / prod)

**Description**: What happens in this environment

**Why environment-specific**: What's different about this environment

**Workaround**: How to handle in validation logic
```

---

## Timing Issues

Tests that fail due to timing, race conditions, or delays.

### None Yet
*Will be populated during testing*

**Template:**
```markdown
### [Issue Title] - [Date]

**Test**: Which test is affected

**Timing issue**: Description (cold start, network delay, processing lag, etc.)

**Current handling**: How validation handles it (timeout, retry, wait)

**Optimization needed**: Better way to handle this timing issue
```

---

## External Dependencies

Issues caused by external services being unavailable.

### Neon Database Cold Start

**Service**: Neon PostgreSQL (serverless)

**Issue**: First query after inactivity can take 3-5 seconds

**Impact**: Database connectivity test may timeout on cold start

**Handling**: Increased timeout to 10 seconds, retry logic

**Status**: Mitigated with retry logic

---

### VPS SSH Connection

**Service**: VPS at 72.60.17.245

**Issue**: Occasional SSH connection timeout

**Impact**: All VPS-based tests fail

**Handling**: Retry SSH commands up to 3 times with 2-second delay

**Status**: Monitoring - may need to increase timeout

---

## Update Log

Track when issues are discovered, fixed, or workarounds implemented.

### 2025-11-24 - Initial Documentation

Created known-issues tracking document. Ready to capture issues during validation testing.

---

**Note**: This document will be updated after each validation run. Issues should be categorized and workarounds documented clearly.
