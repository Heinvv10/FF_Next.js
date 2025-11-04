import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Reminder ID is required'
      });
    }

    const result = await sql`
      DELETE FROM reminders
      WHERE id = ${id as string} AND user_id = ${userId}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reminder not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Reminder delete error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
