import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabaseConnection } from '@/lib/database';
import { RunResult } from './typing';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized',
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const db = getDatabaseConnection();

    const results: RunResult[] = await db.queryGitHubInsights() as RunResult[];

    return NextResponse.json({  
      success: true,
      data: results,
    });

  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to query GitHub insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
