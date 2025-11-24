# /validate-database

Comprehensive validation of Neon PostgreSQL database connectivity, schema, and data quality.

## Overview

This command validates the database layer that all FibreFlow features depend on.

**Database Tested**:
```
Neon PostgreSQL (ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech)
├── Connectivity (Connection, pooling, performance)
├── Schema (Tables, columns, indexes, constraints)
├── Data Integrity (Orphans, nulls, format validation)
├── Critical Data (Projects, contractors, QA reviews)
├── Query Performance (Simple, complex, joins)
├── Configuration (Correct database URL verification)
└── Data Quality (Recent activity, no test data, duplicates)
```

**Test Coverage**: 25+ individual tests across 7 scenarios
**Expected Duration**: 3-5 minutes
**Pass Criteria**: All critical tests pass (22/25 minimum, 88%)

---

## Prerequisites Check

### 1. Get Database URL

**Command**:
```bash
echo $DATABASE_URL
```

**Expected**: Connection string containing `ep-dry-night-a9qyh4sj`

**On Failure**: Set DATABASE_URL environment variable

---

## SCENARIO 1: Database Connectivity

### Test 1.1: Basic Connection

**Purpose**: Verify can connect to Neon PostgreSQL

**Command**:
```bash
psql "$DATABASE_URL" -c "SELECT NOW() as current_time;" -t
```

**Expected Output**: Current timestamp

**Pass Criteria**:
- Command succeeds
- Returns valid timestamp

**Fail Criteria**:
- Connection refused
- Authentication failure
- Timeout

**On Failure**:
1. Check DATABASE_URL is set
2. Verify network connectivity
3. Check Neon dashboard for database status
4. Report: "Cannot connect to database. Check DATABASE_URL and network."

---

### Test 1.2: Database Identity

**Purpose**: Verify connected to correct database

**Command**:
```bash
psql "$DATABASE_URL" -c "SELECT current_database() as db_name, current_user as db_user;" -t
```

**Expected Output**:
- Database: `neondb`
- User: `neondb_owner`

**Pass Criteria**:
- Correct database and user

**Fail Criteria**:
- Wrong database name
- Wrong user

**On Failure**:
Report: "Connected to wrong database: [name]. Check DATABASE_URL."

---

### Test 1.3: Connection Pooling

**Purpose**: Verify using pooled connection

**Command**:
```bash
echo "$DATABASE_URL" | grep -c "pooler"
```

**Expected Output**: `1` (pooler in URL)

**Pass Criteria**:
- Connection string contains "pooler"

**Fail Criteria**:
- No pooler in connection string

**On Failure**:
Report: "Not using connection pooler. Update DATABASE_URL to use -pooler endpoint."

---

### Test 1.4: Connection Performance

**Purpose**: Verify connection time acceptable

**Command**:
```bash
time psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1
```

**Measure**: Real time (wall clock)

**Pass Criteria**:
- Connection time < 2 seconds

**Fail Criteria**:
- Connection time > 2 seconds

**On Failure**:
Report: "Slow database connection ([X]s). Check network latency or database status."

**Note**: Extract timing from `time` command output

---

## SCENARIO 2: Schema Validation

### Test 2.1: Critical Tables Exist

**Purpose**: Verify all essential tables present

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT tablename FROM pg_tables
WHERE schemaname='public'
ORDER BY tablename;
" -t
```

**Expected Tables** (minimum):
- clients
- contractors
- documents
- drops
- fibre
- poles
- projects
- qa_photo_reviews
- staff
- suppliers
- teams

**Pass Criteria**:
- All critical tables exist

**Fail Criteria**:
- Any critical table missing

**On Failure**:
1. List missing tables
2. Report: "Missing critical tables: [list]. Database may not be initialized."

---

### Test 2.2: QA Photo Reviews Schema

**Purpose**: Validate WhatsApp monitor table structure

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'qa_photo_reviews'
ORDER BY ordinal_position;
" -t
```

**Expected Columns** (critical):
- id (integer, NOT NULL)
- drop_number (text, NOT NULL)
- project (text, NOT NULL)
- whatsapp_message_date (timestamp with time zone, NOT NULL)
- submitted_by (text)
- incorrect_steps (jsonb, NOT NULL)
- incorrect_comments (jsonb, NOT NULL)

