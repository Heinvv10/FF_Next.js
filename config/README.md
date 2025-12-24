# Configuration Files

This directory contains JSON configuration files for runtime settings that need to be easily updatable without code changes.

---

## QA Evaluation Steps

**File:** `qa-evaluation-steps.json`

**Purpose:** Defines the Quality Assurance evaluation steps used by the VLM (Vision Language Model) to evaluate installation photos.

### Structure

```json
{
  "version": "1.0",
  "updated": "2025-12-23",
  "description": "QA evaluation steps for DR photo verification using VLM AI",
  "steps": [
    {
      "step_number": 1,
      "step_name": "house_photo",
      "step_label": "House Photo",
      "criteria": "Clear photo of the house."
    }
    // ... more steps
  ]
}
```

### Fields

- **`version`**: Config version (for tracking changes)
- **`updated`**: Last update date (ISO format)
- **`description`**: Human-readable description
- **`steps`**: Array of QA evaluation steps
  - **`step_number`**: Step number (1-10)
  - **`step_name`**: Internal identifier (snake_case)
  - **`step_label`**: Display name (used in UI and WhatsApp)
  - **`criteria`**: What the VLM AI should check for

---

## How to Update

### Quick Update (Production - 1 minute)

```bash
# SSH to production
ssh root@72.60.17.245

# Edit config file
cd /var/www/fibreflow
nano config/qa-evaluation-steps.json

# Make changes, then save (Ctrl+X, Y, Enter)

# Restart app to reload config
pm2 restart fibreflow-prod
```

### Git Workflow (Recommended - 5 minutes)

```bash
# 1. Edit config locally
code config/qa-evaluation-steps.json

# 2. Commit changes
git add config/qa-evaluation-steps.json
git commit -m "Update Step 6: Add cable labeling requirement"

# 3. Push to GitHub
git push origin master

# 4. Deploy to production
ssh root@72.60.17.245 "cd /var/www/fibreflow && git pull && pm2 restart fibreflow-prod"
```

---

## Example Changes

### Add New Requirement to Step

```diff
{
  "step_number": 6,
  "step_name": "ont_back_and_barcode",
  "step_label": "ONT Back & Barcode",
- "criteria": "Back of ONT showing cable connections AND ONT barcode/serial number clearly visible and readable"
+ "criteria": "Back of ONT showing cable connections AND ONT barcode/serial number clearly visible and readable AND cables properly labeled"
}
```

### Make Criteria More Specific

```diff
{
  "step_number": 10,
  "step_name": "ont_lights_and_dr_label",
  "step_label": "Green Lights & DR Label",
- "criteria": "ONT with green lights indicating successful connection AND DR number label clearly visible on device or nearby"
+ "criteria": "ONT with green AND red power lights indicating successful connection AND DR number label clearly visible on device or nearby"
}
```

---

## Usage in Code

**File:** `src/modules/foto-review/services/fotoVlmService.ts`

```typescript
// Load QA steps from config file at startup
function loadQASteps() {
  const configPath = path.join(process.cwd(), 'config', 'qa-evaluation-steps.json');
  const configData = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configData);
  return config.steps;
}

const QA_STEPS = loadQASteps();

// Build VLM prompt with dynamic step count
function buildEvaluationPrompt(drNumber: string): string {
  return `Evaluate photos according to these ${QA_STEPS.length} steps:

${QA_STEPS.map((step, index) =>
  `${index + 1}. **${step.step_label}**: ${step.criteria}`
).join('\n')}`;
}
```

---

## Benefits

| Feature | Before (Hardcoded) | Now (Config File) |
|---------|-------------------|-------------------|
| **Update Time** | 10-15 minutes | 1-2 minutes |
| **Requires Build** | ✅ Yes | ❌ No |
| **Requires Restart** | ✅ Yes | ✅ Yes (quick) |
| **Edit Without Code** | ❌ No | ✅ Yes |
| **Version Control** | ⚠️ In code | ✅ Separate file |
| **Easy Rollback** | ⚠️ Code revert | ✅ File revert |

---

## Future Enhancements

1. **Database Storage** - Instant updates without restart
2. **Admin UI** - Web interface to edit steps
3. **A/B Testing** - Multiple versions for comparing different criteria
4. **History Tracking** - Audit trail of all changes
5. **Multi-Environment** - Different configs for dev/staging/prod

---

## Validation

The config is validated at load time:

- ✅ File must be valid JSON
- ✅ Must have `steps` array
- ✅ Each step must have all required fields
- ✅ Fallback to hardcoded steps if config missing/invalid

**Error Handling:**

If config file is missing or invalid, the app will:
1. Log error: "Failed to load QA steps config"
2. Log warning: "Using fallback hardcoded QA steps"
3. Continue working with hardcoded steps (safe fallback)

---

## Related Documentation

- **Page Log**: `docs/page-logs/foto-review.md`
- **VLM Service**: `src/modules/foto-review/services/fotoVlmService.ts`
- **DR Workflow Guide**: `~/Downloads/DR_PHOTO_WORKFLOW_COMPLETE_GUIDE (2).md`
