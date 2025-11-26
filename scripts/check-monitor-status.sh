#!/bin/bash
# Check the status of the WA Monitor and recent Lawley activity

echo "🔍 WA Monitor Process Status:"
ps aux | grep -E "(drop_monitor|realtime_monitor)" | grep -v grep

echo -e "\n📂 Monitor Working Directory:"
pwdx 8081 2>/dev/null || echo "Process not found"

echo -e "\n📊 Recent Lawley drops in Neon database (last 10):"
cd /home/louisdup/VF/Apps/FF_React
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.NEON_DATABASE_URL);

(async () => {
  try {
    const drops = await sql\`
      SELECT drop_number, installation_date, created_at, status
      FROM drops
      WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55'
      ORDER BY created_at DESC
      LIMIT 10
    \`;

    console.table(drops);

    const today = await sql\`
      SELECT COUNT(*) as count
      FROM drops
      WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55'
        AND created_at::date = CURRENT_DATE
    \`;

    console.log(\`\n📅 Drops added today: \${today[0].count}\`);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
"

echo -e "\n📁 Monitor Log Files (last 5 most recent):"
find /home/louisdup/VF/Apps/WA_Tool -name "*monitor*.log" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -5 | awk '{print $2, "(modified:", strftime("%Y-%m-%d %H:%M", $1), ")"}'