**Pass Criteria**:
- All critical columns exist
- Correct data types
- NOT NULL constraints present

**Fail Criteria**:
- Missing critical columns
- Wrong data types

**On Failure**:
1. List missing/incorrect columns
2. Report: "qa_photo_reviews schema invalid. Run migration scripts."

---

### Test 2.3: Projects Table Schema

**Purpose**: Validate projects master table

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
" -t
```

**Expected Columns**:
- project_id (integer, NOT NULL)
- project_name (text, NOT NULL)
- client (text)
- status (text)
- created_at (timestamp)

**Pass Criteria**:
- All columns exist
- Correct data types

**Fail Criteria**:
- Missing columns

---

### Test 2.4: Contractors Table Schema

**Purpose**: Validate contractors table (RAG feature depends on this)

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contractors'
ORDER BY ordinal_position;
" -t
```

**Expected Columns** (key fields):
- id (integer, NOT NULL)
- contractor_name (text, NOT NULL)
- contractor_email (text)
- status (text)

**Pass Criteria**:
- All key columns exist

**Fail Criteria**:
- Missing columns

---

### Test 2.5: Primary Keys Exist

**Purpose**: Verify all tables have primary keys

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT tablename
FROM pg_tables
WHERE schemaname='public'
AND tablename NOT IN (
    SELECT tablename
    FROM pg_indexes
    WHERE indexdef LIKE '%PRIMARY KEY%'
)
ORDER BY tablename;
" -t
```

**Expected Output**: Empty (all tables have PKs)

**Pass Criteria**:
- All critical tables have primary keys

**Fail Criteria**:
- Tables without primary keys

**On Failure**:
Report: "Tables missing primary keys: [list]. Add primary keys for data integrity."

---

### Test 2.6: Performance Indexes Exist

**Purpose**: Verify indexes on frequently queried columns

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT tablename, COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname='public'
AND tablename IN ('qa_photo_reviews', 'projects', 'contractors', 'fibre', 'drops')
GROUP BY tablename
ORDER BY tablename;
" -t
```

**Expected**:
- qa_photo_reviews: At least 4 indexes (id, drop_number, project, date)
- projects: At least 2 indexes
- Other tables: At least 1 index (primary key minimum)

**Pass Criteria**:
- All critical tables have indexes

**Fail Criteria**:
- Tables with no indexes (performance issue)

**On Failure**:
Report: "Missing indexes on [table]. Query performance will be slow."

---

## SCENARIO 3: Data Integrity

### Test 3.1: No Orphaned QA Reviews

**Purpose**: Verify all QA reviews link to valid projects

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as orphaned_count
FROM qa_photo_reviews
WHERE project NOT IN (SELECT project_name FROM projects)
AND project IS NOT NULL;
" -t
```

**Expected Output**: `0`

**Pass Criteria**:
- Zero orphaned records

**Fail Criteria**:
- Orphaned records found

**On Failure**:
1. List orphaned projects:
   ```bash
   psql "$DATABASE_URL" -c "
   SELECT DISTINCT project
   FROM qa_photo_reviews
   WHERE project NOT IN (SELECT project_name FROM projects)
   LIMIT 10;
   " -t
   ```
2. Report: "Found [X] orphaned QA reviews for projects: [list]. Add missing projects to master table."

---

### Test 3.2: Required Fields Populated

**Purpose**: Verify critical fields not null

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT
    COUNT(*) FILTER (WHERE drop_number IS NULL) as null_drop_number,
    COUNT(*) FILTER (WHERE project IS NULL) as null_project,
    COUNT(*) FILTER (WHERE whatsapp_message_date IS NULL) as null_message_date
FROM qa_photo_reviews;
" -t
```

**Expected Output**: `0 | 0 | 0`

**Pass Criteria**:
- All counts are zero

**Fail Criteria**:
- Any critical field has nulls

**On Failure**:
Report: "Found null values: drop_number=[X], project=[Y], message_date=[Z]. Fix data quality."

---

### Test 3.3: Drop Number Format

