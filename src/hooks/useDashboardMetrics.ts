import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface DashboardMetrics {
  totalUniqueRepos: number;
  totalRuns: number;
  totalUniquePRs: number;
}

export function useDashboardMetrics(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getDashboardMetrics();
        
        if (response.data.success) {
          setMetrics(response.data.data);
        } else {
          setError('Failed to fetch dashboard metrics');
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [enabled]);

  return { metrics, loading, error };
}
