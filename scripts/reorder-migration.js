const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '..', 'neon', 'migrations', '20251218_create_ticketing_tables.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

// Define correct table order (dependencies first)
const tableOrder = [
  'sla_configs',
  'client_contracts',
  'project_guarantees',
  'billable_fee_schedule',
  'tickets',
  'ticket_notes',
  'ticket_attachments',
  'ticket_history',
  'ticket_tags',
  'ticket_billing',
  'ticket_assignment_history',
  'notification_log'
];

// Extract header (everything before first CREATE TABLE)
const headerMatch = sql.match(/([\s\S]*?)CREATE TABLE/);
const header = headerMatch ? headerMatch[1] : '';

// Extract all table sections
const tableSections = {};
const tableRegex = /-- TABLE \d+: (\w+)\n--[\s\S]*?(?=(?:-- TABLE \d+:|-- ====|$))/g;
let match;

while ((match = tableRegex.exec(sql)) !== null) {
  const tableName = match[1];
  tableSections[tableName] = match[0];
}

// Extract triggers section (after all tables)
const triggersMatch = sql.match(/(-- ====.*?TRIGGERS[\s\S]*)/);
const triggers = triggersMatch ? triggersMatch[0] : '';

// Rebuild migration in correct order
let reorderedSQL = header;

tableOrder.forEach(tableName => {
  if (tableSections[tableName]) {
    reorderedSQL += tableSections[tableName];
  } else {
    console.warn(`Warning: Table ${tableName} not found in migration`);
  }
});

reorderedSQL += triggers;

// Write reordered migration
const outputPath = path.join(__dirname, '..', 'neon', 'migrations', '20251218_create_ticketing_tables_reordered.sql');
fs.writeFileSync(outputPath, reorderedSQL);

console.log('✅ Migration reordered successfully');
console.log(`   Output: ${outputPath}`);
