/**
 * Supplier Management Service - Updated to use Neon PostgreSQL
 *
 * This service now uses Neon PostgreSQL instead of Firebase for better performance
 * and compatibility with the main application architecture.
 *
 * The service maintains the same interface as the original Firebase service
 * for backward compatibility.
 */

import { SupplierNeonService } from './supplierNeonService';
import type {
  Supplier,
  SupplierFormData,
  SupplierStatus,
  SupplierRating,
  PerformancePeriod
} from '@/types/supplier/base.types';

/**
 * Supplier Service - Now using Neon PostgreSQL
 *
 * This service provides the same interface as the original Firebase service
 * but now uses the Neon PostgreSQL database for better performance and scalability.
 */
export const supplierService = {
  // ============= CRUD Operations =============

  /**
   * Get all suppliers with optional filtering
   */
  async getAll(filter?: {
    status?: SupplierStatus;
    category?: string;
    isPreferred?: boolean
  }) {
    return SupplierNeonService.getAll(filter);
  },

  /**
   * Get supplier by ID
   */
  async getById(id: string): Promise<Supplier> {
    return SupplierNeonService.getById(id);
  },

  /**
   * Create new supplier
   */
  async create(data: SupplierFormData): Promise<string> {
    return SupplierNeonService.create(data);
  },

  /**
   * Update existing supplier
   */
  async update(id: string, data: Partial<SupplierFormData>): Promise<void> {
    return SupplierNeonService.update(id, data);
  },

  /**
   * Delete supplier
   */
  async delete(id: string): Promise<void> {
    return SupplierNeonService.delete(id);
  },

  // ============= Status Management =============

  /**
   * Update supplier status
   */
  async updateStatus(id: string, status: SupplierStatus, reason?: string): Promise<void> {
    return SupplierNeonService.updateStatus(id, status, reason);
  },

  /**
   * Set preferred supplier
   */
  async setPreferred(id: string, isPreferred: boolean): Promise<void> {
    return SupplierNeonService.setPreferred(id, isPreferred);
  },

  // ============= Performance & Rating =============

  /**
   * Update supplier rating
   */
  async updateRating(id: string, rating: Partial<SupplierRating>): Promise<void> {
    return SupplierNeonService.updateRating(id, rating);
  },

  /**
   * Calculate supplier performance
   */
  async calculatePerformance(supplierId: string, period: PerformancePeriod) {
    return SupplierNeonService.calculatePerformance(supplierId, period);
  },

  // ============= Search & Filter =============

  /**
   * Search suppliers by name
   */
  async searchByName(searchTerm: string): Promise<Supplier[]> {
    return SupplierNeonService.searchByName(searchTerm);
  },

  /**
   * Get preferred suppliers
   */
  async getPreferredSuppliers(): Promise<Supplier[]> {
    return SupplierNeonService.getPreferredSuppliers();
  },

  /**
   * Get suppliers by category
   */
  async getByCategory(category: string): Promise<Supplier[]> {
    return SupplierNeonService.getByCategory(category);
  },

  // ============= Compliance & Documents =============

  /**
   * Update supplier compliance
   */
  async updateCompliance(id: string, compliance: any): Promise<void> {
    return SupplierNeonService.updateCompliance(id, compliance);
  },

  /**
   * Add supplier document
   */
  async addDocument(id: string, document: any): Promise<void> {
    return SupplierNeonService.addDocument(id, document);
  },

  // ============= Real-time Subscription =============

  /**
   * Subscribe to supplier updates (now using polling)
   */
  subscribeToSupplier(supplierId: string, callback: (supplier: Supplier) => void) {
    return SupplierNeonService.subscribeToSupplier(supplierId, callback);
  },

  /**
   * Subscribe to suppliers list updates (now using polling)
   */
  subscribeToSuppliers(callback: (suppliers: Supplier[]) => void) {
    return SupplierNeonService.subscribeToSuppliers(callback);
  },

  // ============= Statistics =============

  /**
   * Get supplier statistics
   */
  async getStatistics() {
    return SupplierNeonService.getStatistics();
  },

  /**
   * Count suppliers by category
   */
  countByCategory(suppliers: Supplier[]) {
    return SupplierNeonService.countByCategory(suppliers);
  }
};

// Export the Neon service for direct access if needed
export { SupplierNeonService };

// Default export maintains compatibility
export default supplierService;