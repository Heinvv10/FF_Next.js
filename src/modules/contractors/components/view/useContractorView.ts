/**
 * Contractor View Hook
 * Custom hook for contractor view functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractorClientService } from '@/services/contractor/contractorClientService';
import { Contractor } from '@/types/contractor.types';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

export type TabType = 'overview' | 'teams' | 'assignments' | 'documents' | 'onboarding' | 'compliance' | 'ratecards';

export function useContractorView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const loadContractor = async () => {
      if (!id) {
        navigate('/app/contractors');
        return;
      }

      try {
        const contractorData = await contractorClientService.getById(id);
        if (!contractorData) {
          toast.error('Contractor not found');
          navigate('/app/contractors');
          return;
        }
        setContractor(contractorData);
      } catch (error) {
        log.error('Failed to load contractor:', { data: error }, 'useContractorView');
        toast.error('Failed to load contractor data');
        navigate('/app/contractors');
      } finally {
        setIsLoading(false);
      }
    };

    loadContractor();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !contractor) return;
    
    setIsDeleting(true);
    try {
      await contractorClientService.delete(id);
      toast.success('Contractor deleted successfully');
      navigate('/app/contractors');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete contractor');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    id,
    contractor,
    isLoading,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting,
    activeTab,
    setActiveTab,
    handleDelete,
    navigate
  };
}