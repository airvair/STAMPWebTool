/**
 * React Hook for API Integration
 * Provides easy access to API client with state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { APIClient, APIConfig, APIResponse, QueryParams, PaginatedResponse } from '@/utils/apiClient';
import { STAPAnalysisData } from '@/utils/importExport';
import { useAnalysis } from './useAnalysis';

interface UseAPIOptions {
  autoSync?: boolean;
  syncInterval?: number; // in seconds
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

interface UseAPIReturn {
  client: APIClient | null;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  sync: () => Promise<void>;
  configure: (config: APIConfig) => void;
}

/**
 * Hook for API integration
 */
export function useAPI(
  config?: APIConfig,
  options?: UseAPIOptions
): UseAPIReturn {
  const [client, setClient] = useState<APIClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const analysisData = useAnalysis();
  const syncIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize client
  useEffect(() => {
    if (config) {
      const apiClient = new APIClient(config);
      setClient(apiClient);
    }
  }, []);

  // Configure client
  const configure = useCallback((newConfig: APIConfig) => {
    const apiClient = new APIClient(newConfig);
    setClient(apiClient);
    setError(null);
  }, []);

  // Sync data with API
  const sync = useCallback(async () => {
    if (!client) {
      setError('API client not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get project ID from somewhere (could be passed as prop or from context)
      const projectId = 'current-project'; // This should be dynamic

      // Export current data
      const exportData: STAPAnalysisData = {
        losses: analysisData.losses || [],
        hazards: analysisData.hazards || [],
        controllers: analysisData.controllers || [],
        controlActions: analysisData.controlActions || [],
        ucas: analysisData.ucas || [],
        causalScenarios: analysisData.scenarios || [],
        requirements: analysisData.requirements || [],
        feedbackPaths: analysisData.feedbackPaths || [],
        controlPaths: analysisData.controlPaths || [],
        communicationPaths: analysisData.communicationPaths || [],
        systemComponents: analysisData.systemComponents || []
      };

      // Import to API
      const response = await client.importAnalysis(projectId, exportData, { merge: true });

      if (response.success) {
        setLastSync(new Date());
        if (options?.onSuccess) {
          options.onSuccess(`Synced ${response.data?.imported || 0} items`);
        }
      } else {
        throw new Error(response.error || 'Sync failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      if (options?.onError) {
        options.onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, analysisData, options]);

  // Auto-sync setup
  useEffect(() => {
    if (options?.autoSync && options.syncInterval && client) {
      // Initial sync
      sync();

      // Set up interval
      syncIntervalRef.current = setInterval(() => {
        sync();
      }, options.syncInterval * 1000);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [options?.autoSync, options?.syncInterval, client, sync]);

  return {
    client,
    isLoading,
    error,
    lastSync,
    sync,
    configure
  };
}

/**
 * Hook for paginated API data
 */
export function usePaginatedAPI<T>(
  fetcher: (params: QueryParams) => Promise<APIResponse<PaginatedResponse<T>>>,
  initialParams?: QueryParams
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialParams?.page || 1);
  const [pageSize] = useState(initialParams?.pageSize || 20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = useCallback(async (params?: QueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetcher({
        page,
        pageSize,
        ...params
      });

      if (response.success && response.data) {
        setData(response.data.items);
        setTotal(response.data.total);
        setHasMore(response.data.hasMore);
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, page, pageSize]);

  // Fetch on mount and when page changes
  useEffect(() => {
    fetchData();
  }, [page, fetchData]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
  };

  const refresh = () => {
    fetchData();
  };

  return {
    data,
    total,
    page,
    pageSize,
    hasMore,
    isLoading,
    error,
    goToPage,
    refresh
  };
}

/**
 * Hook for API search
 */
export function useAPISearch(client: APIClient | null) {
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    options?: {
      entityTypes?: string[];
      limit?: number;
    }
  ) => {
    if (!client) {
      setSearchError('API client not configured');
      return;
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await client.search(query, options);

      if (response.success && response.data) {
        setResults(response.data.results);
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [client]);

  const clearSearch = () => {
    setResults([]);
    setSearchError(null);
  };

  return {
    results,
    isSearching,
    searchError,
    search,
    clearSearch
  };
}

/**
 * Hook for API webhooks
 */
export function useAPIWebhooks(client: APIClient | null) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.getWebhooks();

      if (response.success && response.data) {
        setWebhooks(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch webhooks');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhooks');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const createWebhook = async (config: any) => {
    if (!client) throw new Error('API client not configured');

    const response = await client.createWebhook(config);
    if (response.success) {
      await fetchWebhooks();
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to create webhook');
    }
  };

  const updateWebhook = async (id: string, config: any) => {
    if (!client) throw new Error('API client not configured');

    const response = await client.updateWebhook(id, config);
    if (response.success) {
      await fetchWebhooks();
    } else {
      throw new Error(response.error || 'Failed to update webhook');
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!client) throw new Error('API client not configured');

    const response = await client.deleteWebhook(id);
    if (response.success) {
      await fetchWebhooks();
    } else {
      throw new Error(response.error || 'Failed to delete webhook');
    }
  };

  return {
    webhooks,
    isLoading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    refresh: fetchWebhooks
  };
}

/**
 * Hook for API health monitoring
 */
export function useAPIHealth(client: APIClient | null, checkInterval?: number) {
  const [health, setHealth] = useState<{
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    version?: string;
    uptime?: number;
  }>({ status: 'unknown' });
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    if (!client) return;

    try {
      const response = await client.getHealth();

      if (response.success && response.data) {
        setHealth(response.data);
      } else {
        setHealth({ status: 'unhealthy' });
      }
      setLastCheck(new Date());
    } catch (err) {
      setHealth({ status: 'unhealthy' });
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      // Initial check
      checkHealth();

      // Set up interval if specified
      if (checkInterval) {
        const interval = setInterval(checkHealth, checkInterval * 1000);
        return () => clearInterval(interval);
      }
    }
  }, [client, checkInterval, checkHealth]);

  return {
    ...health,
    lastCheck,
    checkHealth
  };
}