import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;

    // Get daily stats
    const statsQuery = date
      ? `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_valid = true) as valid,
          COUNT(*) FILTER (WHERE is_valid = false) as invalid
        FROM marketing_activations
        WHERE DATE(whatsapp_message_date AT TIME ZONE 'Africa/Johannesburg') = $1
      `
      : `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_valid = true) as valid,
          COUNT(*) FILTER (WHERE is_valid = false) as invalid
        FROM marketing_activations
        WHERE DATE(whatsapp_message_date AT TIME ZONE 'Africa/Johannesburg') = CURRENT_DATE
      `;

    const statsResult = date
      ? await sql(statsQuery, [date])
      : await sql(statsQuery);

    const stats = statsResult[0];

    // Get recent submissions
    const submissionsQuery = date
      ? `
        SELECT
          drop_number,
          whatsapp_message_date,
          submitted_by,
          user_name,
          is_valid,
          validation_message,
          created_at
        FROM marketing_activations
        WHERE DATE(whatsapp_message_date AT TIME ZONE 'Africa/Johannesburg') = $1
        ORDER BY whatsapp_message_date DESC
      `
      : `
        SELECT
          drop_number,
          whatsapp_message_date,
          submitted_by,
          user_name,
          is_valid,
          validation_message,
          created_at
        FROM marketing_activations
        WHERE DATE(whatsapp_message_date AT TIME ZONE 'Africa/Johannesburg') = CURRENT_DATE
        ORDER BY whatsapp_message_date DESC
      `;

    const submissions = date
      ? await sql(submissionsQuery, [date])
      : await sql(submissionsQuery);

    return res.status(200).json({
      success: true,
      data: {
        date: date || new Date().toISOString().split('T')[0],
        stats: {
          total: parseInt(stats.total) || 0,
          valid: parseInt(stats.valid) || 0,
          invalid: parseInt(stats.invalid) || 0
        },
        submissions: submissions.map(sub => ({
          dropNumber: sub.drop_number,
          submittedAt: sub.whatsapp_message_date,
          submittedBy: sub.submitted_by,
          userName: sub.user_name,
          isValid: sub.is_valid,
          validationMessage: sub.validation_message
        }))
      }
    });
  } catch (error: any) {
    console.error('Marketing activations API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
