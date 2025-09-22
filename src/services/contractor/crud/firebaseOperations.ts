/**
 * Firebase Operations for Contractors - DEPRECATED
 * These are stub functions - all operations now use API service
 */

import {
  Contractor,
  ContractorFormData,
  ContractorFilter
} from '@/types/contractor.types';
import { log } from '@/lib/logger';

/**
 * Get all contractors - DEPRECATED
 */
export async function getAllContractorsFromFirebase(filter?: ContractorFilter): Promise<Contractor[]> {
  log.warn('Firebase operations are deprecated', 'firebaseOperations');
  return [];
}

/**
 * Get contractor by ID - DEPRECATED
 */
export async function getContractorByIdFromFirebase(id: string): Promise<Contractor | null> {
  log.warn('Firebase operations are deprecated', 'firebaseOperations');
  return null;
}

/**
 * Create contractor - DEPRECATED
 */
export async function createContractorInFirebase(data: ContractorFormData): Promise<string> {
  log.warn('Firebase operations are deprecated', 'firebaseOperations');
  return '';
}

/**
 * Update contractor - DEPRECATED
 */
export async function updateContractorInFirebase(id: string, data: Partial<ContractorFormData>): Promise<void> {
  log.warn('Firebase operations are deprecated', 'firebaseOperations');
}

/**
 * Delete contractor - DEPRECATED
 */
export async function deleteContractorFromFirebase(id: string): Promise<void> {
  log.warn('Firebase operations are deprecated', 'firebaseOperations');
}