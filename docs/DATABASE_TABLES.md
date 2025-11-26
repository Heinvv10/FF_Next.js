# FibreFlow Database Tables Reference

**⚠️ CRITICAL: DO NOT CONFUSE THESE TABLES!**

## Two Separate Drop Tables

FibreFlow uses **TWO COMPLETELY SEPARATE** drop tables with different purposes, schemas, and data sources.

---

## 1. `drops` Table - SOW Import Data

### Purpose
Stores drops imported from Statement of Work (SOW) Excel/CSV files for project planning and fiber installation tracking.

### Data Source
- Excel/CSV files imported via scripts
- Manual SOW import process
- NOT from WhatsApp

### Used By
- SOW import scripts (`/scripts/sow-import/`)
- Fiber Stringing page (`/fiber-stringing`)
- SOW List page (`/sow/list`)
- SOW Dashboard (`/sow`)

### API Endpoints
- `/api/sow/drops?projectId={id}`
- `/api/sow/fibre?projectId={id}`

### Example Drops
- DR1734268 (imported from Excel)
- DR1734935 (imported from Excel)

### Schema
```sql
CREATE TABLE drops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drop_number VARCHAR(255),           -- Drop number (DR########)
    pole_number VARCHAR(255),           -- Associated pole number
    project_id UUID NOT NULL,           -- Foreign key to projects table
    address TEXT,                       -- Installation address
    customer_name VARCHAR(255),         -- Customer name
    cable_length VARCHAR(50),           -- Cable length measurement
    installation_date DATE,             -- Planned/actual installation date
    status VARCHAR(50) DEFAULT 'Active',
    notes TEXT,
    metadata JSONB,                     -- Additional data from import
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qc_status VARCHAR(50),              -- QC status (if applicable)
    qc_updated_at TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Query Examples
```sql
-- Get drops for a project
SELECT * FROM drops WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55';

-- Count drops per project
SELECT project_id, COUNT(*) FROM drops GROUP BY project_id;

-- Get drops by date
SELECT * FROM drops WHERE installation_date = '2025-11-17';
```

---

## 2. `qa_photo_reviews` Table - WA Monitor WhatsApp Data

### Purpose
Stores drops from WhatsApp QA photo review process - real-time quality assurance tracking of field installations.

### Data Source
- WhatsApp groups (Lawley, Velo Test, Mohadin)
- `realtime_drop_monitor.py` script
- WhatsApp messages with DR numbers

### Used By
- WA Monitor Dashboard (`/wa-monitor`)
- WhatsApp feedback system
- Daily drops tracking
- QA review process

### API Endpoints
- `/api/wa-monitor-drops`
- `/api/wa-monitor-daily-drops`
- `/api/wa-monitor-send-feedback`

### Example Drops
- DR1752169 (from WhatsApp message)
- DR1752182 (from WhatsApp message)
- DR1733545 (from WhatsApp message)

### Schema
```sql
CREATE TABLE qa_photo_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drop_number VARCHAR(50) NOT NULL,
    review_date TIMESTAMP WITH TIME ZONE,
    user_name VARCHAR(100),                     -- Technician/agent name
    completed_photos INTEGER DEFAULT 0,         -- Number of photos completed
    outstanding_photos INTEGER DEFAULT 12,      -- Photos still needed
    outstanding_photos_loaded_to_1map BOOLEAN DEFAULT false,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    project VARCHAR(100),                       -- Project name (Lawley, Velo Test, etc.)
    assigned_agent VARCHAR(50),                 -- Agent phone number
    completed BOOLEAN DEFAULT false,
    incomplete BOOLEAN DEFAULT true,
    feedback_sent TIMESTAMP WITH TIME ZONE,
    sender_phone VARCHAR(50),

    -- 12 QA Photo Steps (Installation Checklist)
    step_01_house_photo BOOLEAN DEFAULT false,
    step_02_cable_from_pole BOOLEAN DEFAULT false,
    step_03_cable_entry_outside BOOLEAN DEFAULT false,
    step_04_cable_entry_inside BOOLEAN DEFAULT false,
    step_05_wall_for_installation BOOLEAN DEFAULT false,
    step_06_ont_back_after_install BOOLEAN DEFAULT false,
    step_07_power_meter_reading BOOLEAN DEFAULT false,
    step_08_ont_barcode BOOLEAN DEFAULT false,
    step_09_ups_serial BOOLEAN DEFAULT false,
    step_10_final_installation BOOLEAN DEFAULT false,
    step_11_green_lights BOOLEAN DEFAULT false,
    step_12_customer_signature BOOLEAN DEFAULT false
);
```

### Query Examples
```sql
-- Get all Lawley drops
SELECT * FROM qa_photo_reviews WHERE project = 'Lawley';

