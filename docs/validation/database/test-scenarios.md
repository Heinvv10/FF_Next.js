# Database Validation - Test Scenarios

**Version**: 1.0
**Created**: November 24, 2025
**Total Tests**: 25+ across 7 scenarios

---

## SCENARIO 1: Database Connectivity (4 tests)

### Test 1.1: Basic Connection
**Purpose**: Verify can connect to Neon PostgreSQL

**Query**:
```sql
SELECT NOW() as current_time;
```

**Expected**:
- Returns current timestamp
- Connection successful

**Pass Criteria**:
- Query executes successfully
- Returns valid timestamp

**Fail Criteria**:
- Connection timeout
- Authentication failure
- Network error

**On Failure**:
- Check network connectivity
- Verify DATABASE_URL environment variable
- Check Neon dashboard for database status

---

### Test 1.2: Database Identity
**Purpose**: Verify connected to correct database

**Query**:
```sql
SELECT current_database() as db_name, current_user as db_user;
```

**Expected Output**:
- `db_name`: neondb
- `db_user`: neondb_owner

**Pass Criteria**:
- Database name = "neondb"
- User = "neondb_owner"

**Fail Criteria**:
- Wrong database name
- Wrong user

**On Failure**:
- Verify DATABASE_URL points to correct database
- Check for environment variable misconfiguration

---

### Test 1.3: Connection Pooling
**Purpose**: Verify using pooled connection (serverless)

**Check**:
Extract hostname from DATABASE_URL

**Expected**:
- Hostname contains "-pooler.gwc.azure.neon.tech"
- Using pooled endpoint (NOT direct connection)

**Pass Criteria**:
- Connection string includes "pooler"

**Fail Criteria**:
- Using direct connection (no pooler)
- Wrong region

**On Failure**:
- Update DATABASE_URL to use pooler endpoint
- See CLAUDE.md for correct connection string

---

### Test 1.4: Connection Performance
**Purpose**: Verify connection time is acceptable

**Test**:
Time the connection establishment

**Expected**:
- Connection time < 2 seconds

**Pass Criteria**:
- Connect in < 1 second (excellent)
- Connect in 1-2 seconds (acceptable)

**Fail Criteria**:
- Connection takes > 2 seconds

**On Failure**:
- Check network latency
- Verify Neon database not suspended
- Check VPS network performance

---

## SCENARIO 2: Schema Validation (6 tests)

### Test 2.1: Critical Tables Exist
**Purpose**: Verify all essential tables present

**Query**:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname='public'
ORDER BY tablename;
```

**Expected Tables** (minimum):
- `contractors`
- `clients`
- `documents`
- `drops`
- `fibre`
- `poles`
- `projects`
- `qa_photo_reviews`
- `staff`
- `suppliers`
- `teams`

**Pass Criteria**:
- All critical tables exist
- No missing tables from list

**Fail Criteria**:
- Any critical table missing

**On Failure**:
- Check if database initialized
- Run migration scripts if needed
- Verify correct database (not old one)

---

### Test 2.2: QA Photo Reviews Schema
**Purpose**: Validate WhatsApp monitor table structure

**Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'qa_photo_reviews'
ORDER BY ordinal_position;
```

**Expected Columns** (critical):
- `id` (integer, NOT NULL)
- `drop_number` (text, NOT NULL)
- `project` (text, NOT NULL)
- `whatsapp_message_date` (timestamp with time zone, NOT NULL)
- `submitted_by` (text)
- `user_name` (text)
- `step_01_house_photo` (text)
- `step_02_*` through `step_12_*` (text)
- `incorrect_steps` (jsonb, NOT NULL)
- `incorrect_comments` (jsonb, NOT NULL)
- `created_at` (timestamp with time zone)
- `review_date` (date)

**Pass Criteria**:
- All critical columns exist
- Data types correct
- NOT NULL constraints on key fields

**Fail Criteria**:
- Missing critical columns
- Wrong data types
- Missing NOT NULL constraints

**On Failure**:
- Run migration to add missing columns
- Check schema version

---

### Test 2.3: Projects Table Schema
**Purpose**: Validate projects master table

**Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;
```

**Expected Columns**:
- `project_id` (integer, NOT NULL, primary key)
- `project_name` (text, NOT NULL, unique)
- `client` (text)
- `status` (text)
- `created_at` (timestamp)

**Pass Criteria**:
- All columns exist
- Primary key on project_id
- Unique constraint on project_name

**Fail Criteria**:
- Missing columns
- No primary key
- No unique constraint

---

### Test 2.4: Contractors Table Schema
**Purpose**: Validate contractors table (RAG feature)

**Query**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contractors'
ORDER BY ordinal_position;
```

**Expected Columns** (key fields):
- `id` (integer, NOT NULL)
- `contractor_name` (text, NOT NULL)
- `contractor_email` (text)
- `contractor_phone` (text)
- `status` (text)
- `created_at` (timestamp)

**Pass Criteria**:
- All columns exist
- NOT NULL on critical fields

---

### Test 2.5: Indexes Exist
**Purpose**: Verify performance indexes present

**Query**:
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname='public'
AND tablename IN ('qa_photo_reviews', 'projects', 'contractors', 'fibre', 'drops')
ORDER BY tablename, indexname;
```

**Expected Indexes**:
- `qa_photo_reviews`: Primary key on `id`
- `qa_photo_reviews`: Index on `drop_number`
- `qa_photo_reviews`: Index on `project`
- `qa_photo_reviews`: Index on `whatsapp_message_date`
- `projects`: Primary key on `project_id`
- `projects`: Unique index on `project_name`
- `fibre`: Unique index on `segment_id`
- `drops`: Unique index on `drop_number`

**Pass Criteria**:
- Primary keys exist on all tables
- Performance indexes present

**Fail Criteria**:
- Missing primary keys
- No indexes on frequently queried columns

---

### Test 2.6: Foreign Key Constraints
**Purpose**: Verify referential integrity constraints

**Query**:
```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

**Expected Constraints** (examples):
- Documents → Contractors (contractor_id)
- Documents → Projects (project_id)
- Teams → Contractors (contractor_id)
- Teams → Projects (project_id)

**Pass Criteria**:
- Foreign keys defined
- Relationships valid

**Note**: Some tables may use loose coupling (text fields) instead of strict foreign keys

---

## SCENARIO 3: Data Integrity (5 tests)

### Test 3.1: No Orphaned QA Reviews
**Purpose**: Verify all QA reviews link to valid projects

**Query**:
```sql
SELECT COUNT(*) as orphaned_count
FROM qa_photo_reviews
WHERE project NOT IN (SELECT project_name FROM projects)
AND project IS NOT NULL;
```

**Expected**:
- `orphaned_count`: 0

**Pass Criteria**:
- Zero orphaned records

**Fail Criteria**:
- Any orphaned records found

**On Failure**:
- List orphaned projects
- Add missing projects to `projects` table
- Or clean up invalid QA reviews

---

### Test 3.2: Required Fields Populated
**Purpose**: Verify critical fields not null

**Query**:
```sql
SELECT
    COUNT(*) FILTER (WHERE drop_number IS NULL) as null_drop_number,
    COUNT(*) FILTER (WHERE project IS NULL) as null_project,
    COUNT(*) FILTER (WHERE whatsapp_message_date IS NULL) as null_message_date
FROM qa_photo_reviews;
```

**Expected**:
- All counts: 0

**Pass Criteria**:
- No null values in critical fields

**Fail Criteria**:
- Any critical field has null values

**On Failure**:
- Investigate how nulls got inserted
- Fix data quality at source (WA Monitor)
- Update records with valid values

---

### Test 3.3: Drop Number Format
**Purpose**: Verify drop numbers follow correct format

**Query**:
```sql
SELECT COUNT(*) as invalid_count
FROM qa_photo_reviews
WHERE drop_number !~ '^DR[0-9]{7}$'
AND drop_number IS NOT NULL;
```

**Expected Format**: `DR` + 7 digits (e.g., DR1734338)

**Pass Criteria**:
- Zero invalid formats

**Fail Criteria**:
- Invalid drop number formats found

**On Failure**:
- List invalid drop numbers
- Fix format issues in source data