**Purpose**: Verify drop numbers follow correct format

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as invalid_count
FROM qa_photo_reviews
WHERE drop_number !~ '^DR[0-9]{7}$'
AND drop_number IS NOT NULL;
" -t
```

**Expected Format**: `DR` + 7 digits (e.g., DR1734338)

**Expected Output**: `0`

**Pass Criteria**:
- Zero invalid formats

**Fail Criteria**:
- Invalid formats found

**On Failure**:
1. Show examples:
   ```bash
   psql "$DATABASE_URL" -c "
   SELECT drop_number
   FROM qa_photo_reviews
   WHERE drop_number !~ '^DR[0-9]{7}$'
   LIMIT 5;
   " -t
   ```
2. Report: "Found [X] invalid drop numbers. Examples: [list]"

---

### Test 3.4: Phone Number Format

**Purpose**: Verify phone numbers follow SA format (no LID numbers)

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as invalid_count
FROM qa_photo_reviews
WHERE submitted_by IS NOT NULL
AND (LENGTH(submitted_by) != 11 OR submitted_by !~ '^27[0-9]{9}$');
" -t
```

**Expected Format**: 27 + 9 digits (e.g., 27640412391)

**Expected Output**: `0`

**Pass Criteria**:
- All phone numbers valid or null

**Fail Criteria**:
- Invalid formats (especially LID numbers > 11 chars)

**On Failure**:
1. Check for LIDs:
   ```bash
   psql "$DATABASE_URL" -c "
   SELECT drop_number, submitted_by, LENGTH(submitted_by) as len
   FROM qa_photo_reviews
   WHERE LENGTH(submitted_by) > 11
   LIMIT 5;
   " -t
   ```
2. Report: "Found [X] invalid phone numbers. Check for LID resolution issues."

---

### Test 3.5: Timestamp Validity

**Purpose**: Verify timestamps are reasonable

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as invalid_count
FROM qa_photo_reviews
WHERE whatsapp_message_date < '2024-01-01'
   OR whatsapp_message_date > NOW() + INTERVAL '1 day';
" -t
```

**Expected Output**: `0`

**Pass Criteria**:
- No timestamps outside reasonable range

**Fail Criteria**:
- Timestamps before 2024 or in future

**On Failure**:
Report: "Found [X] invalid timestamps. Check data import process."

---

## SCENARIO 4: Critical Data Existence

### Test 4.1: Projects Exist

**Purpose**: Verify projects table populated

**Command**:
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) as project_count FROM projects;" -t
```

**Expected Output**: Number > 0

**Pass Criteria**:
- At least 1 project exists

**Fail Criteria**:
- Zero projects (database not initialized)

**On Failure**:
Report: "Projects table empty. Database not initialized or data lost."

---

### Test 4.2: Contractors Exist

**Purpose**: Verify contractors table populated

**Command**:
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) as contractor_count FROM contractors;" -t
```

**Expected Output**: Number > 0

**Pass Criteria**:
- At least 1 contractor exists

**Fail Criteria**:
- Zero contractors

**On Failure**:
Report: "Contractors table empty. RAG feature will not work."

---

### Test 4.3: Recent QA Reviews

**Purpose**: Verify recent WhatsApp activity

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as recent_count
FROM qa_photo_reviews
WHERE whatsapp_message_date > NOW() - INTERVAL '30 days';
" -t
```

**Expected Output**: Number > 0

**Pass Criteria**:
- Recent data exists

**Fail Criteria**:
- No data in last 30 days

**On Failure**:
Report: "⚠️ WARNING: No QA reviews in last 30 days. System inactive or WA Monitor issue."

**Note**: Mark as WARNING, not FAIL

---

### Test 4.4: Staff Records

**Purpose**: Verify staff table populated

