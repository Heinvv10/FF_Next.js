/**
 * Document Export Service
 *
 * Handles CSV and PDF export generation for contractor document reports
 */

import type { ContractorDocumentReport } from '../types/documentReport.types';

/**
 * Convert contractor document report to CSV format
 */
export function generateContractorReportCSV(report: ContractorDocumentReport): string {
  const lines: string[] = [];

  // Header
  lines.push(`Contractor Documents Report - ${report.contractor.name}`);
  lines.push(`Generated: ${new Date().toLocaleString('en-ZA')}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push(`Completion Percentage,${report.summary.completionPercentage}%`);
  lines.push(`Total Documents,${report.summary.totalDocuments}`);
  lines.push(`Verified,${report.summary.verified}`);
  lines.push(`Pending,${report.summary.pending}`);
  lines.push(`Missing,${report.summary.missing}`);
  lines.push(`Expired,${report.summary.expired}`);
  lines.push(`Rejected,${report.summary.rejected}`);
  lines.push(`Expiring Soon,${report.summary.expiring}`);
  lines.push('');

  // Company Documents
  lines.push('COMPANY DOCUMENTS');
  lines.push('Document Type,Status,Expiry Date,File Name,Uploaded Date');
  report.companyDocuments.forEach((doc) => {
    lines.push(
      `"${doc.type}","${doc.displayStatus}","${doc.expiryDate || 'N/A'}","${
        doc.fileName || 'Not uploaded'
      }","${doc.uploadedAt || 'N/A'}"`
    );
  });
  lines.push('');

  // Team Member Documents
  lines.push('TEAM MEMBER ID DOCUMENTS');
  lines.push('Team Member,Role,ID Document Status,File Name,Uploaded Date');
  report.teamDocuments.forEach((member) => {
    lines.push(
      `"${member.memberName}","${member.role}","${member.displayStatus}","${
        member.idDocument?.fileName || 'Not uploaded'
      }","${member.idDocument?.uploadedAt || 'N/A'}"`
    );
  });
  lines.push('');

  // Alerts
  if (report.alerts.length > 0) {
    lines.push('ALERTS');
    lines.push('Severity,Message');
    report.alerts.forEach((alert) => {
      lines.push(`"${alert.severity}","${alert.message}"`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate CSV for all contractors summary
 */
export function generateAllContractorsSummaryCSV(contractors: Array<{
  name: string;
  completionPercentage: number;
  totalDocuments: number;
  verified: number;
  missing: number;
  expired: number;
  pending: number;
  expiring: number;
}>): string {
  const lines: string[] = [];

  // Header
  lines.push('All Contractors Documents Summary');
  lines.push(`Generated: ${new Date().toLocaleString('en-ZA')}`);
  lines.push('');

  // Table Header
  lines.push(
    'Contractor Name,Completion %,Total Docs,Verified,Pending,Missing,Expired,Expiring Soon'
  );

  // Data rows
  contractors.forEach((contractor) => {
    lines.push(
      `"${contractor.name}",${contractor.completionPercentage}%,${contractor.totalDocuments},${contractor.verified},${contractor.pending},${contractor.missing},${contractor.expired},${contractor.expiring}`
    );
  });

  return lines.join('\n');
}
