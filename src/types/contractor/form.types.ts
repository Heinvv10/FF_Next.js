/**
 * Contractor Form Types - Form data structures
 */

import { ContractorStatus } from './base.types';

export interface ContractorFormData {
  // Company Information
  companyName: string;
  registrationNumber: string;
  businessType: 'pty_ltd' | 'cc' | 'sole_proprietor' | 'partnership';
  industryCategory: string;
  yearsInBusiness?: number;
  employeeCount?: number;

  // Contact Information
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone: string;

  // Address
  physicalAddress: string;
  postalAddress: string;
  city: string;
  province: string;
  postalCode: string;

  // Financial Information
  annualTurnover?: number;
  creditRating: string;
  paymentTerms: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;

  // Performance Metrics
  performanceScore?: number;
  safetyScore?: number;
  qualityScore?: number;
  timelinessScore?: number;

  // Professional Information
  specializations: string[];
  certifications: string[];

  // Status
  status: ContractorStatus;
  complianceStatus: 'pending' | 'compliant' | 'non_compliant' | 'under_review';

  // Metadata
  notes: string;
  tags: string[];
  createdBy?: string;
}

export interface TeamFormData {
  teamName: string;
  teamType: 'installation' | 'maintenance' | 'survey' | 'testing' | 'splicing';
  specialization?: string;
  maxCapacity: number;
  baseLocation?: string;
  operatingRadius?: number;
}

export interface MemberFormData {
  firstName: string;
  lastName: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  role: string;
  skillLevel: 'junior' | 'intermediate' | 'senior' | 'expert';
  certifications?: string[];
  specialSkills?: string[];
  employmentType: 'permanent' | 'contract' | 'temporary';
  hourlyRate?: number;
  dailyRate?: number;
  isTeamLead: boolean;
}