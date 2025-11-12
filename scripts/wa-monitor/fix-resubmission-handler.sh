#!/bin/bash
# Fix Resubmission Handler - Pass Resolved Phone to Database
# Bug: Resubmission handler not updating submitted_by/user_name with resolved phone
# Date: November 12, 2025

set -e

VPS_USER="root"
VPS_HOST="72.60.17.245"
MONITOR_DIR="/opt/wa-monitor/prod"

echo "🔧 Fixing Resubmission Handler"
echo "========================================"

# Step 1: Backup current files
echo "📦 Creating backups..."
ssh ${VPS_USER}@${VPS_HOST} "
cd ${MONITOR_DIR} && \
cp modules/monitor.py modules/monitor.py.backup-$(date +%Y%m%d-%H%M%S) && \
cp modules/database.py modules/database.py.backup-$(date +%Y%m%d-%H%M%S)
"
echo "   ✅ Backups created"

# Step 2: Fix monitor.py - Update process_message to pass resolved_phone to resubmission handler
echo "🔨 Fixing monitor.py..."
ssh ${VPS_USER}@${VPS_HOST} "cat > /tmp/fix_monitor.py << 'MONITOR_EOF'
# Find and replace the handle_resubmission call
# FROM: return self.db.handle_resubmission(drop_number, project_name)
# TO:   return self.db.handle_resubmission(drop_number, project_name, resolved_phone)

import re
with open('${MONITOR_DIR}/modules/monitor.py', 'r') as f:
    content = f.read()

# Update the handle_resubmission call to include resolved_phone parameter
content = re.sub(
    r'return self\.db\.handle_resubmission\(drop_number, project_name\)',
    'return self.db.handle_resubmission(drop_number, project_name, resolved_phone)',
    content
)

with open('${MONITOR_DIR}/modules/monitor.py', 'w') as f:
    f.write(content)

print('✅ monitor.py updated')
MONITOR_EOF

python3 /tmp/fix_monitor.py
"
echo "   ✅ monitor.py fixed"

# Step 3: Fix database.py - Update handle_resubmission to accept and use resolved_phone
echo "🔨 Fixing database.py..."
ssh ${VPS_USER}@${VPS_HOST} "cat > /tmp/fix_database.py << 'DATABASE_EOF'
# Update handle_resubmission signature and implementation
# FROM: def handle_resubmission(self, drop_number: str, project: str) -> bool:
# TO:   def handle_resubmission(self, drop_number: str, project: str, resolved_phone: str) -> bool:
# AND update the UPDATE query to set submitted_by and user_name

import re
with open('${MONITOR_DIR}/modules/database.py', 'r') as f:
    content = f.read()

# Step 1: Update function signature
content = re.sub(
    r'def handle_resubmission\(self, drop_number: str, project: str\) -> bool:',
    'def handle_resubmission(self, drop_number: str, project: str, resolved_phone: str) -> bool:',
    content
)

# Step 2: Update the UPDATE query to include submitted_by and user_name
# This is trickier - we need to find the UPDATE statement and add the fields
# The current UPDATE likely looks like:
#   UPDATE qa_photo_reviews SET resubmitted = true, updated_at = NOW() WHERE drop_number = ?
# We need to change it to:
#   UPDATE qa_photo_reviews SET resubmitted = true, submitted_by = ?, user_name = ?, updated_at = NOW() WHERE drop_number = ?

# Find the UPDATE query in handle_resubmission
old_update_pattern = r'(UPDATE qa_photo_reviews\s+SET\s+resubmitted\s*=\s*true,\s*updated_at\s*=\s*NOW\(\))\s+(WHERE drop_number\s*=\s*\?)'
new_update = r'\1, submitted_by = ?, user_name = ? \2'
content = re.sub(old_update_pattern, new_update, content, flags=re.IGNORECASE)

# Update the execute parameters to include resolved_phone twice
# FROM: cursor.execute(query, (drop_number,))
# TO:   cursor.execute(query, (resolved_phone, resolved_phone[:100], drop_number))
old_execute_pattern = r'cursor\.execute\(query,\s*\(drop_number,\)\)'
new_execute = 'cursor.execute(query, (resolved_phone, resolved_phone[:100], drop_number))'
content = re.sub(old_execute_pattern, new_execute, content)

with open('${MONITOR_DIR}/modules/database.py', 'w') as f:
    f.write(content)

print('✅ database.py updated')
DATABASE_EOF

python3 /tmp/fix_database.py
"
echo "   ✅ database.py fixed"

# Step 4: Run safe restart script
echo "🔄 Running safe restart..."
ssh ${VPS_USER}@${VPS_HOST} "${MONITOR_DIR}/restart-monitor.sh"
echo "   ✅ Service restarted with cache cleared"

# Step 5: Verify
echo "📊 Checking service status..."
ssh ${VPS_USER}@${VPS_HOST} "systemctl status wa-monitor-prod --no-pager | head -10"

echo "========================================"
echo "✅ Resubmission handler fix complete!"
echo ""
echo "Next steps:"
echo "1. Test with a resubmission of an existing drop"
echo "2. Check database to confirm submitted_by is phone number (11 chars)"
echo "3. Monitor logs: tail -f ${MONITOR_DIR}/logs/wa-monitor-prod.log"
