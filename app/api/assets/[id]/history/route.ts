/**
 * Asset Assignment History API Route
 * GET /api/assets/[id]/history - Get assignment history for an asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { assignmentService } from '@/modules/assets/services';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ==================== GET /api/assets/[id]/history ====================

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await assignmentService.getHistory(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error fetching assignment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment history' },
      { status: 500 }
    );
  }
}
