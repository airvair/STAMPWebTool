/**
 * API Client for STPA Analysis Integration
 * Provides RESTful API interface for external systems
 */

import {
  Loss,
  Hazard,
  Controller,
  ControlAction,
  UnsafeControlAction,
  Requirement
} from '@/types/types';
import { STAPAnalysisData } from './importExport';

export interface APIConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  headers?: Record<string, string>;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
  include?: string[];
  exclude?: string[];
}

export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete';
  items: T[];
}

export interface BatchResult<T> {
  succeeded: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  totalProcessed: number;
}

export interface WebhookConfig {
  url: string;
  events: WebhookEvent[];
  secret?: string;
  active: boolean;
}

export enum WebhookEvent {
  LOSS_CREATED = 'loss.created',
  LOSS_UPDATED = 'loss.updated',
  LOSS_DELETED = 'loss.deleted',
  HAZARD_CREATED = 'hazard.created',
  HAZARD_UPDATED = 'hazard.updated',
  HAZARD_DELETED = 'hazard.deleted',
  UCA_CREATED = 'uca.created',
  UCA_UPDATED = 'uca.updated',
  UCA_DELETED = 'uca.deleted',
  REQUIREMENT_CREATED = 'requirement.created',
  REQUIREMENT_UPDATED = 'requirement.updated',
  ANALYSIS_COMPLETED = 'analysis.completed'
}

/**
 * API Client for STPA Analysis
 */
export class APIClient {
  private config: APIConfig;
  private abortControllers = new Map<string, AbortController>();

