/**
 * API Route: /api/contractors/import
 * Handles bulk import of contractors from client-processed data
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { contractorService } from '@/services/contractorService';
import { log } from '@/lib/logger';
import type { ContractorFormData } from '@/types/contractor/form.types';
import type { ContractorImportResult } from '@/types/contractor/import.types';

interface ImportContractorData {
  companyName: string;
  contactPerson: string;
  email: string;
  registrationNumber?: string;
  phone?: string;
  businessType?: string;
  services?: string[];
  province?: string;
  regionOfOperations?: string[];
  address1?: string;
  address2?: string;
  suburb?: string;
  city?: string;
  postalCode?: string;
  website?: string;
}

interface ImportRequestBody {
  contractors: ImportContractorData[];
  options: {
    mode: 'skipDuplicates' | 'overwrite';
    sheetIndex?: number;
    hasHeaders?: boolean;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractors, options }: ImportRequestBody = req.body;

    if (!contractors || !Array.isArray(contractors)) {
      return res.status(400).json({ error: 'Invalid contractors data' });
    }

    log.info('🚀 Starting contractor import via API', { data: { count: contractors.length, options } }, 'api/contractors/import');

    const startTime = Date.now();
    const importedIds: string[] = [];
    const errors: Array<{row: number; message: string; data: any}> = [];
    
    let successCount = 0;
    let duplicatesSkipped = 0;

    // Process each contractor
    for (let i = 0; i < contractors.length; i++) {
      const contractor = contractors[i];
      
      try {
        // Convert import format to ContractorFormData
        const contractorData: ContractorFormData = convertToFormData(contractor);
        
        log.info(`💾 Creating contractor: ${contractorData.companyName}`, undefined, 'api/contractors/import');
        
        // Create contractor in database
        const contractorId = await contractorService.create(contractorData);
        importedIds.push(contractorId);
        successCount++;
        
        log.info(`✅ Successfully created contractor with ID: ${contractorId}`, undefined, 'api/contractors/import');
        
      } catch (error) {
        log.error(`❌ Failed to create contractor ${contractor.companyName}:`, { data: error }, 'api/contractors/import');
        errors.push({
          row: i + 1,
          message: error instanceof Error ? error.message : 'Unknown error during creation',
          data: { companyName: contractor.companyName }
        });
      }
    }

    const result: ContractorImportResult = {
      totalProcessed: contractors.length,
      successCount,
      duplicatesSkipped,
      errors,
      importedIds,
      duration: Date.now() - startTime
    };

    log.info('🎉 Import completed via API:', { data: result }, 'api/contractors/import');

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    log.error('❌ Import API error:', { data: error }, 'api/contractors/import');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed'
    });
  }
}

/**
 * Convert import row format to ContractorFormData format
 */
function convertToFormData(contractor: ImportContractorData): ContractorFormData {
  // Map business type from import format to form format
  const businessTypeMapping: Record<string, ContractorFormData['businessType']> = {
    'Pty Ltd': 'pty_ltd',
    'CC': 'cc', 
    'Trust': 'cc', // Map Trust to cc for now
    'Sole Proprietor': 'sole_proprietor'
  };
  
  // Generate unique registration number if missing or is placeholder
  let registrationNumber = contractor.registrationNumber || '';
  if (!registrationNumber || registrationNumber === '0000/000000/00' || registrationNumber.trim() === '') {
    // Generate unique registration number using timestamp and random number
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    registrationNumber = `TEMP/${timestamp}/${random}`;
  }
  
  return {
    // Company Information
    companyName: contractor.companyName || '',
    registrationNumber: registrationNumber,
    businessType: businessTypeMapping[contractor.businessType || ''] || 'pty_ltd',
    industryCategory: 'Telecommunications', // Default category
    yearsInBusiness: undefined,
    employeeCount: undefined,
    
    // Contact Information
    contactPerson: contractor.contactPerson || '',
    email: contractor.email || '',
    phone: contractor.phone || '',
    alternatePhone: '',
    
    // Address - map from import format
    physicalAddress: [contractor.address1, contractor.address2, contractor.suburb]
      .filter(Boolean)
      .join(', '),
    postalAddress: [contractor.address1, contractor.address2, contractor.suburb]
      .filter(Boolean)
      .join(', '),
    city: contractor.city || '',
    province: contractor.province || '',
    postalCode: contractor.postalCode || '',
    
    // Service Information
    serviceCategory: 'Installation', // Default
    capabilities: contractor.services || [],
    equipmentOwned: [],
    certifications: [],
    
    // Business Details
    website: contractor.website || '',
    socialMediaProfiles: {},
    
    // Financial Information
    annualRevenue: 0,
    creditRating: 'Not Rated',
    taxClearance: false,
    
    // Compliance & Certifications
    beeLevel: 'Not Specified',
    insuranceCoverage: {},
    healthSafetyCertification: false,
    
    // Performance & Rating
    performanceRating: 0,
    reliabilityScore: 0,
    qualityScore: 0,
    
    // Operational Information
    operationalRegions: contractor.regionOfOperations || [],
    teamSize: 1,
    projectCapacity: 1,
    
    // Status & Metadata
    status: 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    notes: 'Imported via Excel/CSV import'
  };
}