**Command**:
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) as staff_count FROM staff;" -t
```

**Expected Output**: Number > 0

**Pass Criteria**:
- Staff records exist

**Fail Criteria**:
- Zero staff records

**On Failure**:
Report: "⚠️ WARNING: Staff table empty."

**Note**: Mark as WARNING, not FAIL

---

## SCENARIO 5: Query Performance

### Test 5.1: Simple Query Performance

**Purpose**: Verify basic queries are fast

**Command**:
```bash
time psql "$DATABASE_URL" -c "
SELECT * FROM qa_photo_reviews
WHERE project = 'Lawley'
LIMIT 100;
" > /dev/null 2>&1
```

**Measure**: Execution time (real)

**Pass Criteria**:
- Query completes in < 500ms

**Fail Criteria**:
- Query takes > 1 second

**On Failure**:
1. Check for indexes on `project` column
2. Report: "Slow query performance ([X]ms). Add index on project column."

---

### Test 5.2: Count Query Performance

**Purpose**: Verify aggregation queries fast

**Command**:
```bash
time psql "$DATABASE_URL" -c "
SELECT project, COUNT(*) as drop_count
FROM qa_photo_reviews
WHERE whatsapp_message_date > NOW() - INTERVAL '7 days'
GROUP BY project;
" > /dev/null 2>&1
```

**Measure**: Execution time (real)

**Pass Criteria**:
- Query completes in < 1 second

**Fail Criteria**:
- Query takes > 2 seconds

**On Failure**:
Report: "Slow aggregation query ([X]s). Check indexes and database load."

---

### Test 5.3: Join Query Performance

**Purpose**: Verify multi-table queries acceptable

**Command**:
```bash
time psql "$DATABASE_URL" -c "
SELECT p.project_name, COUNT(q.id) as review_count
FROM projects p
LEFT JOIN qa_photo_reviews q ON p.project_name = q.project
GROUP BY p.project_name;
" > /dev/null 2>&1
```

**Measure**: Execution time (real)

**Pass Criteria**:
- Query completes in < 2 seconds

**Fail Criteria**:
- Query takes > 5 seconds

**On Failure**:
Report: "Slow join query ([X]s). Optimize indexes or query structure."

---

## SCENARIO 6: Database Configuration

### Test 6.1: Correct Database URL

**Purpose**: Verify using correct production database

**Command**:
```bash
echo "$DATABASE_URL" | grep -c "ep-dry-night-a9qyh4sj"
```

**Expected Output**: `1`

**Pass Criteria**:
- Connection string contains correct database endpoint

**Fail Criteria**:
- Wrong database endpoint

**On Failure**:
Report: "🚨 CRITICAL: Using wrong database! Update DATABASE_URL to ep-dry-night-a9qyh4sj."

---

### Test 6.2: Not Using Old Database

**Purpose**: Verify NOT connected to old/incorrect database

**Command**:
```bash
echo "$DATABASE_URL" | grep -c "ep-damp-credit-a857vku0"
```

**Expected Output**: `0`

**Pass Criteria**:
- Not using old database

**Fail Criteria**:
- Connected to old database (count = 1)

**On Failure**:
Report: "🚨 CRITICAL: Using OLD database (ep-damp-credit-a857vku0)! Update DATABASE_URL immediately."

---

## SCENARIO 7: Data Quality Checks

### Test 7.1: Recent Data Activity

**Purpose**: Verify system is actively used

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT
    MAX(whatsapp_message_date) as last_qa_review,
    NOW() - MAX(whatsapp_message_date) as days_since
FROM qa_photo_reviews;
" -t
```

**Expected**: Last activity < 7 days ago

**Pass Criteria**:
- Recent activity detected

**Fail Criteria**:
- No activity in > 30 days

**On Failure**:
Report: "⚠️ WARNING: Last QA review was [X] days ago. System may be inactive."

**Note**: Mark as WARNING, not FAIL

---

### Test 7.2: No Test Data in Production

**Purpose**: Verify production data is clean

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as test_data_count
FROM qa_photo_reviews
WHERE (project ILIKE '%test%' AND project != 'Velo Test')
   OR drop_number LIKE 'DR1111%'
   OR submitted_by = '27000000000';
