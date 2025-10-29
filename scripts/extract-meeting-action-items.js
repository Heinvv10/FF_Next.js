const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log('🔍 Finding meetings with action items...');

    const meetings = await sql`
      SELECT id, title, summary
      FROM meetings
      WHERE summary IS NOT NULL
      AND summary->>'action_items' IS NOT NULL
      AND summary->>'action_items' != ''
    `;

    console.log(`Found ${meetings.length} meetings with action items\n`);

    for (const meeting of meetings) {
      try {
        const response = await fetch('http://localhost:3005/api/action-items/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meeting_id: meeting.id })
        });

        if (!response.ok) {
          const error = await response.json();
          const msg = error.error ? error.error.message : 'Failed';
          console.log(`❌ ${meeting.title}: ${msg}`);
        } else {
          const result = await response.json();
          const count = Array.isArray(result.data) ? result.data.length : 0;
          console.log(`✅ ${meeting.title}: ${count} action items extracted`);
        }
      } catch (error) {
        console.log(`❌ ${meeting.title}: ${error.message}`);
      }
    }

    // Show total
    const total = await sql`SELECT COUNT(*)::int as count FROM meeting_action_items`;
    console.log(`\n📊 Total action items in database: ${total[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
