import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL || '');

    // Check if columns exist
    const checkResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contractors'
      AND column_name IN ('specializations', 'certifications')
    `;

    const existingColumns = checkResult.map(row => row.column_name);

    // Add missing columns
    if (!existingColumns.includes('specializations')) {
      await sql`
        ALTER TABLE contractors
        ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'
      `;
    }

    if (!existingColumns.includes('certifications')) {
      await sql`
        ALTER TABLE contractors
        ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'
      `;
    }

    // Verify the columns were added
    const verifyResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contractors'
      AND column_name IN ('specializations', 'certifications')
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      existingColumnsBefore: existingColumns,
      columnsAfter: verifyResult.map(row => row.column_name),
      columnsAdded: ['specializations', 'certifications'].filter(col => !existingColumns.includes(col))
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}