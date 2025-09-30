import { neon } from '@neondatabase/serverless';
import { FirefliesMeeting } from './fireflies';

function getDatabaseConnection() {
  if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
    throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
  }
  return neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL!);
}

export async function syncFirefliesMeeting(meeting: FirefliesMeeting) {
  const { id, title, date, participants, duration, transcript_url, summary } = meeting;

  // Convert timestamp to ISO string
  const created_at = new Date(date).toISOString();

  // Convert duration to minutes and round to 2 decimal places for better display
  const durationInMinutes = Number((duration / 60).toFixed(2));

  try {
    const sql = getDatabaseConnection();

    // Upsert meeting history
    await sql`
      INSERT INTO fireflies_meetings (id, title, created_at, participants, duration)
      VALUES (${id}, ${title}, ${created_at}::timestamptz, ${JSON.stringify(participants)}, ${durationInMinutes})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        updated_at = NOW()
    `;

    // Upsert transcript (store URL since we don't have full text)
    await sql`
      INSERT INTO fireflies_transcripts (id, full_text)
      VALUES (${id}, ${transcript_url || null})
      ON CONFLICT (id) DO UPDATE SET
        full_text = EXCLUDED.full_text,
        updated_at = NOW()
    `;

    // Upsert notes/summary
    await sql`
      INSERT INTO fireflies_notes (id, summary, bullet_points)
      VALUES (${id}, ${summary.overview}, ${JSON.stringify([summary.bullet_gist])})
      ON CONFLICT (id) DO UPDATE SET
        summary = EXCLUDED.summary,
        bullet_points = EXCLUDED.bullet_points,
        updated_at = NOW()
    `;

    // Log sync
    await sql`
      INSERT INTO fireflies_sync_log (meetings_synced, last_meeting_id)
      VALUES (1, ${id})
    `;

    console.log(`Successfully synced meeting: ${title}`);
  } catch (error) {
    console.error(`Error syncing meeting ${id}:`, error);
    throw error;
  }
}

export async function getFirefliesMeetings(limit: number = 50, offset: number = 0) {
  try {
    const sql = getDatabaseConnection();
    const result = await sql`
      SELECT m.*, t.full_text, n.summary, n.bullet_points
      FROM fireflies_meetings m
      LEFT JOIN fireflies_transcripts t ON m.id = t.id
      LEFT JOIN fireflies_notes n ON m.id = n.id
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result;
  } catch (error) {
    console.error('Error getting Fireflies meetings:', error);
    throw error;
  }
}

export async function getFirefliesMeetingById(id: string) {
  try {
    const sql = getDatabaseConnection();
    const result = await sql`
      SELECT m.*, t.full_text, n.summary, n.bullet_points
      FROM fireflies_meetings m
      LEFT JOIN fireflies_transcripts t ON m.id = t.id
      LEFT JOIN fireflies_notes n ON m.id = n.id
      WHERE m.id = ${id}
    `;
    return result[0] || null;
  } catch (error) {
    console.error(`Error getting Fireflies meeting ${id}:`, error);
    throw error;
  }
}

export async function getLastSyncTimestamp() {
  try {
    const sql = getDatabaseConnection();
    const result = await sql`
      SELECT sync_timestamp FROM fireflies_sync_log
      WHERE status = 'completed'
      ORDER BY sync_timestamp DESC
      LIMIT 1
    `;
    return result[0]?.sync_timestamp || null;
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    throw error;
  }
}