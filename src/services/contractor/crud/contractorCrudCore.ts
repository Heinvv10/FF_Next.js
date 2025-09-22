/**
 * Core Contractor CRUD Service
 * Main orchestrator for contractor operations
 * Using API routes for browser, Neon for server/build
 */

import { 
  Contractor, 
  ContractorFormData,
  ContractorFilter,
  ContractorAnalytics
} from '@/types/contractor.types';
// Import API service for browser
import { contractorApiService } from '../contractorApiService';
import { log } from '@/lib/logger';
import {
  subscribeToContractors,
  subscribeToContractor
} from './subscriptionHandlers';
// Client-side filter utilities removed - using server-side filtering
// sortContractors import removed - using server-side sorting

// Always use API service in browser and pages
const baseService = contractorApiService;

/**
 * Main contractor CRUD service orchestrator
 */
export class ContractorCrudCore {
  /**
   * Get all contractors with optional filtering and sorting
   */
  async getAll(filter?: ContractorFilter): Promise<Contractor[]> {
    try {
      // Always use API service for client-side operations
      const contractors = await baseService.getAll();
      if (!filter) return contractors;

      // Apply client-side filtering
      return contractors.filter(contractor => {
        if (filter.status && !filter.status.includes(contractor.status || 'active')) return false;
        if (filter.specialization && !filter.specialization.includes(contractor.specialization || '')) return false;
        return true;
      });
    } catch (error) {
      log.error('Error getting contractors:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to fetch contractors');
    }
  }

  /**
   * Get contractor by ID
   */
  async getById(id: string): Promise<Contractor | null> {
    try {
      return await baseService.getById(id);
    } catch (error) {
      log.error('Error getting contractor:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to fetch contractor');
    }
  }

  /**
   * Create new contractor
   */
  async create(data: ContractorFormData): Promise<string> {
    try {
      // Always use API service
      const contractor = await baseService.create(data);
      return contractor.id;
    } catch (error) {
      log.error('Error creating contractor:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to create contractor');
    }
  }

  /**
   * Update contractor
   */
  async update(id: string, data: Partial<ContractorFormData>): Promise<void> {
    try {
      // Always use API service
      await baseService.update(id, data);
    } catch (error) {
      log.error('Error updating contractor:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to update contractor');
    }
  }

  /**
   * Delete contractor
   */
  async delete(id: string): Promise<void> {
    try {
      // Always use API service
      await baseService.delete(id);
    } catch (error) {
      log.error('Error deleting contractor:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to delete contractor');
    }
  }

  /**
   * Get contractor analytics
   */
  async getAnalytics(): Promise<ContractorAnalytics> {
    try {
      // For browser, calculate analytics from API data
      const contractors = await baseService.getAll();
      const summary = await baseService.getContractorSummary();

      return {
        totalContractors: summary.totalContractors,
        activeContractors: summary.activeContractors,
        averageRating: summary.averageRating,
        averageHourlyRate: summary.averageHourlyRate,
        topRatedContractors: await baseService.getTopRatedContractors(5),
        contractorsBySpecialization: {},
        recentlyAdded: contractors.slice(0, 5)
      };
    } catch (error) {
      log.error('Error getting contractor analytics:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to fetch contractor analytics');
    }
  }

  /**
   * Subscribe to contractors list changes
   */
  subscribeToContractors(
    callback: (contractors: Contractor[]) => void,
    filter?: ContractorFilter
  ): () => void {
    return subscribeToContractors(callback, filter);
  }

  /**
   * Subscribe to single contractor changes
   */
  subscribeToContractor(
    contractorId: string,
    callback: (contractor: Contractor | null) => void
  ): () => void {
    return subscribeToContractor(contractorId, callback);
  }

  /**
   * Batch update contractors
   */
  async batchUpdate(
    updates: Array<{ id: string; data: Partial<ContractorFormData> }>
  ): Promise<void> {
    try {
      const updatePromises = updates.map(({ id, data }) => this.update(id, data));
      await Promise.all(updatePromises);
    } catch (error) {
      log.error('Error in batch update:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to update contractors in batch');
    }
  }

  /**
   * Search contractors by term
   */
  async search(searchTerm: string): Promise<Contractor[]> {
    try {
      // For browser, filter from all contractors
      const contractors = await baseService.getAll();
      const term = searchTerm.toLowerCase();
      return contractors.filter(c =>
        c.company_name?.toLowerCase().includes(term) ||
        c.contact_person?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
      );
    } catch (error) {
      log.error('Error searching contractors:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to search contractors');
    }
  }

  /**
   * Find contractor by email or registration number
   * Used for duplicate detection during import
   */
  async findByEmailOrRegistration(email: string, registrationNumber?: string): Promise<Contractor | null> {
    try {
      const contractors = await this.getAll();
      
      // First, try to find by email (exact match, case insensitive)
      const byEmail = contractors.find(c => 
        c.email.toLowerCase() === email.toLowerCase()
      );
      
      if (byEmail) {
        return byEmail;
      }
      
      // If no email match and registration number provided, try registration number
      if (registrationNumber?.trim()) {
        const byRegistration = contractors.find(c => 
          c.registrationNumber && 
          c.registrationNumber.toLowerCase() === registrationNumber.toLowerCase()
        );
        
        if (byRegistration) {
          return byRegistration;
        }
      }
      
      return null;
      
    } catch (error) {
      log.error('Error finding contractor by email or registration:', { data: error }, 'contractorCrudCore');
      throw new Error('Failed to search for existing contractor');
    }
  }
}

// Export singleton instance
export const contractorCrudCore = new ContractorCrudCore();