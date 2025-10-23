# Claude Code Commands

Custom slash commands for FibreFlow development.

## Available Commands

### /log - Add CHANGELOG Entry
```bash
/log [type] [title]
```

Quickly add an entry to `docs/CHANGELOG.md`.

**Examples:**
```
/log fix Contractor approval buttons
/log feature User dashboard
/log docs Updated tracking system
```

**Types**: feature, fix, enhancement, refactor, docs, infrastructure, performance, security

---

### /status - Show Project Status
```bash
/status
```

Display comprehensive status across all tracking systems:
- Recent work (CHANGELOG)
- Active issues (page logs)
- Project progress
- Git status
- Vercel deployment
- Local server health

---

## How Commands Work

Commands are defined in `.claude/commands/[name].md` files. Each command file contains:

1. **Description** - What the command does
2. **Usage** - How to use it with examples
3. **Prompt** - Instructions for Claude on how to execute it

## Creating New Commands

1. Create `.claude/commands/[command-name].md`
2. Add usage documentation
3. Add detailed prompt for Claude
4. Test with `/command-name`

## Related

- **Skills**: `.claude/skills/` - Automated behaviors
- **Tracking System**: `docs/TRACKING_SYSTEM.md` - Complete guide
- **CHANGELOG**: `docs/CHANGELOG.md` - Daily work log
- **Page Logs**: `docs/page-logs/` - Per-page issue tracking
