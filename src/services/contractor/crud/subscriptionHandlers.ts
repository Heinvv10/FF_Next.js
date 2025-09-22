/**
 * Subscription Handlers for Contractors
 * Handles real-time updates and subscriptions
 */

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  QueryConstraint,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  Contractor, 
  ContractorFilter
} from '@/types/contractor.types';

/**
 * Subscribe to contractors list changes
 */
export function subscribeToContractors(
  callback: (contractors: Contractor[]) => void,
  filter?: ContractorFilter
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy('companyName', 'asc')];
  
  // Apply basic filters
  if (filter?.status?.length) {
    constraints.push(where('status', 'in', filter.status));
  }
  
  if (filter?.complianceStatus?.length) {
    constraints.push(where('complianceStatus', 'in', filter.complianceStatus));
  }
  
  if (filter?.ragOverall?.length) {
    constraints.push(where('ragOverall', 'in', filter.ragOverall));
  }
  
  if (filter?.businessType?.length) {
    constraints.push(where('businessType', 'in', filter.businessType));
  }
  
  if (filter?.province?.length) {
    constraints.push(where('province', 'in', filter.province));
  }
  
  const q = query(collection(db, 'contractors'), ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    let contractorsList = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastActivity: data.lastActivity?.toDate(),
        nextReviewDate: data.nextReviewDate?.toDate(),
        onboardingCompletedAt: data.onboardingCompletedAt?.toDate(),
      } as Contractor;
    });
    
    // Apply client-side filters that can't be done in Firebase
    contractorsList = applyClientSideFilters(contractorsList, filter);
    
    callback(contractorsList);
  });
}

/**
 * Subscribe to single contractor changes
 */
export function subscribeToContractor(
  contractorId: string,
  callback: (contractor: Contractor | null) => void
): Unsubscribe {
  const docRef = doc(db, 'contractors', contractorId);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const contractor = {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastActivity: data.lastActivity?.toDate(),
        nextReviewDate: data.nextReviewDate?.toDate(),
        onboardingCompletedAt: data.onboardingCompletedAt?.toDate(),
      } as Contractor;
      callback(contractor);
    } else {
      callback(null);
    }
  });
}

/**
 * Apply client-side filters that can't be done in Firebase queries
 */
function applyClientSideFilters(
  contractors: Contractor[], 
  filter?: ContractorFilter
): Contractor[] {
  let filtered = contractors;
  
  // Search term filter
  if (filter?.searchTerm) {
    const searchTerm = filter.searchTerm.toLowerCase();
    filtered = filtered.filter(contractor => 
      contractor.companyName.toLowerCase().includes(searchTerm) ||
      contractor.contactPerson.toLowerCase().includes(searchTerm) ||
      contractor.email.toLowerCase().includes(searchTerm) ||
      contractor.phone?.includes(searchTerm) ||
      contractor.registrationNumber.toLowerCase().includes(searchTerm) ||
      contractor.industryCategory?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Tag filter
  if (filter?.tags?.length) {
    filtered = filtered.filter(contractor =>
      contractor.tags?.some(tag => filter.tags!.includes(tag))
    );
  }
  
  // Active projects filter
  if (filter?.hasActiveProjects !== undefined) {
    filtered = filtered.filter(contractor => {
      const hasActive = (contractor.activeProjects || 0) > 0;
      return filter.hasActiveProjects === hasActive;
    });
  }
  
  // Documents expiring filter
  if (filter?.documentsExpiring !== undefined && filter.documentsExpiring) {
    filtered = filtered.filter(contractor => 
      (contractor.documentsExpiring || 0) > 0
    );
  }
  
  return filtered;
}