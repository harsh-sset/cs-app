import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Query keys
export const queryKeys = {
  githubInsights: ['github-insights'] as const,
  githubReports: ['github-reports'] as const,
  databaseTest: ['database-test'] as const,
};

// GitHub Insights Hook
export function useGitHubInsights() {
  return useQuery({
    queryKey: queryKeys.githubInsights,
    queryFn: async () => {
      const response = await api.getGitHubReports();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// GitHub Reports Hook
export function useGitHubReports() {
  return useQuery({
    queryKey: [...queryKeys.githubReports],
    queryFn: async () => {
      const response = await api.getGitHubReports();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

// GitHub Report by ID Hook
export function useGitHubReportById(id: number) {
  return useQuery({
    queryKey: [...queryKeys.githubReports, id],
    queryFn: async () => {
      const response = await api.getGitHubReportById(id);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    enabled: !!id, // Only run if id is provided
  });
}

// Database Test Hook
export function useDatabaseTest() {
  return useQuery({
    queryKey: queryKeys.databaseTest,
    queryFn: async () => {
      const response = await api.testDatabase();
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

// Generic Data Fetching Hook
export function useApiData<T>(
  key: string,
  url: string,
  params?: any,
  options?: {
    staleTime?: number;
    retry?: number;
    enabled?: boolean;
  }
) {
  return useQuery<T>({
    queryKey: [key, params],
    queryFn: async () => {
      const response = await api.get(url, params);
      return response.data;
    },
    staleTime: options?.staleTime || 5 * 60 * 1000,
    retry: options?.retry || 2,
    enabled: options?.enabled !== false,
  });
}

// Mutation Hook for POST/PUT/DELETE
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: any, variables: TVariables) => void;
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);
      
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    },
    onError: options?.onError,
  });
}

