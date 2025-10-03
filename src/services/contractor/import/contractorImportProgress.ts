/**
 * Contractor Import Progress & Export Operations
 * Handles template downloads, Excel exports, and progress tracking
 */

import { log } from '@/lib/logger';
import * as XLSX from 'xlsx';

export class ContractorImportProgress {
  
  /**
   * Download contractor import template
   */
  downloadTemplate(): void {
    try {
      const templateData = [
        {
          'Company Name': 'Example Construction Co',
          'Contact Person': 'John Smith', 
          'Email': 'john@example.com',
          'Phone': '+27123456789',
          'Address': '123 Main St, Cape Town, Western Cape',
          'Services': 'Fiber Installation, Maintenance',
          'Service Regions': 'Western Cape, Northern Cape',
          'Rating': 'Green',
          'Certifications': 'ISO 9001, OHSAS 18001',
          'Registration Number': 'REG123456',
          'Tax Number': 'TAX789012',
          'Banking Details': 'FNB - 62547896325',
          'Insurance Details': 'Santam Policy #POL123456',
          'Emergency Contact': 'Jane Smith - +27987654321',
          'Notes': 'Preferred contractor for Western Cape region'
        }
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // Set column widths for better readability
      worksheet['!cols'] = [
        { wch: 20 }, // Company Name
        { wch: 15 }, // Contact Person
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 40 }, // Address
        { wch: 25 }, // Services
        { wch: 20 }, // Service Regions
        { wch: 10 }, // Rating
        { wch: 20 }, // Certifications
        { wch: 15 }, // Registration Number
        { wch: 15 }, // Tax Number
        { wch: 20 }, // Banking Details
        { wch: 25 }, // Insurance Details
        { wch: 20 }, // Emergency Contact
        { wch: 30 }  // Notes
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contractors');
      
      // Generate file and trigger download
      const fileName = `contractor-import-template-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      log.info('Contractor import template downloaded', { fileName });
    } catch (error) {
      log.error('Error generating contractor import template', { error });
      throw new Error('Failed to generate import template');
    }
  }

  /**
   * Export contractors to Excel format
   */
  async exportToExcel(): Promise<void> {
    try {
      // Fetch contractors from API
      const response = await fetch('/api/contractors');
      if (!response.ok) {
        throw new Error('Failed to fetch contractors for export');
      }

      const contractors = await response.json();
      
      if (!contractors || contractors.length === 0) {
        throw new Error('No contractors found to export');
      }

      // Transform contractors for Excel export
      const exportData = contractors.map((contractor: any) => ({
        'Company Name': contractor.companyName || '',
        'Contact Person': contractor.contactPerson || '',
        'Email': contractor.email || '',
        'Phone': contractor.phone || '',
        'Address': contractor.address || '',
        'Services': Array.isArray(contractor.services) ? contractor.services.join(', ') : contractor.services || '',
        'Service Regions': Array.isArray(contractor.serviceRegions) ? contractor.serviceRegions.join(', ') : contractor.serviceRegions || '',
        'Rating': contractor.ragScore?.overallRating || contractor.rating || '',
        'Performance Score': contractor.performanceScore || '',
        'Certifications': Array.isArray(contractor.certifications) ? contractor.certifications.join(', ') : contractor.certifications || '',
        'Registration Number': contractor.registrationNumber || '',
        'Tax Number': contractor.taxNumber || '',
        'Banking Details': contractor.bankingDetails || '',
        'Insurance Details': contractor.insuranceDetails || '',
        'Emergency Contact': contractor.emergencyContact || '',
        'Status': contractor.status || '',
        'Created Date': contractor.createdAt ? new Date(contractor.createdAt).toLocaleDateString() : '',
        'Last Updated': contractor.updatedAt ? new Date(contractor.updatedAt).toLocaleDateString() : '',
        'Notes': contractor.notes || ''
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 25 }, // Company Name
        { wch: 20 }, // Contact Person
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 40 }, // Address
        { wch: 30 }, // Services
        { wch: 25 }, // Service Regions
        { wch: 12 }, // Rating
        { wch: 15 }, // Performance Score
        { wch: 25 }, // Certifications
        { wch: 15 }, // Registration Number
        { wch: 15 }, // Tax Number
        { wch: 25 }, // Banking Details
        { wch: 25 }, // Insurance Details
        { wch: 25 }, // Emergency Contact
        { wch: 12 }, // Status
        { wch: 12 }, // Created Date
        { wch: 12 }, // Last Updated
        { wch: 30 }  // Notes
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contractors');
      
      // Generate file and trigger download
      const fileName = `contractors-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      log.info('Contractors exported to Excel', { 
        fileName, 
        contractorCount: contractors.length 
      });
    } catch (error) {
      log.error('Error exporting contractors to Excel', { error });
      throw new Error('Failed to export contractors to Excel');
    }
  }

  /**
   * Track import progress and provide status updates
   */
  trackProgress(current: number, total: number, operation: string): void {
    const percentage = Math.round((current / total) * 100);
    
    log.info('Import progress update', {
      operation,
      current,
      total,
      percentage,
      completed: current === total
    });

    // Emit progress event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('contractorImportProgress', {
        detail: {
          operation,
          current,
          total,
          percentage,
          completed: current === total
        }
      }));
    }
  }

  /**
   * Calculate and return progress statistics
   */
  calculateProgressStats(processed: number, total: number, errors: number): {
    percentage: number;
    processed: number;
    remaining: number;
    total: number;
    errors: number;
    successRate: number;
  } {
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    const remaining = Math.max(0, total - processed);
    const successRate = processed > 0 ? Math.round(((processed - errors) / processed) * 100) : 0;

    return {
      percentage,
      processed,
      remaining,
      total,
      errors,
      successRate
    };
  }
}