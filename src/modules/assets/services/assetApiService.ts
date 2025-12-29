/**
 * Asset API Service
 *
 * Client-side service for calling asset API endpoints.
 */

import type { Asset, AssetCategory } from '../types/asset';
import type { AssetAssignment } from '../types/assignment';
import type { CreateAssetInput, UpdateAssetInput, AssetFilterInput } from '../utils/schemas';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { code: string; message: string };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface DashboardSummary {
  stats: {
    totalAssets: number;
    availableAssets: number;
    assignedAssets: number;
    inMaintenanceAssets: number;
    calibrationDue: number;
    calibrationOverdue: number;
  };
  alerts: {
    overdueReturns: number;
    calibrationDue: number;
    maintenanceDue: number;
  };
  recentAlerts: {
    overdueReturns: AssetAssignment[];
    calibrationDue: Asset[];
    maintenanceDue: Asset[];
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || json.message || 'Request failed');
  }

  return json.data;
}

async function handlePaginatedResponse<T>(response: Response): Promise<{
  data: T[];
  pagination: ApiResponse<T[]>['pagination'];
}> {
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || json.message || 'Request failed');
  }

  return {
    data: json.data,
    pagination: json.pagination,
  };
}

export const assetApiService = {
  // Assets
  async getAll(filter?: AssetFilterInput) {
    const params = new URLSearchParams();

    if (filter?.page) params.append('page', String(filter.page));
    if (filter?.limit) params.append('limit', String(filter.limit));
    if (filter?.searchTerm) params.append('searchTerm', filter.searchTerm);
    if (filter?.status) filter.status.forEach(s => params.append('status', s));
    if (filter?.categoryId) filter.categoryId.forEach(c => params.append('categoryId', c));
    if (filter?.calibrationDueWithinDays !== undefined) {
      params.append('calibrationDueWithinDays', String(filter.calibrationDueWithinDays));
    }

    const response = await fetch(`/api/assets?${params.toString()}`);
    return handlePaginatedResponse<Asset>(response);
  },

  async getById(id: string): Promise<Asset> {
    const response = await fetch(`/api/assets/${id}`);
    return handleResponse<Asset>(response);
  },

  async create(input: CreateAssetInput): Promise<Asset> {
    const response = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<Asset>(response);
  },

  async update(id: string, input: UpdateAssetInput): Promise<Asset> {
    const response = await fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<Asset>(response);
  },

  async updateStatus(id: string, status: string): Promise<Asset> {
    const response = await fetch(`/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse<Asset>(response);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error?.message || 'Delete failed');
    }
  },

  async search(term: string): Promise<Asset[]> {
    const response = await fetch(`/api/assets/search?q=${encodeURIComponent(term)}`);
    return handleResponse<Asset[]>(response);
  },

  async getByBarcode(code: string): Promise<Asset> {
    const response = await fetch(`/api/assets/barcode/${encodeURIComponent(code)}`);
    return handleResponse<Asset>(response);
  },

  // Checkout/Checkin
  async checkout(assetId: string, data: {
    toType: 'staff' | 'project' | 'vehicle' | 'warehouse';
    toId: string;
    toName: string;
    toLocation?: string;
    projectId?: string;
    projectName?: string;
    expectedReturnDate?: string;
    conditionAtCheckout: string;
    purpose?: string;
    checkoutNotes?: string;
  }): Promise<AssetAssignment> {
    const response = await fetch(`/api/assets/${assetId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AssetAssignment>(response);
  },

  async checkin(assetId: string, data: {
    conditionAtCheckin: string;
    checkinNotes?: string;
    newLocation?: string;
    maintenanceRequired?: boolean;
  }): Promise<AssetAssignment> {
    const response = await fetch(`/api/assets/${assetId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AssetAssignment>(response);
  },

  async getAssignmentHistory(assetId: string): Promise<{
    asset: { id: string; assetNumber: string; name: string };
    history: AssetAssignment[];
  }> {
    const response = await fetch(`/api/assets/${assetId}/history`);
    return handleResponse(response);
  },

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await fetch('/api/assets/dashboard');
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || 'Request failed');
    }

    // Transform App Router response format to expected format
    const data = json.data;
    return {
      stats: {
        totalAssets: data.assets?.totalAssets ?? 0,
        availableAssets: data.assets?.availableAssets ?? 0,
        assignedAssets: data.assets?.assignedAssets ?? 0,
        inMaintenanceAssets: data.assets?.inMaintenanceAssets ?? 0,
        calibrationDue: data.assets?.calibrationDue ?? 0,
        calibrationOverdue: data.assets?.calibrationOverdue ?? 0,
      },
      alerts: {
        overdueReturns: data.maintenance?.overdueReturns ?? 0,
        calibrationDue: data.assets?.calibrationDue ?? 0,
        maintenanceDue: data.maintenance?.maintenanceDue ?? 0,
      },
      recentAlerts: {
        overdueReturns: [],
        calibrationDue: [],
        maintenanceDue: [],
      },
    };
  },

  async getCalibrationDue(days = 30): Promise<{
    assets: Asset[];
    summary: { total: number; overdue: number; dueSoon: number; withinDays: number };
  }> {
    const response = await fetch(`/api/assets/calibration-due?days=${days}`);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || 'Request failed');
    }

    return json.data;
  },

  async getMaintenanceDue(days = 30): Promise<{
    assets: Asset[];
    summary: { total: number; withinDays: number };
  }> {
    const response = await fetch(`/api/assets/maintenance-due?days=${days}`);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || 'Request failed');
    }

    return json.data;
  },

  // Categories
  async getCategories(filter?: { isActive?: boolean; type?: string }): Promise<AssetCategory[]> {
    const params = new URLSearchParams();
    if (filter?.isActive !== undefined) params.append('isActive', String(filter.isActive));
    if (filter?.type) params.append('type', filter.type);

    const response = await fetch(`/api/assets/categories?${params.toString()}`);
    return handleResponse<AssetCategory[]>(response);
  },

  async getCategoryById(id: string): Promise<AssetCategory & { assetCount: number }> {
    const response = await fetch(`/api/assets/categories/${id}`);
    return handleResponse(response);
  },

  async createCategory(input: {
    name: string;
    code: string;
    type: string;
    description?: string;
    requiresCalibration?: boolean;
    calibrationIntervalDays?: number;
    depreciationYears?: number;
  }): Promise<AssetCategory> {
    const response = await fetch('/api/assets/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<AssetCategory>(response);
  },

  async updateCategory(id: string, input: Partial<{
    name: string;
    code: string;
    type: string;
    description: string;
    requiresCalibration: boolean;
    calibrationIntervalDays: number;
    depreciationYears: number;
    isActive: boolean;
  }>): Promise<AssetCategory> {
    const response = await fetch(`/api/assets/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse<AssetCategory>(response);
  },

  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`/api/assets/categories/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error?.message || 'Delete failed');
    }
  },

  async getCategoryTypes(): Promise<string[]> {
    const response = await fetch('/api/assets/categories/types');
    return handleResponse<string[]>(response);
  },
};
