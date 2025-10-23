/**
 * Neon Contractor Service - Direct database operations for contractors
 * Uses Neon PostgreSQL for all contractor-related operations
 */

import { neon } from '@neondatabase/serverless';
import { log } from '@/lib/logger';
import type { 
  Contractor, 
  ContractorFormData,
  ContractorTeam,
  TeamFormData,
  ContractorDocument,
  RAGScore
} from '@/types/contractor.types';

// Database connection
const sql = neon(process.env.DATABASE_URL || '');

export const neonContractorService = {
  // ==================== CONTRACTOR CRUD ====================
  
  /**
   * Get all contractors with optional filters
   */
  async getContractors(filters?: {
    status?: string | string[];
    complianceStatus?: string;
    ragOverall?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Contractor[]> {
    try {
      // Build dynamic query using template literals
      let result;

      // Handle different filter combinations
      if (!filters || Object.keys(filters).length === 0) {
        result = await sql`
          SELECT * FROM contractors
          ORDER BY created_at DESC
        `;
      } else if (filters.search && !filters.status && !filters.complianceStatus && !filters.ragOverall && filters.isActive === undefined) {
        // Search only
        const searchTerm = `%${filters.search}%`;
        result = await sql`
          SELECT * FROM contractors
          WHERE (
            LOWER(company_name) LIKE LOWER(${searchTerm}) OR
            LOWER(contact_person) LIKE LOWER(${searchTerm}) OR
            LOWER(email) LIKE LOWER(${searchTerm})
          )
          ORDER BY created_at DESC
        `;
      } else if (filters.status && !filters.search) {
        // Status filter only - support both single and multiple statuses
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        result = await sql`
          SELECT * FROM contractors
          WHERE status = ANY(${statusArray})
          ${filters.isActive !== undefined ? sql`AND is_active = ${filters.isActive}` : sql``}
          ORDER BY created_at DESC
        `;
      } else {
        // For complex filters, use basic query for now
        // TODO: Implement more complex filter combinations as needed
        result = await sql`
          SELECT * FROM contractors
          ORDER BY created_at DESC
        `;
      }

      return this.mapContractors(result);
    } catch (error) {
      log.error('Error fetching contractors:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Get contractor by ID
   */
  async getContractorById(id: string): Promise<Contractor | null> {
    try {
      const result = await sql`
        SELECT * FROM contractors 
        WHERE id = ${id}
      `;
      
      if (result.length === 0) return null;
      return this.mapContractor(result[0]);
    } catch (error) {
      log.error('Error fetching contractor by ID:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Create new contractor
   */
  async createContractor(data: ContractorFormData): Promise<Contractor> {
    try {
      const result = await sql`
        INSERT INTO contractors (
          company_name, registration_number, business_type, industry_category,
          years_in_business, employee_count, contact_person, email, phone,
          alternate_phone, physical_address, postal_address, city, province,
          postal_code, annual_turnover, credit_rating, payment_terms,
          bank_name, account_number, branch_code, specializations,
          certifications, notes, tags, created_by
        ) VALUES (
          ${data.companyName}, ${data.registrationNumber}, ${data.businessType},
          ${data.industryCategory}, ${data.yearsInBusiness}, ${data.employeeCount},
          ${data.contactPerson}, ${data.email}, ${data.phone}, ${data.alternatePhone},
          ${data.physicalAddress}, ${data.postalAddress}, ${data.city}, ${data.province},
          ${data.postalCode}, ${data.annualTurnover}, ${data.creditRating},
          ${data.paymentTerms}, ${data.bankName}, ${data.accountNumber},
          ${data.branchCode}, ${JSON.stringify(data.specializations || [])},
          ${JSON.stringify(data.certifications || [])}, ${data.notes},
          ${JSON.stringify(data.tags || [])}, ${data.createdBy || 'web_form'}
        )
        RETURNING *
      `;

      return this.mapContractor(result[0]);
    } catch (error) {
      log.error('Error creating contractor:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Update contractor
   */
  async updateContractor(id: string, data: Partial<ContractorFormData>): Promise<Contractor> {
    try {
      // Use template literal with all fields
      const result = await sql`
        UPDATE contractors
        SET
          company_name = COALESCE(${data.companyName}, company_name),
          contact_person = COALESCE(${data.contactPerson}, contact_person),
          email = COALESCE(${data.email}, email),
          phone = COALESCE(${data.phone}, phone),
          status = COALESCE(${data.status}, status),
          is_active = COALESCE(${(data as any).isActive}, is_active),
          registration_number = COALESCE(${data.registrationNumber}, registration_number),
          business_type = COALESCE(${data.businessType}, business_type),
          industry_category = COALESCE(${data.industryCategory}, industry_category),
          years_in_business = COALESCE(${data.yearsInBusiness}, years_in_business),
          employee_count = COALESCE(${data.employeeCount}, employee_count),
          alternate_phone = COALESCE(${data.alternatePhone}, alternate_phone),
          physical_address = COALESCE(${data.physicalAddress}, physical_address),
          postal_address = COALESCE(${data.postalAddress}, postal_address),
          city = COALESCE(${data.city}, city),
          province = COALESCE(${data.province}, province),
          postal_code = COALESCE(${data.postalCode}, postal_code),
          annual_turnover = COALESCE(${data.annualTurnover}, annual_turnover),
          credit_rating = COALESCE(${data.creditRating}, credit_rating),
          payment_terms = COALESCE(${data.paymentTerms}, payment_terms),
          bank_name = COALESCE(${data.bankName}, bank_name),
          account_number = COALESCE(${data.accountNumber}, account_number),
          branch_code = COALESCE(${data.branchCode}, branch_code),
          specializations = COALESCE(${data.specializations ? JSON.stringify(data.specializations) : null}, specializations),
          certifications = COALESCE(${data.certifications ? JSON.stringify(data.certifications) : null}, certifications),
          notes = COALESCE(${data.notes}, notes),
          tags = COALESCE(${data.tags ? JSON.stringify(data.tags) : null}, tags),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error('Contractor not found');
      }

      return this.mapContractor(result[0]);
    } catch (error) {
      log.error('Error updating contractor:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Delete contractor (soft delete)
   */
  async deleteContractor(id: string): Promise<void> {
    try {
      await sql`
        UPDATE contractors 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id}
      `;
    } catch (error) {
      log.error('Error deleting contractor:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  // ==================== TEAM MANAGEMENT ====================
  
  /**
   * Get teams for a contractor
   */
  async getContractorTeams(contractorId: string): Promise<ContractorTeam[]> {
    try {
      const result = await sql`
        SELECT * FROM contractor_teams
        WHERE contractor_id = ${contractorId}
        ORDER BY created_at DESC
      `;
      
      return this.mapTeams(result);
    } catch (error) {
      log.error('Error fetching contractor teams:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Create contractor team
   */
  async createTeam(contractorId: string, data: TeamFormData): Promise<ContractorTeam> {
    try {
      const result = await sql`
        INSERT INTO contractor_teams (
          contractor_id, team_name, team_type, team_size,
          lead_name, lead_phone, lead_email, lead_certification,
          members, specializations, equipment_available, service_areas,
          availability, max_capacity, notes, created_by
        ) VALUES (
          ${contractorId}, ${data.teamName}, ${data.teamType}, ${data.teamSize},
          ${data.leadName}, ${data.leadPhone}, ${data.leadEmail}, ${data.leadCertification},
          ${JSON.stringify(data.members || [])}, ${JSON.stringify(data.specializations || [])},
          ${JSON.stringify(data.equipmentAvailable || [])}, ${JSON.stringify(data.serviceAreas || [])},
          ${data.availability || 'available'}, ${data.maxCapacity || 5},
          ${data.notes}, ${data.createdBy}
        )
        RETURNING *
      `;
      
      return this.mapTeam(result[0]);
    } catch (error) {
      log.error('Error creating team:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Update contractor team
   */
  async updateTeam(teamId: string, data: Partial<TeamFormData>): Promise<ContractorTeam> {
    try {
      const result = await sql`
        UPDATE contractor_teams
        SET
          team_name = COALESCE(${data.teamName}, team_name),
          team_size = COALESCE(${data.teamSize}, team_size),
          availability = COALESCE(${data.availability}, availability),
          updated_at = NOW()
        WHERE id = ${teamId}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error('Team not found');
      }

      return this.mapTeam(result[0]);
    } catch (error) {
      log.error('Error updating team:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Delete contractor team
   */
  async deleteTeam(teamId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM contractor_teams
        WHERE id = ${teamId}
      `;
    } catch (error) {
      log.error('Error deleting team:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  // ==================== DOCUMENT MANAGEMENT ====================
  
  /**
   * Get documents for a contractor
   */
  async getContractorDocuments(contractorId: string): Promise<ContractorDocument[]> {
    try {
      const result = await sql`
        SELECT * FROM contractor_documents
        WHERE contractor_id = ${contractorId}
        ORDER BY created_at DESC
      `;
      
      return this.mapDocuments(result);
    } catch (error) {
      log.error('Error fetching contractor documents:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Add document to contractor
   */
  async addDocument(contractorId: string, document: {
    documentType: string;
    documentName: string;
    fileName: string;
    filePath: string;
    fileUrl?: string;
    expiryDate?: Date;
    notes?: string;
  }): Promise<ContractorDocument> {
    try {
      const result = await sql`
        INSERT INTO contractor_documents (
          contractor_id, document_type, document_name,
          file_name, file_path, file_url, expiry_date, notes
        ) VALUES (
          ${contractorId}, ${document.documentType}, ${document.documentName},
          ${document.fileName}, ${document.filePath}, ${document.fileUrl},
          ${document.expiryDate}, ${document.notes}
        )
        RETURNING *
      `;
      
      return this.mapDocument(result[0]);
    } catch (error) {
      log.error('Error adding document:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Update document status
   */
  async updateDocumentStatus(documentId: string, status: string, notes?: string): Promise<void> {
    try {
      await sql`
        UPDATE contractor_documents
        SET status = ${status}, 
            verification_notes = ${notes},
            updated_at = NOW()
        WHERE id = ${documentId}
      `;
    } catch (error) {
      log.error('Error updating document status:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM contractor_documents
        WHERE id = ${documentId}
      `;
    } catch (error) {
      log.error('Error deleting document:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  // ==================== RAG SCORING ====================
  
  /**
   * Update RAG scores
   */
  async updateRAGScores(contractorId: string, scores: {
    overall?: RAGScore;
    financial?: RAGScore;
    compliance?: RAGScore;
    performance?: RAGScore;
    safety?: RAGScore;
  }): Promise<void> {
    try {
      await sql`
        UPDATE contractors
        SET
          rag_overall = COALESCE(${scores.overall}, rag_overall),
          rag_financial = COALESCE(${scores.financial}, rag_financial),
          rag_compliance = COALESCE(${scores.compliance}, rag_compliance),
          rag_performance = COALESCE(${scores.performance}, rag_performance),
          rag_safety = COALESCE(${scores.safety}, rag_safety),
          updated_at = NOW()
        WHERE id = ${contractorId}
      `;

      // Record RAG history
      for (const [scoreType, newScore] of Object.entries(scores)) {
        if (newScore) {
          await this.recordRAGHistory(contractorId, scoreType, newScore);
        }
      }
    } catch (error) {
      log.error('Error updating RAG scores:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  /**
   * Record RAG score history
   */
  async recordRAGHistory(contractorId: string, scoreType: string, newScore: RAGScore): Promise<void> {
    try {
      await sql`
        INSERT INTO contractor_rag_history (
          contractor_id, score_type, new_score
        ) VALUES (
          ${contractorId}, ${scoreType}, ${newScore}
        )
      `;
    } catch (error) {
      log.error('Error recording RAG history:', { data: error }, 'neonContractorService');
      throw error;
    }
  },

  // ==================== DATA MAPPING ====================
  
  /**
   * Map database row to Contractor type
   */
  mapContractor(row: any): Contractor {
    return {
      id: row.id.toString(),
      companyName: row.company_name,
      registrationNumber: row.registration_number,
      businessType: row.business_type,
      industryCategory: row.industry_category,
      yearsInBusiness: row.years_in_business,
      employeeCount: row.employee_count,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      alternatePhone: row.alternate_phone,
      physicalAddress: row.physical_address,
      postalAddress: row.postal_address,
      city: row.city,
      province: row.province,
      postalCode: row.postal_code,
      annualTurnover: row.annual_turnover,
      creditRating: row.credit_rating,
      paymentTerms: row.payment_terms,
      bankName: row.bank_name,
      accountNumber: row.account_number,
      branchCode: row.branch_code,
      status: row.status,
      isActive: row.is_active,
      complianceStatus: row.compliance_status,
      ragOverall: row.rag_overall,
      ragFinancial: row.rag_financial,
      ragCompliance: row.rag_compliance,
      ragPerformance: row.rag_performance,
      ragSafety: row.rag_safety,
      performanceScore: row.performance_score,
      safetyScore: row.safety_score,
      qualityScore: row.quality_score,
      timelinessScore: row.timeliness_score,
      specializations: row.specializations || [],
      totalProjects: row.total_projects,
      completedProjects: row.completed_projects,
      activeProjects: row.active_projects,
      cancelledProjects: row.cancelled_projects,
      successRate: row.success_rate,
      onTimeCompletion: row.on_time_completion,
      averageProjectValue: row.average_project_value,
      certifications: row.certifications || [],
      onboardingProgress: row.onboarding_progress,
      onboardingCompletedAt: row.onboarding_completed_at,
      documentsExpiring: row.documents_expiring,
      notes: row.notes,
      tags: row.tags || [],
      lastActivity: row.last_activity,
      nextReviewDate: row.next_review_date,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  mapContractors(rows: any[]): Contractor[] {
    return rows.map(row => this.mapContractor(row));
  },

  mapTeam(row: any): ContractorTeam {
    return {
      id: row.id.toString(),
      contractorId: row.contractor_id.toString(),
      teamName: row.team_name,
      teamType: row.team_type,
      teamSize: row.team_size,
      leadName: row.lead_name,
      leadPhone: row.lead_phone,
      leadEmail: row.lead_email,
      leadCertification: row.lead_certification,
      members: row.members || [],
      specializations: row.specializations || [],
      equipmentAvailable: row.equipment_available || [],
      serviceAreas: row.service_areas || [],
      availability: row.availability,
      currentWorkload: row.current_workload,
      maxCapacity: row.max_capacity,
      teamRating: row.team_rating,
      projectsCompleted: row.projects_completed,
      averageCompletionTime: row.average_completion_time,
      isActive: row.is_active,
      lastAssignmentDate: row.last_assignment_date,
      notes: row.notes,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  mapTeams(rows: any[]): ContractorTeam[] {
    return rows.map(row => this.mapTeam(row));
  },

  mapDocument(row: any): ContractorDocument {
    return {
      id: row.id.toString(),
      contractorId: row.contractor_id.toString(),
      documentType: row.document_type,
      documentName: row.document_name,
      documentNumber: row.document_number,
      fileName: row.file_name,
      filePath: row.file_path,
      fileUrl: row.file_url,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      isExpired: row.is_expired,
      daysUntilExpiry: row.days_until_expiry,
      isVerified: row.is_verified,
      verifiedBy: row.verified_by,
      verifiedAt: row.verified_at,
      verificationNotes: row.verification_notes,
      status: row.status,
      rejectionReason: row.rejection_reason,
      notes: row.notes,
      tags: row.tags || [],
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  mapDocuments(rows: any[]): ContractorDocument[] {
    return rows.map(row => this.mapDocument(row));
  }
};