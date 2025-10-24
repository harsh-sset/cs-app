import { Root, RunResult } from '@/app/api/github-reports/typing';
import axios from 'axios';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API endpoints
export const api = {
  // Database test
  testDatabase: () => apiClient.get('/test-db'),
  
  // GitHub reports
  getGitHubReports: () => apiClient.get<Root>('/github-reports'),
  getGitHubReportById: (id: number) => apiClient.get<{success: boolean, data: RunResult}>('/github-reports/' + id),
  
      // Dashboard metrics
  getDashboardMetrics: () => apiClient.get<{success: boolean, data: {totalUniqueRepos: number, totalRuns: number, totalUniquePRs: number}}>('/dashboard-metrics'),
  
  // Generic data fetching
  get: (url: string, params?: any) => apiClient.get(url, { params }),
  post: (url: string, data?: any) => apiClient.post(url, data),
  put: (url: string, data?: any) => apiClient.put(url, data),
  delete: (url: string) => apiClient.delete(url),
};

export default api;
