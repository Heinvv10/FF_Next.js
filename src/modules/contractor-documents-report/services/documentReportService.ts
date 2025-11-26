/**
 * Document Report Service (Backend)
 *
 * Aggregates contractor document data from database and generates reports
 */

import { neon } from '@neondatabase/serverless';
import type {
  ContractorDocumentReport,
  DocumentInfo,
  TeamMemberDocuments,
  ContractorBasicInfo,
  DocumentVerificationStatus,
  AllContractorsSummary,
  ContractorSummaryItem,
} from '../types/documentReport.types';
import { ALL_COMPANY_DOCUMENTS } from '../types/documentCategories';
import {
  calculateDaysUntilExpiry,
  calculateUrgencyLevel,
  calculateDisplayStatus,
} from '../utils/documentStatusRules';
import { calculateContractorSummary, calculateOverallStatistics } from '../utils/completenessCalculator';
import { generateDocumentAlerts, hasUrgentAlerts } from '../utils/alertGenerator';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Fetch contractor basic info
 */
async function fetchContractorInfo(contractorId: string): Promise<ContractorBasicInfo | null> {
  const result = await sql`
    SELECT id, company_name, status
    FROM contractors
    WHERE id = ${contractorId}
    LIMIT 1
  `;

  if (result.length === 0) return null;

  return {
    id: result[0].id,
    name: result[0].company_name,
    status: result[0].status,
  };
}

/**
 * Fetch company documents from database
 */
async function fetchCompanyDocuments(contractorId: string): Promise<Map<string, any>> {
  const result = await sql`
    SELECT
      id,
      document_type,
      file_name,
      file_url,
      verification_status,
      expiry_date,
      uploaded_at,
      verified_at,
      verified_by,
      rejection_reason
    FROM contractor_documents
    WHERE contractor_id = ${contractorId}
    ORDER BY uploaded_at DESC
  `;

  // Create a map of document type -> document data (most recent)
  const docMap = new Map<string, any>();

  result.forEach((row) => {
    const docType = row.document_type;
    // Only store if we haven't seen this type yet (most recent due to ORDER BY)
    if (!docMap.has(docType)) {
      docMap.set(docType, row);
    }
  });

  return docMap;
}

/**
 * Fetch team members and their ID documents
 */
async function fetchTeamMemberDocuments(contractorId: string): Promise<TeamMemberDocuments[]> {
  // First, get all team members
  const members = await sql`
    SELECT id, member_name, role
    FROM contractor_teams
    WHERE contractor_id = ${contractorId}
    ORDER BY member_name ASC
  `;

  if (members.length === 0) return [];

  // Then, get their ID documents
  const memberIds = members.map((m) => m.id);
  const documents = await sql`
    SELECT
      team_member_id,
      file_name,
      file_url,
      verification_status,
      uploaded_at,
      verified_at,
      verified_by,
      rejection_reason
    FROM contractor_team_documents
    WHERE team_member_id = ANY(${memberIds})
      AND document_type = 'ID Document'
  `;

  // Create map of member ID -> document
  const docMap = new Map<string, any>();
  documents.forEach((doc) => {
    docMap.set(doc.team_member_id, doc);
  });

  // Build team member documents array
  const teamDocuments: TeamMemberDocuments[] = members.map((member) => {
    const doc = docMap.get(member.id);

    let idDocument: DocumentInfo | undefined;
    let displayStatus: any = 'missing';

    if (doc) {
      const verificationStatus: DocumentVerificationStatus = doc.verification_status || 'pending';
      const urgencyLevel = calculateUrgencyLevel(null, 'ID Document'); // IDs don't expire

      displayStatus = calculateDisplayStatus(verificationStatus, urgencyLevel);

      idDocument = {
        id: member.id, // Use member ID as doc ID
        type: 'ID Document',
        category: 'team_member',
        verificationStatus,
        fileName: doc.file_name,
        fileUrl: doc.file_url,
        urgencyLevel,
        displayStatus,
        uploadedAt: doc.uploaded_at,
        verifiedAt: doc.verified_at,
        verifiedBy: doc.verified_by,
        rejectionReason: doc.rejection_reason,
      };
    }

    return {
      teamMemberId: member.id,
      memberName: member.member_name,
      role: member.role,
      idDocument,
      displayStatus,
    };
  });

  return teamDocuments;
}

