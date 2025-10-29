/**
 * Contractor API Service
 * Uses API routes instead of direct database access for security
 */

const API_BASE = '/api';

// Import proper types instead of redefining
import type { Contractor, ContractorFormData } from '@/types/contractor.types';

// Convert camelCase to snake_case for API
function formDataToApiFormat(data: ContractorFormData): any {
  return {
    companyName: data.companyName,
    registrationNumber: data.registrationNumber,
    businessType: data.businessType,
    industryCategory: data.industryCategory,
    yearsInBusiness: data.yearsInBusiness,
    employeeCount: data.employeeCount,
    contactPerson: data.contactPerson,
    email: data.email,
    phone: data.phone,
    alternatePhone: data.alternatePhone,
    physicalAddress: data.physicalAddress,
    postalAddress: data.postalAddress,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    annualTurnover: data.annualTurnover,
    creditRating: data.creditRating,
    paymentTerms: data.paymentTerms,
    bankName: data.bankName,
    accountNumber: data.accountNumber,
    branchCode: data.branchCode,
    specializations: data.specializations || [],
    certifications: data.certifications || [],
    status: data.status,
    complianceStatus: data.complianceStatus,
    notes: data.notes,
    tags: data.tags,
    createdBy: data.createdBy || 'web_form'
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    console.error('API Error Response:', { status: response.status, error });
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log('API Success Response:', data);
  return data.data || data;
}

export const contractorApiService = {
  async getAll(filter?: any): Promise<Contractor[]> {
    const params = new URLSearchParams();

    if (filter?.status) {
      // Support both array and single value
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      statuses.forEach((s: string) => params.append('status', s));
    }
    if (filter?.searchTerm) {
      params.append('search', filter.searchTerm);
    }

    const queryString = params.toString();
    const url = queryString ? `${API_BASE}/contractors?${queryString}` : `${API_BASE}/contractors`;

    const response = await fetch(url);
    return handleResponse<Contractor[]>(response);
  },

  async getById(id: string): Promise<Contractor | null> {
    const response = await fetch(`${API_BASE}/contractors?id=${id}`);
    return handleResponse<Contractor | null>(response);
  },

  async create(contractorData: ContractorFormData): Promise<Contractor> {
    const apiData = formDataToApiFormat(contractorData);
    const response = await fetch(`${API_BASE}/contractors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData)
    });
    return handleResponse<Contractor>(response);
  },

  async update(id: string, updates: Partial<Contractor>): Promise<Contractor> {
    const response = await fetch(`${API_BASE}/contractors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<Contractor>(response);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    // Use POST to dedicated delete endpoint instead of DELETE method
    // This works around Vercel routing issues with dynamic DELETE routes
    const response = await fetch(`${API_BASE}/contractors/delete/${id}`, {
      method: 'POST'
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },

  // Compatibility methods to match existing service interface
  async getActiveContractors(): Promise<Contractor[]> {
    const contractors = await this.getAll();
    return contractors.filter(c => c.status === 'active');
  },

  async getContractorsBySpecialization(specialization: string): Promise<Contractor[]> {
    const contractors = await this.getAll();
    return contractors.filter(c => c.specialization === specialization);
  },

  async getTopRatedContractors(limit: number = 10): Promise<Contractor[]> {
    const contractors = await this.getAll();
    return contractors
      .filter(c => c.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  },

  async getContractorSummary(): Promise<{
    totalContractors: number;
    activeContractors: number;
    averageRating: number;
    averageHourlyRate: number;
  }> {
    const contractors = await this.getAll();
    const withRating = contractors.filter(c => c.rating !== undefined);
    const withRate = contractors.filter(c => c.hourly_rate !== undefined);

    return {
      totalContractors: contractors.length,
      activeContractors: contractors.filter(c => c.status === 'active').length,
      averageRating: withRating.length > 0
        ? withRating.reduce((sum, c) => sum + (c.rating || 0), 0) / withRating.length
        : 0,
      averageHourlyRate: withRate.length > 0
        ? withRate.reduce((sum, c) => sum + (c.hourly_rate || 0), 0) / withRate.length
        : 0
    };
  },

  async searchByName(searchTerm: string): Promise<Contractor[]> {
    const contractors = await this.getAll();
    const term = searchTerm.toLowerCase();
    return contractors.filter(c =>
      c.company_name?.toLowerCase().includes(term) ||
      c.contact_person?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }
};