import { NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/database';

export async function GET() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    ssl: process.env.DB_SSL
  };

  try {
    const db = getDatabaseConnection();
    
    // Test basic connection
    const connectionTest = await db.testConnection();
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: 'Check your environment variables and database server status',
        troubleshooting: {
          hostReachable: 'Test with: ping ' + config.host,
          portOpen: 'Test with: nc -zv ' + config.host + ' ' + config.port,
          sslRequired: 'Google Cloud SQL requires SSL. Set DB_SSL=true',
          firewall: 'Check if port ' + config.port + ' is open',
          credentials: 'Verify DB_USER and DB_PASSWORD are correct'
        },
        config
      }, { status: 500 });
    }

    // Test a simple query
    const result = await db.query('SELECT 1 as test');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      testQuery: result,
      config
    });

  } catch (error) {
    console.error('Database test error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage.includes('ETIMEDOUT');
    const isAccessDenied = errorMessage.includes('Access denied');
    const isSSL = errorMessage.includes('SSL');
    
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: errorMessage,
      troubleshooting: {
        ...(isTimeout && {
          timeout: 'Connection timeout - check host, port, and firewall settings',
          hostTest: `Test host: ping ${config.host}`,
          portTest: `Test port: nc -zv ${config.host} ${config.port}`
        }),
        ...(isAccessDenied && {
          auth: 'Authentication failed - check username and password',
          user: 'Verify DB_USER has access to the database'
        }),
        ...(isSSL && {
          ssl: 'SSL connection issue - try DB_SSL=false for local or DB_SSL=true for remote'
        }),
        general: [
          'Check if database server is running',
          'Verify network connectivity',
          'Check firewall settings',
          'For Google Cloud SQL: ensure authorized networks include your IP'
        ]
      },
      config
    }, { status: 500 });
  }
}
