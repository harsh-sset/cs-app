import { RunResult } from '@/app/api/github-reports/typing';
import mysql from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

class DatabaseConnection {
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async getConnection() {
    const connectionConfig: any = {
      host: this.config.host,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      port: this.config.port,
      connectTimeout: 10000, // 10 seconds
      ssl: false, // Disable SSL by default
    };

    // Only enable SSL if explicitly requested
    if (process.env.DB_SSL === 'true') {
      console.log('SSL enabled by configuration');
      connectionConfig.ssl = {
        rejectUnauthorized: false
      };
    } else {
      console.log('Connecting without SSL');
    }

    const connection = await mysql.createConnection(connectionConfig);
    return connection;
  }

  async query(sql: string, params?: any[]) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  async testConnection() {
    try {
      const connection = await this.getConnection();
      await connection.ping();
      await connection.end();
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  async queryGitHubInsights() {
    let sql = `
      SELECT 
        *
      FROM github_events
      LIMIT 100
    `;
    
    
    return await this.query(sql);
  }

  async queryGitHubReportById(id: number) {
    let sql = `
      SELECT 
        *
      FROM github_events 
      WHERE id = ?
      LIMIT 1
    `;
    
    const results = await this.query(sql, [id]) as RunResult[];
    return results.length > 0 ? results[0] : null;
  }
}

// Create a singleton instance
let dbConnection: DatabaseConnection | null = null;

export function getDatabaseConnection(): DatabaseConnection {
  if (!dbConnection) {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    };

    if (!config.user || !config.password || !config.database) {
      throw new Error('Missing required database configuration. Please check your environment variables.');
    }

    console.log('Connecting to database:', config.host, config.database);
    dbConnection = new DatabaseConnection(config);
  }

  return dbConnection;
}

export default DatabaseConnection;
