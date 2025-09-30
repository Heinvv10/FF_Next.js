/**
 * Supplier Service for Neon PostgreSQL Database
 *
 * This service replaces the Firebase-based supplier service with a Neon PostgreSQL implementation.
 * It provides the same interface as the original service for backward compatibility.
 */

import { neon } from '@neondatabase/serverless';
import type {
  Supplier,
  SupplierFormData,
  SupplierStatus,
  SupplierRating,
  PerformancePeriod
} from '@/types/supplier/base.types';
import { SupplierFilter } from './crud/types';

// Simple cache for supplier data
const suppliersCache = new Map<string, { data: Supplier[]; timestamp: number; total: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Database connection
const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL || process.env.DATABASE_URL!);

// Cache key generator
const getCacheKey = (filters?: SupplierFilter) => {
  return `suppliers_${JSON.stringify(filters || {})}`;
};

class SupplierNeonService {
  /**
   * Get all suppliers with optional filtering
   */
  static async getAll(filter?: SupplierFilter): Promise<Supplier[]> {
    try {
      // Check cache first
      const cacheKey = getCacheKey(filter);
      const cached = suppliersCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.data;
      }

      // Build query
      let whereClause = sql`WHERE 1=1`;
      if (filter?.status) {
        whereClause = sql`${whereClause} AND status = ${filter.status}`;
      }
      if (filter?.isPreferred !== undefined) {
        whereClause = sql`${whereClause} AND is_preferred = ${filter.isPreferred}`;
      }
      if (filter?.category) {
        whereClause = sql`${whereClause} AND categories::text LIKE ${'%' + filter.category + '%'}`;
      }

      const query = sql`
        SELECT
          id,
          code,
          name,
          company_name as "companyName",
          trading_name as "tradingName",
          registration_number as "registrationNumber",
          tax_number as "taxNumber",
          status,
          business_type as "businessType",
          is_active as "isActive",
          is_preferred as "isPreferred",
          is_verified as "isVerified",
          email,
          phone,
          fax,
          website,
          contact_name as "contactName",
          contact_title as "contactTitle",
          contact_email as "contactEmail",
          contact_phone as "contactPhone",
          contact_mobile as "contactMobile",
          contact_department as "contactDepartment",
          physical_street1 as "physicalStreet1",
          physical_street2 as "physicalStreet2",
          physical_city as "physicalCity",
          physical_state as "physicalState",
          physical_postal_code as "physicalPostalCode",
          physical_country as "physicalCountry",
          physical_lat as "physicalLat",
          physical_lng as "physicalLng",
          bank_name as "bankName",
          bank_account_name as "bankAccountName",
          bank_account_number as "bankAccountNumber",
          bank_branch_code as "bankBranchCode",
          employee_size as "employeeSize",
          annual_revenue as "annualRevenue",
          established_date as "establishedDate",
          industry as "industry",
          province as "province",
          preferred_payment_terms as "preferredPaymentTerms",
          currency as "currency",
          credit_limit as "creditLimit",
          lead_time_days as "leadTimeDays",
          minimum_order_value as "minimumOrderValue",
          rating_overall as "ratingOverall",
          rating_quality as "ratingQuality",
          rating_delivery as "ratingDelivery",
          rating_pricing as "ratingPricing",
          rating_communication as "ratingCommunication",
          rating_flexibility as "ratingFlexibility",
          total_reviews as "totalReviews",
          last_review_date as "lastReviewDate",
          last_reviewed_by as "lastReviewedBy",
          tax_compliant as "taxCompliant",
          bee_compliant as "beeCompliant",
          bee_level as "beeLevel",
          insurance_valid as "insuranceValid",
          documents_verified as "documentsVerified",
          last_audit_date as "lastAuditDate",
          next_audit_date as "nextAuditDate",
          blacklisted as "blacklisted",
          blacklist_reason as "blacklistReason",
          blacklisted_at as "blacklistedAt",
          blacklisted_by as "blacklistedBy",
          inactive_reason as "inactiveReason",
          inactivated_at as "inactivatedAt",
          notes,
          tags,
          categories,
          created_by as "createdBy",
          created_at as "createdAt",
          updated_by as "updatedBy",
          updated_at as "updatedAt"
        FROM suppliers
        ${whereClause}
        ORDER BY company_name ASC
        LIMIT 1000
      `;

      const result = await query;

      // Transform data to match interface
      const suppliers = result.map(supplier => ({
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        companyName: supplier.companyName,
        businessType: supplier.businessType,
        registrationNumber: supplier.registrationNumber,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        addresses: {
          physical: {
            street1: supplier.physicalStreet1 || '',
            street2: supplier.physicalStreet2 || '',
            city: supplier.physicalCity || '',
            state: supplier.physicalState || '',
            postalCode: supplier.physicalPostalCode || '',
            country: supplier.physicalCountry || 'South Africa'
          }
        },
        isPreferred: supplier.isPreferred,
        isActive: supplier.isActive,
        status: supplier.status,
        categories: supplier.categories || [],
        servicesOffered: [],
        rating: {
          overall: supplier.ratingOverall || 0,
          totalReviews: supplier.totalReviews || 0,
          lastReviewDate: supplier.lastReviewDate
        },
        performanceScore: supplier.ratingOverall || 0,
        complianceStatus: {
          taxCompliant: supplier.taxCompliant,
          beeCompliant: supplier.beeCompliant,
          insuranceValid: supplier.insuranceValid,
          documentsVerified: supplier.documentsVerified
        },
        primaryContact: {
          name: supplier.contactName || '',
          email: supplier.contactEmail || supplier.email || '',
          phone: supplier.contactPhone || supplier.phone || ''
        },
        contact: {
          name: supplier.contactName || '',
          email: supplier.contactEmail || supplier.email || '',
          phone: supplier.contactPhone || supplier.phone || ''
        },
        notes: supplier.notes,
        documents: [],
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt
      }));

      // Cache the result
      suppliersCache.set(cacheKey, {
        data: suppliers,
        timestamp: now,
        total: suppliers.length
      });

      return suppliers;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error(`Failed to fetch suppliers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get supplier by ID
   */
  static async getById(id: string): Promise<Supplier> {
    try {
      const query = sql`
        SELECT
          id,
          code,
          name,
          company_name as "companyName",
          trading_name as "tradingName",
          registration_number as "registrationNumber",
          tax_number as "taxNumber",
          status,
          business_type as "businessType",
          is_active as "isActive",
          is_preferred as "isPreferred",
          is_verified as "isVerified",
          email,
          phone,
          fax,
          website,
          contact_name as "contactName",
          contact_title as "contactTitle",
          contact_email as "contactEmail",
          contact_phone as "contactPhone",
          contact_mobile as "contactMobile",
          contact_department as "contactDepartment",
          physical_street1 as "physicalStreet1",
          physical_street2 as "physicalStreet2",
          physical_city as "physicalCity",
          physical_state as "physicalState",
          physical_postal_code as "physicalPostalCode",
          physical_country as "physicalCountry",
          physical_lat as "physicalLat",
          physical_lng as "physicalLng",
          bank_name as "bankName",
          bank_account_name as "bankAccountName",
          bank_account_number as "bankAccountNumber",
          bank_branch_code as "bankBranchCode",
          employee_size as "employeeSize",
          annual_revenue as "annualRevenue",
          established_date as "establishedDate",
          industry as "industry",
          province as "province",
          preferred_payment_terms as "preferredPaymentTerms",
          currency as "currency",
          credit_limit as "creditLimit",
          lead_time_days as "leadTimeDays",
          minimum_order_value as "minimumOrderValue",
          rating_overall as "ratingOverall",
          rating_quality as "ratingQuality",
          rating_delivery as "ratingDelivery",
          rating_pricing as "ratingPricing",
          rating_communication as "ratingCommunication",
          rating_flexibility as "ratingFlexibility",
          total_reviews as "totalReviews",
          last_review_date as "lastReviewDate",
          last_reviewed_by as "lastReviewedBy",
          tax_compliant as "taxCompliant",
          bee_compliant as "beeCompliant",
          bee_level as "beeLevel",
          insurance_valid as "insuranceValid",
          documents_verified as "documentsVerified",
          last_audit_date as "lastAuditDate",
          next_audit_date as "nextAuditDate",
          blacklisted as "blacklisted",
          blacklist_reason as "blacklistReason",
          blacklisted_at as "blacklistedAt",
          blacklisted_by as "blacklistedBy",
          inactive_reason as "inactiveReason",
          inactivated_at as "inactivatedAt",
          notes,
          tags,
          categories,
          created_by as "createdBy",
          created_at as "createdAt",
          updated_by as "updatedBy",
          updated_at as "updatedAt"
        FROM suppliers
        WHERE id = ${id}
      `;

      const result = await query;

      if (!result || result.length === 0) {
        throw new Error('Supplier not found');
      }

      const supplier = result[0];

      // Transform data to match interface
      return {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        companyName: supplier.companyName,
        businessType: supplier.businessType,
        registrationNumber: supplier.registrationNumber,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        addresses: {
          physical: {
            street1: supplier.physicalStreet1 || '',
            street2: supplier.physicalStreet2 || '',
            city: supplier.physicalCity || '',
            state: supplier.physicalState || '',
            postalCode: supplier.physicalPostalCode || '',
            country: supplier.physicalCountry || 'South Africa'
          }
        },
        isPreferred: supplier.isPreferred,
        isActive: supplier.isActive,
        status: supplier.status,
        categories: supplier.categories || [],
        servicesOffered: [],
        rating: {
          overall: supplier.ratingOverall || 0,
          totalReviews: supplier.totalReviews || 0,
          lastReviewDate: supplier.lastReviewDate
        },
        performanceScore: supplier.ratingOverall || 0,
        complianceStatus: {
          taxCompliant: supplier.taxCompliant,
          beeCompliant: supplier.beeCompliant,
          insuranceValid: supplier.insuranceValid,
          documentsVerified: supplier.documentsVerified
        },
        primaryContact: {
          name: supplier.contactName || '',
          email: supplier.contactEmail || supplier.email || '',
          phone: supplier.contactPhone || supplier.phone || ''
        },
        contact: {
          name: supplier.contactName || '',
          email: supplier.contactEmail || supplier.email || '',
          phone: supplier.contactPhone || supplier.phone || ''
        },
        notes: supplier.notes,
        documents: [],
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt
      };
    } catch (error) {
      console.error(`Error fetching supplier ${id}:`, error);
      throw new Error(`Failed to fetch supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new supplier
   */
  static async create(data: SupplierFormData): Promise<string> {
    try {
      // Validate required fields
      if (!data.name) {
        throw new Error('Supplier name is required');
      }
      if (!data.email) {
        throw new Error('Supplier email is required');
      }

      // Generate supplier code
      const code = `SUP-${Date.now()}`;

      const result = await sql`
        INSERT INTO suppliers (
          code, name, company_name, business_type, email, phone,
          registration_number, categories, is_preferred, contact_name,
          contact_email, contact_phone, physical_city
        ) VALUES (
          ${code}, ${data.name}, ${data.companyName || data.name}, ${data.businessType || 'Other'}, ${data.email}, ${data.phone || null},
          ${data.registrationNumber || null}, ${data.categories || []}, ${data.isPreferred || false}, ${data.name},
          ${data.email}, ${data.phone || null}, 'Johannesburg'
        )
        RETURNING id
      `;

      if (!result || result.length === 0) {
        throw new Error('Failed to create supplier');
      }

      // Clear cache
      suppliersCache.clear();
      return result[0].id;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw new Error(`Failed to create supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing supplier
   */
  static async update(id: string, data: Partial<SupplierFormData>): Promise<void> {
    try {
      // Build dynamic update query using tagged template syntax
      let updateClause = sql``;
      let separator = sql`SET`;

      if (data.name !== undefined) {
        updateClause = sql`${updateClause} ${separator} name = ${data.name}`;
        separator = sql`,`;
      }
      if (data.companyName !== undefined) {
        updateClause = sql`${updateClause} ${separator} company_name = ${data.companyName}`;
        separator = sql`,`;
      }
      if (data.businessType !== undefined) {
        updateClause = sql`${updateClause} ${separator} business_type = ${data.businessType}`;
        separator = sql`,`;
      }
      if (data.email !== undefined) {
        updateClause = sql`${updateClause} ${separator} email = ${data.email}`;
        separator = sql`,`;
      }
      if (data.phone !== undefined) {
        updateClause = sql`${updateClause} ${separator} phone = ${data.phone}`;
        separator = sql`,`;
      }
      if (data.registrationNumber !== undefined) {
        updateClause = sql`${updateClause} ${separator} registration_number = ${data.registrationNumber}`;
        separator = sql`,`;
      }
      if (data.categories !== undefined) {
        updateClause = sql`${updateClause} ${separator} categories = ${data.categories}`;
        separator = sql`,`;
      }
      if (data.isPreferred !== undefined) {
        updateClause = sql`${updateClause} ${separator} is_preferred = ${data.isPreferred}`;
        separator = sql`,`;
      }
      if (data.status !== undefined) {
        updateClause = sql`${updateClause} ${separator} status = ${data.status}`;
        separator = sql`,`;
      }

      if (separator === sql`SET`) {
        return; // Nothing to update
      }

      updateClause = sql`${updateClause}, updated_at = CURRENT_TIMESTAMP`;

      const query = sql`
        UPDATE suppliers
        ${updateClause}
        WHERE id = ${id}
      `;

      await query;

      // Clear cache
      suppliersCache.clear();
    } catch (error) {
      console.error(`Error updating supplier ${id}:`, error);
      throw new Error(`Failed to update supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete supplier
   */
  static async delete(id: string): Promise<void> {
    try {
      const result = await sql`
        DELETE FROM suppliers
        WHERE id = ${id}
        RETURNING id
      `;

      if (!result || result.length === 0) {
        throw new Error('Supplier not found');
      }

      // Clear cache
      suppliersCache.clear();
    } catch (error) {
      console.error(`Error deleting supplier ${id}:`, error);
      throw new Error(`Failed to delete supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update supplier status
   */
  static async updateStatus(id: string, status: SupplierStatus, reason?: string): Promise<void> {
    return this.update(id, { status });
  }

  /**
   * Set preferred supplier
   */
  static async setPreferred(id: string, isPreferred: boolean): Promise<void> {
    return this.update(id, { isPreferred });
  }

  /**
   * Get preferred suppliers
   */
  static async getPreferredSuppliers(): Promise<Supplier[]> {
    return this.getAll({ isPreferred: true });
  }

  /**
   * Search suppliers by name
   */
  static async searchByName(searchTerm: string): Promise<Supplier[]> {
    try {
      const query = sql`
        SELECT
          id,
          code,
          name,
          company_name as "companyName",
          trading_name as "tradingName",
          registration_number as "registrationNumber",
          tax_number as "taxNumber",
          status,
          business_type as "businessType",
          is_active as "isActive",
          is_preferred as "isPreferred",
          is_verified as "isVerified",
          email,
          phone,
          fax,
          website,
          contact_name as "contactName",
          contact_title as "contactTitle",
          contact_email as "contactEmail",
          contact_phone as "contactPhone",
          contact_mobile as "contactMobile",
          contact_department as "contactDepartment",
          physical_street1 as "physicalStreet1",
          physical_street2 as "physicalStreet2",
          physical_city as "physicalCity",
          physical_state as "physicalState",
          physical_postal_code as "physicalPostalCode",
          physical_country as "physicalCountry",
          physical_lat as "physicalLat",
          physical_lng as "physicalLng",
          bank_name as "bankName",
          bank_account_name as "bankAccountName",
          bank_account_number as "bankAccountNumber",
          bank_branch_code as "bankBranchCode",
          employee_size as "employeeSize",
          annual_revenue as "annualRevenue",
          established_date as "establishedDate",
          industry as "industry",
          province as "province",
          preferred_payment_terms as "preferredPaymentTerms",
          currency as "currency",
          credit_limit as "creditLimit",
          lead_time_days as "leadTimeDays",
          minimum_order_value as "minimumOrderValue",
          rating_overall as "ratingOverall",
          rating_quality as "ratingQuality",
          rating_delivery as "ratingDelivery",
          rating_pricing as "ratingPricing",
          rating_communication as "ratingCommunication",
          rating_flexibility as "ratingFlexibility",
          total_reviews as "totalReviews",
          last_review_date as "lastReviewDate",
          last_reviewed_by as "lastReviewedBy",
          tax_compliant as "taxCompliant",
          bee_compliant as "beeCompliant",
          bee_level as "beeLevel",
          insurance_valid as "insuranceValid",
          documents_verified as "documentsVerified",
          last_audit_date as "lastAuditDate",
          next_audit_date as "nextAuditDate",
          blacklisted as "blacklisted",
          blacklist_reason as "blacklistReason",
          blacklisted_at as "blacklistedAt",
          blacklisted_by as "blacklistedBy",
          inactive_reason as "inactiveReason",
          inactivated_at as "inactivatedAt",
          notes,
          tags,
          categories,
          created_by as "createdBy",
          created_at as "createdAt",
          updated_by as "updatedBy",
          updated_at as "updatedAt"
        FROM suppliers
        WHERE (
          to_tsvector('english', company_name || ' ' || COALESCE(registration_number, '') || ' ' || email || ' ' || COALESCE(contact_name, '') || ' ' || COALESCE(notes, ''))
          @@ to_tsquery('english', ${searchTerm})
        )
        ORDER BY company_name ASC
        LIMIT 100
      `;

      const result = await query;

      // Transform data to match interface
      return result.map(supplier => ({
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        companyName: supplier.companyName,
        businessType: supplier.businessType,
        registrationNumber: supplier.registrationNumber,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        addresses: {
          physical: {
            street1: supplier.physicalStreet1 || '',
            street2: supplier.physicalStreet2 || '',
            city: supplier.physicalCity || '',
            state: supplier.physicalState || '',
            postalCode: supplier.physicalPostalCode || '',
            country: supplier.physicalCountry || 'South Africa'
          }
        },
        isPreferred: supplier.isPreferred,
        isActive: supplier.isActive,
        status: supplier.status,
        categories: supplier.categories || [],
        servicesOffered: [],
        rating: {
          overall: supplier.ratingOverall || 0,
          totalReviews: supplier.totalReviews || 0,
          lastReviewDate: supplier.lastReviewDate
        },
        performanceScore: supplier.ratingOverall || 0,
        complianceStatus: {
          taxCompliant: supplier.taxCompliant,
          beeCompliant: supplier.beeCompliant,
          insuranceValid: supplier.insuranceValid,
          documentsVerified: supplier.documentsVerified
        },
        primaryContact: {
          name: supplier.contactName || '',
          email: supplier.contactEmail || supplier.email || '',
          phone: supplier.contactPhone || supplier.phone || ''
        },
        contact: {
          name: supplier.contactName || '',
          email: supplier.contactEmail || supplier.email || '',
          phone: supplier.contactPhone || supplier.phone || ''
        },
        notes: supplier.notes,
        documents: [],
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt
      }));
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw new Error(`Failed to search suppliers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get suppliers by category
   */
  static async getByCategory(category: string): Promise<Supplier[]> {
    return this.getAll({ category });
  }

  /**
   * Get supplier statistics
   */
  static async getStatistics() {
    try {
      const stats = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive,
          COUNT(CASE WHEN is_preferred = true THEN 1 END) as preferred,
          COUNT(CASE WHEN is_active = true THEN 1 END) as isActive,
          AVG(rating_overall) as averageRating,
          COUNT(CASE WHEN tax_compliant = true THEN 1 END) as taxCompliant,
          COUNT(CASE WHEN bee_compliant = true THEN 1 END) as beeCompliant,
          COUNT(CASE WHEN insurance_valid = true THEN 1 END) as insuranceValid,
          COUNT(CASE WHEN documents_verified = true THEN 1 END) as documentsVerified
        FROM suppliers
      `;

      return stats[0] || {};
    } catch (error) {
      console.error('Error fetching supplier statistics:', error);
      throw new Error(`Failed to fetch supplier statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update supplier rating
   */
  static async updateRating(id: string, rating: Partial<SupplierRating>): Promise<void> {
    // For now, we'll store rating in the overall_rating field
    if (rating.overall !== undefined) {
      await this.update(id, {
        // We'll need to add rating fields to the API
      });
    }
  }

  /**
   * Calculate supplier performance
   */
  static async calculatePerformance(supplierId: string, period: PerformancePeriod) {
    // Placeholder implementation
    return {
      score: 0,
      metrics: {},
      period
    };
  }

  /**
   * Update supplier compliance
   */
  static async updateCompliance(id: string, compliance: any): Promise<void> {
    await this.update(id, { compliance });
  }

  /**
   * Add supplier document
   */
  static async addDocument(id: string, document: any): Promise<void> {
    // This would need to be implemented with a separate documents API
    console.log('Adding document to supplier:', id, document);
  }

  /**
   * Subscribe to supplier updates (simplified for Neon)
   */
  static subscribeToSupplier(supplierId: string, callback: (supplier: Supplier) => void) {
    // For Neon, we'll use polling instead of real-time subscriptions
    const interval = setInterval(async () => {
      try {
        const supplier = await this.getById(supplierId);
        callback(supplier);
      } catch (error) {
        console.error('Error polling supplier:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }

  /**
   * Subscribe to suppliers list updates (simplified for Neon)
   */
  static subscribeToSuppliers(callback: (suppliers: Supplier[]) => void) {
    // For Neon, we'll use polling instead of real-time subscriptions
    const interval = setInterval(async () => {
      try {
        const suppliers = await this.getAll();
        callback(suppliers);
      } catch (error) {
        console.error('Error polling suppliers:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }

  /**
   * Count suppliers by category
   */
  static countByCategory(suppliers: Supplier[]) {
    const counts: Record<string, number> = {};

    suppliers.forEach(supplier => {
      supplier.categories?.forEach(category => {
        counts[category] = (counts[category] || 0) + 1;
      });
    });

    return counts;
  }
}

export { SupplierNeonService };