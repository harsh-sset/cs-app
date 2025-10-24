import { getDatabaseConnection } from './database';

export interface GitHubInsight {
  id?: number;
  repository_name: string;
  commit_hash: string;
  author_name: string;
  author_email: string;
  commit_date: string;
  message: string;
  lines_added: number;
  lines_deleted: number;
  files_changed: number;
}

export interface QueryFilters {
  repository?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export class GitHubInsightsService {
  private db = getDatabaseConnection();

  async getInsights(filters: QueryFilters = {}): Promise<GitHubInsight[]> {
    return await this.db.queryGitHubInsights(filters) as GitHubInsight[];
  }

  async getRepositoryStats() {
    return await this.db.getRepositoryStats();
  }

  async getAuthorStats() {
    return await this.db.getAuthorStats();
  }

  async getDailyCommitStats(days: number = 30) {
    return await this.db.getDailyCommitStats(days);
  }

  async insertInsights(insights: GitHubInsight[]): Promise<void> {
    const insertPromises = insights.map(async (insight) => {
      const sql = `
        INSERT INTO github_insights (
          repository_name, commit_hash, author_name, author_email,
          commit_date, message, lines_added, lines_deleted, files_changed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          author_name = VALUES(author_name),
          author_email = VALUES(author_email),
          commit_date = VALUES(commit_date),
          message = VALUES(message),
          lines_added = VALUES(lines_added),
          lines_deleted = VALUES(lines_deleted),
          files_changed = VALUES(files_changed)
      `;
      
      await this.db.query(sql, [
        insight.repository_name,
        insight.commit_hash,
        insight.author_name,
        insight.author_email,
        insight.commit_date,
        insight.message,
        insight.lines_added,
        insight.lines_deleted,
        insight.files_changed,
      ]);
    });

    await Promise.all(insertPromises);
  }

  async searchInsights(searchTerm: string, filters: QueryFilters = {}): Promise<GitHubInsight[]> {
    const sql = `
      SELECT 
        id,
        repository_name,
        commit_hash,
        author_name,
        author_email,
        commit_date,
        message,
        lines_added,
        lines_deleted,
        files_changed
      FROM github_insights 
      WHERE (
        repository_name LIKE ? OR 
        author_name LIKE ? OR 
        message LIKE ?
      )
      ${filters.repository ? 'AND repository_name = ?' : ''}
      ${filters.dateFrom ? 'AND commit_date >= ?' : ''}
      ${filters.dateTo ? 'AND commit_date <= ?' : ''}
      ORDER BY commit_date DESC
      ${filters.limit ? 'LIMIT ?' : ''}
    `;
    
    const params: any[] = [
      `%${searchTerm}%`,
      `%${searchTerm}%`,
      `%${searchTerm}%`,
    ];

    if (filters.repository) params.push(filters.repository);
    if (filters.dateFrom) params.push(filters.dateFrom);
    if (filters.dateTo) params.push(filters.dateTo);
    if (filters.limit) params.push(filters.limit);

    return await this.db.query(sql, params) as GitHubInsight[];
  }

  async getTopRepositories(limit: number = 10) {
    const sql = `
      SELECT 
        repository_name,
        COUNT(*) as commit_count,
        SUM(lines_added) as total_lines_added,
        SUM(lines_deleted) as total_lines_deleted,
        MAX(commit_date) as last_activity
      FROM github_insights 
      GROUP BY repository_name
      ORDER BY commit_count DESC
      LIMIT ?
    `;
    
    return await this.db.query(sql, [limit]);
  }

  async getTopContributors(limit: number = 10) {
    const sql = `
      SELECT 
        author_name,
        author_email,
        COUNT(*) as commit_count,
        SUM(lines_added) as total_lines_added,
        SUM(lines_deleted) as total_lines_deleted,
        COUNT(DISTINCT repository_name) as repositories_contributed
      FROM github_insights 
      GROUP BY author_name, author_email
      ORDER BY commit_count DESC
      LIMIT ?
    `;
    
    return await this.db.query(sql, [limit]);
  }

  async getCommitTrends(days: number = 30) {
    const sql = `
      SELECT 
        DATE(commit_date) as date,
        COUNT(*) as commits,
        COUNT(DISTINCT author_name) as unique_authors,
        SUM(lines_added) as lines_added,
        SUM(lines_deleted) as lines_deleted
      FROM github_insights 
      WHERE commit_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(commit_date)
      ORDER BY date ASC
    `;
    
    return await this.db.query(sql, [days]);
  }
}

// Export a singleton instance
export const githubInsightsService = new GitHubInsightsService();
