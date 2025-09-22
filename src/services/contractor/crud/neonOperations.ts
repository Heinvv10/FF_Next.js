/**
 * Neon Operations for Contractors
 * Handles Neon PostgreSQL operations for contractor analytics
 * NOTE: These operations should only be called from server-side code (API routes)
 * This file should NOT be imported in client-side components
 */

import { ContractorFormData, ContractorAnalytics } from '@/types/contractor.types';
import { log } from '@/lib/logger';

// Mock implementation for client-side to prevent build errors
// Real implementation should use API calls instead
const sql = () => {
  throw new Error('Database operations cannot be performed on the client side. Use API routes instead.');
};

/**
 * Create contractor record in Neon for analytics
 */
export async function createContractorInNeon(id: string, data: ContractorFormData): Promise<void> {
  try {
    await sql`
      INSERT INTO contractors (
        id, company_name, registration_number, contact_person, email, phone, 
        alternate_phone, physical_address, postal_address, city, province, postal_code,
        business_type, industry_category, years_in_business, employee_count, 
        annual_turnover, credit_rating, payment_terms, bank_name, account_number, 
        branch_code, status, is_active, compliance_status, rag_overall, 
        rag_financial, rag_compliance, rag_performance, rag_safety,
        total_projects, completed_projects, active_projects, cancelled_projects,
        onboarding_progress, documents_expiring, notes, tags, created_by, updated_by
      ) VALUES (
        ${id}, ${data.companyName}, ${data.registrationNumber}, ${data.contactPerson}, 
        ${data.email}, ${data.phone}, ${data.alternatePhone}, ${data.physicalAddress},
        ${data.postalAddress}, ${data.city}, ${data.province}, ${data.postalCode},
        ${data.businessType}, ${data.industryCategory}, ${data.yearsInBusiness}, 
        ${data.employeeCount}, ${data.annualTurnover?.toString()}, ${data.creditRating},
        ${data.paymentTerms}, ${data.bankName}, ${data.accountNumber}, ${data.branchCode},
        ${data.status || 'pending'}, true, ${data.complianceStatus || 'pending'}, 'amber',
        'amber', 'amber', 'amber', 'amber', 0, 0, 0, 0, 0, 0, 
        ${data.notes}, ${JSON.stringify(data.tags || [])}, 'current-user', 'current-user'
      )
    `;
  } catch (error) {
    log.warn('Failed to sync contractor to Neon:', { data: error }, 'neonOperations');
    throw error;
  }
}

/**
 * Update contractor record in Neon for analytics
 */
export async function updateContractorInNeon(id: string, data: Partial<ContractorFormData>): Promise<void> {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.companyName) {
      updates.push('company_name = $' + (values.length + 1));
      values.push(data.companyName);
    }
    if (data.contactPerson) {
      updates.push('contact_person = $' + (values.length + 1));
      values.push(data.contactPerson);
    }
    if (data.email) {
      updates.push('email = $' + (values.length + 1));
      values.push(data.email);
    }
    if (data.phone) {
      updates.push('phone = $' + (values.length + 1));
      values.push(data.phone);
    }
    if (data.status) {
      updates.push('status = $' + (values.length + 1));
      values.push(data.status);
    }
    if (data.notes) {
      updates.push('notes = $' + (values.length + 1));
      values.push(data.notes);
    }
    if (data.tags) {
      updates.push('tags = $' + (values.length + 1));
      values.push(JSON.stringify(data.tags));
    }
    
    if (updates.length > 0) {
      updates.push('updated_by = $' + (values.length + 1));
      values.push('current-user');
      updates.push('updated_at = $' + (values.length + 1));
      values.push(new Date().toISOString());
      values.push(id); // for WHERE clause
      
      await sql`UPDATE contractors SET ${updates.join(', ')} WHERE id = ${id}`;
    }
  } catch (error) {
    log.warn('Failed to sync contractor update to Neon:', { data: error }, 'neonOperations');
    throw error;
  }
}

/**
 * Delete contractor from Neon
 */
export async function deleteContractorFromNeon(id: string): Promise<void> {
  try {
    await sql`DELETE FROM contractors WHERE id = ${id}`;
  } catch (error) {
    log.warn('Failed to delete contractor from Neon:', { data: error }, 'neonOperations');
    throw error;
  }
}

/**
 * Get contractor analytics from Neon
 */
export async function getContractorAnalytics(): Promise<ContractorAnalytics> {
  try {
    // Get all counts in a single query for efficiency
    const [results] = await sql`
      SELECT 
        COUNT(*) as total_contractors,
        COUNT(*) FILTER (WHERE is_active = true) as active_contractors,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_contractors,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_approval,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
        COUNT(*) FILTER (WHERE status = 'blacklisted') as blacklisted,
        COUNT(*) FILTER (WHERE rag_overall = 'green') as rag_green,
        COUNT(*) FILTER (WHERE rag_overall = 'amber') as rag_amber,
        COUNT(*) FILTER (WHERE rag_overall = 'red') as rag_red,
        COUNT(*) FILTER (WHERE is_active = true AND documents_expiring > 0) as expiring_docs
      FROM contractors
    `;

    return {
      totalContractors: parseInt(results?.total_contractors || '0'),
      activeContractors: parseInt(results?.active_contractors || '0'),
      approvedContractors: parseInt(results?.approved_contractors || '0'),
      pendingApproval: parseInt(results?.pending_approval || '0'),
      suspended: parseInt(results?.suspended || '0'),
      blacklisted: parseInt(results?.blacklisted || '0'),
      
      ragDistribution: {
        green: parseInt(results?.rag_green || '0'),
        amber: parseInt(results?.rag_amber || '0'),
        red: parseInt(results?.rag_red || '0'),
      },
      
      // Placeholder values - would calculate from actual data
      averagePerformanceScore: 0,
      averageSafetyScore: 0,
      averageQualityScore: 0,
      averageTimelinessScore: 0,
      
      totalActiveProjects: 0,
      totalCompletedProjects: 0,
      averageProjectsPerContractor: 0,
      
      documentsExpiringSoon: parseInt(results?.expiring_docs || '0'),
      complianceIssues: 0,
      pendingDocuments: 0,
    };
  } catch (error) {
    log.error('Error getting contractor analytics:', { data: error }, 'neonOperations');
    throw new Error('Failed to fetch contractor analytics');
  }
}