/**
 * Build complete document info from database row
 */
function buildDocumentInfo(docType: string, dbRow: any | null): DocumentInfo {
  if (!dbRow) {
    // Document doesn't exist in database - it's missing
    return {
      id: `missing-${docType}`,
      type: docType as any,
      category: 'company',
      verificationStatus: 'missing',
      urgencyLevel: 'ok',
      displayStatus: 'missing',
    };
  }

  const verificationStatus: DocumentVerificationStatus = dbRow.verification_status || 'pending';
  const expiryDate = dbRow.expiry_date;
  const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
  const urgencyLevel = calculateUrgencyLevel(expiryDate, docType);
  const displayStatus = calculateDisplayStatus(verificationStatus, urgencyLevel);

  return {
    id: dbRow.id,
    type: docType as any,
    category: 'company',
    verificationStatus,
    fileName: dbRow.file_name,
    fileUrl: dbRow.file_url,
    expiryDate,
    daysUntilExpiry: daysUntilExpiry || undefined,
    urgencyLevel,
    displayStatus,
    uploadedAt: dbRow.uploaded_at,
    verifiedAt: dbRow.verified_at,
    verifiedBy: dbRow.verified_by,
    rejectionReason: dbRow.rejection_reason,
  };
}

/**
 * Generate full document report for a contractor
 */
export async function generateContractorDocumentReport(
  contractorId: string
): Promise<ContractorDocumentReport | null> {
  // Fetch contractor info
  const contractor = await fetchContractorInfo(contractorId);
  if (!contractor) return null;

  // Fetch company documents
  const companyDocsMap = await fetchCompanyDocuments(contractorId);

  // Build DocumentInfo array for all required company documents
  const companyDocuments: DocumentInfo[] = ALL_COMPANY_DOCUMENTS.map((docType) => {
    const dbRow = companyDocsMap.get(docType) || null;
    return buildDocumentInfo(docType, dbRow);
  });

  // Fetch team member documents
  const teamDocuments = await fetchTeamMemberDocuments(contractorId);

  // Calculate summary
  const summary = calculateContractorSummary(companyDocuments, teamDocuments);

  // Generate alerts
  const alerts = generateDocumentAlerts(companyDocuments, teamDocuments, summary);

  return {
    contractor,
    summary,
    companyDocuments,
    teamDocuments,
    alerts,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate summary for all contractors
 */
export async function generateAllContractorsSummary(): Promise<AllContractorsSummary> {
  // Fetch all approved contractors (not suspended or pending)
  const contractors = await sql`
    SELECT id, company_name, status
    FROM contractors
    WHERE status = 'approved'
    ORDER BY company_name ASC
  `;

  const contractorSummaries: ContractorSummaryItem[] = [];

  // Generate summary for each contractor
  for (const contractor of contractors) {
    const report = await generateContractorDocumentReport(contractor.id);

    if (!report) continue;

    const hasAlerts = hasUrgentAlerts(report.alerts);

    contractorSummaries.push({
      id: contractor.id,
      name: contractor.company_name,
      completionPercentage: report.summary.completionPercentage,
      totalDocuments: report.summary.totalDocuments,
      verified: report.summary.verified,
      missing: report.summary.missing,
      expired: report.summary.expired,
      pending: report.summary.pending,
      expiring: report.summary.expiring,
      hasAlerts,
      alertCount: report.alerts.length,
    });
  }

  // Calculate overall statistics
  const overallStats = calculateOverallStatistics(contractorSummaries);

  return {
    contractors: contractorSummaries,
    overallStats,
  };
}
