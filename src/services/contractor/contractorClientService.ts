/**
 * Client-Safe Contractor Service
 * 
 * This service is designed ONLY for client-side use and contains NO server-side imports.
 * It only communicates via API calls and never directly accesses the database.
 * 
 * Use this service in:
 * - React components
 * - Client-side hooks
 * - Pages that run in the browser
 * 
 * DO NOT use the main contractorService in client-side code as it may contain
 * server-side dependencies that cause "DATABASE_URL is not configured" errors.
 */

import { 
  Contractor, 
  ContractorFormData,
  ContractorFilter,
  ContractorAnalytics
} from '@/types/contractor.types';
import { contractorApiService } from './contractorApiService';
import { log } from '@/lib/logger';

/**
 * Client-safe contractor service
 * Only uses API calls - no direct database access
 */
export class ContractorClientService {
  /**
   * Get all contractors with optional filtering
   */
  async getAll(filter?: ContractorFilter): Promise<Contractor[]> {
    try {
      log.info('Client service: Getting all contractors', undefined, 'contractorClientService');
      const contractors = await contractorApiService.getAll();
      
      if (!filter) return contractors;

      // Apply client-side filtering if needed
      return contractors.filter(contractor => {
        if (filter.status && !filter.status.includes(contractor.status || 'active')) return false;
        if (filter.specialization && !filter.specialization.includes(contractor.specialization || '')) return false;
        return true;
      });
    } catch (error) {
      log.error('Client service: Error getting contractors', { data: error }, 'contractorClientService');
      throw new Error('Failed to fetch contractors');
    }
  }

  /**
   * Get contractor by ID
   */
  async getById(id: string): Promise<Contractor | null> {
    try {
      log.info(`Client service: Getting contractor ${id}`, undefined, 'contractorClientService');
      return await contractorApiService.getById(id);
    } catch (error) {
      log.error('Client service: Error getting contractor', { data: error }, 'contractorClientService');
      throw new Error('Failed to fetch contractor');
    }
  }

  /**
   * Create new contractor
   */
  async create(data: ContractorFormData): Promise<string> {
    try {
      log.info('Client service: Creating contractor', { data: { companyName: data.companyName } }, 'contractorClientService');
      const contractor = await contractorApiService.create(data);
      return contractor.id;
    } catch (error) {
      log.error('Client service: Error creating contractor', { data: error }, 'contractorClientService');
      throw new Error('Failed to create contractor');
    }
  }

  /**
   * Update contractor
   */
  async update(id: string, data: Partial<ContractorFormData>): Promise<void> {
    try {
      log.info(`Client service: Updating contractor ${id}`, undefined, 'contractorClientService');
      await contractorApiService.update(id, data);
    } catch (error) {
      log.error('Client service: Error updating contractor', { data: error }, 'contractorClientService');
      throw new Error('Failed to update contractor');
    }
  }

  /**
   * Delete contractor
   */
  async delete(id: string): Promise<void> {
    try {
      log.info(`Client service: Deleting contractor ${id}`, undefined, 'contractorClientService');
      await contractorApiService.delete(id);
    } catch (error) {
      log.error('Client service: Error deleting contractor', { data: error }, 'contractorClientService');
      throw new Error('Failed to delete contractor');
    }
  }

  /**
   * Search contractors by term
   */
  async search(searchTerm: string): Promise<Contractor[]> {
    try {
      log.info(`Client service: Searching contractors for "${searchTerm}"`, undefined, 'contractorClientService');
      const contractors = await contractorApiService.getAll();
      const term = searchTerm.toLowerCase();
      
      return contractors.filter(c =>
        c.company_name?.toLowerCase().includes(term) ||
        c.contact_person?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    } catch (error) {
      log.error('Client service: Error searching contractors', { data: error }, 'contractorClientService');
      throw new Error('Failed to search contractors');
    }
  }

  /**
   * Get contractor analytics (client-calculated from API data)
   */
  async getAnalytics(): Promise<ContractorAnalytics> {
    try {
      log.info('Client service: Getting contractor analytics', undefined, 'contractorClientService');
      const contractors = await contractorApiService.getAll();
      const summary = await contractorApiService.getContractorSummary();

      // Calculate RAG distribution from client data
      const ragDistribution = {
        green: contractors.filter(c => c.ragOverall === 'green').length,
        amber: contractors.filter(c => c.ragOverall === 'amber').length,
        red: contractors.filter(c => c.ragOverall === 'red').length
      };

      return {
        totalContractors: summary.totalContractors,
        activeContractors: summary.activeContractors,
        approvedContractors: summary.approvedContractors,
        pendingApproval: summary.pendingApproval,
        suspended: contractors.filter(c => c.status === 'suspended').length,
        blacklisted: contractors.filter(c => c.status === 'blacklisted').length,
        ragDistribution,
        averagePerformanceScore: summary.averagePerformanceScore,
        averageSafetyScore: summary.averageSafetyScore,
        averageQualityScore: summary.averagePerformanceScore, // Use performance as fallback
        averageTimelinessScore: summary.averagePerformanceScore, // Use performance as fallback
        totalActiveProjects: 0, // Would need actual project data
        totalCompletedProjects: 0, // Would need actual project data
        averageProjectsPerContractor: 0, // Would need actual project data
        documentsExpiringSoon: 0, // Would need document data
        complianceIssues: 0, // Would need compliance data
        pendingDocuments: 0 // Would need document data
      };
    } catch (error) {
      log.error('Client service: Error getting contractor analytics', { data: error }, 'contractorClientService');
      throw new Error('Failed to fetch contractor analytics');
    }
  }

  /**
   * Find contractor by email or registration number (for import duplicate detection)
   */
  async findByEmailOrRegistration(email: string, registrationNumber: string): Promise<Contractor | null> {
    try {
      log.info('Client service: Finding contractor by email/registration', undefined, 'contractorClientService');
      const contractors = await contractorApiService.getAll();
      
      return contractors.find(c => 
        c.email === email || c.registrationNumber === registrationNumber
      ) || null;
    } catch (error) {
      log.error('Client service: Error finding contractor', { data: error }, 'contractorClientService');
      return null;
    }
  }
}

// Export singleton instance
export const contractorClientService = new ContractorClientService();

// Re-export types for convenience
export type {
  Contractor,
  ContractorFormData,
  ContractorFilter,
  ContractorAnalytics
} from '@/types/contractor.types';