# SOW Linking Verification & Goals

## Target/Goal
Automatically link OneMap field data with SOW planning data to track project progress and identify discrepancies between planned and actual work.

## How Linking Should Work

### 1. Matching Logic
- **Primary Key**: Pole Numbers (`onemap_properties.pole_number` ↔ `sow_poles.pole_number`)
- **Secondary Key**: Drop Numbers (`onemap_properties.drop_number` ↔ `sow_drops.drop_number`)
- **Project Filter**: Only match within same project via `project_id`

### 2. SQL Query Implementation
```sql
SELECT
  op.*,
  sp.pole_number as sow_pole_number,
  sd.drop_number as sow_drop_number
FROM onemap_properties op
LEFT JOIN sow_poles sp
  ON op.pole_number = sp.pole_number
  AND sp.project_id = ${projectId}
LEFT JOIN sow_drops sd
  ON op.drop_number = sd.drop_number
  AND sd.project_id = ${projectId}
```

### 3. Expected Scenarios

| Scenario | OneMap Data | SOW Data | Visual Indicator | Business Meaning |
|----------|-------------|----------|-----------------|------------------|
| Matched | Pole exists | Pole planned | ✓ Linked (Green) | Work completed as planned |
| Unmatched Field | Pole exists | No match in SOW | Not Linked (Outlined) | Extra/unauthorized work |
| Missing Field | No record | Pole in SOW | No OneMap entry | Planned work not done |

## Verification Checklist
- [ ] LEFT JOIN preserves all OneMap records
- [ ] NULL values in sow_pole_number indicate no SOW match
- [ ] Visual indicators display correctly in grid
- [ ] Linking works across correct project_id
- [ ] Both pole and drop numbers link independently

## Notes
- Created: September 16, 2025
- Purpose: Ensure SOW linking is implemented correctly
- Status: To be verified with real data examples