  constructor(config: APIConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * Core HTTP request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requestId?: string
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`;
    const controller = new AbortController();
    
    if (requestId) {
      this.abortControllers.set(requestId, controller);
    }

    const timeout = setTimeout(() => controller.abort(), this.config.timeout!);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...this.config.headers
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.data || data,
        metadata: {
          timestamp: new Date().toISOString(),
          version: response.headers.get('X-API-Version') || '1.0',
          requestId: response.headers.get('X-Request-ID') || ''
        }
      };

    } catch (error) {
      clearTimeout(timeout);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout'
          };
        }
        
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: 'Unknown error occurred'
      };
    } finally {
      if (requestId) {
        this.abortControllers.delete(requestId);
      }
    }
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Loss endpoints
   */
  async getLosses(params?: QueryParams): Promise<APIResponse<PaginatedResponse<Loss>>> {
    const queryString = this.buildQueryString(params);
    return this.request<PaginatedResponse<Loss>>(`/api/losses${queryString}`);
  }

  async getLoss(id: string): Promise<APIResponse<Loss>> {
    return this.request<Loss>(`/api/losses/${id}`);
  }

  async createLoss(loss: Omit<Loss, 'id'>): Promise<APIResponse<Loss>> {
    return this.request<Loss>('/api/losses', {
      method: 'POST',
      body: JSON.stringify(loss)
    });
  }

  async updateLoss(id: string, loss: Partial<Loss>): Promise<APIResponse<Loss>> {
    return this.request<Loss>(`/api/losses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(loss)
    });
  }

  async deleteLoss(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/api/losses/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Hazard endpoints
   */
  async getHazards(params?: QueryParams): Promise<APIResponse<PaginatedResponse<Hazard>>> {
    const queryString = this.buildQueryString(params);
    return this.request<PaginatedResponse<Hazard>>(`/api/hazards${queryString}`);
  }

  async getHazard(id: string): Promise<APIResponse<Hazard>> {
    return this.request<Hazard>(`/api/hazards/${id}`);
  }

  async createHazard(hazard: Omit<Hazard, 'id'>): Promise<APIResponse<Hazard>> {
    return this.request<Hazard>('/api/hazards', {
      method: 'POST',
      body: JSON.stringify(hazard)
    });
  }

  async updateHazard(id: string, hazard: Partial<Hazard>): Promise<APIResponse<Hazard>> {
    return this.request<Hazard>(`/api/hazards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hazard)
    });
  }

  async deleteHazard(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/api/hazards/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Controller endpoints
   */
  async getControllers(params?: QueryParams): Promise<APIResponse<PaginatedResponse<Controller>>> {
    const queryString = this.buildQueryString(params);
    return this.request<PaginatedResponse<Controller>>(`/api/controllers${queryString}`);
  }

  async getController(id: string): Promise<APIResponse<Controller>> {
    return this.request<Controller>(`/api/controllers/${id}`);
  }

  async createController(controller: Omit<Controller, 'id'>): Promise<APIResponse<Controller>> {
    return this.request<Controller>('/api/controllers', {
      method: 'POST',
      body: JSON.stringify(controller)
    });
  }

  async updateController(id: string, controller: Partial<Controller>): Promise<APIResponse<Controller>> {
    return this.request<Controller>(`/api/controllers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(controller)
    });
  }

  async deleteController(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/api/controllers/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Control Action endpoints
   */
  async getControlActions(params?: QueryParams): Promise<APIResponse<PaginatedResponse<ControlAction>>> {
    const queryString = this.buildQueryString(params);
    return this.request<PaginatedResponse<ControlAction>>(`/api/control-actions${queryString}`);
  }

  async getControlAction(id: string): Promise<APIResponse<ControlAction>> {
    return this.request<ControlAction>(`/api/control-actions/${id}`);
  }

  async createControlAction(action: Omit<ControlAction, 'id'>): Promise<APIResponse<ControlAction>> {
    return this.request<ControlAction>('/api/control-actions', {
      method: 'POST',
      body: JSON.stringify(action)
    });
  }

  async updateControlAction(id: string, action: Partial<ControlAction>): Promise<APIResponse<ControlAction>> {
    return this.request<ControlAction>(`/api/control-actions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(action)
    });
  }

  async deleteControlAction(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/api/control-actions/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * UCA endpoints
   */
  async getUCAs(params?: QueryParams): Promise<APIResponse<PaginatedResponse<UnsafeControlAction>>> {
    const queryString = this.buildQueryString(params);
    return this.request<PaginatedResponse<UnsafeControlAction>>(`/api/ucas${queryString}`);
  }

  async getUCA(id: string): Promise<APIResponse<UnsafeControlAction>> {
    return this.request<UnsafeControlAction>(`/api/ucas/${id}`);
  }

  async createUCA(uca: Omit<UnsafeControlAction, 'id'>): Promise<APIResponse<UnsafeControlAction>> {
    return this.request<UnsafeControlAction>('/api/ucas', {
      method: 'POST',
      body: JSON.stringify(uca)
    });
  }

  async updateUCA(id: string, uca: Partial<UnsafeControlAction>): Promise<APIResponse<UnsafeControlAction>> {
    return this.request<UnsafeControlAction>(`/api/ucas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(uca)
    });
  }

  async deleteUCA(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/api/ucas/${id}`, {
      method: 'DELETE'
    });
  }


  /**
   * Requirement endpoints
   */
  async getRequirements(params?: QueryParams): Promise<APIResponse<PaginatedResponse<Requirement>>> {
    const queryString = this.buildQueryString(params);
    return this.request<PaginatedResponse<Requirement>>(`/api/requirements${queryString}`);
  }

  async getRequirement(id: string): Promise<APIResponse<Requirement>> {
    return this.request<Requirement>(`/api/requirements/${id}`);
  }

  async createRequirement(requirement: Omit<Requirement, 'id'>): Promise<APIResponse<Requirement>> {
    return this.request<Requirement>('/api/requirements', {
      method: 'POST',
      body: JSON.stringify(requirement)
    });
  }

  async updateRequirement(id: string, requirement: Partial<Requirement>): Promise<APIResponse<Requirement>> {
    return this.request<Requirement>(`/api/requirements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requirement)
    });
  }

  async deleteRequirement(id: string): Promise<APIResponse<void>> {
    return this.request<void>(`/api/requirements/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Batch operations
   */
  async batchCreate<T>(
    entityType: string,
    items: T[]
  ): Promise<APIResponse<BatchResult<T>>> {
    return this.request<BatchResult<T>>(`/api/batch/${entityType}`, {
      method: 'POST',
      body: JSON.stringify({
        operation: 'create',
        items
      })
    });
  }

  async batchUpdate<T>(
    entityType: string,
    items: T[]
  ): Promise<APIResponse<BatchResult<T>>> {
    return this.request<BatchResult<T>>(`/api/batch/${entityType}`, {
      method: 'PUT',
      body: JSON.stringify({
        operation: 'update',
        items
      })
    });
  }

  async batchDelete(
    entityType: string,
    ids: string[]
  ): Promise<APIResponse<BatchResult<string>>> {
    return this.request<BatchResult<string>>(`/api/batch/${entityType}`, {
      method: 'DELETE',
      body: JSON.stringify({
        operation: 'delete',
        ids
      })
    });
  }

  /**
   * Analysis operations
   */
  async getCompleteAnalysis(projectId: string): Promise<APIResponse<STAPAnalysisData>> {
    return this.request<STAPAnalysisData>(`/api/analysis/${projectId}`);
  }

  async importAnalysis(
    projectId: string,
    data: STAPAnalysisData,
    options?: { merge?: boolean }
  ): Promise<APIResponse<{ imported: number; errors: string[] }>> {
    return this.request(`/api/analysis/${projectId}/import`, {
      method: 'POST',
      body: JSON.stringify({ data, options })
    });
  }

  async exportAnalysis(
    projectId: string,
    format: 'json' | 'csv' | 'stpa-ml'
  ): Promise<APIResponse<Blob>> {
    const response = await fetch(`${this.config.baseURL}/api/analysis/${projectId}/export?format=${format}`, {
      headers: {
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : ''
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Export failed: ${response.statusText}`
      };
    }

    const blob = await response.blob();
    return {
      success: true,
      data: blob
    };
  }

  /**
   * Search and filtering
   */
  async search(
    query: string,
    options?: {
      entityTypes?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<APIResponse<{
    results: Array<{
      entityType: string;
      entity: any;
      score: number;
    }>;
    total: number;
  }>> {
    const params = new URLSearchParams({
      q: query,
      ...(options?.entityTypes && { types: options.entityTypes.join(',') }),
      ...(options?.limit && { limit: options.limit.toString() }),
      ...(options?.offset && { offset: options.offset.toString() })
    });

    return this.request(`/api/search?${params.toString()}`);
  }

  /**
   * Relationships and traceability
   */
  async getRelationships(
    entityType: string,
    entityId: string
  ): Promise<APIResponse<{
    parents: Array<{ type: string; id: string; entity: any }>;
    children: Array<{ type: string; id: string; entity: any }>;
  }>> {
    return this.request(`/api/relationships/${entityType}/${entityId}`);
  }

  async getTraceability(
    startType: string,
    startId: string,
    endType?: string
  ): Promise<APIResponse<{
    paths: Array<{
      entities: Array<{ type: string; id: string; entity: any }>;
      relationships: string[];
    }>;
  }>> {
    const params = endType ? `?endType=${endType}` : '';
    return this.request(`/api/traceability/${startType}/${startId}${params}`);
  }

  /**
   * Webhook management
   */
  async createWebhook(config: WebhookConfig): Promise<APIResponse<{ id: string; secret: string }>> {
    return this.request('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  async updateWebhook(id: string, config: Partial<WebhookConfig>): Promise<APIResponse<void>> {
    return this.request(`/api/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  }

  async deleteWebhook(id: string): Promise<APIResponse<void>> {
    return this.request(`/api/webhooks/${id}`, {
      method: 'DELETE'
    });
  }

  async getWebhooks(): Promise<APIResponse<WebhookConfig[]>> {
    return this.request('/api/webhooks');
  }

  /**
   * Health and status
   */
  async getHealth(): Promise<APIResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
  }>> {
    return this.request('/api/health');
  }

  async getStatistics(projectId: string): Promise<APIResponse<{
    entities: Record<string, number>;
    relationships: Record<string, number>;
    completeness: number;
    lastModified: string;
  }>> {
    return this.request(`/api/statistics/${projectId}`);
  }

  /**
   * Utility methods
   */
  private buildQueryString(params?: QueryParams): string {
    if (!params) return '';

    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    
    if (params.filter) {
      Object.entries(params.filter).forEach(([key, value]) => {
        searchParams.append(`filter[${key}]`, value.toString());
      });
    }

    if (params.include) {
      searchParams.append('include', params.include.join(','));
    }

    if (params.exclude) {
      searchParams.append('exclude', params.exclude.join(','));
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Set API configuration
   */
  setConfig(config: Partial<APIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): APIConfig {
    return { ...this.config };
  }
}

// Export factory function
export function createAPIClient(config: APIConfig): APIClient {
  return new APIClient(config);
}