" -t
```

**Expected Output**: `0`

**Pass Criteria**:
- No obvious test data

**Fail Criteria**:
- Test data found

**On Failure**:
Report: "⚠️ WARNING: Found [X] test records in production. Clean up test data."

**Note**: "Velo Test" project is VALID (excluded from check)

---

### Test 7.3: Duplicate Detection

**Purpose**: Check for excessive duplicate submissions

**Command**:
```bash
psql "$DATABASE_URL" -c "
SELECT drop_number, COUNT(*) as duplicate_count
FROM qa_photo_reviews
GROUP BY drop_number
HAVING COUNT(*) > 10
ORDER BY duplicate_count DESC
LIMIT 5;
" -t
```

**Expected**: No drop numbers with > 10 submissions

**Pass Criteria**:
- No excessive duplicates

**Fail Criteria**:
- Drop numbers with > 10 submissions (indicates bug)

**On Failure**:
Report: "⚠️ WARNING: Found drops with excessive duplicates: [list]. May indicate processing bug."

**Note**: Some duplicates are valid (resubmissions) - only flag if > 10

---

## Final Report Generation

Generate comprehensive report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DATABASE VALIDATION REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Validation completed: [timestamp]
Duration: [X minutes]
Database: ep-dry-night-a9qyh4sj (Neon PostgreSQL)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO 1: DATABASE CONNECTIVITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 1.1 Basic Connection: Connected
✅ 1.2 Database Identity: neondb / neondb_owner
✅ 1.3 Connection Pooling: Using pooler
✅ 1.4 Connection Performance: 0.8s

Status: ✅ PASS (4/4)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO 2: SCHEMA VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 2.1 Critical Tables: All exist (11/11)
✅ 2.2 QA Reviews Schema: Valid
✅ 2.3 Projects Schema: Valid
✅ 2.4 Contractors Schema: Valid
✅ 2.5 Primary Keys: All present
✅ 2.6 Performance Indexes: All present

Status: ✅ PASS (6/6)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO 3: DATA INTEGRITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 3.1 No Orphaned QA Reviews: 0 orphans
✅ 3.2 Required Fields: All populated
✅ 3.3 Drop Number Format: Valid
✅ 3.4 Phone Number Format: Valid (no LIDs)
✅ 3.5 Timestamp Validity: Valid

Status: ✅ PASS (5/5)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO 4: CRITICAL DATA EXISTENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 4.1 Projects: 12 projects
✅ 4.2 Contractors: 47 contractors
✅ 4.3 Recent QA Reviews: 342 (last 30 days)
✅ 4.4 Staff Records: 8 staff

Status: ✅ PASS (4/4)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO 5: QUERY PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 5.1 Simple Query: 245ms
✅ 5.2 Count Query: 0.8s
✅ 5.3 Join Query: 1.2s

Status: ✅ PASS (3/3)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO 6: DATABASE CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 6.1 Correct Database URL: ep-dry-night-a9qyh4sj
✅ 6.2 Not Using Old Database: Verified

Status: ✅ PASS (2/2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENARIO 7: DATA QUALITY CHECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 7.1 Recent Activity: 2 days ago
✅ 7.2 No Test Data: Clean
⚠️ 7.3 Duplicates: 3 drops with >10 submissions

Status: ✅ PASS (2/3, 1 warning)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tests Passed: 24/25 (96%)
Warnings: 1
Failures: 0

Overall Status: ✅ VALIDATION PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERFORMANCE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Connection Time: 0.8s ✅
Simple Query: 245ms ✅
Aggregation: 0.8s ✅
Join Query: 1.2s ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA HEALTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Projects: 12
Contractors: 47
QA Reviews (30d): 342
Staff: 8
Last Activity: 2 days ago

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Database is healthy and performing well
⚠️ Review drops with excessive duplicates (non-critical)
📝 Document this run in docs/validation/database/results/

Validation completed: [timestamp]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Success Criteria

**Validation PASSES when**:
- Database connection successful
- All critical tables exist with correct schema
- No critical data integrity violations
- Recent data exists
- Query performance acceptable
- Correct database URL verified
- Pass rate ≥ 88% (22/25 tests)

**Validation FAILS when**:
- Cannot connect to database
- Critical tables missing
- Schema mismatches
- Data integrity violations
- Wrong database URL
- Pass rate < 88%

---

## Known Limitations

This validation does NOT test:
- Database backups/recovery
- Write performance (only reads)
- Transaction isolation levels
- Neon-specific features (branching, etc.)
- Database size limits
- Replication status

---

## Version History

- **v1.0** (2025-11-24): Initial database validation
  - 7 scenarios, 25 individual tests
  - Comprehensive schema and data integrity checks
  - Performance benchmarking

---

**Ready to validate! Run `/validate-database` to check database health.**
