import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabaseConnection } from '@/lib/database';

export interface DashboardMetrics {
  totalUniqueRepos: number;
  totalRuns: number;
  totalUniquePRs: number;
}

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

    // Query for total unique repositories
    const uniqueReposQuery = `
      SELECT COUNT(DISTINCT GITHUB_REPOSITORY) as total_unique_repos
      FROM github_events 
      WHERE customer_slug = 'harsh_sset'
    `;

    // Query for total runs
    const totalRunsQuery = `
      SELECT COUNT(*) as total_runs
      FROM github_events 
      WHERE customer_slug = 'harsh_sset'
    `;

    // Query for total unique PRs
    const uniquePRsQuery = `
      SELECT COUNT(DISTINCT GITHUB_PR_NUMBER) as total_unique_prs
      FROM github_events 
      WHERE customer_slug = 'harsh_sset' 
      AND GITHUB_PR_NUMBER IS NOT NULL
    `;

    // Execute all queries in parallel
    const [uniqueReposResult, totalRunsResult, uniquePRsResult] = await Promise.all([
      db.query(uniqueReposQuery),
      db.query(totalRunsQuery),
      db.query(uniquePRsQuery)
    ]);

    const metrics: DashboardMetrics = {
      totalUniqueRepos: (uniqueReposResult as any[])[0]?.total_unique_repos || 0,
      totalRuns: (totalRunsResult as any[])[0]?.total_runs || 0,
      totalUniquePRs: (uniquePRsResult as any[])[0]?.total_unique_prs || 0,
    };

    return NextResponse.json({  
      success: true,
      data: metrics,
    });

  } catch (error) {
    console.error('Dashboard metrics query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
