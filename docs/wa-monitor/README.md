# WA Monitor Documentation

Complete documentation for the WhatsApp Monitor system that tracks QA photo review submissions.

**Version:** 2.0 - Refactored (November 9, 2025)
**Architecture:** Modular, Config-Driven, Prod/Dev Separation

---

## 📚 Quick Navigation

### Getting Started
- **[5-Minute Project Addition Guide](WA_MONITOR_ADD_PROJECT_5MIN.md)** ⭐ START HERE
  - How to add a new WhatsApp group in 5 minutes
  - Step-by-step with examples

- **[Architecture v2.0](WA_MONITOR_ARCHITECTURE_V2.md)**
  - Complete system architecture
  - Module breakdown
  - Data flow diagrams
  - Configuration reference

### Testing & Development
- **[Dual-Monitoring for Testing](WA_MONITOR_DUAL_TESTING.md)**
  - How to test dev changes against prod
  - Side-by-side comparison examples
  - Validation workflows

- **[Lessons Learned](WA_MONITOR_LESSONS_LEARNED.md)**
  - Why adding Mamelodi took 4 hours
  - Root causes and solutions
  - Before/after comparison

- **[Refactoring Design](WA_MONITOR_REFACTORING_DESIGN.md)**
  - Design decisions for v2.0
  - Migration strategy
  - Benefits delivered

### Setup & Configuration
- **[Reliability Improvements](RELIABILITY_IMPROVEMENTS.md)** ⭐ NEW (Nov 10, 2025)
  - Persistent state (never miss messages)
  - Daily auto-restart (3am SAST)
  - How to prevent message loss

- **[Database Separation](DATABASE_SEPARATION.md)**
  - Prod/dev schema isolation
  - How databases are separated
  - Safe testing environment

- **[Database Setup](WA_MONITOR_DATABASE_SETUP.md)**
  - Database schema
  - Table structure
  - Initial setup

- **[Adding a Group](WA_MONITOR_ADD_GROUP.md)** (Legacy v1.0)
  - Old process documentation
  - Historical reference

### Integration & Features
- **[WhatsApp Integration](WA_MONITOR_WHATSAPP_INTEGRATION.md)**
  - How WhatsApp bridge works
  - Message capture process
  - Group pairing

- **[SharePoint Sync](WA_MONITOR_SHAREPOINT_SYNC.md)**
  - Nightly sync to SharePoint
  - Configuration
  - Troubleshooting

- **[Data Flow Report](WA_MONITOR_DATA_FLOW_REPORT.md)**
  - Complete data flow investigation
  - Accurate counting methodology
  - Historical batch processing issues

### Troubleshooting
- **[Pairing Troubleshooting](WA_MONITOR_PAIRING_TROUBLESHOOTING.md)**
  - WhatsApp pairing issues
  - Connection problems
  - Reset procedures

- **[Implementation Summary](WA_MONITOR_IMPLEMENTATION_SUMMARY.md)**
  - Initial implementation notes
  - Setup process
  - Deployment history

---

## 🏗️ Architecture Overview

```
WhatsApp Groups (Lawley, Velo Test, Mohadin, Mamelodi)
    ↓
WhatsApp Bridge (Go) → SQLite Database
    ↓
Drop Monitor Services (Python)
    ├── wa-monitor-prod (4 projects)
    └── wa-monitor-dev (1 project: Velo Test)
    ↓
Neon PostgreSQL (qa_photo_reviews table)
    ↓
FibreFlow Dashboard (/wa-monitor)
    ↓
SharePoint Sync (Nightly)
```

---

## 🚀 Quick Commands

### Production Service
```bash
# View logs
ssh root@72.60.17.245
tail -f /opt/wa-monitor/prod/logs/wa-monitor-prod.log

# Add project
nano /opt/wa-monitor/prod/config/projects.yaml
systemctl restart wa-monitor-prod

# Check status
systemctl status wa-monitor-prod
```

### Development Service
```bash
# View logs
tail -f /opt/wa-monitor/dev/logs/wa-monitor-dev.log

# Test changes
nano /opt/wa-monitor/dev/modules/monitor.py
systemctl restart wa-monitor-dev

# Compare with prod
tail -f /opt/wa-monitor/dev/logs/wa-monitor-dev.log | grep "Velo Test"
```

---

## 📊 Key Metrics (v2.0)

| Metric | v1.0 (Old) | v2.0 (Refactored) |
|--------|------------|-------------------|
| Time to add project | 4 hours | 5 minutes |
| Files to edit | 8 files | 1 file (YAML) |
| Test environment | None | Dev service |
| Code structure | Monolithic | Modular |
| Configuration | Hardcoded | Config-driven |

---

## 🎯 Common Tasks

### Add a New WhatsApp Group
→ See [5-Minute Guide](WA_MONITOR_ADD_PROJECT_5MIN.md)

### Test Code Changes
→ See [Dual-Monitoring Guide](WA_MONITOR_DUAL_TESTING.md)

### Debug Issues
→ See [Pairing Troubleshooting](WA_MONITOR_PAIRING_TROUBLESHOOTING.md)

### Understand Data Flow
→ See [Data Flow Report](WA_MONITOR_DATA_FLOW_REPORT.md)

---

## 📂 VPS Directory Structure

```
/opt/wa-monitor/
├── prod/                              # PRODUCTION
│   ├── config/projects.yaml          # ← EDIT THIS
│   ├── modules/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── monitor.py
│   ├── main.py
│   ├── .env
│   └── logs/
│
├── dev/                               # DEVELOPMENT
│   ├── config/projects.yaml
│   ├── modules/
│   ├── main.py
│   ├── .env
│   └── logs/
│
└── shared/
    └── whatsapp-bridge/
        └── store/messages.db
```

---

## 🔗 Related Documentation

- **Main Project Docs:** `../CLAUDE.md` (lines 461-659)
- **Changelog:** `../CHANGELOG.md` (Nov 9, 2025 entry)
- **VPS Deployment:** `../VPS/`

---

## 📝 Document Versions

| Document | Version | Last Updated |
|----------|---------|--------------|
| Architecture | 2.0 | Nov 9, 2025 |
| 5-Minute Guide | 2.0 | Nov 9, 2025 |
| Dual-Monitoring | 2.0 | Nov 9, 2025 |
| Refactoring Design | 2.0 | Nov 9, 2025 |
| Lessons Learned | 1.0 | Nov 9, 2025 |

---

## 💡 Tips

1. **Always test in dev first** before deploying to production
2. **Use dual-monitoring** to validate changes with real data
3. **Check both logs** when debugging (prod and dev)
4. **Edit YAML, not Python** to add projects
5. **Restart services** after config changes

---

**Questions?** Check the specific guide above or search this directory for keywords.
