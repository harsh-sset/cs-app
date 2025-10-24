import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/database';
import { RunResult } from '../typing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);
    
    if (isNaN(reportId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid report ID. Must be a number.',
        },
        { status: 400 }
      );
    }

    const db = getDatabaseConnection();
    const result: RunResult | null = await db.queryGitHubReportById(reportId) as RunResult | null;

    console.log("This is the result :: ", result?.id);
    if (!result) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Report not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({  
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
