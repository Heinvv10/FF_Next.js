/**
 * QField Sync API Service
 * Frontend service for communicating with QField sync endpoints
 */

import {
  QFieldProject,
  SyncJob,
  SyncStats,
  SyncConflict,
  SyncResponse,
  ProjectListResponse,
  SyncHistoryResponse,
  QFieldSyncDashboardData,
  SyncDirection,
} from '../types/qfield-sync.types';

class QFieldSyncApiService {
  private baseUrl = '/api/qfield-sync';

  /**
   * Generic request handler
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `Request failed with status ${response.status}`,
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<QFieldSyncDashboardData> {
    return this.request<QFieldSyncDashboardData>('/dashboard');
  }

  /**
   * Get list of QFieldCloud projects
   */
  async getProjects(): Promise<QFieldProject[]> {
    const response = await this.request<ProjectListResponse>('/projects');
    return response.projects;
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<QFieldProject> {
    return this.request<QFieldProject>(`/projects/${projectId}`);
  }

  /**
   * Start a sync job
   */
  async startSync(
    type: SyncJob['type'],
    direction: SyncDirection = 'bidirectional'
  ): Promise<SyncJob> {
    return this.request<SyncJob>('/sync/start', {
      method: 'POST',
      body: JSON.stringify({ type, direction }),
    });
  }

  /**
   * Get current sync job status
   */
  async getCurrentJob(): Promise<SyncJob | null> {
    return this.request<SyncJob | null>('/sync/current');
  }

  /**
   * Get sync history
   */
  async getSyncHistory(
    page = 1,
    pageSize = 20
  ): Promise<SyncHistoryResponse> {
    return this.request<SyncHistoryResponse>(
      `/sync/history?page=${page}&pageSize=${pageSize}`
    );
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<SyncStats> {
    return this.request<SyncStats>('/sync/stats');
  }

  /**
   * Get unresolved conflicts
   */
  async getConflicts(): Promise<SyncConflict[]> {
    return this.request<SyncConflict[]>('/conflicts');
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'use_qfield' | 'use_fibreflow' | 'merge' | 'skip'
  ): Promise<SyncResponse> {
    return this.request<SyncResponse>(`/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  }

  /**
   * Test QFieldCloud connection
   */
  async testQFieldConnection(): Promise<SyncResponse> {
    return this.request<SyncResponse>('/test/qfield-connection');
  }

  /**
   * Test FibreFlow database connection
   */
  async testDatabaseConnection(): Promise<SyncResponse> {
    return this.request<SyncResponse>('/test/database-connection');
  }

  /**
   * Update sync configuration
   */
  async updateConfig(config: any): Promise<SyncResponse> {
    return this.request<SyncResponse>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * Get sync configuration
   */
  async getConfig(): Promise<any> {
    return this.request<any>('/config');
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(
    type: SyncJob['type'] = 'fiber_cables'
  ): Promise<SyncJob> {
    return this.request<SyncJob>('/sync/manual', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  /**
   * Cancel current sync job
   */
  async cancelSync(): Promise<SyncResponse> {
    return this.request<SyncResponse>('/sync/cancel', {
      method: 'POST',
    });
  }

  /**
   * Get sync job details
   */
  async getSyncJob(jobId: string): Promise<SyncJob> {
    return this.request<SyncJob>(`/sync/jobs/${jobId}`);
  }

  /**
   * Export sync history as CSV
   */
  async exportSyncHistory(): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/sync/export`, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }

    return response.blob();
  }

  /**
   * WebSocket connection for real-time updates
   */
  connectWebSocket(
    onMessage: (event: MessageEvent) => void,
    onError?: (event: Event) => void
  ): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/qfield-sync`);

    ws.onmessage = onMessage;
    ws.onerror = onError || console.error;

    ws.onopen = () => {
      console.log('QField Sync WebSocket connected');
    };

    ws.onclose = () => {
      console.log('QField Sync WebSocket disconnected');
    };

    return ws;
  }

  /**
   * Get fiber cable records from QFieldCloud
   */
  async getQFieldFiberCables(projectId: string): Promise<any[]> {
    return this.request<any[]>(`/projects/${projectId}/fiber-cables`);
  }

  /**
   * Get fiber cable records from FibreFlow
   */
  async getFibreFlowFiberCables(): Promise<any[]> {
    return this.request<any[]>('/fiber-cables');
  }

  /**
   * Compare records between systems
   */
  async compareRecords(type: string): Promise<any> {
    return this.request<any>(`/compare/${type}`);
  }

  /**
   * Batch update multiple records
   */
  async batchUpdate(records: any[]): Promise<SyncResponse> {
    return this.request<SyncResponse>('/batch-update', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  }

  /**
   * Get sync logs
   */
  async getSyncLogs(
    jobId?: string,
    level?: 'info' | 'warning' | 'error'
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (jobId) params.append('jobId', jobId);
    if (level) params.append('level', level);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/logs${query}`);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{
    status: string;
    qfieldConnection: boolean;
    databaseConnection: boolean;
    lastSync: string | null;
  }> {
    return this.request('/health');
  }
}

// Export singleton instance
export const qfieldSyncApiService = new QFieldSyncApiService();