-- Count drops by project
SELECT project, COUNT(*) FROM qa_photo_reviews GROUP BY project;

-- Get drops from today
SELECT * FROM qa_photo_reviews WHERE DATE(created_at) = CURRENT_DATE;

-- Get drops from specific date
SELECT * FROM qa_photo_reviews WHERE DATE(created_at) = '2025-11-25';

-- Get incomplete drops
SELECT * FROM qa_photo_reviews WHERE incomplete = true;
```

---

## Key Differences

| Feature | `drops` Table | `qa_photo_reviews` Table |
|---------|---------------|--------------------------|
| **Purpose** | SOW planning data | WhatsApp QA tracking |
| **Source** | Excel/CSV imports | WhatsApp messages |
| **Project Key** | `project_id` (UUID) | `project` (VARCHAR name) |
| **Date Field** | `installation_date` (DATE) | `created_at` (TIMESTAMP) |
| **Status** | `status` (VARCHAR) | `completed`/`incomplete` (BOOLEAN) |
| **QA Steps** | ❌ No | ✅ Yes (12 steps) |
| **Photos** | ❌ No | ✅ Yes |
| **Feedback** | ❌ No | ✅ Yes |
| **APIs** | `/api/sow/*` | `/api/wa-monitor-*` |
| **Pages** | `/sow`, `/fiber-stringing` | `/wa-monitor` |

---

## Common Mistakes

### ❌ WRONG: Querying drops table for WA Monitor data
```sql
-- This will NOT work for WhatsApp drops!
SELECT * FROM drops WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55';
```

### ✅ CORRECT: Querying qa_photo_reviews for WA Monitor data
```sql
-- This is correct for WhatsApp drops
SELECT * FROM qa_photo_reviews WHERE project = 'Lawley';
```

---

## When to Use Which Table

### Use `drops` table when:
- Importing SOW data from Excel/CSV
- Viewing fiber stringing progress
- Planning installations
- Tracking pole-to-drop relationships
- Generating SOW reports

### Use `qa_photo_reviews` table when:
- Checking WhatsApp QA submissions
- Viewing WA Monitor dashboard
- Sending feedback to technicians
- Tracking QA photo completion
- Monitoring daily drop submissions
- Analyzing QA review progress

---

## Related Documentation

- **WA Monitor Module:** `src/modules/wa-monitor/README.md`
- **SOW Import Guide:** `SOW/docs/importlog.md`
- **CLAUDE.md:** Main project documentation
- **Database Scripts:** `scripts/sow-import/` (for drops table)
- **WA Monitor Scripts:** External `realtime_drop_monitor.py`

---

## Quick Reference Commands

### Check drops table
```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.NEON_DATABASE_URL);
(async () => {
  const result = await sql\`SELECT COUNT(*) as count FROM drops WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55'\`;
  console.log('SOW drops:', result[0].count);
})();
"
```

### Check qa_photo_reviews table
```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });
const sql = neon(process.env.NEON_DATABASE_URL);
(async () => {
  const result = await sql\`SELECT COUNT(*) as count FROM qa_photo_reviews WHERE project = 'Lawley'\`;
  console.log('WA Monitor drops:', result[0].count);
})();
"
```

---

**Last Updated:** November 26, 2025
**Author:** Louis (after Claude's confusion incident)
**Reason:** To prevent future table confusion errors
