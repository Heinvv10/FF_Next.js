/**
 * ContractorDetail Component - Next.js compatible contractor detail view
 * Adapted from ContractorView to work with Next.js router
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  ContractorViewHeader,
  ContractorTabs,
  TabContent,
  DeleteConfirmModal,
  ContractorNotFound
} from './view';
import { contractorService } from '@/services/contractorService';
import { Contractor } from '@/types/contractor.types';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

export type TabType = 'overview' | 'teams' | 'assignments' | 'documents' | 'onboarding' | 'compliance' | 'ratecards';

export function ContractorDetail() {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const loadContractor = async () => {
      if (!id) {
        return;
      }

      try {
        setIsLoading(true);
        const contractorData = await contractorService.getById(id);
        if (!contractorData) {
          toast.error('Contractor not found');
          return;
        }
        setContractor(contractorData);
      } catch (error) {
        log.error('Failed to load contractor:', { data: error }, 'ContractorDetail');
        toast.error('Failed to load contractor data');
      } finally {
        setIsLoading(false);
      }
    };

    loadContractor();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !contractor) return;

    setIsDeleting(true);
    try {
      await contractorService.delete(id);
      toast.success('Contractor deleted successfully');
      router.push('/contractors');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contractor');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" label="Loading contractor..." />
      </div>
    );
  }

  if (!contractor) {
    return <ContractorNotFound onBack={() => router.push('/contractors')} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ContractorViewHeader
        contractor={contractor}
        onBack={() => router.push('/contractors')}
        onEdit={() => router.push(`/contractors/${id}/edit`)}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <ContractorTabs
            contractor={contractor}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      <TabContent activeTab={activeTab} contractor={contractor} />

      {showDeleteConfirm && (
        <DeleteConfirmModal
          contractorName={contractor.companyName}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