---

### Test 3.4: Phone Number Format
**Purpose**: Verify phone numbers follow SA format

**Query**:
```sql
SELECT COUNT(*) as invalid_count
FROM qa_photo_reviews
WHERE submitted_by IS NOT NULL
AND LENGTH(submitted_by) != 11
AND submitted_by !~ '^27[0-9]{9}$';
```

**Expected Format**: 27 + 9 digits (e.g., 27640412391)

**Pass Criteria**:
- All phone numbers valid or null
- No LID numbers (length > 11)

**Fail Criteria**:
- Invalid phone formats
- LID numbers present

**On Failure**:
- Check for LID resolution issues in WA Monitor
- See CLAUDE.md section on LID bug fix

---

### Test 3.5: Timestamp Validity
**Purpose**: Verify timestamps are reasonable

**Query**:
```sql
SELECT COUNT(*) as invalid_count
FROM qa_photo_reviews
WHERE whatsapp_message_date < '2024-01-01'
   OR whatsapp_message_date > NOW() + INTERVAL '1 day';
```

**Expected**:
- No timestamps before 2024 (app started in 2024)
- No future timestamps (beyond tomorrow)

**Pass Criteria**:
- Zero invalid timestamps

**Fail Criteria**:
- Timestamps outside reasonable range

---

## SCENARIO 4: Critical Data Existence (4 tests)

### Test 4.1: Projects Exist
**Purpose**: Verify projects table populated

**Query**:
```sql
SELECT COUNT(*) as project_count FROM projects;
```

**Expected**:
- Count > 0
- At least 3-5 active projects

**Pass Criteria**:
- Projects table not empty

**Fail Criteria**:
- Zero projects (database not initialized)

---

### Test 4.2: Contractors Exist
**Purpose**: Verify contractors table populated

**Query**:
```sql
SELECT COUNT(*) as contractor_count FROM contractors;
```

**Expected**:
- Count > 0

**Pass Criteria**:
- Contractors table not empty

**Fail Criteria**:
- Zero contractors

---

### Test 4.3: Recent QA Reviews
**Purpose**: Verify recent WhatsApp activity

**Query**:
```sql
SELECT COUNT(*) as recent_count
FROM qa_photo_reviews
WHERE whatsapp_message_date > NOW() - INTERVAL '30 days';
```

**Expected**:
- Count > 0
- Recent submissions within last 30 days

**Pass Criteria**:
- Recent data exists

**Fail Criteria**:
- No data in last 30 days (system inactive?)

**Note**: Mark as WARNING if no recent data (not FAIL)

---

### Test 4.4: Staff Records
**Purpose**: Verify staff table populated

**Query**:
```sql
SELECT COUNT(*) as staff_count FROM staff;
```

**Expected**:
- Count > 0

**Pass Criteria**:
- Staff records exist

**Note**: Mark as WARNING if empty (not critical)

---

## SCENARIO 5: Query Performance (3 tests)

### Test 5.1: Simple Query Performance
**Purpose**: Verify basic queries are fast

**Query**:
```sql
SELECT * FROM qa_photo_reviews
WHERE project = 'Lawley'
LIMIT 100;
```

**Measure**: Execution time

**Pass Criteria**:
- Query completes in < 500ms

**Fail Criteria**:
- Query takes > 1 second

**On Failure**:
- Check indexes on `project` column
- Verify database not under load

---

### Test 5.2: Count Query Performance
**Purpose**: Verify aggregation queries fast

**Query**:
```sql
SELECT project, COUNT(*) as drop_count
FROM qa_photo_reviews
WHERE whatsapp_message_date > NOW() - INTERVAL '7 days'
GROUP BY project;
```

**Measure**: Execution time

**Pass Criteria**:
- Query completes in < 1 second

**Fail Criteria**:
- Query takes > 2 seconds

---

### Test 5.3: Join Query Performance
**Purpose**: Verify multi-table queries acceptable

**Query**:
```sql
SELECT p.project_name, COUNT(q.id) as review_count
FROM projects p
LEFT JOIN qa_photo_reviews q ON p.project_name = q.project
GROUP BY p.project_name;
```

