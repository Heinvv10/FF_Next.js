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
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

export const contractorApiService = {
  async getAll(): Promise<Contractor[]> {
    const response = await fetch(`${API_BASE}/contractors`);
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
    const response = await fetch(`${API_BASE}/contractors?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse<Contractor>(response);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/contractors?id=${id}`, {
      method: 'DELETE'
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
    return contractors.filter(c => c.specializations?.includes(specialization));
  },

  async getTopRatedContractors(limit: number = 10): Promise<Contractor[]> {
    const contractors = await this.getAll();
    return contractors
      .filter(c => c.ragOverall !== undefined && c.ragOverall === 'green')
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
      .slice(0, limit);
  },

  async getContractorSummary(): Promise<{
    totalContractors: number;
    activeContractors: number;
    approvedContractors: number;
    pendingApproval: number;
    averagePerformanceScore: number;
    averageSafetyScore: number;
    averageRating: number;
    averageHourlyRate: number;
  }> {
    const contractors = await this.getAll();
    const withPerformance = contractors.filter(c => c.performanceScore !== undefined);
    const withSafety = contractors.filter(c => c.safetyScore !== undefined);
    const withRating = contractors.filter(c => c.ragOverall === 'green');

    return {
      totalContractors: contractors.length,
      activeContractors: contractors.filter(c => c.status === 'approved').length,
      approvedContractors: contractors.filter(c => c.status === 'approved').length,
      pendingApproval: contractors.filter(c => c.status === 'pending' || c.status === 'under_review').length,
      averagePerformanceScore: withPerformance.length > 0
        ? withPerformance.reduce((sum, c) => sum + (c.performanceScore || 0), 0) / withPerformance.length
        : 0,
      averageSafetyScore: withSafety.length > 0
        ? withSafety.reduce((sum, c) => sum + (c.safetyScore || 0), 0) / withSafety.length
        : 0,
      averageRating: withRating.length > 0 ? (withRating.length / contractors.length) * 100 : 0,
      averageHourlyRate: 0 // Placeholder - this would need to be calculated from actual rate data
    };
  },

  async searchByName(searchTerm: string): Promise<Contractor[]> {
    const contractors = await this.getAll();
    const term = searchTerm.toLowerCase();
    return contractors.filter(c =>
      c.companyName?.toLowerCase().includes(term) ||
      c.contactPerson?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }
};