**Measure**: Execution time

**Pass Criteria**:
- Query completes in < 2 seconds

**Fail Criteria**:
- Query takes > 5 seconds

---

## SCENARIO 6: Database Configuration (2 tests)

### Test 6.1: Correct Database URL
**Purpose**: Verify using correct production database

**Check**: DATABASE_URL environment variable

**Expected**:
- Contains: `ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech`
- Database: `neondb`
- SSL mode: `require`

**Pass Criteria**:
- Correct database endpoint

**Fail Criteria**:
- Using wrong database (ep-damp-credit-a857vku0)
- Not using SSL

**On Failure**:
- Update DATABASE_URL in all environments
- See CLAUDE.md "CRITICAL: Database Configuration" section

---

### Test 6.2: Not Using Old Database
**Purpose**: Verify NOT connected to old/incorrect database

**Check**: Connection hostname

**Expected**:
- Does NOT contain: `ep-damp-credit-a857vku0`

**Pass Criteria**:
- Not using old database

**Fail Criteria**:
- Connected to old database

**On Failure**:
- CRITICAL: Update DATABASE_URL immediately
- All environments must use same database

---

## SCENARIO 7: Data Quality Checks (3 tests)

### Test 7.1: Recent Data Activity
**Purpose**: Verify system is actively used

**Query**:
```sql
SELECT
    MAX(whatsapp_message_date) as last_qa_review,
    MAX(created_at) as last_project_update
FROM qa_photo_reviews;
```

**Expected**:
- Last QA review < 7 days old
- Shows active usage

**Pass Criteria**:
- Recent activity detected

**Fail Criteria**:
- No activity in > 30 days (system abandoned?)

**Note**: Mark as WARNING, not FAIL

---

### Test 7.2: No Test Data in Production
**Purpose**: Verify production data is clean

**Query**:
```sql
SELECT COUNT(*) as test_data_count
FROM qa_photo_reviews
WHERE project ILIKE '%test%'
   OR drop_number LIKE 'DR1111%'
   OR submitted_by = '27000000000';
```

**Expected**:
- Count = 0 (no test data)
- Note: "Velo Test" is a valid production project

**Pass Criteria**:
- No obvious test data

**Fail Criteria**:
- Test data found in production

**Note**: "Velo Test" project is EXCLUDED from this check (it's a real project)

---

### Test 7.3: Duplicate Detection
**Purpose**: Check for duplicate submissions

**Query**:
```sql
SELECT drop_number, COUNT(*) as duplicate_count
FROM qa_photo_reviews
GROUP BY drop_number
HAVING COUNT(*) > 1
LIMIT 10;
```

**Expected**:
- Duplicates allowed (resubmissions are valid)
- Check for excessive duplicates (> 5 per drop)

**Pass Criteria**:
- No drop number with > 10 submissions

**Fail Criteria**:
- Drop numbers with excessive duplicates (indicates bug)

**Note**: Mark as WARNING - duplicates are often valid resubmissions

---

## Pass/Fail Summary

| Scenario | Tests | Critical? | Pass Threshold |
|----------|-------|-----------|----------------|
| 1. Connectivity | 4 | ✅ Yes | 100% (4/4) |
| 2. Schema | 6 | ✅ Yes | 100% (6/6) |
| 3. Data Integrity | 5 | ✅ Yes | 80% (4/5) |
| 4. Data Existence | 4 | ⚠️ Partial | 75% (3/4) |
| 5. Performance | 3 | ⚠️ Partial | 67% (2/3) |
| 6. Configuration | 2 | ✅ Yes | 100% (2/2) |
| 7. Data Quality | 3 | ⚠️ Partial | 67% (2/3) |
| **TOTAL** | **27** | - | **90% (24/27)** |

---

## Validation Report Format

Each validation run produces a detailed report including:
- Test results with timing
- Pass/Fail status for each scenario
- Performance metrics
- Data quality issues found
- Recommendations for fixes
- Overall health score

---

**Version**: 1.0
**Last Updated**: November 24, 2025
**Total Test Scenarios**: 7
**Total Individual Tests**: 27
